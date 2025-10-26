/**
 * User Metrics & Stats Service
 */

import { getSupabaseClient } from '../config/supabase.js';
import { authService } from './AuthService.js';

const supabase = getSupabaseClient();

class UserMetricsService {
  
  /**
   * Get user stats
   */
  async getUserStats(userId) {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No stats yet, create default
        return await this.createDefaultStats(userId);
      }
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get stats error:', error);
      return null;
    }
  }
  
  /**
   * Create default stats for new user
   */
  async createDefaultStats(userId) {
    const defaultStats = {
      player_id: userId,
      total_kills: 0,
      total_deaths: 0,
      games_played: 0,
      games_won: 0,
      total_playtime_seconds: 0,
      highest_killstreak: 0,
      level: 1,
      experience: 0
    };
    
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .insert([defaultStats])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create stats error:', error);
      return defaultStats;
    }
  }
  
  /**
   * Record a kill
   */
  async recordKill(userId, killCount = 1) {
    if (!userId) return;
    
    try {
      const stats = await this.getUserStats(userId);
      
      const { error } = await supabase
        .from('player_stats')
        .update({
          total_kills: (stats.total_kills || 0) + killCount,
          highest_killstreak: Math.max(stats.highest_killstreak || 0, killCount),
          experience: (stats.experience || 0) + (killCount * 10)
        })
        .eq('player_id', userId);
      
      if (error) throw error;
      
      // Check for level up
      await this.checkLevelUp(userId);
    } catch (error) {
      console.error('Record kill error:', error);
    }
  }
  
  /**
   * Record a death
   */
  async recordDeath(userId) {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('player_stats')
        .update({
          total_deaths: supabase.raw('total_deaths + 1')
        })
        .eq('player_id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Record death error:', error);
    }
  }
  
  /**
   * Record game completed
   */
  async recordGameCompleted(userId, won = false, playtimeSeconds = 0) {
    if (!userId) return;
    
    try {
      const updates = {
        games_played: supabase.raw('games_played + 1'),
        total_playtime_seconds: supabase.raw(`total_playtime_seconds + ${playtimeSeconds}`)
      };
      
      if (won) {
        updates.games_won = supabase.raw('games_won + 1');
        updates.experience = supabase.raw('experience + 50'); // Bonus XP for winning
      }
      
      const { error } = await supabase
        .from('player_stats')
        .update(updates)
        .eq('player_id', userId);
      
      if (error) throw error;
      
      await this.checkLevelUp(userId);
    } catch (error) {
      console.error('Record game error:', error);
    }
  }
  
  /**
   * Check and update level
   */
  async checkLevelUp(userId) {
    try {
      const stats = await this.getUserStats(userId);
      const currentLevel = stats.level || 1;
      const currentXP = stats.experience || 0;
      
      // Simple level formula: 100 XP per level
      const requiredXP = currentLevel * 100;
      
      if (currentXP >= requiredXP) {
        const newLevel = Math.floor(currentXP / 100) + 1;
        
        await supabase
          .from('player_stats')
          .update({ level: newLevel })
          .eq('player_id', userId);
        
        return { leveledUp: true, newLevel };
      }
      
      return { leveledUp: false };
    } catch (error) {
      console.error('Level check error:', error);
      return { leveledUp: false };
    }
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10, sortBy = 'total_kills') {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select(`
          *,
          players:player_id (username, wallet_address)
        `)
        .order(sortBy, { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return [];
    }
  }
  
  /**
   * Get user rank
   */
  async getUserRank(userId, sortBy = 'total_kills') {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('player_id, ' + sortBy)
        .order(sortBy, { ascending: false });
      
      if (error) throw error;
      
      const rank = data.findIndex(s => s.player_id === userId) + 1;
      return rank || null;
    } catch (error) {
      console.error('Get rank error:', error);
      return null;
    }
  }
}

export const userMetricsService = new UserMetricsService();

