import { useState, useCallback } from 'react';
import { useTournaments } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SCORING_CONFIG, TEAM_COLORS, type ScoringFormat, type ScoringConfig, type Tournament } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Plus, Settings, Monitor, ChevronRight, Shield, Eye } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';

interface HomePageProps {
  isAdmin: boolean;
  onOpenOrganizer: (id: string) => void;
  onOpenScoreboard: (id: string) => void;
}

export function HomePage({ isAdmin, onOpenOrganizer, onOpenScoreboard }: HomePageProps) {
  const { tournaments, loading } = useTournaments();
  const { profile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-default bg-surface/50 glass sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Trophy size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Scoreboard</h1>
              <p className="text-xs text-muted">Tournament Management Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button onClick={() => setShowCreate(true)} size="sm">
                <Plus size={18} /> New Tournament
              </Button>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-muted" />
            </div>
            <h2 className="text-xl font-bold mb-2">No tournaments yet</h2>
            <p className="text-muted mb-6 max-w-sm mx-auto">
              {isAdmin ? 'Create your first tournament to start managing teams, scores, and live standings.' : 'No tournaments have been created yet. Check back soon.'}
            </p>
            {isAdmin && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={18} /> Create Tournament
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Tournaments</h2>
                <span className="text-sm text-muted">{tournaments.length} total</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isAdmin ? 'bg-primary/15 text-primary-light' : 'bg-emerald-500/15 text-accent'}`}>
                {isAdmin ? <Shield size={12} /> : <Eye size={12} />}
                {isAdmin ? 'Admin Mode' : 'Viewer Mode'}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((t) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  isAdmin={isAdmin}
                  onOpenOrganizer={() => onOpenOrganizer(t.id)}
                  onOpenScoreboard={() => onOpenScoreboard(t.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {isAdmin && (
        <CreateTournamentModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          creating={creating}
          setCreating={setCreating}
        />
      )}
    </div>
  );
}

function TournamentCard({ tournament, isAdmin, onOpenOrganizer, onOpenScoreboard }: {
  tournament: Tournament;
  isAdmin: boolean;
  onOpenOrganizer: () => void;
  onOpenScoreboard: () => void;
}) {
  const statusBadge = {
    setup: <Badge variant="default">Setup</Badge>,
    active: <Badge variant="success">Active</Badge>,
    completed: <Badge variant="info">Completed</Badge>,
  }[tournament.status];

  const config = tournament.scoring_config;
  const formatLabel = {
    points: 'Points-based',
    sets: 'Set-based',
    time: 'Time-based',
  }[config.format];

  return (
    <div className="bg-surface border border-default rounded-2xl p-5 hover:border-primary/40 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base truncate mb-1">{tournament.name}</h3>
          <p className="text-sm text-muted">{tournament.sport_name}</p>
        </div>
        {statusBadge}
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-muted">
        <span className="px-2 py-1 rounded-md bg-surface-2">{formatLabel}</span>
        <span className="px-2 py-1 rounded-md bg-surface-2">
          {config.win_condition === 'highest' ? 'Highest wins' : 'Lowest wins'}
        </span>
      </div>

      <div className="flex gap-2">
        {isAdmin ? (
          <button
            onClick={onOpenOrganizer}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-2 hover:bg-primary hover:text-white text-sm font-semibold transition-all border border-default hover:border-primary"
          >
            <Settings size={16} /> Organize
          </button>
        ) : null}
        <button
          onClick={onOpenScoreboard}
          className={`${isAdmin ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-2 hover:bg-accent hover:text-white text-sm font-semibold transition-all border border-default hover:border-accent`}
        >
          <Monitor size={16} /> Scoreboard
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function CreateTournamentModal({ open, onClose, creating, setCreating }: {
  open: boolean;
  onClose: () => void;
  creating: boolean;
  setCreating: (v: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [sportName, setSportName] = useState('');
  const [format, setFormat] = useState<ScoringFormat>('points');
  const [winCondition, setWinCondition] = useState<'highest' | 'lowest'>('highest');
  const [winPoints, setWinPoints] = useState(3);
  const [drawPoints, setDrawPoints] = useState(1);
  const [lossPoints, setLossPoints] = useState(0);
  const [allowDraws, setAllowDraws] = useState(true);

  const handleCreate = useCallback(async () => {
    if (!name.trim() || !sportName.trim()) return;
    setCreating(true);
    const config: ScoringConfig = {
      format,
      win_condition: winCondition,
      points_for_win: winPoints,
      points_for_draw: drawPoints,
      points_for_loss: lossPoints,
      sets_to_win: format === 'sets' ? 2 : 0,
      allow_draws: format === 'time' ? false : allowDraws,
    };
    const { error } = await supabase.from('tournaments').insert({
      name: name.trim(),
      sport_name: sportName.trim(),
      scoring_config: config,
      status: 'setup',
    });
    setCreating(false);
    if (error) { console.error('Error creating tournament:', error); return; }
    setName(''); setSportName(''); setFormat('points'); setWinCondition('highest');
    setWinPoints(3); setDrawPoints(1); setLossPoints(0); setAllowDraws(true);
    onClose();
  }, [name, sportName, format, winCondition, winPoints, drawPoints, lossPoints, allowDraws, setCreating, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Create Tournament">
      <div className="space-y-4">
        <Input label="Tournament Name" placeholder="e.g. Summer Cup 2026" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Sport / Game" placeholder="e.g. Basketball, Volleyball, Chess" value={sportName} onChange={(e) => setSportName(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Scoring Format" value={format} onChange={(e) => setFormat(e.target.value as ScoringFormat)}>
            <option value="points">Points-based</option>
            <option value="sets">Set-based</option>
            <option value="time">Time-based</option>
          </Select>
          <Select label="Win Condition" value={winCondition} onChange={(e) => setWinCondition(e.target.value as 'highest' | 'lowest')}>
            <option value="highest">Highest score wins</option>
            <option value="lowest">Lowest score wins</option>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label="Win Pts" type="number" value={winPoints} onChange={(e) => setWinPoints(Number(e.target.value))} />
          <Input label="Draw Pts" type="number" value={drawPoints} onChange={(e) => setDrawPoints(Number(e.target.value))} />
          <Input label="Loss Pts" type="number" value={lossPoints} onChange={(e) => setLossPoints(Number(e.target.value))} />
        </div>

        {format !== 'time' && (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={allowDraws} onChange={(e) => setAllowDraws(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
            <span className="text-sm text-muted">Allow draws in this sport</span>
          </label>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim() || !sportName.trim()} className="flex-1">
            {creating ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
