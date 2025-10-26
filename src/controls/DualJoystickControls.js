/**
 * Dual Joystick Mobile Controls - Glassmorphism Design
 * Premium UI with modern design elements
 */

export class DualJoystickControls {
  constructor(scene) {
    this.scene = scene;
    this.leftJoystick = null;
    this.rightJoystick = null;
    this.jetpackButton = null;
    
    this.input = {
      moveX: 0,
      moveY: 0,
      moving: false,
      shootAngle: 0,
      shooting: false,
      aimX: 0,
      aimY: 0,
      jetpack: false
    };
    
    this.createControls();
  }
  
  createControls() {
    const width = this.scene.width || this.scene.scale.width;
    const height = this.scene.height || this.scene.scale.height;
    
    // Left Joystick - Movement AND Jetpack (bottom-left corner)
    this.createMovementJoystick(70, height - 70);
    
    // Right Joystick - Shooting (bottom-right corner)
    this.createShootingJoystick(width - 70, height - 70);
  }
  
  createMovementJoystick(x, y) {
    const radius = 50;
    const stickRadius = 20;
    
    // Glassmorphic base container (more transparent)
    const glassContainer = this.scene.add.graphics();
    glassContainer.setScrollFactor(0);
    glassContainer.setDepth(998);
    
    glassContainer.fillStyle(0x00F5FF, 0.05);
    glassContainer.fillCircle(x, y, radius + 6);
    glassContainer.lineStyle(1, 0x00F5FF, 0.2);
    glassContainer.strokeCircle(x, y, radius + 6);
    
    // Inner glass layer (more transparent)
    const innerGlass = this.scene.add.circle(x, y, radius, 0x0a0a0a, 0.25);
    innerGlass.setScrollFactor(0);
    innerGlass.setDepth(999);
    
    // Border
    const border = this.scene.add.circle(x, y, radius, 0x000000, 0);
    border.setStrokeStyle(1.5, 0x00F5FF, 0.3);
    border.setScrollFactor(0);
    border.setDepth(999);
    
    // Subtle inner glow
    const innerGlow = this.scene.add.circle(x, y, radius - 6, 0x00F5FF, 0.03);
    innerGlow.setScrollFactor(0);
    innerGlow.setDepth(999);
    
    // Center dot
    const centerDot = this.scene.add.circle(x, y, 2, 0x00F5FF, 0.25);
    centerDot.setScrollFactor(0);
    centerDot.setDepth(1000);
    
    // Joystick stick
    const stickShadow = this.scene.add.circle(x + 1, y + 1, stickRadius, 0x000000, 0.2);
    stickShadow.setScrollFactor(0);
    stickShadow.setDepth(1000);
    
    const stick = this.scene.add.circle(x, y, stickRadius, 0x00F5FF, 0.75);
    stick.setScrollFactor(0);
    stick.setDepth(1001);
    
    // Stick highlight
    const stickHighlight = this.scene.add.circle(x - 5, y - 5, 7, 0xFFFFFF, 0.2);
    stickHighlight.setScrollFactor(0);
    stickHighlight.setDepth(1002);
    
    // Minimal directional indicators
    const dirIndicators = this.scene.add.graphics();
    dirIndicators.lineStyle(0.5, 0x00F5FF, 0.1);
    dirIndicators.setScrollFactor(0);
    dirIndicators.setDepth(999);
    dirIndicators.lineBetween(x - 6, y, x + 6, y);
    dirIndicators.lineBetween(x, y - 6, x, y + 6);
    
    // Touch tracking with multi-touch support
    let pointerId = null;
    
    const isInArea = (px, py) => {
      return Phaser.Math.Distance.Between(px, py, x, y) < radius + 20;
    };
    
    const updateJoystick = (p) => {
      if (p.id !== pointerId) return;
      
      const angle = Phaser.Math.Angle.Between(x, y, p.x, p.y);
      const distance = Math.min(
        Phaser.Math.Distance.Between(p.x, p.y, x, y), 
        radius - stickRadius - 5
      );
      
      stick.x = x + Math.cos(angle) * distance;
      stick.y = y + Math.sin(angle) * distance;
      stickShadow.x = stick.x + 1;
      stickShadow.y = stick.y + 1;
      stickHighlight.x = stick.x - 5;
      stickHighlight.y = stick.y - 5;
      
      const normalized = distance / (radius - stickRadius - 5);
      this.input.moveX = Math.cos(angle) * normalized;
      this.input.moveY = Math.sin(angle) * normalized;
      this.input.moving = normalized > 0.12;
      
      // Jetpack when joystick is pushed upward (negative Y)
      const angleInDegrees = Phaser.Math.RadToDeg(angle);
      const isUpward = angleInDegrees < -45 && angleInDegrees > -135;
      this.input.jetpack = isUpward && normalized > 0.3;
    };
    
    const resetJoystick = () => {
      stick.x = x;
      stick.y = y;
      stickShadow.x = x + 1;
      stickShadow.y = y + 1;
      stickHighlight.x = x - 5;
      stickHighlight.y = y - 5;
      stick.setFillStyle(0x00F5FF, 0.75);
      stick.setScale(1);
      this.input.moveX = 0;
      this.input.moveY = 0;
      this.input.moving = false;
      this.input.jetpack = false;
    };
    
    this.scene.input.on('pointerdown', (p) => {
      if (pointerId === null && isInArea(p.x, p.y)) {
        pointerId = p.id;
        stick.setFillStyle(0x00FFFF, 1);
        stick.setScale(1.1);
        updateJoystick(p);
      }
    });
    
    this.scene.input.on('pointermove', (p) => {
      if (p.id === pointerId) {
        updateJoystick(p);
      }
    });
    
    this.scene.input.on('pointerup', (p) => {
      if (p.id === pointerId) {
        pointerId = null;
        resetJoystick();
      }
    });
    
    this.leftJoystick = { 
      glassContainer, innerGlass, border, innerGlow, centerDot,
      stick, stickShadow, stickHighlight, dirIndicators, x, y 
    };
  }
  
