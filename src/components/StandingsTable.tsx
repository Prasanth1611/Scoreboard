import type { StandingsRow } from '@/types/database';
import { Trophy } from 'lucide-react';

interface StandingsTableProps {
  standings: StandingsRow[];
  compact?: boolean;
}

export function StandingsTable({ standings, compact = false }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <Trophy size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No standings yet. Standings appear once matches are completed.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-default">
            <th className="py-3 px-3 font-semibold w-12">Rank</th>
            <th className="py-3 px-3 font-semibold">Team</th>
            <th className="py-3 px-3 font-semibold text-center w-12">P</th>
            <th className="py-3 px-3 font-semibold text-center w-12">W</th>
            <th className="py-3 px-3 font-semibold text-center w-12">D</th>
            <th className="py-3 px-3 font-semibold text-center w-12">L</th>
            {!compact && <th className="py-3 px-3 font-semibold text-center w-16">PF</th>}
            {!compact && <th className="py-3 px-3 font-semibold text-center w-16">PA</th>}
            {!compact && <th className="py-3 px-3 font-semibold text-center w-16">+/-</th>}
            <th className="py-3 px-3 font-semibold text-center w-16">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.team_id}
              className="border-b border-default/50 hover:bg-surface-2/50 transition-colors animate-flash"
            >
              <td className="py-3 px-3">
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm ${
                  row.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                  row.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                  row.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                  'text-muted'
                }`}>
                  {row.rank}
                </div>
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2.5">
                  {row.color && (
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                  )}
                  <span className="font-semibold text-sm">{row.team_name}</span>
                  {row.seed != null && (
                    <span className="text-xs text-muted">#{row.seed}</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-3 text-center text-sm font-mono">{row.played}</td>
              <td className="py-3 px-3 text-center text-sm font-mono text-accent font-semibold">{row.wins}</td>
              <td className="py-3 px-3 text-center text-sm font-mono text-warning">{row.draws}</td>
              <td className="py-3 px-3 text-center text-sm font-mono text-error">{row.losses}</td>
              {!compact && <td className="py-3 px-3 text-center text-sm font-mono">{row.points_for}</td>}
              {!compact && <td className="py-3 px-3 text-center text-sm font-mono">{row.points_against}</td>}
              {!compact && (
                <td className={`py-3 px-3 text-center text-sm font-mono font-semibold ${row.points_diff > 0 ? 'text-accent' : row.points_diff < 0 ? 'text-error' : ''}`}>
                  {row.points_diff > 0 ? '+' : ''}{row.points_diff}
                </td>
              )}
              <td className="py-3 px-3 text-center">
                <span className="font-mono font-bold text-base text-primary-light">{row.standings_points}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
