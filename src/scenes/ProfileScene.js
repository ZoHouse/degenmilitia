import { authService } from '../services/AuthService.js';
import { userMetricsService } from '../services/UserMetricsService.js';

/**
 * Profile Scene - View user stats and info
 */
export class ProfileScene extends Phaser.Scene {
  constructor() {
    super('ProfileScene');
  }
  
  async create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x10002B);
    
    // Title (smaller for landscape with safe margin)
    const safeMarginTop = 50;
    this.add.text(width / 2, safeMarginTop, 'PLAYER PROFILE', {
      fontSize: '32px',
      fill: '#9D4EDD',
      fontStyle: 'bold',
      stroke: '#7B2CBF',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Get user
    const user = authService.getCurrentUser();
    if (!user) {
      this.add.text(width / 2, height / 2, 'No user logged in', {
        fontSize: '20px',
        fill: '#FF4444'
      }).setOrigin(0.5);
      this.createBackButton(width, height);
      return;
    }
    
    // Profile Card Container (landscape optimized - left side)
    const cardX = width * 0.27;
    const cardY = height * 0.38;
    const cardWidth = 340;
    const cardHeight = 190;
    
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x9D4EDD, 0.1);
    cardBg.fillRoundedRect(cardX - cardWidth/2, cardY - cardHeight/2, cardWidth, cardHeight, 16);
    cardBg.lineStyle(2, 0x9D4EDD, 0.4);
    cardBg.strokeRoundedRect(cardX - cardWidth/2, cardY - cardHeight/2, cardWidth, cardHeight, 16);
    
    // Avatar/Icon
    this.add.text(cardX - 150, cardY - 50, '👤', {
      fontSize: '60px'
    });
    
    // Username with edit button
    const usernameText = this.add.text(cardX - 80, cardY - 50, user.username, {
      fontSize: '24px',
      fill: '#9D4EDD',
      fontStyle: 'bold'
    });
    
    // Edit button
    const editBtn = this.add.text(cardX + 130, cardY - 50, '✏️', {
      fontSize: '20px'
    }).setInteractive({ useHandCursor: true });
    
    editBtn.on('pointerdown', () => {
      this.editUsername(user, usernameText);
    });
    
    editBtn.on('pointerover', () => {
      editBtn.setScale(1.2);
    });
    
    editBtn.on('pointerout', () => {
      editBtn.setScale(1);
    });
    
    // Wallet Address
    const walletShort = user.wallet_address 
      ? `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}`
      : 'No wallet connected';
    this.add.text(cardX - 80, cardY - 20, walletShort, {
      fontSize: '14px',
      fill: '#888888'
    });
    
    // Connect Wallet Button (if not connected)
    if (!user.wallet_address || user.is_local) {
      this.createSmallButton(cardX, cardY + 30, 200, 35, 
        '🔗 Connect Wallet', 0x00F5FF, () => {
          this.connectWallet(user);
        });
    }
    
    // Account Type Badge
    const accountType = user.is_local ? 'LOCAL' : user.is_guest ? 'GUEST' : 'VERIFIED';
    const badgeColor = user.is_local ? 0xFFD700 : user.is_guest ? 0x888888 : 0x00FF00;
    
    const badgeY = user.wallet_address && !user.is_local ? cardY + 30 : cardY + 70;
    
    const badge = this.add.graphics();
    badge.fillStyle(badgeColor, 0.2);
    badge.fillRoundedRect(cardX - 80, badgeY, 90, 25, 8);
    badge.lineStyle(1.5, badgeColor, 0.5);
    badge.strokeRoundedRect(cardX - 80, badgeY, 90, 25, 8);
    
    this.add.text(cardX - 35, badgeY + 12, accountType, {
      fontSize: '12px',
      fill: badgeColor === 0xFFD700 ? '#FFD700' : badgeColor === 0x888888 ? '#888888' : '#00FF00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Stats Section (right side for landscape)
    const statsX = width * 0.7;
    const statsY = safeMarginTop + 60;
    
    this.add.text(statsX, statsY, 'STATISTICS', {
      fontSize: '22px',
      fill: '#00F5FF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Loading text
    const loadingText = this.add.text(statsX, statsY + 40, 'Loading stats...', {
      fontSize: '14px',
      fill: '#888888'
    }).setOrigin(0.5);
    
    // Fetch stats
    if (!user.is_local && !user.is_guest) {
      try {
        const stats = await userMetricsService.getUserStats(user.id);
        loadingText.destroy();
        
        if (stats) {
          this.displayStats(statsX, statsY + 40, stats);
        } else {
          loadingText.setText('No stats yet - Play some games!');
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        loadingText.setText('Stats unavailable');
      }
    } else {
      loadingText.setText('Stats not saved (local account)\nConnect with X to track your progress!');
    }
    
    // Buttons (landscape optimized - bottom center with safe margins)
    const safeMarginBottom = 60; // Safe from gesture bars and bottom edge
    const btnY = height - safeMarginBottom;
    const btnSpacing = 250; // More spacing between buttons
    
    this.createButton(width / 2 - btnSpacing, btnY, 180, 45, 
      'BACK', 0x00F5FF, () => {
        this.scene.start('MenuScene');
      });
    
    // Logout button
    this.createButton(width / 2 + btnSpacing, btnY, 150, 45, 
      'LOGOUT', 0xFF4444, () => {
        authService.logout();
        window.location.reload(); // Reload to go back to login
      });
  }
  
  editUsername(user, textObject) {
    const newName = prompt('Enter new username:', user.username);
    if (newName && newName.trim() && newName !== user.username) {
      authService.updateProfile({ username: newName.trim() })
        .then(updatedUser => {
          textObject.setText(updatedUser.username);
          alert('Username updated!');
        })
        .catch(error => {
          console.error('Error updating username:', error);
          alert('Failed to update username');
        });
    }
  }
  
  async connectWallet(user) {
    try {
      // Check for ethereum provider (handle conflicts gracefully)
      const provider = window.ethereum;
      
      if (!provider) {
        alert('No Web3 wallet found!\n\nPlease install MetaMask or use Privy login instead.');
        return;
      }
      
      // Request accounts
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        alert('No accounts found. Please unlock your wallet.');
        return;
      }
      
      const walletAddress = accounts[0];
      
      // Update profile
      await authService.updateProfile({ wallet_address: walletAddress });
      alert('Wallet connected successfully!');
      this.scene.restart(); // Reload the scene
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      // User-friendly error messages
      if (error.code === 4001) {
        alert('Connection rejected. Please approve the connection request.');
      } else if (error.code === -32002) {
        alert('A connection request is already pending. Please check your wallet.');
      } else {
        alert('Failed to connect wallet. Please try using Privy login instead.');
      }
    }
  }
  
  createSmallButton(x, y, width, height, text, color, callback) {
    const btn = this.add.graphics();
    btn.fillStyle(color, 0.2);
    btn.fillRoundedRect(x - width/2, y - height/2, width, height, 8);
    btn.lineStyle(1.5, color, 0.4);
    btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 8);
    btn.setInteractive(new Phaser.Geom.Rectangle(x - width/2, y - height/2, width, height), Phaser.Geom.Rectangle.Contains);
    
    const label = this.add.text(x, y, text, {
      fontSize: '14px',
      fill: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    btn.on('pointerdown', callback);
    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(color, 0.4);
      btn.fillRoundedRect(x - width/2, y - height/2, width, height, 8);
      btn.lineStyle(1.5, color, 0.6);
      btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 8);
      label.setScale(1.05);
    });
    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(color, 0.2);
      btn.fillRoundedRect(x - width/2, y - height/2, width, height, 8);
      btn.lineStyle(1.5, color, 0.4);
      btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 8);
      label.setScale(1);
    });
  }
  
  displayStats(centerX, startY, stats) {
    const statsData = [
      { label: '🎯 Total Kills', value: stats.total_kills || 0 },
      { label: '💀 Total Deaths', value: stats.total_deaths || 0 },
      { label: '🎮 Games Played', value: stats.games_played || 0 },
      { label: '🏆 Games Won', value: stats.games_won || 0 },
      { label: '⚡ Best Streak', value: stats.highest_killstreak || 0 },
      { label: '⭐ Level', value: stats.level || 1 },
      { label: '💎 Experience', value: stats.experience || 0 },
    ];
    
    // Calculate K/D Ratio
    const kdRatio = stats.total_deaths > 0 
      ? (stats.total_kills / stats.total_deaths).toFixed(2)
      : stats.total_kills;
    
    // Calculate Win Rate
    const winRate = stats.games_played > 0
      ? ((stats.games_won / stats.games_played) * 100).toFixed(1)
      : 0;
    
    statsData.push(
      { label: '📊 K/D Ratio', value: kdRatio },
      { label: '🎯 Win Rate', value: `${winRate}%` }
    );
    
    // Display in grid (landscape optimized - 3 columns, compact cards)
    const cols = 3;
    const rows = Math.ceil(statsData.length / cols);
    const cardWidth = 135;
    const cardHeight = 60;
    const gapX = 18;
    const gapY = 18;
    const totalWidth = (cardWidth * cols) + (gapX * (cols - 1));
    const startX = centerX - (totalWidth / 2);
    
    statsData.forEach((stat, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + (col * (cardWidth + gapX));
      const y = startY + (row * (cardHeight + gapY));
      
      // Stat card
      const card = this.add.graphics();
      card.fillStyle(0x1a1a1a, 0.6);
      card.fillRoundedRect(x, y, cardWidth, cardHeight, 10);
      card.lineStyle(1.5, 0x00F5FF, 0.3);
      card.strokeRoundedRect(x, y, cardWidth, cardHeight, 10);
      
      // Label
      this.add.text(x + cardWidth / 2, y + 16, stat.label, {
        fontSize: '11px',
        fill: '#888888'
      }).setOrigin(0.5);
      
      // Value
      this.add.text(x + cardWidth / 2, y + 38, stat.value.toString(), {
        fontSize: '18px',
        fill: '#00F5FF',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    });
  }
  
  createButton(x, y, width, height, text, color, callback) {
    // Glassmorphic button
    const glassContainer = this.add.graphics();
    glassContainer.fillStyle(color, 0.1);
    glassContainer.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
    glassContainer.lineStyle(2, color, 0.3);
    glassContainer.strokeRoundedRect(x - width/2, y - height/2, width, height, 12);
    
    const button = this.add.rectangle(x, y, width - 4, height - 4, 0x0a0a0a, 0.5);
    button.setInteractive({ useHandCursor: true });
    
    const innerGlow = this.add.rectangle(x, y, width - 16, height - 16, color, 0.08);
    
    const label = this.add.text(x, y, text, {
      fontSize: '20px',
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
      label.setScale(0.95);
    });
    
    button.on('pointerup', () => {
      button.setFillStyle(0x0a0a0a, 0.5);
      label.setScale(1);
      callback();
    });
  }
}

