-- Enable Supabase Realtime on the tables the app subscribes to.
-- Without this, postgres_changes subscriptions never fire and the
-- scoreboard/standings never auto-refresh when scores change.

ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;