export type UserRole = 'admin' | 'viewer';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export type ScoringFormat = 'points' | 'sets' | 'time';

export type WinCondition = 'highest' | 'lowest';

export interface ScoringConfig {
  format: ScoringFormat;
  win_condition: WinCondition;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  sets_to_win: number;
  allow_draws: boolean;
}

export type TournamentStatus = 'setup' | 'active' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  sport_name: string;
  scoring_config: ScoringConfig;
  status: TournamentStatus;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  seed: number | null;
  color: string | null;
  created_at: string;
}

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

export interface ScorePayload {
  points?: number;
  sets?: number[];
  sets_won?: number;
  time_seconds?: number;
}

export interface Match {
  id: string;
  tournament_id: string;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: ScorePayload | null;
  team2_score: ScorePayload | null;
  status: MatchStatus;
  round: number | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface StandingsRow {
  tournament_id: string;
  team_id: string;
  team_name: string;
  color: string | null;
  seed: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points_for: number;
  points_against: number;
  points_diff: number;
  standings_points: number;
  rank: number;
}

export interface MatchWithTeams extends Match {
  team1?: Team | null;
  team2?: Team | null;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  format: 'points',
  win_condition: 'highest',
  points_for_win: 3,
  points_for_draw: 1,
  points_for_loss: 0,
  sets_to_win: 2,
  allow_draws: true,
};

export const TEAM_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#6366f1', '#14b8a6', '#e11d48',
  '#a855f7', '#0ea5e9', '#65a30d', '#dc2626',
];
