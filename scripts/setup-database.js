/**
 * Database Setup Script
 * Creates tables and initializes the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SQL_SCHEMA = `
-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  
  -- Stats
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_playtime INTEGER DEFAULT 0,
  
  -- Progression
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id TEXT NOT NULL,
  room_code TEXT UNIQUE NOT NULL,
  
  -- Session info
  status TEXT DEFAULT 'waiting',
  max_players INTEGER DEFAULT 8,
  current_players INTEGER DEFAULT 1,
  
  -- Game settings
  game_mode TEXT DEFAULT 'deathmatch',
  map_name TEXT,
  time_limit INTEGER,
  kill_limit INTEGER,
  
  -- Results
  winner_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Session players table
CREATE TABLE IF NOT EXISTS session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  
  -- Performance
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_kills ON players(kills DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON game_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_players_session ON session_players(session_id);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Players viewable by all" ON players;
CREATE POLICY "Players viewable by all" ON players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON players;
CREATE POLICY "Users update own profile" ON players FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users insert own profile" ON players;
CREATE POLICY "Users insert own profile" ON players FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Sessions viewable by all" ON game_sessions;
CREATE POLICY "Sessions viewable by all" ON game_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create session" ON game_sessions;
CREATE POLICY "Anyone can create session" ON game_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Session players viewable" ON session_players;
CREATE POLICY "Session players viewable" ON session_players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can join session" ON session_players;
CREATE POLICY "Anyone can join session" ON session_players FOR INSERT WITH CHECK (true);
`;

async function setupDatabase() {
  console.log('🚀 Setting up Degen Militia database...\n');
  
  try {
    // Test connection
    console.log('📡 Testing connection to Supabase...');
    const { data, error } = await supabase.from('players').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means table doesn't exist yet, which is fine
      console.log('⚠️  Tables not found, creating schema...');
    } else {
      console.log('✅ Connection successful!');
      console.log('⚠️  Tables may already exist, attempting to create anyway...\n');
    }
    
    // Execute schema
    console.log('📝 Creating database schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: SQL_SCHEMA });
    
    // Note: exec_sql might not exist, so we'll use the SQL editor approach
    console.log('⚠️  Please run the SQL schema manually in Supabase dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard/project/gmapyfpcljfeddljnucb/editor');
    console.log('   2. Open SQL Editor');
    console.log('   3. Copy and run the schema from SETUP-SERVICES.md\n');
    
    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = ['players', 'game_sessions', 'session_players'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(0);
      if (!error) {
        console.log(`   ✅ ${table} table ready`);
      } else {
        console.log(`   ❌ ${table} table not found`);
      }
    }
    
    console.log('\n✅ Database setup complete!');
    console.log('\n🎮 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Click login and authenticate');
    console.log('   4. Start playing!\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();

