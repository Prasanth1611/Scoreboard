import type { MatchWithTeams, ScoringConfig } from '@/types/database';
import { Badge } from '@/components/ui/Badge';

interface MatchCardProps {
  match: MatchWithTeams;
  scoringConfig?: ScoringConfig;
  onClick?: () => void;
  showActions?: boolean;
}

function formatScore(score: MatchWithTeams['team1_score'], config?: ScoringConfig): string {
  if (!score) return '-';
  if (config?.format === 'sets' && score.sets) {
    return score.sets.join('-');
  }
  if (config?.format === 'time' && score.time_seconds != null) {
    const mins = Math.floor(score.time_seconds / 60);
    const secs = score.time_seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return score.points?.toString() ?? '-';
}

export function MatchCard({ match, scoringConfig, onClick, showActions = false }: MatchCardProps) {
  const t1 = match.team1;
  const t2 = match.team2;

  const statusBadge = {
    scheduled: <Badge variant="default">Scheduled</Badge>,
    in_progress: <Badge variant="warning">Live</Badge>,
    completed: <Badge variant="success">Final</Badge>,
  }[match.status];

  const isCompleted = match.status === 'completed';
  const t1Won = isCompleted && (
    scoringConfig?.format === 'sets'
      ? (match.team1_score?.sets_won ?? 0) > (match.team2_score?.sets_won ?? 0)
      : (match.team1_score?.points ?? 0) > (match.team2_score?.points ?? 0)
  );
  const t2Won = isCompleted && (
    scoringConfig?.format === 'sets'
      ? (match.team2_score?.sets_won ?? 0) > (match.team1_score?.sets_won ?? 0)
      : (match.team2_score?.points ?? 0) > (match.team1_score?.points ?? 0)
  );

  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-default rounded-xl p-4 transition-all ${
        onClick ? 'cursor-pointer hover:border-primary/50 hover:bg-surface-2/50' : ''
      } ${match.status === 'in_progress' ? 'border-amber-500/40 animate-pulse-glow' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.round != null && <span className="text-xs text-muted">Round {match.round}</span>}
          {statusBadge}
        </div>
        {match.status === 'in_progress' && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {t1?.color && <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t1.color }} />}
            <span className={`text-sm truncate ${t1Won ? 'font-bold' : 'font-medium'} ${t2Won ? 'opacity-50' : ''}`}>
              {t1?.name ?? 'TBD'}
            </span>
          </div>
          <span className={`font-mono text-lg font-bold flex-shrink-0 ml-3 ${t1Won ? 'text-accent' : ''}`}>
            {formatScore(match.team1_score, scoringConfig)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {t2?.color && <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t2.color }} />}
            <span className={`text-sm truncate ${t2Won ? 'font-bold' : 'font-medium'} ${t1Won ? 'opacity-50' : ''}`}>
              {t2?.name ?? 'TBD'}
            </span>
          </div>
          <span className={`font-mono text-lg font-bold flex-shrink-0 ml-3 ${t2Won ? 'text-accent' : ''}`}>
            {formatScore(match.team2_score, scoringConfig)}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t border-default text-xs text-muted">
          Click to {match.status === 'completed' ? 'edit' : 'score'} this match
        </div>
      )}
    </div>
  );
}
