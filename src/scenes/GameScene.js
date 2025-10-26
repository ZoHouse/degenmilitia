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
  
  init(data) {
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    this.currentUser = authService.getCurrentUser();
    this.gameStartTime = Date.now();
  }
  
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Mario-style sky background (gradient)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x5c94fc, 0x5c94fc, 0x78b9ff, 0x78b9ff, 1);
    sky.fillRect(0, 0, width * 2, height);
    
    // Add clouds
    this.createClouds(width, height);
    
    // Add background hills
    this.createHills(width, height);
    
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
      fill: '#FFD700',
      fontStyle: 'bold',
      stroke: '#FF6B00',
      strokeThickness: 4
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
    
    // Controls
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      this.controls = new DualJoystickControls(this);
    }
    
    // Desktop fallback
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey('W'),
      left: this.input.keyboard.addKey('A'),
      right: this.input.keyboard.addKey('D'),
      space: this.input.keyboard.addKey('SPACE')
    };
    
    if (!isMobile) {
      this.input.on('pointerdown', (pointer) => {
        if (pointer.leftButtonDown()) {
          const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            pointer.x + this.cameras.main.scrollX,
            pointer.y + this.cameras.main.scrollY
          );
          this.shootBullet(angle);
        }
      });
    }
    
    // HUD
    this.createHUD(width, height, safeMarginTop);
  }
  
  createClouds(width, height) {
    const clouds = [
      { x: width * 0.15, y: height * 0.15 },
      { x: width * 0.45, y: height * 0.22 },
      { x: width * 0.75, y: height * 0.18 },
      { x: width * 1.2, y: height * 0.2 },
    ];
    
    clouds.forEach(cloud => {
      // White fluffy cloud
      const cloudGroup = this.add.graphics();
      cloudGroup.fillStyle(0xffffff, 0.9);
      cloudGroup.fillCircle(cloud.x, cloud.y, 25);
      cloudGroup.fillCircle(cloud.x + 20, cloud.y, 30);
      cloudGroup.fillCircle(cloud.x + 45, cloud.y, 25);
      cloudGroup.fillCircle(cloud.x + 25, cloud.y - 15, 22);
    });
  }
  
  createHills(width, height) {
    const hills = [
      { x: width * 0.25, y: height - 80, w: 200, h: 120, color: 0x4ade80 },
      { x: width * 0.65, y: height - 80, w: 250, h: 100, color: 0x22c55e },
      { x: width * 1.15, y: height - 80, w: 180, h: 110, color: 0x4ade80 },
    ];
    
    hills.forEach(hill => {
      const hillGraphic = this.add.graphics();
      hillGraphic.fillStyle(hill.color, 1);
      hillGraphic.fillEllipse(hill.x, hill.y, hill.w, hill.h);
    });
  }
  
  createPlatforms(width, height) {
    this.platforms = this.physics.add.staticGroup();
    
    // Ground with grass on top (Mario-style)
    const groundHeight = 80;
    const groundY = height - 40;
    
    // Brown dirt base
    const groundBase = this.add.graphics();
    groundBase.fillStyle(0xc2410c, 1);
    groundBase.fillRect(0, groundY, width, groundHeight);
    
    // Green grass top
    const grass = this.add.graphics();
    grass.fillStyle(0x10b981, 1);
    grass.fillRect(0, groundY - 15, width, 15);
    
    // Add grass texture (small triangles)
    for (let i = 0; i < width; i += 20) {
      grass.fillStyle(0x059669, 1);
      grass.fillTriangle(i, groundY - 15, i + 5, groundY - 20, i + 10, groundY - 15);
    }
    
    const ground = this.add.rectangle(width / 2, height - 40, width, groundHeight, 0xc2410c, 0);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    // Floating platforms (Mario-style bricks)
    const platformData = [
      { x: width * 0.15, y: height * 0.7, w: 180, type: 'brick' },
      { x: width * 0.35, y: height * 0.55, w: 140, type: 'grass' },
      { x: width * 0.55, y: height * 0.45, w: 200, type: 'brick' },
      { x: width * 0.75, y: height * 0.6, w: 160, type: 'grass' },
      { x: width * 0.9, y: height * 0.75, w: 120, type: 'brick' },
    ];
    
    platformData.forEach(p => {
      if (p.type === 'brick') {
        this.createBrickPlatform(p.x, p.y, p.w);
      } else {
        this.createGrassPlatform(p.x, p.y, p.w);
      }
    });
  }
  
  createBrickPlatform(x, y, width) {
    const platformHeight = 28;
    const brickWidth = 35;
    const numBricks = Math.floor(width / brickWidth);
    
    const container = this.add.container(x, y);
    
    for (let i = 0; i < numBricks; i++) {
      const brickX = (i - numBricks / 2) * brickWidth + brickWidth / 2;
      
      // Brick body (orange/brown)
      const brick = this.add.graphics();
      brick.fillStyle(0xfb923c, 1);
      brick.fillRoundedRect(brickX - brickWidth/2, -platformHeight/2, brickWidth - 2, platformHeight, 3);
      
      // Brick outline
      brick.lineStyle(2, 0xc2410c, 1);
      brick.strokeRoundedRect(brickX - brickWidth/2, -platformHeight/2, brickWidth - 2, platformHeight, 3);
      
      // Brick details (lines)
      brick.lineStyle(1, 0xc2410c, 0.5);
      brick.lineBetween(brickX - brickWidth/2 + 5, -platformHeight/2 + platformHeight/2, 
                       brickX + brickWidth/2 - 5, -platformHeight/2 + platformHeight/2);
      
      container.add(brick);
    }
    
    // Physics body
    const platform = this.add.rectangle(x, y, width, platformHeight, 0xfb923c, 0);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }
  
  createGrassPlatform(x, y, width) {
    const platformHeight = 28;
    
    // Green grass platform
    const platform = this.add.graphics();
    
    // Brown base
    platform.fillStyle(0x92400e, 1);
    platform.fillRoundedRect(x - width/2, y - platformHeight/2 + 8, width, platformHeight - 8, 4);
    
    // Green grass top
    platform.fillStyle(0x10b981, 1);
    platform.fillRoundedRect(x - width/2, y - platformHeight/2, width, 12, 4);
    
    // Grass texture
    for (let i = x - width/2; i < x + width/2; i += 15) {
      platform.fillStyle(0x059669, 1);
      platform.fillTriangle(i, y - platformHeight/2, i + 4, y - platformHeight/2 - 5, i + 8, y - platformHeight/2);
    }
    
    // Outline
    platform.lineStyle(2, 0x065f46, 1);
    platform.strokeRoundedRect(x - width/2, y - platformHeight/2, width, platformHeight, 4);
    
    // Physics body
    const physicsBody = this.add.rectangle(x, y, width, platformHeight, 0x10b981, 0);
    this.physics.add.existing(physicsBody, true);
    this.platforms.add(physicsBody);
  }
  
  createPlayer(width, height) {
    // Create a Mario-style character
    const playerContainer = this.add.container(width / 2, height / 2);
    
    // Body (red shirt)
    const body = this.add.rectangle(0, 5, 28, 35, 0xef4444);
    
    // Head (peach skin color)
    const head = this.add.circle(0, -15, 12, 0xfcd34d);
    
    // Eyes
    const leftEye = this.add.circle(-4, -15, 2, 0x000000);
    const rightEye = this.add.circle(4, -15, 2, 0x000000);
    
    // Cap (blue)
    const cap = this.add.ellipse(0, -22, 20, 12, 0x3b82f6);
    
    // Overalls (blue pants)
    const legs = this.add.rectangle(0, 20, 24, 15, 0x2563eb);
    
    // Shoes (brown)
    const leftShoe = this.add.ellipse(-8, 28, 12, 8, 0x92400e);
    const rightShoe = this.add.ellipse(8, 28, 12, 8, 0x92400e);
    
    playerContainer.add([cap, head, leftEye, rightEye, body, legs, leftShoe, rightShoe]);
    
    // Add physics to container
    this.player = playerContainer;
    this.physics.add.existing(this.player);
    this.player.body.setSize(28, 50);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBounce(0.1);
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
    
    // Get input
    let moveX = 0;
    let jetpack = false;
    let shooting = false;
    let shootAngle = 0;
    
    if (this.controls) {
      const input = this.controls.getInput();
      moveX = input.moveX;
      jetpack = input.jetpack;
      shooting = input.shooting;
      shootAngle = input.shootAngle;
    } else {
      if (this.cursors.left.isDown || this.wasd.left.isDown) moveX = -1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) moveX = 1;
      jetpack = this.cursors.up.isDown || this.wasd.space.isDown || this.wasd.up.isDown;
    }
    
    // Movement
    this.player.body.setVelocityX(moveX * 300);
    
    // Jetpack
    if (jetpack && this.jetpackFuel > 0) {
      this.player.body.setVelocityY(-400);
      this.jetpackFuel -= 1.5;
      
      if (Math.random() > 0.6) {
        // More colorful jetpack fire (orange-yellow gradient effect)
        const colors = [0xff6b00, 0xfbbf24, 0xef4444];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particle = this.add.circle(
          this.player.x + Phaser.Math.Between(-10, 10),
          this.player.y + 25,
          Phaser.Math.Between(3, 6), color
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
    } else if (!jetpack && this.jetpackFuel < 100) {
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
    
    // Create a Mario-style fireball
    const bullet = this.add.graphics();
    bullet.fillStyle(0xff6b00, 1);
    bullet.fillCircle(0, 0, 8);
    bullet.lineStyle(2, 0xfbbf24, 1);
    bullet.strokeCircle(0, 0, 8);
    bullet.fillStyle(0xfef08a, 1);
    bullet.fillCircle(-2, -2, 3);
    
    bullet.x = this.player.x;
    bullet.y = this.player.y;
    
    this.physics.add.existing(bullet);
    this.bullets.add(bullet);
    
    const speed = 900;
    bullet.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // Add rotation for fireball effect
    this.tweens.add({
      targets: bullet,
      rotation: Math.PI * 4,
      duration: 1000,
      repeat: -1
    });
    
    this.time.delayedCall(2500, () => {
      if (bullet && bullet.active) bullet.destroy();
    });
  }
}