  createShootingJoystick(x, y) {
    const radius = 50;
    const stickRadius = 20;
    
    // Glassmorphic base container (more transparent)
    const glassContainer = this.scene.add.graphics();
    glassContainer.setScrollFactor(0);
    glassContainer.setDepth(998);
    
    glassContainer.fillStyle(0xFF4444, 0.05);
    glassContainer.fillCircle(x, y, radius + 6);
    glassContainer.lineStyle(1, 0xFF4444, 0.2);
    glassContainer.strokeCircle(x, y, radius + 6);
    
    // Inner glass layer (more transparent)
    const innerGlass = this.scene.add.circle(x, y, radius, 0x0a0a0a, 0.25);
    innerGlass.setScrollFactor(0);
    innerGlass.setDepth(999);
    
    // Border
    const border = this.scene.add.circle(x, y, radius, 0x000000, 0);
    border.setStrokeStyle(1.5, 0xFF4444, 0.3);
    border.setScrollFactor(0);
    border.setDepth(999);
    
    // Inner glow
    const innerGlow = this.scene.add.circle(x, y, radius - 6, 0xFF4444, 0.03);
    innerGlow.setScrollFactor(0);
    innerGlow.setDepth(999);
    
    // Minimal crosshair
    const crosshair = this.scene.add.graphics();
    crosshair.lineStyle(0.5, 0xFF4444, 0.2);
    crosshair.setScrollFactor(0);
    crosshair.setDepth(999);
    crosshair.lineBetween(x - 6, y, x + 6, y);
    crosshair.lineBetween(x, y - 6, x, y + 6);
    crosshair.strokeCircle(x, y, 2);
    
    // Joystick stick
    const stickShadow = this.scene.add.circle(x + 1, y + 1, stickRadius, 0x000000, 0.2);
    stickShadow.setScrollFactor(0);
    stickShadow.setDepth(1000);
    
    const stick = this.scene.add.circle(x, y, stickRadius, 0xFF4444, 0.75);
    stick.setScrollFactor(0);
    stick.setDepth(1001);
    
    // Stick highlight
    const stickHighlight = this.scene.add.circle(x - 5, y - 5, 7, 0xFFFFFF, 0.2);
    stickHighlight.setScrollFactor(0);
    stickHighlight.setDepth(1002);
    
    // Smaller gun icon
    const gunIcon = this.scene.add.text(x, y, '🎯', {
      fontSize: '14px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);
    
    // Touch tracking with multi-touch support
    let pointerId = null;
    
    const isInArea = (px, py) => {
      return Phaser.Math.Distance.Between(px, py, x, y) < radius + 20;
    };
    
    const updateJoystick = (p) => {
      if (p.id !== pointerId) return;
      
      const angle = Phaser.Math.Angle.Between(x, y, p.x, p.y);
      const distance = Math.min(
        Phaser.Math.Distance.Between(p.x, p.y, x, y), 
        radius - stickRadius - 5
      );
      
      stick.x = x + Math.cos(angle) * distance;
      stick.y = y + Math.sin(angle) * distance;
      stickShadow.x = stick.x + 1;
      stickShadow.y = stick.y + 1;
      stickHighlight.x = stick.x - 5;
      stickHighlight.y = stick.y - 5;
      gunIcon.x = stick.x;
      gunIcon.y = stick.y;
      gunIcon.rotation = angle;
      
      this.input.shootAngle = angle;
      this.input.aimX = Math.cos(angle);
      this.input.aimY = Math.sin(angle);
      
      const normalized = distance / (radius - stickRadius - 5);
      this.input.shooting = normalized > 0.15;
    };
    
    const resetJoystick = () => {
      stick.x = x;
      stick.y = y;
      stickShadow.x = x + 1;
      stickShadow.y = y + 1;
      stickHighlight.x = x - 5;
      stickHighlight.y = y - 5;
      gunIcon.x = x;
      gunIcon.y = y;
      gunIcon.rotation = 0;
      stick.setFillStyle(0xFF4444, 0.75);
      stick.setScale(1);
      this.input.shooting = false;
    };
    
    this.scene.input.on('pointerdown', (p) => {
      if (pointerId === null && isInArea(p.x, p.y)) {
        pointerId = p.id;
        stick.setFillStyle(0xFF0000, 1);
        stick.setScale(1.1);
        this.input.shooting = true;
        updateJoystick(p);
      }
    });
    
    this.scene.input.on('pointermove', (p) => {
      if (p.id === pointerId) {
        updateJoystick(p);
      }
    });
    
    this.scene.input.on('pointerup', (p) => {
      if (p.id === pointerId) {
        pointerId = null;
        resetJoystick();
      }
    });
    
    this.rightJoystick = { 
      glassContainer, innerGlass, border, innerGlow, crosshair,
      stick, stickShadow, stickHighlight, gunIcon, x, y 
    };
  }
  
  
  getInput() {
    return this.input;
  }
  
  destroy() {
    if (this.leftJoystick) {
      Object.values(this.leftJoystick).forEach(obj => {
        if (obj && obj.destroy) obj.destroy();
      });
    }
    
    if (this.rightJoystick) {
      Object.values(this.rightJoystick).forEach(obj => {
        if (obj && obj.destroy) obj.destroy();
      });
    }
    
    if (this.jetpackButton) {
      Object.values(this.jetpackButton).forEach(obj => {
        if (obj && obj.destroy) obj.destroy();
      });
    }
  }
}
