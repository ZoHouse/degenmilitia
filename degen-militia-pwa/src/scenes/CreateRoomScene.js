/**
 * Create Room Scene - Generate room code and wait for players
 */
export class CreateRoomScene extends Phaser.Scene {
  constructor() {
    super('CreateRoomScene');
  }
  
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x10002B);
    
    // Title
    this.add.text(width / 2, height * 0.15, 'CREATE GAME', {
      fontSize: '48px',
      fill: '#9D4EDD',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Generate room code
    const roomCode = this.generateRoomCode();
    this.registry.set('roomCode', roomCode);
    
    // Glassmorphic room code display
    const codeBoxGlass = this.add.graphics();
    codeBoxGlass.fillStyle(0x9D4EDD, 0.1);
    codeBoxGlass.fillRoundedRect(width / 2 - 200, height * 0.35 - 60, 400, 120, 16);
    codeBoxGlass.lineStyle(2, 0x9D4EDD, 0.4);
    codeBoxGlass.strokeRoundedRect(width / 2 - 200, height * 0.35 - 60, 400, 120, 16);
    
    const codeBox = this.add.rectangle(width / 2, height * 0.35, 390, 110, 0x0a0a0a, 0.5);
    
    this.add.text(width / 2, height * 0.3, 'ROOM CODE', {
      fontSize: '16px',
      fill: '#9D4EDD',
      fontStyle: 'bold',
      alpha: 0.7
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height * 0.38, roomCode, {
      fontSize: '52px',
      fill: '#00F5FF',
      fontStyle: 'bold',
      letterSpacing: 10,
      stroke: '#240046',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Instruction
    this.add.text(width / 2, height * 0.5, 'Share this code with friends!', {
      fontSize: '20px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);
    
    // Players waiting
    this.playersText = this.add.text(width / 2, height * 0.6, 'Waiting for players... (1/8)', {
      fontSize: '18px',
      fill: '#00F5FF'
    }).setOrigin(0.5);
    
    // Glassmorphic start button (disabled initially)
    const startBtnGlass = this.add.graphics();
    startBtnGlass.fillStyle(0x444444, 0.1);
    startBtnGlass.fillRoundedRect(width / 2 - 150, height * 0.75 - 30, 300, 60, 12);
    startBtnGlass.lineStyle(2, 0x444444, 0.3);
    startBtnGlass.strokeRoundedRect(width / 2 - 150, height * 0.75 - 30, 300, 60, 12);
    
    this.startButton = this.add.rectangle(width / 2, height * 0.75, 290, 50, 0x0a0a0a, 0.5);
    this.startButton.setInteractive({ useHandCursor: true });
    
    this.startButtonLabel = this.add.text(width / 2, height * 0.75, 'START GAME', {
      fontSize: '22px',
      fill: '#666666',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.startBtnGlass = startBtnGlass;
    
    this.startButton.on('pointerup', () => {
      if (this.canStart) {
        this.scene.start('GameScene', { roomCode, isHost: true });
      }
    });
    
    // Back Button
    this.createBackButton(width, height);
    
    // Simulate player joining (for testing)
    this.canStart = false;
    this.playerCount = 1;
    
    // In real implementation, listen to Supabase real-time for players joining
    // For now, enable start after 2 seconds (demo)
    this.time.delayedCall(2000, () => {
      this.enableStartButton();
    });
  }
  
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  enableStartButton() {
    this.canStart = true;
    this.startButton.setFillStyle(0x9D4EDD, 0.4);
    this.startButtonLabel.setColor('#FFFFFF');
    
    // Update glass container
    const width = this.scale.width;
    const height = this.scale.height;
    this.startBtnGlass.clear();
    this.startBtnGlass.fillStyle(0x9D4EDD, 0.15);
    this.startBtnGlass.fillRoundedRect(width / 2 - 150, height * 0.75 - 30, 300, 60, 12);
    this.startBtnGlass.lineStyle(2, 0x9D4EDD, 0.5);
    this.startBtnGlass.strokeRoundedRect(width / 2 - 150, height * 0.75 - 30, 300, 60, 12);
    
    this.tweens.add({
      targets: this.startButton,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  createBackButton(width, height) {
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

