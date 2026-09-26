import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { HomePage } from '@/pages/HomePage';
import { OrganizerPage } from '@/pages/OrganizerPage';
import { ScoreboardPage } from '@/pages/ScoreboardPage';
import { LoginPage } from '@/pages/LoginPage';

type Route =
  | { page: 'home' }
  | { page: 'organizer'; tournamentId: string }
  | { page: 'scoreboard'; tournamentId: string };

function parseHash(): Route {
  const hash = window.location.hash.slice(1);
  const parts = hash.split('/');
  if (parts[0] === 'organizer' && parts[1]) {
    return { page: 'organizer', tournamentId: parts[1] };
  }
  if (parts[0] === 'scoreboard' && parts[1]) {
    return { page: 'scoreboard', tournamentId: parts[1] };
  }
  return { page: 'home' };
}

function routeToHash(route: Route): string {
  if (route.page === 'organizer') return `organizer/${route.tournamentId}`;
  if (route.page === 'scoreboard') return `scoreboard/${route.tournamentId}`;
  return '';
}

function App() {
  const { session, profile, loading } = useAuth();
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((r: Route) => {
    const hash = routeToHash(r);
    window.location.hash = hash;
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginPage />;
  }

  const isAdmin = profile.role === 'admin';

  // Block viewers from accessing the organizer panel — redirect to scoreboard
  if (route.page === 'organizer' && !isAdmin) {
    navigate({ page: 'scoreboard', tournamentId: route.tournamentId });
    return null;
  }

  if (route.page === 'home') {
    return (
      <HomePage
        isAdmin={isAdmin}
        onOpenOrganizer={(id) => navigate({ page: 'organizer', tournamentId: id })}
        onOpenScoreboard={(id) => navigate({ page: 'scoreboard', tournamentId: id })}
      />
    );
  }

  if (route.page === 'organizer') {
    return (
      <OrganizerPage
        tournamentId={route.tournamentId}
        onBack={() => navigate({ page: 'home' })}
        onOpenScoreboard={(id) => navigate({ page: 'scoreboard', tournamentId: id })}
      />
    );
  }

  if (route.page === 'scoreboard') {
    return (
      <ScoreboardPage
        tournamentId={route.tournamentId}
        onBack={() => navigate({ page: 'home' })}
      />
    );
  }

  return null;
}

export default App;
