import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tournament, Team, Match, StandingsRow, MatchWithTeams } from '@/types/database';

// ============================================================
// Tournament hooks
// ============================================================

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = useCallback(async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching tournaments:', error);
      return;
    }
    setTournaments(data as Tournament[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTournaments();
    const channel = supabase
      .channel('tournaments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
        fetchTournaments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTournaments]);

  return { tournaments, loading, refetch: fetchTournaments };
}

export function useTournament(tournamentId: string | null) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTournament = useCallback(async () => {
    if (!tournamentId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .maybeSingle();
    if (error) { console.error('Error fetching tournament:', error); return; }
    setTournament(data as Tournament);
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
    if (!tournamentId) return;
    const channel = supabase
      .channel(`tournament-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` }, () => {
        fetchTournament();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTournament, tournamentId]);

  return { tournament, loading, refetch: fetchTournament };
}

// ============================================================
// Team hooks
// ============================================================

export function useTeams(tournamentId: string | null) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!tournamentId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true, nullsFirst: false });
    if (error) { console.error('Error fetching teams:', error); return; }
    setTeams(data as Team[]);
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    fetchTeams();
    if (!tournamentId) return;
    const channel = supabase
      .channel(`teams-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `tournament_id=eq.${tournamentId}` }, () => {
        fetchTeams();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTeams, tournamentId]);

  return { teams, loading, refetch: fetchTeams };
}

// ============================================================
// Match hooks
// ============================================================

export function useMatches(tournamentId: string | null) {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!tournamentId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:team1_id(id, name, color, seed),
        team2:team2_id(id, name, color, seed)
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });
    if (error) { console.error('Error fetching matches:', error); return; }
    setMatches(data as MatchWithTeams[]);
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    fetchMatches();
    if (!tournamentId) return;
    const channel = supabase
      .channel(`matches-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` }, () => {
        fetchMatches();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMatches, tournamentId]);

  return { matches, loading, refetch: fetchMatches };
}

// ============================================================
// Standings hook (auto-updates via realtime on matches + teams)
// ============================================================

export function useStandings(tournamentId: string | null) {
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStandings = useCallback(async () => {
    if (!tournamentId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('standings')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('rank', { ascending: true });
    if (error) { console.error('Error fetching standings:', error); return; }
    setStandings(data as StandingsRow[]);
    setLastUpdate(new Date());
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    fetchStandings();
    if (!tournamentId) return;

    // Subscribe to both matches and teams changes — either can affect standings
    const channel = supabase
      .channel(`standings-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` }, () => {
        fetchStandings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `tournament_id=eq.${tournamentId}` }, () => {
        fetchStandings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStandings, tournamentId]);

  return { standings, loading, lastUpdate, refetch: fetchStandings };
}
