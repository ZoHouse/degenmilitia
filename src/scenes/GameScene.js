import { DualJoystickControls } from '../controls/DualJoystickControls.js';
import { authService } from '../services/AuthService.js';
import { userMetricsService } from '../services/UserMetricsService.js';
import { MultiplayerService } from '../services/MultiplayerService.js';

/**
 * Main Game Scene
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }
  
  preload() {
    // No sprites needed - using simple shapes
  }
  
  init(data) {
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    this.currentUser = authService.getCurrentUser();
    this.gameStartTime = Date.now();
    this.multiplayer = null;
    this.otherPlayerSprites = new Map();
  }
  
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Simple gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);
    
    // Compact room code display (top-left)
    const roomCodeBg = this.add.graphics();
    roomCodeBg.fillStyle(0x00F5FF, 0.05);
    roomCodeBg.fillRoundedRect(10, 10, 110, 28, 6);
    roomCodeBg.lineStyle(1, 0x00F5FF, 0.25);
    roomCodeBg.strokeRoundedRect(10, 10, 110, 28, 6);
    roomCodeBg.setScrollFactor(0).setDepth(999);
    
    this.add.text(16, 14, `ROOM`, {
      fontSize: '8px',
      fill: '#00F5FF',
      fontStyle: 'bold',
      alpha: 0.5
    }).setScrollFactor(0).setDepth(1000);
    
    this.add.text(16, 22, this.roomCode, {
      fontSize: '12px',
      fill: '#00F5FF',
      fontStyle: 'bold',
      letterSpacing: 0.5
    }).setScrollFactor(0).setDepth(1000);
    
    // Smaller title with safe top margin
    const safeMarginTop = 60;
    this.add.text(width / 2, safeMarginTop, 'DEGEN MILITIA', {
      fontSize: '20px',
      fill: '#000000',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(999);
    
    // Game state
    this.jetpackFuel = 100;
    this.health = 100;
    this.kills = 0;
    this.lastShot = 0;
    
    // Create world
    this.createPlatforms(width, height);
    this.createPlayer(width, height);
    
    // Bullets
    this.bullets = this.physics.add.group({ maxSize: 50 });
    
    // Controls - ALWAYS show mobile controls (can use on desktop too!)
    this.controls = new DualJoystickControls(this);
    
    // Desktop keyboard fallback (works alongside mobile controls)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey('W'),
      left: this.input.keyboard.addKey('A'),
      right: this.input.keyboard.addKey('D'),
      space: this.input.keyboard.addKey('SPACE')
    };
    
    // HUD
    this.createHUD(width, height, safeMarginTop);
    
    // Initialize Multiplayer
    this.initMultiplayer();
  }
  
  initMultiplayer() {
    const playerId = this.currentUser?.id || `guest_${Date.now()}`;
    const playerName = this.currentUser?.username || 'Guest';
    
    this.multiplayer = new MultiplayerService(this.roomCode, playerId, playerName);
    
    // Set up callbacks
    this.multiplayer.on('onPlayerJoined', (player) => {
      console.log('🎮 Player joined:', player.playerName);
      this.createOtherPlayer(player.playerId, player.playerName);
    });
    
    this.multiplayer.on('onPlayerLeft', (playerId) => {
      console.log('👋 Player left:', playerId);
      this.removeOtherPlayer(playerId);
    });
    
    this.multiplayer.on('onPlayerUpdate', (data) => {
      this.updateOtherPlayer(data);
    });
    
    this.multiplayer.on('onBulletFired', (data) => {
      this.createOtherPlayerBullet(data);
    });
    
    // Connect to multiplayer room
    this.multiplayer.connect();
  }
  
  createOtherPlayer(playerId, playerName) {
    if (this.otherPlayerSprites.has(playerId)) return;
    
    // Create player sprite (different color from main player)
    const sprite = this.add.rectangle(100, 100, 30, 50, 0xff6b6b);
    this.physics.add.existing(sprite);
    sprite.body.setCollideWorldBounds(true);
    
    // Add name label
    const nameLabel = this.add.text(0, -35, playerName, {
      fontSize: '10px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    this.otherPlayerSprites.set(playerId, { sprite, nameLabel });
  }
  
  removeOtherPlayer(playerId) {
    const player = this.otherPlayerSprites.get(playerId);
    if (player) {
      player.sprite.destroy();
      player.nameLabel.destroy();
      this.otherPlayerSprites.delete(playerId);
    }
  }
  
  updateOtherPlayer(data) {
    let player = this.otherPlayerSprites.get(data.playerId);
    
    // Create if doesn't exist
    if (!player) {
      this.createOtherPlayer(data.playerId, data.playerName);
      player = this.otherPlayerSprites.get(data.playerId);
    }
    
    if (player) {
      // Smoothly interpolate position
      player.sprite.x = Phaser.Math.Linear(player.sprite.x, data.x, 0.3);
      player.sprite.y = Phaser.Math.Linear(player.sprite.y, data.y, 0.3);
      player.nameLabel.x = player.sprite.x;
      player.nameLabel.y = player.sprite.y - 35;
      
      // Show jetpack particles if jetpacking
      if (data.isJetpacking && Math.random() > 0.7) {
        const particle = this.add.circle(
          player.sprite.x + Phaser.Math.Between(-10, 10),
          player.sprite.y + 25,
          Phaser.Math.Between(3, 6), 0xff6600
        );
        this.tweens.add({
          targets: particle,
          y: particle.y + 30,
          alpha: 0,
          duration: 400,
          onComplete: () => particle.destroy()
        });
      }
    }
  }
  
  createOtherPlayerBullet(data) {
    const bullet = this.add.circle(data.x, data.y, 5, 0xffff00);
    this.physics.add.existing(bullet);
    bullet.body.setVelocity(data.velocityX, data.velocityY);
    
    this.time.delayedCall(2500, () => {
      if (bullet && bullet.active) bullet.destroy();
    });
  }
  
  createPlatforms(width, height) {
    this.platforms = this.physics.add.staticGroup();
    
    // Simple ground
    const ground = this.add.rectangle(width / 2, height - 40, width, 80, 0x2a2a3e);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    // Simple floating platforms
    const platformData = [
      { x: width * 0.15, y: height * 0.7, w: 180 },
      { x: width * 0.35, y: height * 0.55, w: 140 },
      { x: width * 0.55, y: height * 0.45, w: 200 },
      { x: width * 0.75, y: height * 0.6, w: 160 },
      { x: width * 0.9, y: height * 0.75, w: 120 },
    ];
    
    platformData.forEach(p => {
      const platform = this.add.rectangle(p.x, p.y, p.w, 20, 0x3d3d5c);
      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
    });
  }
  
  createPlayer(width, height) {
    // Simple player shape
    this.player = this.add.rectangle(width / 2, height / 2, 30, 50, 0x00d9ff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBounce(0.1);
    
    // Add collision with platforms
    this.physics.add.collider(this.player, this.platforms);
  }
  
  createHUD(width, height, safeMarginTop) {
    // Compact HP/Fuel container (left side)
    const statusBg = this.add.graphics();
    statusBg.fillStyle(0x00FF00, 0.05);
    statusBg.fillRoundedRect(10, 45, 85, 40, 6);
    statusBg.lineStyle(1, 0x00FF00, 0.2);
    statusBg.strokeRoundedRect(10, 45, 85, 40, 6);
    statusBg.setScrollFactor(0).setDepth(999);
    
    this.statusText = this.add.text(16, 50, '', {
      fontSize: '11px',
      fill: '#00FF00',
      fontStyle: 'bold',
      lineSpacing: 3
    }).setScrollFactor(0).setDepth(1000);
    
    // Compact kills container (right side)
    const safeMarginRight = 80; // Safe from right edge
    const killsTextY = safeMarginTop + 30; // Below title
    
    const killsBg = this.add.graphics();
    killsBg.fillStyle(0xFFD700, 0.05);
    killsBg.fillRoundedRect(width - 95 - safeMarginRight, killsTextY - 7, 85, 26, 6);
    killsBg.lineStyle(1, 0xFFD700, 0.25);
    killsBg.strokeRoundedRect(width - 95 - safeMarginRight, killsTextY - 7, 85, 26, 6);
    killsBg.setScrollFactor(0).setDepth(999);
    
    this.killsText = this.add.text(width - 88 - safeMarginRight, killsTextY, 'Kills: 0', {
      fontSize: '12px',
      fill: '#FFD700',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1000);
    
    this.statusBg = statusBg;
    this.killsBg = killsBg;
  }
  
  update() {
    if (!this.player) return;
    
    // Broadcast position to other players (throttled to every 50ms)
    if (!this.lastBroadcast || Date.now() - this.lastBroadcast > 50) {
      this.lastBroadcast = Date.now();
      if (this.multiplayer) {
        const isJetpacking = this.jetpackFuel > 0 && this.player.body.velocity.y < -100;
        this.multiplayer.broadcastPlayerUpdate(
          this.player.x,
          this.player.y,
          this.player.body.velocity.x,
          this.player.body.velocity.y,
          isJetpacking,
          false,
          0
        );
      }
    }
    
    // Get input from mobile controls (priority) OR keyboard
    let moveX = 0;
    let jetpack = false;
    let shooting = false;
    let shootAngle = 0;
    
    // Mobile controls (joysticks)
    if (this.controls) {
      const input = this.controls.getInput();
      moveX = input.moveX;
      jetpack = input.jetpack;
      shooting = input.shooting;
      shootAngle = input.shootAngle;
    }
    
    // Keyboard fallback (if mobile controls not active)
    if (moveX === 0) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) moveX = -1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) moveX = 1;
    }
    if (!jetpack) {
      jetpack = this.cursors.up.isDown || this.wasd.space.isDown || this.wasd.up.isDown;
    }
    
    // Movement
    this.player.body.setVelocityX(moveX * 300);
    
    // Jetpack
    if (jetpack && this.jetpackFuel > 0) {
      this.player.body.setVelocityY(-400);
      this.jetpackFuel -= 1.5;
      
      // Jetpack particles
      if (Math.random() > 0.6) {
        const particle = this.add.circle(
          this.player.x + Phaser.Math.Between(-10, 10),
          this.player.y + 25,
          Phaser.Math.Between(3, 6), 0xff6600
        );
        this.tweens.add({
          targets: particle,
          y: particle.y + 30,
          alpha: 0,
          duration: 400,
          onComplete: () => particle.destroy()
        });
      }
    } else if (this.jetpackFuel < 100) {
      this.jetpackFuel += 0.8;
    }
    
    // Shooting
    if (shooting) {
      this.shootBullet(shootAngle);
    }
    
    // Clean bullets
    this.bullets.children.entries.forEach(bullet => {
      if (bullet.x < -100 || bullet.x > this.scale.width + 100 ||
          bullet.y < -100 || bullet.y > this.scale.height + 100) {
        bullet.destroy();
      }
    });
    
    // Update HUD
    const fuelColor = this.jetpackFuel > 30 ? '#00FF00' : '#FF4444';
    this.statusText.setText([
      `HP:   ${Math.floor(this.health)}`,
      `Fuel: ${Math.floor(this.jetpackFuel)}`
    ]);
    this.statusText.setColor(fuelColor);
    
    // Update status background color based on fuel
    if (this.statusBg) {
      const bgColor = this.jetpackFuel > 30 ? 0x00FF00 : 0xFF4444;
      const borderColor = this.jetpackFuel > 30 ? 0x00FF00 : 0xFF4444;
      this.statusBg.clear();
      this.statusBg.fillStyle(bgColor, 0.05);
      this.statusBg.fillRoundedRect(10, 45, 85, 40, 6);
      this.statusBg.lineStyle(1, borderColor, 0.2);
      this.statusBg.strokeRoundedRect(10, 45, 85, 40, 6);
    }
  }
  
  async recordKill() {
    this.kills++;
    this.killsText.setText(`Kills: ${this.kills}`);
    
    // Save to database
    if (this.currentUser && !this.currentUser.is_guest) {
      await userMetricsService.recordKill(this.currentUser.id, 1);
    }
  }
  
  shootBullet(angle) {
    const now = Date.now();
    if (now - this.lastShot < 200) return;
    this.lastShot = now;
    
    // Simple bullet (Mini Militia style)
    const bullet = this.add.circle(this.player.x, this.player.y, 5, 0xffff00);
    this.physics.add.existing(bullet);
    this.bullets.add(bullet);
    
    const speed = 900;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    
    bullet.body.setVelocity(velocityX, velocityY);
    
    // Broadcast bullet to other players
    if (this.multiplayer) {
      this.multiplayer.broadcastBulletFired(
        this.player.x,
        this.player.y,
        angle,
        velocityX,
        velocityY
      );
    }
    
    this.time.delayedCall(2500, () => {
      if (bullet && bullet.active) bullet.destroy();
    });
  }
  
  shutdown() {
    // Clean up multiplayer connection
    if (this.multiplayer) {
      this.multiplayer.disconnect();
    }
  }
}

