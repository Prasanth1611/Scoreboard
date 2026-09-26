/*
# Sport-Agnostic Tournament Platform Schema

Creates tables for tournaments, teams, matches, and an auto-computed standings view.
Sport-agnostic: scoring rules stored as configurable JSON.
Single-tenant (no auth) — all data is intentionally public/shared.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLE: tournaments
-- ============================================================
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport_name text NOT NULL DEFAULT 'Generic',
  scoring_config jsonb NOT NULL DEFAULT '{"format":"points","win_condition":"highest","points_for_win":3,"points_for_draw":1,"points_for_loss":0,"sets_to_win":2,"allow_draws":true}'::jsonb,
  status text NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tournaments" ON tournaments;
CREATE POLICY "anon_select_tournaments" ON tournaments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tournaments" ON tournaments;
CREATE POLICY "anon_insert_tournaments" ON tournaments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tournaments" ON tournaments;
CREATE POLICY "anon_update_tournaments" ON tournaments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tournaments" ON tournaments;
CREATE POLICY "anon_delete_tournaments" ON tournaments FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- TABLE: teams
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  seed int,
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
CREATE POLICY "anon_select_teams" ON teams FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);

-- ============================================================
-- TABLE: matches
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team1_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  team1_score jsonb,
  team2_score jsonb,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  round int,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_matches" ON matches;
CREATE POLICY "anon_select_matches" ON matches FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_matches" ON matches;
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- ============================================================
-- VIEW: standings (auto-computed from matches + tournaments)
-- ============================================================
CREATE OR REPLACE VIEW standings AS
WITH completed_matches AS (
  SELECT
    m.tournament_id,
    m.team1_id,
    m.team2_id,
    m.team1_score,
    m.team2_score,
    t.scoring_config
  FROM matches m
  JOIN tournaments t ON t.id = m.tournament_id
  WHERE m.status = 'completed'
    AND m.team1_id IS NOT NULL
    AND m.team2_id IS NOT NULL
),
match_results AS (
  SELECT tournament_id, team1_id AS team_id, team2_id AS opponent_id,
         team1_score, team2_score, scoring_config, 1 AS is_team1
  FROM completed_matches
  UNION ALL
  SELECT tournament_id, team2_id AS team_id, team1_id AS opponent_id,
         team2_score, team1_score, scoring_config, 0 AS is_team1
  FROM completed_matches
),
scored_matches AS (
  SELECT
    mr.tournament_id,
    mr.team_id,
    mr.scoring_config,
    CASE
      WHEN (mr.scoring_config->>'format') = 'sets' THEN COALESCE((mr.team1_score->>'sets_won')::int, 0)
      WHEN (mr.scoring_config->>'format') = 'time' THEN COALESCE((mr.team1_score->>'time_seconds')::int, 0)
      ELSE COALESCE((mr.team1_score->>'points')::int, 0)
    END AS my_score_val,
    CASE
      WHEN (mr.scoring_config->>'format') = 'sets' THEN COALESCE((mr.team2_score->>'sets_won')::int, 0)
      WHEN (mr.scoring_config->>'format') = 'time' THEN COALESCE((mr.team2_score->>'time_seconds')::int, 0)
      ELSE COALESCE((mr.team2_score->>'points')::int, 0)
    END AS opp_score_val,
    COALESCE((mr.team1_score->>'points')::int, 0) AS my_points_raw,
    COALESCE((mr.team2_score->>'points')::int, 0) AS opp_points_raw
  FROM match_results mr
),
determined_results AS (
  SELECT
    sm.tournament_id,
    sm.team_id,
    CASE
      WHEN (sm.my_score_val = sm.opp_score_val) THEN 'draw'
      WHEN (sm.my_score_val > sm.opp_score_val) THEN
        CASE WHEN (sm.scoring_config->>'win_condition') = 'lowest' THEN 'loss' ELSE 'win' END
      ELSE
        CASE WHEN (sm.scoring_config->>'win_condition') = 'lowest' THEN 'win' ELSE 'loss' END
    END AS result,
    sm.my_points_raw,
    sm.opp_points_raw
  FROM scored_matches sm
),
team_stats AS (
  SELECT
    dr.tournament_id,
    dr.team_id,
    COUNT(*) AS played,
    COUNT(*) FILTER (WHERE dr.result = 'win') AS wins,
    COUNT(*) FILTER (WHERE dr.result = 'draw') AS draws,
    COUNT(*) FILTER (WHERE dr.result = 'loss') AS losses,
    SUM(dr.my_points_raw) AS points_for,
    SUM(dr.opp_points_raw) AS points_against
  FROM determined_results dr
  GROUP BY dr.tournament_id, dr.team_id
),
all_teams AS (
  SELECT DISTINCT t.id AS team_id, t.tournament_id, t.name AS team_name, t.color, t.seed
  FROM teams t
),
standings_base AS (
  SELECT
    ateam.tournament_id,
    ateam.team_id,
    ateam.team_name,
    ateam.color,
    ateam.seed,
    COALESCE(ts.played, 0) AS played,
    COALESCE(ts.wins, 0) AS wins,
    COALESCE(ts.draws, 0) AS draws,
    COALESCE(ts.losses, 0) AS losses,
    COALESCE(ts.points_for, 0) AS points_for,
    COALESCE(ts.points_against, 0) AS points_against,
    COALESCE(ts.points_for, 0) - COALESCE(ts.points_against, 0) AS points_diff,
    COALESCE(ts.wins, 0) * COALESCE((t.scoring_config->>'points_for_win')::int, 3)
      + COALESCE(ts.draws, 0) * COALESCE((t.scoring_config->>'points_for_draw')::int, 1)
      + COALESCE(ts.losses, 0) * COALESCE((t.scoring_config->>'points_for_loss')::int, 0)
      AS standings_points
  FROM all_teams ateam
  LEFT JOIN team_stats ts ON ts.team_id = ateam.team_id AND ts.tournament_id = ateam.tournament_id
  JOIN tournaments t ON t.id = ateam.tournament_id
)
SELECT
  tournament_id,
  team_id,
  team_name,
  color,
  seed,
  played,
  wins,
  draws,
  losses,
  points_for,
  points_against,
  points_diff,
  standings_points,
  ROW_NUMBER() OVER (
    PARTITION BY tournament_id
    ORDER BY standings_points DESC, points_diff DESC, wins DESC, team_name ASC
  ) AS rank
FROM standings_base;

GRANT SELECT ON standings TO anon, authenticated;

-- ============================================================
-- TRIGGER: update updated_at on tournaments
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tournaments_updated_at ON tournaments;
CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();