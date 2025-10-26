import { authService } from '../services/AuthService.js';

/**
 * Main Menu Scene
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }
  
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Get current user
    const user = authService.getCurrentUser();
    if (!user) {
      // Not logged in, reload to show Privy auth
      window.location.reload();
      return;
    }
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x10002B);
    
    // Logo/Title (landscape optimized)
    this.add.text(width / 2, height * 0.2, 'DEGEN MILITIA', {
      fontSize: '48px',
      fill: '#9D4EDD',
      fontStyle: 'bold',
      stroke: '#7B2CBF',
      strokeThickness: 5
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width / 2, height * 0.32, 'Mobile Multiplayer Shooter', {
      fontSize: '18px',
      fill: '#00F5FF'
    }).setOrigin(0.5);
    
    // Buttons (landscape layout - side by side with proper spacing)
    const btnY = height * 0.5;
    const btnSpacing = 200;
    const btnWidth = 180;
    const btnHeight = 55;
    
    // Create Game Button
    this.createButton(width / 2 - btnSpacing, btnY, btnWidth, btnHeight, 
      'CREATE GAME', 0x9D4EDD, () => {
        this.scene.start('CreateRoomScene');
      });
    
    // Join Game Button
    this.createButton(width / 2, btnY, btnWidth, btnHeight, 
      'JOIN GAME', 0x00F5FF, () => {
        this.scene.start('JoinRoomScene');
      });
    
    // Profile Button
    this.createButton(width / 2 + btnSpacing, btnY, btnWidth, btnHeight, 
      '👤 PROFILE', 0xFFD700, () => {
        this.scene.start('ProfileScene');
      });
    
    // User info (top-right with safe area margins)
    const safeMarginTop = 60; // Safe from notches
    const safeMarginRight = 80; // Safe from right edge
    
    const userInfoBg = this.add.graphics();
    userInfoBg.fillStyle(0x9D4EDD, 0.1);
    userInfoBg.fillRoundedRect(width - 250 - safeMarginRight, safeMarginTop, 230, 50, 8);
    userInfoBg.lineStyle(1.5, 0x9D4EDD, 0.3);
    userInfoBg.strokeRoundedRect(width - 250 - safeMarginRight, safeMarginTop, 230, 50, 8);
    
    this.add.text(width - 240 - safeMarginRight, safeMarginTop + 10, user.username, {
      fontSize: '18px',
      fill: '#9D4EDD',
      fontStyle: 'bold'
    });
    
    const walletShort = user.wallet_address 
      ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
      : 'Guest';
    this.add.text(width - 240 - safeMarginRight, safeMarginTop + 28, walletShort, {
      fontSize: '12px',
      fill: '#888888'
    });
    
    // Logout button
    const logoutBtn = this.add.text(width - 40 - safeMarginRight, safeMarginTop + 25, '🚪', {
      fontSize: '20px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    logoutBtn.on('pointerup', () => {
      authService.logout();
      window.location.reload(); // Reload to show Privy auth
    });
    
    // Version
    this.add.text(width / 2, height - 30, 'v1.0.0', {
      fontSize: '14px',
      fill: '#666666'
    }).setOrigin(0.5);
  }
  
  createButton(x, y, width, height, text, color, callback) {
    // Glassmorphic button container
    const glassContainer = this.add.graphics();
    glassContainer.fillStyle(color, 0.1);
    glassContainer.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
    glassContainer.lineStyle(2, color, 0.3);
    glassContainer.strokeRoundedRect(x - width/2, y - height/2, width, height, 12);
    
    // Button background
    const button = this.add.rectangle(x, y, width - 4, height - 4, 0x0a0a0a, 0.5);
    button.setInteractive({ useHandCursor: true });
    
    // Inner glow
    const innerGlow = this.add.rectangle(x, y, width - 16, height - 16, color, 0.08);
    
    const label = this.add.text(x, y, text, {
      fontSize: '22px',
      fill: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    button.on('pointerover', () => {
      button.setFillStyle(color, 0.3);
      innerGlow.setAlpha(0.15);
      label.setScale(1.05);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x0a0a0a, 0.5);
      innerGlow.setAlpha(0.08);
      label.setScale(1);
    });
    
    button.on('pointerdown', () => {
      button.setFillStyle(color, 0.5);
      innerGlow.setAlpha(0.2);
      label.setScale(0.95);
    });
    
    button.on('pointerup', () => {
      button.setFillStyle(0x0a0a0a, 0.5);
      innerGlow.setAlpha(0.08);
      label.setScale(1);
      callback();
    });
  }
}

