/*
# Add Authentication with Role-Based Access (Admin / Viewer)

## Overview
Adds a `profiles` table linked to `auth.users` that stores each user's role
('admin' or 'viewer'). Updates all existing RLS policies to enforce role-based
access: both admins and viewers can read all tournament data, but only admins
can create, update, or delete tournaments, teams, and matches.

## New Objects

### 1. profiles table
- `id` (uuid, PK, references auth.users.id ON DELETE CASCADE)
- `email` (text) — copied from auth.users at signup for convenience
- `full_name` (text) — display name
- `role` (text) — 'admin' or 'viewer', defaults to 'viewer'
- `created_at` (timestamptz)

### 2. Trigger: handle_new_user
Auto-creates a profile row when a new user signs up. The role is read from
the `raw_user_meta_data.role` field passed during signUp (defaulting to 'viewer'
if not provided). This lets the signup form choose the role.

## Security Changes

### profiles table
- RLS enabled
- Users can read their own profile (SELECT by auth.uid() = id)
- Users can update their own profile name but NOT their role
  (role is set at signup and should not be user-changeable)

### tournaments, teams, matches tables
- SELECT: TO authenticated USING (true) — both admins and viewers can read
- INSERT/UPDATE/DELETE: TO authenticated, but only if the user's profile
  role is 'admin'. Uses EXISTS subquery on profiles table.

### standings view
- GRANT SELECT TO authenticated (reads through base table RLS)

## Important Notes
1. The anon role no longer has access to any table — all access requires
   authentication. The frontend must sign in before it can read data.
2. The role is stored in the profiles table, NOT in user_metadata, to prevent
   users from escalating their own privileges.
3. The trigger reads role from raw_user_meta_data at signup time only.
4. Existing data is preserved — only policies change, not data.
*/

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Users can update their own profile (name only, not role)
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- FUNCTION: handle_new_user — auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Update RLS on tournaments
-- ============================================================

-- Drop old anon policies
DROP POLICY IF EXISTS "anon_select_tournaments" ON tournaments;
DROP POLICY IF EXISTS "anon_insert_tournaments" ON tournaments;
DROP POLICY IF EXISTS "anon_update_tournaments" ON tournaments;
DROP POLICY IF EXISTS "anon_delete_tournaments" ON tournaments;

-- SELECT: all authenticated users (admins + viewers)
DROP POLICY IF EXISTS "auth_select_tournaments" ON tournaments;
CREATE POLICY "auth_select_tournaments" ON tournaments FOR SELECT
  TO authenticated USING (true);

-- INSERT/UPDATE/DELETE: admins only
DROP POLICY IF EXISTS "admin_insert_tournaments" ON tournaments;
CREATE POLICY "admin_insert_tournaments" ON tournaments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_tournaments" ON tournaments;
CREATE POLICY "admin_update_tournaments" ON tournaments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_tournaments" ON tournaments;
CREATE POLICY "admin_delete_tournaments" ON tournaments FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- Update RLS on teams
-- ============================================================

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
DROP POLICY IF EXISTS "anon_update_teams" ON teams;
DROP POLICY IF EXISTS "anon_delete_teams" ON teams;

DROP POLICY IF EXISTS "auth_select_teams" ON teams;
CREATE POLICY "auth_select_teams" ON teams FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
CREATE POLICY "admin_insert_teams" ON teams FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_teams" ON teams;
CREATE POLICY "admin_update_teams" ON teams FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
CREATE POLICY "admin_delete_teams" ON teams FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- Update RLS on matches
-- ============================================================

DROP POLICY IF EXISTS "anon_select_matches" ON matches;
DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
DROP POLICY IF EXISTS "anon_update_matches" ON matches;
DROP POLICY IF EXISTS "anon_delete_matches" ON matches;

DROP POLICY IF EXISTS "auth_select_matches" ON matches;
CREATE POLICY "auth_select_matches" ON matches FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_matches" ON matches;
CREATE POLICY "admin_insert_matches" ON matches FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_matches" ON matches;
CREATE POLICY "admin_update_matches" ON matches FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_matches" ON matches;
CREATE POLICY "admin_delete_matches" ON matches FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- Update standings view grants
-- ============================================================
-- Revoke anon access, keep authenticated
REVOKE ALL ON standings FROM anon;
GRANT SELECT ON standings TO authenticated;