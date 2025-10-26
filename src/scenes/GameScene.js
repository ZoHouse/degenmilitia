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
    
    // Mario-style sky blue gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x5C9EE6, 0x5C9EE6, 0x87CEEB, 0x87CEEB, 1);
    bg.fillRect(0, 0, width, height);
    
    // Add some white clouds for Mario atmosphere
    const clouds = [
      { x: width * 0.2, y: height * 0.15 },
      { x: width * 0.5, y: height * 0.1 },
      { x: width * 0.8, y: height * 0.2 },
    ];
    
    clouds.forEach(cloud => {
      // Simple cloud shape with circles
      const cloudGroup = this.add.graphics();
      cloudGroup.fillStyle(0xFFFFFF, 0.8);
      cloudGroup.fillCircle(cloud.x, cloud.y, 25);
      cloudGroup.fillCircle(cloud.x + 20, cloud.y, 30);
      cloudGroup.fillCircle(cloud.x + 40, cloud.y, 25);
      cloudGroup.fillCircle(cloud.x + 20, cloud.y - 15, 20);
      
      // Make clouds slowly drift
      this.tweens.add({
        targets: cloudGroup,
        x: cloud.x + 100,
        duration: 30000,
        repeat: -1,
        yoyo: true,
        ease: 'Linear'
      });
    });
    
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
    
    // Random emoji for other players
    const emojis = ['🦊', '🐼', '🐸', '🦁', '🐯', '🐻', '🐨', '🐮'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Create player sprite as emoji text
    const sprite = this.add.text(100, 100, randomEmoji, {
      fontSize: '40px'
    }).setOrigin(0.5);
    
    this.physics.add.existing(sprite);
    sprite.body.setCollideWorldBounds(true);
    sprite.body.setSize(30, 40); // Hitbox size
    sprite.body.setOffset(5, 5); // Center the hitbox
    
    // Add name label
    const nameLabel = this.add.text(0, -35, playerName, {
      fontSize: '10px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    // Create health bar
    const healthBarBg = this.add.rectangle(0, -50, 32, 4, 0x000000, 0.5);
    const healthBar = this.add.rectangle(0, -50, 30, 3, 0x00ff00);
    
    this.otherPlayerSprites.set(playerId, { 
      sprite, 
      nameLabel, 
      healthBarBg,
      healthBar,
      health: 100 
    });
  }
  
  removeOtherPlayer(playerId) {
    const player = this.otherPlayerSprites.get(playerId);
    if (player) {
      player.sprite.destroy();
      player.nameLabel.destroy();
      if (player.healthBarBg) player.healthBarBg.destroy();
      if (player.healthBar) player.healthBar.destroy();
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
      
      // Update health bar position
      if (player.healthBarBg && player.healthBar) {
        player.healthBarBg.x = player.sprite.x;
        player.healthBarBg.y = player.sprite.y - 50;
        player.healthBar.x = player.sprite.x;
        player.healthBar.y = player.sprite.y - 50;
      }
      
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
    
    // Ground with grass-like color (Mario green)
    const ground = this.add.rectangle(width / 2, height - 30, width, 60, 0x7CBF3F);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    // Add dirt texture to ground
    const groundDirt = this.add.rectangle(width / 2, height - 10, width, 20, 0x8B4513);
    this.physics.add.existing(groundDirt, true);
    this.platforms.add(groundDirt);
    
    // Simplified Mario-style platforms - cleaner layout
    const platformData = [
      // Bottom level platforms (left and right)
      { x: width * 0.2, y: height * 0.75, w: 150, h: 20, color: 0xC84B31 }, // Brick red
      { x: width * 0.8, y: height * 0.75, w: 150, h: 20, color: 0xC84B31 },
      
      // Middle level platforms
      { x: width * 0.35, y: height * 0.55, w: 140, h: 20, color: 0xF4A460 }, // Sandy brown
      { x: width * 0.65, y: height * 0.55, w: 140, h: 20, color: 0xF4A460 },
      
      // Upper platforms
      { x: width * 0.2, y: height * 0.35, w: 120, h: 20, color: 0x4B7C4B }, // Dark green
      { x: width * 0.8, y: height * 0.35, w: 120, h: 20, color: 0x4B7C4B },
      
      // Top central platform
      { x: width * 0.5, y: height * 0.2, w: 180, h: 20, color: 0xFFD700 }, // Gold
      
      // "Pipe" obstacles (vertical rectangles)
      { x: width * 0.15, y: height - 100, w: 50, h: 80, color: 0x27AE60 }, // Green pipe left
      { x: width * 0.85, y: height - 100, w: 50, h: 80, color: 0x27AE60 }, // Green pipe right
    ];
    
    platformData.forEach(p => {
      const platform = this.add.rectangle(p.x, p.y, p.w, p.h, p.color);
      
      // Add border to make it look more Mario-like
      const border = this.add.graphics();
      border.lineStyle(2, 0x000000, 0.6);
      border.strokeRect(p.x - p.w/2, p.y - p.h/2, p.w, p.h);
      
      // Add highlight on top edge
      const highlight = this.add.graphics();
      highlight.lineStyle(2, 0xFFFFFF, 0.3);
      highlight.lineBetween(p.x - p.w/2, p.y - p.h/2, p.x + p.w/2, p.y - p.h/2);
      
      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
    });
  }
  
  createPlayer(width, height) {
    // Main player as emoji
    this.player = this.add.text(width / 2, height / 2, '🤠', {
      fontSize: '40px'
    }).setOrigin(0.5);
    
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBounce(0.1);
    this.player.body.setSize(30, 40); // Hitbox size
    this.player.body.setOffset(5, 5); // Center the hitbox
    
    // Add collision with platforms
    this.physics.add.collider(this.player, this.platforms);
    
    // Create health bar for main player
    this.playerHealthBarBg = this.add.rectangle(0, -50, 32, 4, 0x000000, 0.5);
    this.playerHealthBar = this.add.rectangle(0, -50, 30, 3, 0x00ff00);
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
    
    // Update main player health bar position
    if (this.playerHealthBarBg && this.playerHealthBar) {
      this.playerHealthBarBg.x = this.player.x;
      this.playerHealthBarBg.y = this.player.y - 50;
      this.playerHealthBar.x = this.player.x;
      this.playerHealthBar.y = this.player.y - 50;
      
      // Update health bar width based on health
      const healthPercent = this.health / 100;
      this.playerHealthBar.width = 30 * healthPercent;
      
      // Change color based on health
      if (this.health > 60) {
        this.playerHealthBar.setFillStyle(0x00ff00);
      } else if (this.health > 30) {
        this.playerHealthBar.setFillStyle(0xffff00);
      } else {
        this.playerHealthBar.setFillStyle(0xff0000);
      }
    }
    
    // Check bullet collisions with other players
    this.bullets.children.entries.forEach(bullet => {
      if (!bullet.active) return;
      
      // Check collision with other players
      this.otherPlayerSprites.forEach((player, playerId) => {
        if (Phaser.Math.Distance.Between(bullet.x, bullet.y, player.sprite.x, player.sprite.y) < 30) {
          // Hit!
          player.health = Math.max(0, player.health - 10);
          
          // Update health bar
          const healthPercent = player.health / 100;
          player.healthBar.width = 30 * healthPercent;
          
          // Change color based on health
          if (player.health > 60) {
            player.healthBar.setFillStyle(0x00ff00);
          } else if (player.health > 30) {
            player.healthBar.setFillStyle(0xffff00);
          } else {
            player.healthBar.setFillStyle(0xff0000);
          }
          
          // Flash effect
          player.sprite.setAlpha(0.5);
          this.time.delayedCall(100, () => {
            if (player.sprite) player.sprite.setAlpha(1);
          });
          
          // Check if killed
          if (player.health <= 0) {
            this.recordKill();
            // Respawn other player (in real game, this would be synced)
            player.health = 100;
            player.healthBar.width = 30;
            player.healthBar.setFillStyle(0x00ff00);
          }
          
          bullet.destroy();
        }
      });
    });
    
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

