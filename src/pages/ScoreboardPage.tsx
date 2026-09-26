import { useState, useEffect } from 'react';
import { useTournament, useMatches, useStandings } from '@/hooks/useSupabaseData';
import type { MatchWithTeams, ScoringConfig } from '@/types/database';
import { StandingsTable } from '@/components/StandingsTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Trophy, Radio, Clock, Activity, ChevronRight } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';

interface ScoreboardPageProps {
  tournamentId: string;
  onBack: () => void;
}

export function ScoreboardPage({ tournamentId, onBack }: ScoreboardPageProps) {
  const { tournament, loading } = useTournament(tournamentId);
  const { matches } = useMatches(tournamentId);
  const { standings, lastUpdate } = useStandings(tournamentId);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pulse, setPulse] = useState(false);

  // Flash effect when standings update
  useEffect(() => {
    if (!lastUpdate) return;
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 800);
    return () => clearTimeout(timer);
  }, [lastUpdate]);

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const config = tournament.scoring_config;
  const liveMatches = matches.filter((m) => m.status === 'in_progress');
  const scheduledMatches = matches.filter((m) => m.status === 'scheduled');
  const completedMatches = matches.filter((m) => m.status === 'completed');

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero header */}
      <header className="relative overflow-hidden border-b border-default">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-emerald-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-[var(--color-text)] transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE UPDATES
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-3.5 h-3.5 rounded accent-blue-500" />
                <span className="text-xs text-muted">Auto</span>
              </label>
              <UserMenu />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-600/30">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{tournament.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted">{tournament.sport_name}</span>
                <Badge variant={
                  tournament.status === 'active' ? 'success' :
                  tournament.status === 'completed' ? 'info' : 'default'
                }>
                  {tournament.status === 'active' ? 'Active' : tournament.status === 'completed' ? 'Completed' : 'Setup'}
                </Badge>
                <span className="text-xs text-muted hidden sm:inline">
                  {config.format === 'points' ? 'Points-based' : config.format === 'sets' ? 'Set-based' : 'Time-based'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live matches */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Radio size={18} className="text-amber-400" />
              <h2 className="font-bold text-lg text-amber-400">Live Now</h2>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold animate-pulse">
                {liveMatches.length} LIVE
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((m) => (
                <LiveMatchDisplay key={m.id} match={m} config={config} />
              ))}
            </div>
          </section>
        )}

        {/* Standings */}
        <section className={`bg-surface border border-default rounded-2xl overflow-hidden ${pulse ? 'animate-flash' : ''}`}>
          <div className="px-5 py-4 border-b border-default flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-primary-light" />
              <h2 className="font-bold text-lg">Standings</h2>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdate && (
                <span className="text-xs text-muted flex items-center gap-1">
                  <Clock size={12} /> Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Badge variant="success">Auto</Badge>
            </div>
          </div>
          <StandingsTable standings={standings} />
        </section>

        {/* Recent results */}
        {completedMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} className="text-muted" />
              <h2 className="font-bold text-lg">Recent Results</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completedMatches.slice(-6).reverse().map((m) => (
                <ResultDisplay key={m.id} match={m} config={config} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {scheduledMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-muted" />
              <h2 className="font-bold text-lg">Upcoming</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scheduledMatches.slice(0, 6).map((m) => (
                <UpcomingMatchDisplay key={m.id} match={m} config={config} />
              ))}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div className="text-center py-20">
            <Trophy size={40} className="mx-auto mb-4 text-muted opacity-30" />
            <p className="text-muted text-lg">No matches scheduled yet.</p>
            <p className="text-muted text-sm mt-1">Check back once the organizer starts the tournament.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// Live Match Display (big, prominent)
// ============================================================

function LiveMatchDisplay({ match, config }: { match: MatchWithTeams; config: ScoringConfig }) {
  const t1 = match.team1;
  const t2 = match.team2;

  const getScore = (score: MatchWithTeams['team1_score']): string => {
    if (!score) return '0';
    if (config.format === 'sets') return `${score.sets_won ?? 0}`;
    if (config.format === 'time') {
      const s = score.time_seconds ?? 0;
      return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    }
    return `${score.points ?? 0}`;
  };

  return (
    <div className="bg-surface border-2 border-amber-500/40 rounded-2xl p-5 animate-pulse-glow">
      <div className="flex items-center justify-between mb-4">
        {match.round != null && <span className="text-xs text-muted">Round {match.round}</span>}
        <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold ml-auto">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          LIVE
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {t1?.color && <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t1.color }} />}
            <span className="font-bold truncate">{t1?.name ?? 'TBD'}</span>
          </div>
          <span className="font-mono text-3xl font-black text-primary-light">{getScore(match.team1_score)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {t2?.color && <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t2.color }} />}
            <span className="font-bold truncate">{t2?.name ?? 'TBD'}</span>
          </div>
          <span className="font-mono text-3xl font-black text-primary-light">{getScore(match.team2_score)}</span>
        </div>
      </div>
      {config.format === 'sets' && match.team1_score?.sets && (
        <div className="mt-3 pt-3 border-t border-default flex justify-center gap-2">
          {match.team1_score.sets.map((s, i) => (
            <span key={i} className="text-xs font-mono text-muted">
              {s}-{match.team2_score?.sets?.[i] ?? 0}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Result Display
// ============================================================

function ResultDisplay({ match, config }: { match: MatchWithTeams; config: ScoringConfig }) {
  const t1 = match.team1;
  const t2 = match.team2;

  const getScore = (score: MatchWithTeams['team1_score']): string => {
    if (!score) return '-';
    if (config.format === 'sets') return `${score.sets_won ?? 0}`;
    if (config.format === 'time') {
      const s = score.time_seconds ?? 0;
      return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    }
    return `${score.points ?? 0}`;
  };

  const t1Score = getScore(match.team1_score);
  const t2Score = getScore(match.team2_score);
  const t1Won = parseInt(t1Score) > parseInt(t2Score);
  const t2Won = parseInt(t2Score) > parseInt(t1Score);

  return (
    <div className="bg-surface border border-default rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        {match.round != null && <span className="text-xs text-muted">Round {match.round}</span>}
        <Badge variant="success">Final</Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {t1?.color && <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t1.color }} />}
            <span className={`text-sm truncate ${t1Won ? 'font-bold' : 'font-medium'} ${t2Won ? 'opacity-50' : ''}`}>{t1?.name ?? 'TBD'}</span>
          </div>
          <span className={`font-mono text-xl font-bold ${t1Won ? 'text-accent' : 'text-muted'}`}>{t1Score}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {t2?.color && <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t2.color }} />}
            <span className={`text-sm truncate ${t2Won ? 'font-bold' : 'font-medium'} ${t1Won ? 'opacity-50' : ''}`}>{t2?.name ?? 'TBD'}</span>
          </div>
          <span className={`font-mono text-xl font-bold ${t2Won ? 'text-accent' : 'text-muted'}`}>{t2Score}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Upcoming Match Display
// ============================================================

function UpcomingMatchDisplay({ match, config }: { match: MatchWithTeams; config: ScoringConfig }) {
  const t1 = match.team1;
  const t2 = match.team2;
  return (
    <div className="bg-surface border border-default rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        {match.round != null && <span className="text-xs text-muted">Round {match.round}</span>}
        <Badge variant="default">Scheduled</Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {t1?.color && <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t1.color }} />}
          <span className="text-sm font-medium truncate">{t1?.name ?? 'TBD'}</span>
        </div>
        <div className="text-center text-xs text-muted font-mono">VS</div>
        <div className="flex items-center gap-2">
          {t2?.color && <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t2.color }} />}
          <span className="text-sm font-medium truncate">{t2?.name ?? 'TBD'}</span>
        </div>
      </div>
    </div>
  );
}
