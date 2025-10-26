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
      fill: '#9D4EDD',
      fontStyle: 'bold',
      stroke: '#240046',
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
  
  createPlatforms(width, height) {
    this.platforms = this.physics.add.staticGroup();
    
    const ground = this.add.rectangle(width / 2, height - 40, width, 80, 0x666666);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    const platformData = [
      { x: width * 0.2, y: height * 0.65, w: 200 },
      { x: width * 0.5, y: height * 0.5, w: 220 },
      { x: width * 0.8, y: height * 0.65, w: 200 },
    ];
    
    platformData.forEach(p => {
      const platform = this.add.rectangle(p.x, p.y, p.w, 20, 0x888888);
      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
    });
  }
  
  createPlayer(width, height) {
    this.player = this.add.rectangle(width / 2, height / 2, 30, 50, 0x9D4EDD);
    this.physics.add.existing(this.player);
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
        const particle = this.add.circle(
          this.player.x + Phaser.Math.Between(-10, 10),
          this.player.y + 25,
          4, 0xFF6600
        );
        this.tweens.add({
          targets: particle,
          y: particle.y + 30,
          alpha: 0,
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
    
    const bullet = this.add.circle(this.player.x, this.player.y, 6, 0xFFFF00);
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

