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
    
    // Responsive sizing based on screen width
    const isMobile = width < 900;
    const titleSize = isMobile ? '36px' : '48px';
    const subtitleSize = isMobile ? '14px' : '18px';
    
    // Logo/Title (responsive positioning)
    this.add.text(width / 2, height * 0.25, 'DEGEN MILITIA', {
      fontSize: titleSize,
      fill: '#9D4EDD',
      fontStyle: 'bold',
      stroke: '#7B2CBF',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width / 2, height * 0.35, 'Mobile Multiplayer Shooter', {
      fontSize: subtitleSize,
      fill: '#00F5FF'
    }).setOrigin(0.5);
    
    // Buttons (responsive layout)
    const btnY = height * 0.55;
    const btnSpacing = isMobile ? 160 : 200;
    const btnWidth = isMobile ? 140 : 180;
    const btnHeight = isMobile ? 45 : 55;
    
    const btnFontSize = isMobile ? '16px' : '22px';
    
    // Create Game Button
    this.createButton(width / 2 - btnSpacing, btnY, btnWidth, btnHeight, 
      'CREATE GAME', 0x9D4EDD, btnFontSize, () => {
        this.scene.start('CreateRoomScene');
      });
    
    // Join Game Button
    this.createButton(width / 2, btnY, btnWidth, btnHeight, 
      'JOIN GAME', 0x00F5FF, btnFontSize, () => {
        this.scene.start('JoinRoomScene');
      });
    
    // Profile Button
    this.createButton(width / 2 + btnSpacing, btnY, btnWidth, btnHeight, 
      '👤 PROFILE', 0xFFD700, btnFontSize, () => {
        this.scene.start('ProfileScene');
      });
    
    // User info (top-right with safe area margins - responsive)
    const safeMarginTop = isMobile ? 15 : 60;
    const safeMarginRight = isMobile ? 15 : 80;
    const userBoxWidth = isMobile ? 180 : 230;
    const userBoxHeight = isMobile ? 40 : 50;
    
    const userInfoBg = this.add.graphics();
    userInfoBg.fillStyle(0x9D4EDD, 0.1);
    userInfoBg.fillRoundedRect(width - userBoxWidth - safeMarginRight, safeMarginTop, userBoxWidth, userBoxHeight, 8);
    userInfoBg.lineStyle(1.5, 0x9D4EDD, 0.3);
    userInfoBg.strokeRoundedRect(width - userBoxWidth - safeMarginRight, safeMarginTop, userBoxWidth, userBoxHeight, 8);
    
    const userNameSize = isMobile ? '14px' : '18px';
    const walletSize = isMobile ? '10px' : '12px';
    const userTextX = width - userBoxWidth - safeMarginRight + 10;
    
    this.add.text(userTextX, safeMarginTop + (isMobile ? 8 : 10), user.username, {
      fontSize: userNameSize,
      fill: '#9D4EDD',
      fontStyle: 'bold'
    });
    
    const walletShort = user.wallet_address 
      ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
      : 'Guest';
    this.add.text(userTextX, safeMarginTop + (isMobile ? 22 : 28), walletShort, {
      fontSize: walletSize,
      fill: '#888888'
    });
    
    // Logout button
    const logoutBtn = this.add.text(width - safeMarginRight - (isMobile ? 20 : 30), safeMarginTop + userBoxHeight / 2, '🚪', {
      fontSize: isMobile ? '16px' : '20px'
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
  
  createButton(x, y, width, height, text, color, fontSize, callback) {
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
      fontSize: fontSize,
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

