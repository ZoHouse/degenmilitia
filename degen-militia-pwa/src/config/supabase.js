import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Supabase Client Configuration
 * Handles database connections and real-time subscriptions
 */

let supabaseClient = null;

export const getSupabaseClient = () => {
  if (!supabaseClient && env.supabase.url && env.supabase.anonKey) {
    supabaseClient = createClient(
      env.supabase.url,
      env.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }
  return supabaseClient;
};

/**
 * Database Operations
 */

// Player Profile
export const playerService = {
  // Get player profile
  async getProfile(userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching player profile:', error);
      return null;
    }

    return data;
  },

  // Create or update player profile
  async upsertProfile(userId, profileData) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('players')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting player profile:', error);
      return null;
    }

    return data;
  },

  // Update player stats
  async updateStats(userId, stats) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('players')
      .update({
        kills: stats.kills,
        deaths: stats.deaths,
        wins: stats.wins,
        games_played: stats.gamesPlayed,
        total_playtime: stats.totalPlaytime,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating player stats:', error);
      return null;
    }

    return data;
  },
};

// Leaderboard
export const leaderboardService = {
  // Get top players
  async getTopPlayers(limit = 10) {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('players')
      .select('user_id, username, kills, deaths, wins, games_played')
      .order('kills', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data;
  },
};

// Game Sessions
export const sessionService = {
  // Create a game session
  async createSession(hostId, roomCode) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        host_id: hostId,
        room_code: roomCode,
        status: 'waiting',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  },

  // Join a session
  async joinSession(sessionId, playerId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('session_players')
      .insert({
        session_id: sessionId,
        player_id: playerId,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining session:', error);
      return null;
    }

    return data;
  },

  // End a session
  async endSession(sessionId, winnerData) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        status: 'completed',
        winner_id: winnerData.winnerId,
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error ending session:', error);
      return null;
    }

    return data;
  },
};

// Real-time subscriptions
export const subscribeToSession = (sessionId, callback) => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  return supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_players',
        filter: `session_id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();
};

export default getSupabaseClient;

