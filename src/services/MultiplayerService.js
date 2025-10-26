/**
 * Multiplayer Service - Real-time player synchronization
 * Uses Supabase Realtime for WebSocket communication
 */

import { getSupabaseClient } from '../config/supabase.js';

export class MultiplayerService {
  constructor(roomCode, playerId, playerName) {
    this.roomCode = roomCode;
    this.playerId = playerId;
    this.playerName = playerName;
    this.channel = null;
    this.otherPlayers = new Map();
    this.callbacks = {
      onPlayerJoined: null,
      onPlayerLeft: null,
      onPlayerUpdate: null,
      onBulletFired: null
    };
  }

  /**
   * Connect to multiplayer room
   */
  connect() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not initialized');
      return this;
    }

    // Create a channel for this room
    this.channel = supabase.channel(`game:${this.roomCode}`, {
      config: {
        presence: {
          key: this.playerId
        }
      }
    });

    // Track presence (who's in the room)
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        this.handlePresenceSync(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Player joined:', key, newPresences);
        if (this.callbacks.onPlayerJoined) {
          newPresences.forEach(presence => {
            this.callbacks.onPlayerJoined(presence);
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Player left:', key);
        this.otherPlayers.delete(key);
        if (this.callbacks.onPlayerLeft) {
          this.callbacks.onPlayerLeft(key);
        }
      })
      // Listen for player position updates
      .on('broadcast', { event: 'player_update' }, ({ payload }) => {
        if (payload.playerId !== this.playerId) {
          this.otherPlayers.set(payload.playerId, payload);
          if (this.callbacks.onPlayerUpdate) {
            this.callbacks.onPlayerUpdate(payload);
          }
        }
      })
      // Listen for bullet events
      .on('broadcast', { event: 'bullet_fired' }, ({ payload }) => {
        if (payload.playerId !== this.playerId && this.callbacks.onBulletFired) {
          this.callbacks.onBulletFired(payload);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this player's presence
          await this.channel.track({
            playerId: this.playerId,
            playerName: this.playerName,
            online_at: new Date().toISOString()
          });
          console.log('✅ Connected to multiplayer room:', this.roomCode);
        }
      });

    return this;
  }

  /**
   * Handle presence sync - update other players list
   */
  handlePresenceSync(state) {
    const players = [];
    Object.keys(state).forEach(key => {
      state[key].forEach(presence => {
        if (presence.playerId !== this.playerId) {
          players.push(presence);
        }
      });
    });
    
    // Update other players map
    this.otherPlayers.clear();
    players.forEach(player => {
      this.otherPlayers.set(player.playerId, player);
    });
  }

  /**
   * Broadcast player position/state
   */
  broadcastPlayerUpdate(x, y, velocityX, velocityY, isJetpacking, isShooting, shootAngle) {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'player_update',
      payload: {
        playerId: this.playerId,
        playerName: this.playerName,
        x,
        y,
        velocityX,
        velocityY,
        isJetpacking,
        isShooting,
        shootAngle,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Broadcast bullet fired
   */
  broadcastBulletFired(x, y, angle, velocityX, velocityY) {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'bullet_fired',
      payload: {
        playerId: this.playerId,
        x,
        y,
        angle,
        velocityX,
        velocityY,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Set event callbacks
   */
  on(event, callback) {
    if (this.callbacks[event] !== undefined) {
      this.callbacks[event] = callback;
    }
  }

  /**
   * Get other players in the room
   */
  getOtherPlayers() {
    return Array.from(this.otherPlayers.values());
  }

  /**
   * Disconnect from multiplayer
   */
  disconnect() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.otherPlayers.clear();
    console.log('❌ Disconnected from multiplayer');
  }
}

