import { useState, useCallback } from 'react';
import { useTournament, useTeams, useMatches, useStandings } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { TEAM_COLORS, type Team, type Match, type MatchWithTeams, type ScoringConfig, type ScorePayload, type ScoringFormat } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StandingsTable } from '@/components/StandingsTable';
import { MatchCard } from '@/components/MatchCard';
import { ArrowLeft, Plus, Users, Trophy, Settings, Trash2, Edit3, Play, Check, X, Monitor } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';

interface OrganizerPageProps {
  tournamentId: string;
  onBack: () => void;
  onOpenScoreboard: (id: string) => void;
}

type Tab = 'teams' | 'matches' | 'standings' | 'settings';

export function OrganizerPage({ tournamentId, onBack, onOpenScoreboard }: OrganizerPageProps) {
  const { tournament, loading } = useTournament(tournamentId);
  const { teams, refetch: refetchTeams } = useTeams(tournamentId);
  const { matches, refetch: refetchMatches } = useMatches(tournamentId);
  const { standings, refetch: refetchStandings } = useStandings(tournamentId);
  const [tab, setTab] = useState<Tab>('teams');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [scoringMatch, setScoringMatch] = useState<MatchWithTeams | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const refetchAll = useCallback(() => {
    refetchTeams(); refetchMatches(); refetchStandings();
  }, [refetchTeams, refetchMatches, refetchStandings]);

  const updateTournamentStatus = useCallback(async (status: 'setup' | 'active' | 'completed') => {
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', tournamentId);
    if (error) console.error('Error updating status:', error);
  }, [tournamentId]);

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const config = tournament.scoring_config;

  const tabs: { id: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { id: 'teams', label: 'Teams', icon: Users, count: teams.length },
    { id: 'matches', label: 'Matches', icon: Trophy, count: matches.length },
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-default bg-surface/50 glass sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-surface-2 transition-colors flex-shrink-0">
              <ArrowLeft size={20} className="text-muted" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-base truncate">{tournament.name}</h1>
              <p className="text-xs text-muted">{tournament.sport_name} — Organizer Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={() => onOpenScoreboard(tournamentId)}>
              <Monitor size={16} /> <span className="hidden sm:inline">Scoreboard</span>
            </Button>
            {tournament.status === 'setup' && (
              <Button variant="accent" size="sm" onClick={() => updateTournamentStatus('active')}>
                <Play size={16} /> Start
              </Button>
            )}
            {tournament.status === 'active' && (
              <Button variant="danger" size="sm" onClick={() => updateTournamentStatus('completed')}>
                <Check size={16} /> End
              </Button>
            )}
            <UserMenu />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto scrollbar-thin">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'border-primary text-primary-light'
                  : 'border-transparent text-muted hover:text-[var(--color-text)]'
              }`}
            >
              <t.icon size={16} />
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-surface-2 text-xs">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'teams' && (
          <TeamsTab
            teams={teams}
            tournamentId={tournamentId}
            tournamentStatus={tournament.status}
            onAddTeam={() => setShowAddTeam(true)}
            onEditTeam={(t) => setEditingTeam(t)}
            refetchAll={refetchAll}
          />
        )}
        {tab === 'matches' && (
          <MatchesTab
            matches={matches}
            teams={teams}
            config={config}
            tournamentId={tournamentId}
            tournamentStatus={tournament.status}
            onCreateMatch={() => setShowCreateMatch(true)}
            onScoreMatch={(m) => setScoringMatch(m)}
            refetchAll={refetchAll}
          />
        )}
        {tab === 'standings' && (
          <div className="bg-surface border border-default rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-default flex items-center justify-between">
              <h3 className="font-bold">Standings</h3>
              <Badge variant="info">Auto-updated</Badge>
            </div>
            <StandingsTable standings={standings} />
          </div>
        )}
        {tab === 'settings' && (
          <SettingsTab tournament={tournament} refetchAll={refetchAll} />
        )}
      </main>

      {/* Modals */}
      <AddTeamModal
        open={showAddTeam}
        onClose={() => setShowAddTeam(false)}
        tournamentId={tournamentId}
        existingCount={teams.length}
        onAdded={refetchAll}
      />
      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          open={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          onSaved={refetchAll}
        />
      )}
      <CreateMatchModal
        open={showCreateMatch}
        onClose={() => setShowCreateMatch(false)}
        tournamentId={tournamentId}
        teams={teams}
        onCreated={refetchAll}
      />
      {scoringMatch && (
        <ScoreMatchModal
          match={scoringMatch}
          config={config}
          open={!!scoringMatch}
          onClose={() => setScoringMatch(null)}
          onSaved={refetchAll}
        />
      )}
    </div>
  );
}

// ============================================================
// Teams Tab
// ============================================================

function TeamsTab({ teams, tournamentId, tournamentStatus, onAddTeam, onEditTeam, refetchAll }: {
  teams: Team[];
  tournamentId: string;
  tournamentStatus: string;
  onAddTeam: () => void;
  onEditTeam: (t: Team) => void;
  refetchAll: () => void;
}) {
  const deleteTeam = useCallback(async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { console.error('Error deleting team:', error); return; }
    refetchAll();
  }, [refetchAll]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">Teams</h3>
          <p className="text-sm text-muted">{teams.length} team{teams.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={onAddTeam} size="sm">
          <Plus size={18} /> Add Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-default rounded-2xl">
          <Users size={32} className="mx-auto mb-3 text-muted opacity-50" />
          <p className="text-muted mb-4">No teams registered yet.</p>
          <Button onClick={onAddTeam} size="sm"><Plus size={18} /> Add First Team</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, i) => (
            <div key={team.id} className="bg-surface border border-default rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: team.color ?? TEAM_COLORS[i % TEAM_COLORS.length] }}>
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{team.name}</p>
                  {team.seed != null && <p className="text-xs text-muted">Seed #{team.seed}</p>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEditTeam(team)} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
                  <Edit3 size={15} className="text-muted" />
                </button>
                <button onClick={() => deleteTeam(team.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                  <Trash2 size={15} className="text-error" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Matches Tab
// ============================================================

function MatchesTab({ matches, teams, config, tournamentId, tournamentStatus, onCreateMatch, onScoreMatch, refetchAll }: {
  matches: MatchWithTeams[];
  teams: Team[];
  config: ScoringConfig;
  tournamentId: string;
  tournamentStatus: string;
  onCreateMatch: () => void;
  onScoreMatch: (m: MatchWithTeams) => void;
  refetchAll: () => void;
}) {
  const deleteMatch = useCallback(async (id: string) => {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) { console.error('Error deleting match:', error); return; }
    refetchAll();
  }, [refetchAll]);

  const scheduled = matches.filter((m) => m.status === 'scheduled');
  const live = matches.filter((m) => m.status === 'in_progress');
  const completed = matches.filter((m) => m.status === 'completed');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">Matches</h3>
          <p className="text-sm text-muted">{matches.length} total — {live.length} live, {scheduled.length} scheduled, {completed.length} completed</p>
        </div>
        <Button onClick={onCreateMatch} size="sm" disabled={teams.length < 2}>
          <Plus size={18} /> New Match
        </Button>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-default rounded-2xl">
          <Trophy size={32} className="mx-auto mb-3 text-muted opacity-50" />
          <p className="text-muted mb-4">No matches scheduled yet.</p>
          <Button onClick={onCreateMatch} size="sm" disabled={teams.length < 2}>
            <Plus size={18} /> {teams.length < 2 ? 'Need at least 2 teams' : 'Create First Match'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {live.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> LIVE NOW
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((m) => (
                  <div key={m.id} className="relative group">
                    <MatchCard match={m} scoringConfig={config} onClick={() => onScoreMatch(m)} />
                    <button onClick={() => deleteMatch(m.id)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-2 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} className="text-error" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {scheduled.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-muted mb-2">Scheduled</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scheduled.map((m) => (
                  <div key={m.id} className="relative group">
                    <MatchCard match={m} scoringConfig={config} onClick={() => onScoreMatch(m)} showActions />
                    <button onClick={() => deleteMatch(m.id)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-2 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} className="text-error" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-muted mb-2">Completed</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((m) => (
                  <div key={m.id} className="relative group">
                    <MatchCard match={m} scoringConfig={config} onClick={() => onScoreMatch(m)} showActions />
                    <button onClick={() => deleteMatch(m.id)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-2 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} className="text-error" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Settings Tab
// ============================================================

function SettingsTab({ tournament, refetchAll }: {
  tournament: NonNullable<ReturnType<typeof useTournament>['tournament']>;
  refetchAll: () => void;
}) {
  const config = tournament.scoring_config;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tournament.name);
  const [sportName, setSportName] = useState(tournament.sport_name);
  const [winPoints, setWinPoints] = useState(config.points_for_win);
  const [drawPoints, setDrawPoints] = useState(config.points_for_draw);
  const [lossPoints, setLossPoints] = useState(config.points_for_loss);

  const saveSettings = useCallback(async () => {
    const newConfig: ScoringConfig = { ...config, points_for_win: winPoints, points_for_draw: drawPoints, points_for_loss: lossPoints };
    const { error } = await supabase.from('tournaments').update({
      name: name.trim(),
      sport_name: sportName.trim(),
      scoring_config: newConfig,
    }).eq('id', tournament.id);
    if (error) { console.error('Error updating settings:', error); return; }
    setEditing(false);
    refetchAll();
  }, [config, winPoints, drawPoints, lossPoints, name, sportName, tournament.id, refetchAll]);

  const deleteTournament = useCallback(async () => {
    const { error } = await supabase.from('tournaments').delete().eq('id', tournament.id);
    if (error) { console.error('Error deleting tournament:', error); return; }
    window.location.hash = '';
    window.location.reload();
  }, [tournament.id]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-surface border border-default rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Tournament Info</h3>
        <div className="space-y-4">
          <Input label="Tournament Name" value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} />
          <Input label="Sport / Game" value={sportName} onChange={(e) => setSportName(e.target.value)} disabled={!editing} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Win Pts" type="number" value={winPoints} onChange={(e) => setWinPoints(Number(e.target.value))} disabled={!editing} />
            <Input label="Draw Pts" type="number" value={drawPoints} onChange={(e) => setDrawPoints(Number(e.target.value))} disabled={!editing} />
            <Input label="Loss Pts" type="number" value={lossPoints} onChange={(e) => setLossPoints(Number(e.target.value))} disabled={!editing} />
          </div>
          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
                <Button onClick={saveSettings} className="flex-1"><Check size={16} /> Save</Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setEditing(true)} className="w-full"><Edit3 size={16} /> Edit Settings</Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-red-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-2 text-error">Danger Zone</h3>
        <p className="text-sm text-muted mb-4">Deleting a tournament removes all teams, matches, and standings permanently.</p>
        <Button variant="danger" onClick={deleteTournament}>
          <Trash2 size={16} /> Delete Tournament
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Add Team Modal
// ============================================================

function AddTeamModal({ open, onClose, tournamentId, existingCount, onAdded }: {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  existingCount: number;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [seed, setSeed] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    const color = TEAM_COLORS[existingCount % TEAM_COLORS.length];
    const { error } = await supabase.from('teams').insert({
      tournament_id: tournamentId,
      name: name.trim(),
      seed: seed ? parseInt(seed) : null,
      color,
    });
    setSaving(false);
    if (error) { console.error('Error adding team:', error); return; }
    setName(''); setSeed('');
    onAdded();
    onClose();
  }, [name, seed, tournamentId, existingCount, onAdded, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Add Team">
      <div className="space-y-4">
        <Input label="Team Name" placeholder="e.g. Thunder FC" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input label="Seed (optional)" type="number" placeholder="e.g. 1" value={seed} onChange={(e) => setSeed(e.target.value)} />
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Team color:</span>
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: TEAM_COLORS[existingCount % TEAM_COLORS.length] }} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleAdd} disabled={saving || !name.trim()} className="flex-1">
            {saving ? 'Adding...' : 'Add Team'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Edit Team Modal
// ============================================================

function EditTeamModal({ team, open, onClose, onSaved }: {
  team: Team;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [seed, setSeed] = useState(team.seed?.toString() ?? '');
  const [color, setColor] = useState(team.color ?? TEAM_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const { error } = await supabase.from('teams').update({
      name: name.trim(),
      seed: seed ? parseInt(seed) : null,
      color,
    }).eq('id', team.id);
    setSaving(false);
    if (error) { console.error('Error updating team:', error); return; }
    onSaved();
    onClose();
  }, [name, seed, color, team.id, onSaved, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Edit Team">
      <div className="space-y-4">
        <Input label="Team Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Seed" type="number" value={seed} onChange={(e) => setSeed(e.target.value)} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-muted">Team Color</label>
          <div className="flex flex-wrap gap-2">
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface)]' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Create Match Modal
// ============================================================

function CreateMatchModal({ open, onClose, tournamentId, teams, onCreated }: {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  teams: Team[];
  onCreated: () => void;
}) {
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [round, setRound] = useState('1');
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!team1Id || !team2Id || team1Id === team2Id) return;
    setSaving(true);
    const { error } = await supabase.from('matches').insert({
      tournament_id: tournamentId,
      team1_id: team1Id,
      team2_id: team2Id,
      status: 'scheduled',
      round: round ? parseInt(round) : null,
    });
    setSaving(false);
    if (error) { console.error('Error creating match:', error); return; }
    setTeam1Id(''); setTeam2Id(''); setRound('1');
    onCreated();
    onClose();
  }, [team1Id, team2Id, round, tournamentId, onCreated, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Create Match">
      <div className="space-y-4">
        <Select label="Team 1" value={team1Id} onChange={(e) => setTeam1Id(e.target.value)}>
          <option value="">Select team...</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <div className="flex items-center justify-center text-muted text-sm font-mono">VS</div>
        <Select label="Team 2" value={team2Id} onChange={(e) => setTeam2Id(e.target.value)}>
          <option value="">Select team...</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Input label="Round" type="number" value={round} onChange={(e) => setRound(e.target.value)} />
        {team1Id && team2Id && team1Id === team2Id && (
          <p className="text-sm text-error">Please select two different teams.</p>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !team1Id || !team2Id || team1Id === team2Id} className="flex-1">
            {saving ? 'Creating...' : 'Create Match'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Score Match Modal
// ============================================================

function ScoreMatchModal({ match, config, open, onClose, onSaved }: {
  match: MatchWithTeams;
  config: ScoringConfig;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const format = config.format;
  const [t1Points, setT1Points] = useState(match.team1_score?.points?.toString() ?? '');
  const [t2Points, setT2Points] = useState(match.team2_score?.points?.toString() ?? '');
  const [t1Sets, setT1Sets] = useState<number[]>(match.team1_score?.sets ?? (format === 'sets' ? [] : []));
  const [t2Sets, setT2Sets] = useState<number[]>(match.team2_score?.sets ?? (format === 'sets' ? [] : []));
  const [t1Time, setT1Time] = useState(match.team1_score?.time_seconds?.toString() ?? '');
  const [t2Time, setT2Time] = useState(match.team2_score?.time_seconds?.toString() ?? '');
  const [status, setStatus] = useState(match.status);
  const [saving, setSaving] = useState(false);

  const t1 = match.team1;
  const t2 = match.team2;

  const handleSave = useCallback(async () => {
    setSaving(true);
    let t1Score: ScorePayload | null = null;
    let t2Score: ScorePayload | null = null;

    if (format === 'points') {
      t1Score = { points: t1Points ? parseInt(t1Points) : 0 };
      t2Score = { points: t2Points ? parseInt(t2Points) : 0 };
    } else if (format === 'sets') {
      const t1Won = t1Sets.filter((s, i) => s > t2Sets[i]).length;
      const t2Won = t2Sets.filter((s, i) => s > t1Sets[i]).length;
      t1Score = { sets: t1Sets, sets_won: t1Won };
      t2Score = { sets: t2Sets, sets_won: t2Won };
    } else if (format === 'time') {
      t1Score = { time_seconds: t1Time ? parseInt(t1Time) : 0 };
      t2Score = { time_seconds: t2Time ? parseInt(t2Time) : 0 };
    }

    const newStatus = status === 'completed' ? 'completed' : status === 'in_progress' ? 'in_progress' : 'scheduled';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    const { error } = await supabase.from('matches').update({
      team1_score: t1Score,
      team2_score: t2Score,
      status: newStatus,
      completed_at: completedAt,
    }).eq('id', match.id);

    setSaving(false);
    if (error) { console.error('Error saving score:', error); return; }
    onSaved();
    onClose();
  }, [format, t1Points, t2Points, t1Sets, t2Sets, t1Time, t2Time, status, match.id, onSaved, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Score Match" maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Team names */}
        <div className="flex items-center justify-between bg-surface-2 rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            {t1?.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t1.color }} />}
            <span className="font-bold">{t1?.name ?? 'TBD'}</span>
          </div>
          <span className="text-muted text-sm font-mono">VS</span>
          <div className="flex items-center gap-2.5">
            <span className="font-bold">{t2?.name ?? 'TBD'}</span>
            {t2?.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t2.color }} />}
          </div>
        </div>

        {/* Score input by format */}
        {format === 'points' && (
          <div className="grid grid-cols-2 gap-4">
            <Input label={t1?.name ?? 'Team 1'} type="number" value={t1Points} onChange={(e) => setT1Points(e.target.value)} className="text-center text-2xl font-mono font-bold" />
            <Input label={t2?.name ?? 'Team 2'} type="number" value={t2Points} onChange={(e) => setT2Points(e.target.value)} className="text-center text-2xl font-mono font-bold" />
          </div>
        )}

        {format === 'time' && (
          <div className="grid grid-cols-2 gap-4">
            <Input label={`${t1?.name ?? 'Team 1'} (seconds)`} type="number" value={t1Time} onChange={(e) => setT1Time(e.target.value)} className="text-center text-xl font-mono font-bold" placeholder="e.g. 1830" />
            <Input label={`${t2?.name ?? 'Team 2'} (seconds)`} type="number" value={t2Time} onChange={(e) => setT2Time(e.target.value)} className="text-center text-xl font-mono font-bold" placeholder="e.g. 1740" />
          </div>
        )}

        {format === 'sets' && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Enter the score for each set. The winner of each set is determined by the higher score.</p>
            <div className="space-y-2">
              {Array.from({ length: Math.max(t1Sets.length, t2Sets.length, 3) }).map((_, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <Input type="number" value={t1Sets[i] ?? ''} onChange={(e) => {
                    const next = [...t1Sets]; next[i] = parseInt(e.target.value) || 0; setT1Sets(next);
                  }} className="text-center font-mono font-bold" placeholder="0" />
                  <span className="text-xs text-muted font-semibold">Set {i + 1}</span>
                  <Input type="number" value={t2Sets[i] ?? ''} onChange={(e) => {
                    const next = [...t2Sets]; next[i] = parseInt(e.target.value) || 0; setT2Sets(next);
                  }} className="text-center font-mono font-bold" placeholder="0" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setT1Sets([...t1Sets, 0]); setT2Sets([...t2Sets, 0]); }}>
                <Plus size={14} /> Add Set
              </Button>
              {t1Sets.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { setT1Sets(t1Sets.slice(0, -1)); setT2Sets(t2Sets.slice(0, -1)); }}>
                  <X size={14} /> Remove Last Set
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Status selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-muted">Match Status</label>
          <div className="grid grid-cols-3 gap-2">
            {(['scheduled', 'in_progress', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                  status === s
                    ? 'bg-primary border-primary text-white'
                    : 'bg-surface-2 border-default text-muted hover:text-[var(--color-text)]'
                }`}
              >
                {s === 'scheduled' ? 'Scheduled' : s === 'in_progress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Score'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
