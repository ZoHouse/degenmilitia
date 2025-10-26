import { DualJoystickControls } from '../controls/DualJoystickControls.js';
import { authService } from '../services/AuthService.js';
import { userMetricsService } from '../services/UserMetricsService.js';

/**
 * Main Game Scene
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }
  
  preload() {
    // Load Mini Militia sprites from public folder
    this.load.image('background', '/assets/maps/background.png');
    this.load.spritesheet('player_right', '/assets/sprites/character_sprite1_right.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('player_left', '/assets/sprites/character_sprite1_left.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.image('grass', '/assets/sprites/grass.png');
    this.load.image('sand', '/assets/sprites/sand.png');
    this.load.image('stones', '/assets/sprites/big_stones.png');
  }
  
  init(data) {
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    this.currentUser = authService.getCurrentUser();
    this.gameStartTime = Date.now();
  }
  
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Mini Militia background
    const bg = this.add.image(width / 2, height / 2, 'background');
    bg.setDisplaySize(width, height);
    bg.setScrollFactor(0.3); // Parallax effect
    
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
    this.playerDirection = 'right'; // Track player direction
    
    // Create world
    this.createPlatforms(width, height);
    this.createPlayer(width, height);
    
    // Create animations
    this.createAnimations();
    
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
  }
  
  createAnimations() {
    // Check if animations already exist to avoid duplicates
    if (this.anims.exists('idle_right')) return;
    
    // The sprite sheet only has 4 frames (0-3), so we'll reuse them
    // Frame 0-1: Idle/Standing
    // Frame 2-3: Walking/Jetpack
    
    // Idle animation (right)
    this.anims.create({
      key: 'idle_right',
      frames: this.anims.generateFrameNumbers('player_right', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1
    });
    
    // Walk animation (right)
    this.anims.create({
      key: 'walk_right',
      frames: this.anims.generateFrameNumbers('player_right', { start: 2, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Jetpack animation (right) - use all frames for movement
    this.anims.create({
      key: 'jetpack_right',
      frames: this.anims.generateFrameNumbers('player_right', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Idle animation (left)
    this.anims.create({
      key: 'idle_left',
      frames: this.anims.generateFrameNumbers('player_left', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1
    });
    
    // Walk animation (left)
    this.anims.create({
      key: 'walk_left',
      frames: this.anims.generateFrameNumbers('player_left', { start: 2, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Jetpack animation (left) - use all frames for movement
    this.anims.create({
      key: 'jetpack_left',
      frames: this.anims.generateFrameNumbers('player_left', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
  }
  
  createPlatforms(width, height) {
    this.platforms = this.physics.add.staticGroup();
    
    // Ground - use sand texture for bottom, grass on top
    const groundY = height - 40;
    const groundHeight = 80;
    
    // Add sand texture at bottom
    const sandTile = this.add.tileSprite(width / 2, groundY + 20, width, 60, 'sand');
    
    // Add grass on top
    const grassTop = this.add.tileSprite(width / 2, groundY - 10, width, 30, 'grass');
    
    // Physics body for ground
    const ground = this.add.rectangle(width / 2, height - 40, width, groundHeight, 0x000000, 0);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    // Floating platforms using grass and stone textures
    const platformData = [
      { x: width * 0.15, y: height * 0.7, w: 180, type: 'grass' },
      { x: width * 0.35, y: height * 0.55, w: 140, type: 'stone' },
      { x: width * 0.55, y: height * 0.45, w: 200, type: 'grass' },
      { x: width * 0.75, y: height * 0.6, w: 160, type: 'stone' },
      { x: width * 0.9, y: height * 0.75, w: 120, type: 'grass' },
    ];
    
    platformData.forEach(p => {
      this.createTexturedPlatform(p.x, p.y, p.w, p.type);
    });
  }
  
  createTexturedPlatform(x, y, width, type) {
    const platformHeight = 30;
    
    // Create platform with texture
    const texture = type === 'grass' ? 'grass' : 'stones';
    const platform = this.add.tileSprite(x, y, width, platformHeight, texture);
    
    // Physics body
    const physicsBody = this.add.rectangle(x, y, width, platformHeight, 0x000000, 0);
    this.physics.add.existing(physicsBody, true);
    this.platforms.add(physicsBody);
  }
  
  createPlayer(width, height) {
    // Create player sprite using Mini Militia character
    this.player = this.physics.add.sprite(width / 2, height / 2, 'player_right');
    this.player.setScale(0.5); // Scale down to appropriate size
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.1);
    this.player.body.setSize(60, 80); // Adjust collision box
    
    // Play idle animation (safely)
    try {
      if (this.anims.exists('idle_right')) {
        this.player.play('idle_right');
      }
    } catch (error) {
      console.warn('Animation not loaded yet:', error);
    }
    
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
    
    // Update player direction
    if (moveX > 0) this.playerDirection = 'right';
    else if (moveX < 0) this.playerDirection = 'left';
    
    // Jetpack
    const isJetpacking = jetpack && this.jetpackFuel > 0;
    if (isJetpacking) {
      this.player.body.setVelocityY(-400);
      this.jetpackFuel -= 1.5;
      
      // Jetpack animation
      const jetpackAnim = this.playerDirection === 'right' ? 'jetpack_right' : 'jetpack_left';
      if (this.anims.exists(jetpackAnim) && this.player.anims.currentAnim?.key !== jetpackAnim) {
        this.player.play(jetpackAnim);
      }
      
      // Jetpack particles (orange fire)
      if (Math.random() > 0.6) {
        const particle = this.add.circle(
          this.player.x + Phaser.Math.Between(-10, 10),
          this.player.y + 30,
          Phaser.Math.Between(3, 6), 0xff6600
        );
        this.tweens.add({
          targets: particle,
          y: particle.y + 30,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 400,
          onComplete: () => particle.destroy()
        });
      }
    } else {
      // Walking or idle animation
      if (moveX !== 0) {
        const walkAnim = this.playerDirection === 'right' ? 'walk_right' : 'walk_left';
        if (this.anims.exists(walkAnim) && this.player.anims.currentAnim?.key !== walkAnim) {
          this.player.play(walkAnim);
        }
      } else {
        const idleAnim = this.playerDirection === 'right' ? 'idle_right' : 'idle_left';
        if (this.anims.exists(idleAnim) && this.player.anims.currentAnim?.key !== idleAnim) {
          this.player.play(idleAnim);
        }
      }
      
      if (this.jetpackFuel < 100) {
        this.jetpackFuel += 0.8;
      }
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
    bullet.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    this.time.delayedCall(2500, () => {
      if (bullet && bullet.active) bullet.destroy();
    });
  }
}

