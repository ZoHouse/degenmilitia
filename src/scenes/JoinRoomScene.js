/**
 * Join Room Scene - Enter room code to join game
 */
export class JoinRoomScene extends Phaser.Scene {
  constructor() {
    super('JoinRoomScene');
    this.enteredCode = '';
  }
  
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x10002B);
    
    // Title
    this.add.text(width / 2, height * 0.15, 'JOIN GAME', {
      fontSize: '48px',
      fill: '#00F5FF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Instruction
    this.add.text(width / 2, height * 0.3, 'Enter Room Code', {
      fontSize: '20px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);
    
    // Glassmorphic code input display
    const codeBoxGlass = this.add.graphics();
    codeBoxGlass.fillStyle(0x00F5FF, 0.1);
    codeBoxGlass.fillRoundedRect(width / 2 - 225, height * 0.45 - 50, 450, 100, 16);
    codeBoxGlass.lineStyle(2, 0x00F5FF, 0.4);
    codeBoxGlass.strokeRoundedRect(width / 2 - 225, height * 0.45 - 50, 450, 100, 16);
    
    this.codeBox = this.add.rectangle(width / 2, height * 0.45, 440, 90, 0x0a0a0a, 0.5);
    
    this.codeText = this.add.text(width / 2, height * 0.45, '______', {
      fontSize: '48px',
      fill: '#00F5FF',
      fontStyle: 'bold',
      letterSpacing: 18,
      stroke: '#240046',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Error message
    this.errorText = this.add.text(width / 2, height * 0.55, '', {
      fontSize: '16px',
      fill: '#FF4444'
    }).setOrigin(0.5);
    
    // Virtual keyboard
    this.createKeyboard(width, height);
    
    // Glassmorphic join button
    this.joinBtnGlass = this.add.graphics();
    this.joinBtnGlass.fillStyle(0x444444, 0.1);
    this.joinBtnGlass.fillRoundedRect(width / 2 - 150, height * 0.85 - 30, 300, 60, 12);
    this.joinBtnGlass.lineStyle(2, 0x444444, 0.3);
    this.joinBtnGlass.strokeRoundedRect(width / 2 - 150, height * 0.85 - 30, 300, 60, 12);
    
    this.joinButton = this.add.rectangle(width / 2, height * 0.85, 290, 50, 0x0a0a0a, 0.5);
    this.joinButton.setInteractive({ useHandCursor: true });
    
    this.joinButtonLabel = this.add.text(width / 2, height * 0.85, 'JOIN GAME', {
      fontSize: '22px',
      fill: '#666666',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.joinButton.on('pointerup', () => {
      if (this.enteredCode.length === 6) {
        this.joinGame();
      }
    });
    
    // Back button
    this.createBackButton();
    
    // Desktop: Allow keyboard input
    this.input.keyboard.on('keydown', (event) => {
      this.handleKeyPress(event.key.toUpperCase());
    });
  }
  
  createKeyboard(width, height) {
    const keys = [
      ['2', '3', '4', '5', '6', '7', '8', '9'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ];
    
    const startY = height * 0.58;
    const keySize = 45;
    const gap = 8;
    
    keys.forEach((row, rowIndex) => {
      const rowWidth = row.length * (keySize + gap);
      const startX = (width - rowWidth) / 2;
      
      row.forEach((key, keyIndex) => {
        const x = startX + keyIndex * (keySize + gap) + keySize / 2;
        const y = startY + rowIndex * (keySize + gap);
        
        // Glassmorphic key
        const keyGlass = this.add.graphics();
        keyGlass.fillStyle(0x666666, 0.1);
        keyGlass.fillRoundedRect(x - keySize/2, y - keySize/2, keySize, keySize, 6);
        keyGlass.lineStyle(1, 0x666666, 0.2);
        keyGlass.strokeRoundedRect(x - keySize/2, y - keySize/2, keySize, keySize, 6);
        
        const button = this.add.rectangle(x, y, keySize - 2, keySize - 2, 0x0a0a0a, 0.5);
        button.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(x, y, key, {
          fontSize: key === '⌫' ? '24px' : '18px',
          fill: '#FFFFFF',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.on('pointerdown', () => {
          button.setFillStyle(0x666666, 0.6);
          label.setScale(0.9);
          this.handleKeyPress(key);
        });
        
        button.on('pointerup', () => {
          button.setFillStyle(0x0a0a0a, 0.5);
          label.setScale(1);
        });
        
        button.on('pointerover', () => {
          button.setFillStyle(0x444444, 0.5);
        });
        
        button.on('pointerout', () => {
          button.setFillStyle(0x0a0a0a, 0.5);
        });
      });
    });
  }
  
  handleKeyPress(key) {
    if (key === '⌫' || key === 'BACKSPACE') {
      this.enteredCode = this.enteredCode.slice(0, -1);
    } else if (this.enteredCode.length < 6 && /^[A-Z0-9]$/.test(key)) {
      this.enteredCode += key;
    }
    
    // Update display
    const display = this.enteredCode.padEnd(6, '_');
    this.codeText.setText(display.split('').join(' '));
    
    // Enable/disable join button with glassmorphism
    const width = this.scale.width;
    const height = this.scale.height;
    
    if (this.enteredCode.length === 6) {
      this.joinButton.setFillStyle(0x00F5FF, 0.4);
      this.joinButtonLabel.setColor('#FFFFFF');
      
      this.joinBtnGlass.clear();
      this.joinBtnGlass.fillStyle(0x00F5FF, 0.15);
      this.joinBtnGlass.fillRoundedRect(width / 2 - 150, height * 0.85 - 30, 300, 60, 12);
      this.joinBtnGlass.lineStyle(2, 0x00F5FF, 0.5);
      this.joinBtnGlass.strokeRoundedRect(width / 2 - 150, height * 0.85 - 30, 300, 60, 12);
    } else {
      this.joinButton.setFillStyle(0x0a0a0a, 0.5);
      this.joinButtonLabel.setColor('#666666');
      
      this.joinBtnGlass.clear();
      this.joinBtnGlass.fillStyle(0x444444, 0.1);
      this.joinBtnGlass.fillRoundedRect(width / 2 - 150, height * 0.85 - 30, 300, 60, 12);
      this.joinBtnGlass.lineStyle(2, 0x444444, 0.3);
      this.joinBtnGlass.strokeRoundedRect(width / 2 - 150, height * 0.85 - 30, 300, 60, 12);
    }
    
    this.errorText.setText('');
  }
  
  joinGame() {
    // In real implementation: Check if room exists in Supabase
    // For now, just start the game
    const roomCode = this.enteredCode;
    
    // Simulate checking room
    this.errorText.setText('Joining room...');
    this.errorText.setColor('#00F5FF');
    
    this.time.delayedCall(1000, () => {
      // Start game
      this.scene.start('GameScene', { roomCode, isHost: false });
    });
  }
  
  createBackButton() {
    // Safe margins for notches and rounded corners
    const safeMarginLeft = 60;
    const safeMarginTop = 60;
    
    const backBtn = this.add.text(safeMarginLeft, safeMarginTop, '← BACK', {
      fontSize: '20px',
      fill: '#888888'
    }).setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerover', () => backBtn.setColor('#FFFFFF'));
    backBtn.on('pointerout', () => backBtn.setColor('#888888'));
    backBtn.on('pointerup', () => this.scene.start('MenuScene'));
  }
}

