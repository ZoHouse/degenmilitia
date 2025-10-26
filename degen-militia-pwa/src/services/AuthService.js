/**
 * Privy Authentication Service
 */

import { getSupabaseClient } from '../config/supabase.js';

const supabase = getSupabaseClient();

class AuthService {
  constructor() {
    this.currentUser = null;
    this.privyUser = null;
  }
  
  /**
   * Initialize Privy (for web-based login)
   * Note: Full Privy integration requires React wrapper
   * For Phaser game, we'll use a simpler flow
   */
  async initPrivy() {
    // Check if user already logged in (from localStorage)
    const savedUser = localStorage.getItem('degen_militia_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      return this.currentUser;
    }
    return null;
  }
  
  /**
   * Login with wallet address (simplified for Phaser)
   */
  async loginWithWallet(walletAddress) {
    try {
      if (!supabase) {
        console.warn('Supabase not initialized, using local-only mode');
        // Fallback to local-only mode
        const localUser = {
          id: `local_${Date.now()}`,
          wallet_address: walletAddress,
          username: `Player${Math.floor(Math.random() * 10000)}`,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_local: true
        };
        this.currentUser = localUser;
        localStorage.setItem('degen_militia_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      }

      // Check if user exists in our database
      const { data: existingUser, error } = await supabase
        .from('players')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      if (error) {
        console.warn('Supabase query error:', error);
        // Fallback to local mode on error
        const localUser = {
          id: `local_${Date.now()}`,
          wallet_address: walletAddress,
          username: `Player${Math.floor(Math.random() * 10000)}`,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_local: true
        };
        this.currentUser = localUser;
        localStorage.setItem('degen_militia_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      }
      
      if (existingUser) {
        // Update last login
        await supabase
          .from('players')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id);
        
        this.currentUser = existingUser;
      } else {
        // Create new user
        const newUser = {
          wallet_address: walletAddress,
          username: `Player${Math.floor(Math.random() * 10000)}`,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
        
        const { data: created, error: createError } = await supabase
          .from('players')
          .insert([newUser])
          .select()
          .single();
        
        if (createError) {
          console.warn('Error creating user in database:', createError);
          // Use local fallback
          this.currentUser = { ...newUser, id: `local_${Date.now()}`, is_local: true };
        } else {
          this.currentUser = created;
        }
      }
      
      // Save to localStorage
      localStorage.setItem('degen_militia_user', JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Login error:', error);
      // Final fallback - always allow login even if database fails
      const fallbackUser = {
        id: `local_${Date.now()}`,
        wallet_address: walletAddress,
        username: `Player${Math.floor(Math.random() * 10000)}`,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_local: true
      };
      this.currentUser = fallbackUser;
      localStorage.setItem('degen_militia_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
  }
  
  /**
   * Guest login (no wallet)
   */
  async loginAsGuest() {
    const guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const username = `Guest${Math.floor(Math.random() * 10000)}`;
    
    this.currentUser = {
      id: guestId,
      username,
      is_guest: true,
      wallet_address: null
    };
    
    localStorage.setItem('degen_militia_user', JSON.stringify(this.currentUser));
    return this.currentUser;
  }
  
  /**
   * Logout
   */
  logout() {
    this.currentUser = null;
    this.privyUser = null;
    localStorage.removeItem('degen_militia_user');
  }
  
  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }
  
  /**
   * Update user profile
   */
  async updateProfile(updates) {
    if (!this.currentUser || this.currentUser.is_guest) {
      throw new Error('Cannot update guest profile');
    }
    
    try {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single();
      
      if (error) throw error;
      
      this.currentUser = { ...this.currentUser, ...data };
      localStorage.setItem('degen_militia_user', JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const authService = new AuthService();

