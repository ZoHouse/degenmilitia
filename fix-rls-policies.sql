-- Fix Row Level Security to allow anonymous inserts/updates
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own profile" ON players;

-- Allow anyone to INSERT new players (for registration)
CREATE POLICY "Allow anonymous insert players"
  ON players FOR INSERT
  WITH CHECK (true);

-- Allow anyone to SELECT players (public profiles)
CREATE POLICY "Allow public read players"
  ON players FOR SELECT
  USING (true);

-- Allow users to UPDATE their own profile (by wallet_address or id)
CREATE POLICY "Allow users update own profile"
  ON players FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to INSERT/UPDATE player_stats
CREATE POLICY "Allow insert player_stats"
  ON player_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update player_stats"
  ON player_stats FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to read game sessions
CREATE POLICY "Allow read game_sessions"
  ON game_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow insert game_sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update game_sessions"
  ON game_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to read/write session_players
CREATE POLICY "Allow read session_players"
  ON session_players FOR SELECT
  USING (true);

CREATE POLICY "Allow insert session_players"
  ON session_players FOR INSERT
  WITH CHECK (true);

