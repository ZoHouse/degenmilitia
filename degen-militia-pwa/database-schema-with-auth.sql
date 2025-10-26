-- Enhanced Database Schema with User Auth & Metrics
-- Run this in Supabase SQL Editor

-- ============================================
-- PLAYERS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,
  bio TEXT,
  country TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

-- ============================================
-- PLAYER STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_playtime_seconds INTEGER DEFAULT 0,
  highest_killstreak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  rank_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id)
);

-- ============================================
-- GAME SESSIONS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES players(id),
  status TEXT DEFAULT 'waiting', -- waiting, active, completed
  max_players INTEGER DEFAULT 8,
  current_players INTEGER DEFAULT 0,
  map_name TEXT DEFAULT 'default',
  game_mode TEXT DEFAULT 'deathmatch',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES players(id)
);

-- ============================================
-- SESSION PLAYERS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  placement INTEGER,
  UNIQUE(session_id, player_id)
);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  points INTEGER DEFAULT 10,
  requirement_type TEXT, -- kills, wins, killstreak, etc.
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PLAYER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, achievement_id)
);

-- ============================================
-- DAILY CHALLENGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT, -- kills, wins, playtime
  target_value INTEGER,
  reward_xp INTEGER DEFAULT 100,
  active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PLAYER CHALLENGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS player_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(player_id, challenge_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_rank_points ON player_stats(rank_points DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_code ON game_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_players_session_id ON session_players(session_id);
CREATE INDEX IF NOT EXISTS idx_session_players_player_id ON session_players(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_player_id ON player_achievements(player_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update player stats updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_stats_timestamp
BEFORE UPDATE ON player_stats
FOR EACH ROW
EXECUTE FUNCTION update_player_stats_timestamp();

-- Calculate K/D ratio
CREATE OR REPLACE FUNCTION get_kd_ratio(p_player_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  kills INTEGER;
  deaths INTEGER;
BEGIN
  SELECT total_kills, total_deaths INTO kills, deaths
  FROM player_stats
  WHERE player_id = p_player_id;
  
  IF deaths = 0 THEN
    RETURN kills::NUMERIC;
  ELSE
    RETURN ROUND((kills::NUMERIC / deaths::NUMERIC), 2);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate win rate
CREATE OR REPLACE FUNCTION get_win_rate(p_player_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  wins INTEGER;
  games INTEGER;
BEGIN
  SELECT games_won, games_played INTO wins, games
  FROM player_stats
  WHERE player_id = p_player_id;
  
  IF games = 0 THEN
    RETURN 0;
  ELSE
    RETURN ROUND((wins::NUMERIC / games::NUMERIC) * 100, 1);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT SAMPLE ACHIEVEMENTS
-- ============================================
INSERT INTO achievements (name, description, icon, rarity, points, requirement_type, requirement_value)
VALUES
  ('First Blood', 'Get your first kill', '🎯', 'common', 10, 'kills', 1),
  ('Killing Spree', 'Get 5 kills in one game', '🔥', 'rare', 25, 'killstreak', 5),
  ('Unstoppable', 'Get 10 kills in one game', '⚡', 'epic', 50, 'killstreak', 10),
  ('Godlike', 'Get 20 kills in one game', '👑', 'legendary', 100, 'killstreak', 20),
  ('Winner', 'Win your first game', '🏆', 'common', 15, 'wins', 1),
  ('Champion', 'Win 10 games', '🥇', 'rare', 50, 'wins', 10),
  ('Legend', 'Win 50 games', '💎', 'epic', 150, 'wins', 50),
  ('Veteran', 'Play 100 games', '🎖️', 'rare', 30, 'games_played', 100)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- Players can read all profiles but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON players FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Stats are viewable by everyone
CREATE POLICY "Stats are viewable by everyone"
  ON player_stats FOR SELECT
  USING (true);

-- Achievements are viewable by everyone
CREATE POLICY "Achievements are viewable by everyone"
  ON player_achievements FOR SELECT
  USING (true);

COMMENT ON TABLE players IS 'User profiles with wallet integration';
COMMENT ON TABLE player_stats IS 'Player statistics and progression';
COMMENT ON TABLE game_sessions IS 'Active and completed game sessions';
COMMENT ON TABLE achievements IS 'Available achievements in the game';

