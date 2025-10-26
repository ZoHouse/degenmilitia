import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyAuth } from './auth/PrivyAuth.jsx';
import { authService } from './services/AuthService.js';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { ProfileScene } from './scenes/ProfileScene.js';
import { CreateRoomScene } from './scenes/CreateRoomScene.js';
import { JoinRoomScene } from './scenes/JoinRoomScene.js';
import { GameScene } from './scenes/GameScene.js';

/**
 * Main App - Handles Privy Auth then loads Phaser game
 */
function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide loading screen immediately
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Check if user already logged in
    const checkAuth = async () => {
      const user = await authService.initPrivy();
      if (user) {
        setAuthenticated(true);
        startPhaserGame();
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleAuthenticated = async (privyUser) => {
    console.log('✅ User authenticated:', privyUser);

    // Extract user data
    const walletAddress = privyUser.wallet?.address || privyUser.twitter?.username;
    const username = privyUser.twitter?.username || `Player${Math.floor(Math.random() * 10000)}`;

    try {
      // Login with AuthService
      const user = await authService.loginWithWallet(walletAddress);
      
      // Update username if from Twitter
      if (privyUser.twitter?.username) {
        await authService.updateProfile({ username: privyUser.twitter.username });
      }

      console.log('✅ User saved to database:', user);
      
      setAuthenticated(true);
      startPhaserGame();
    } catch (error) {
      console.error('❌ Authentication error:', error);
    }
  };

  const startPhaserGame = () => {
    // Hide loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    // Remove React root
    setTimeout(() => {
      const authContainer = document.getElementById('auth-container');
      if (authContainer) {
        authContainer.style.display = 'none';
      }

      // Start Phaser game
      const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#10002B',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 500 },
            debug: false
          }
        },
        scene: [MenuScene, ProfileScene, CreateRoomScene, JoinRoomScene, GameScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        render: {
          pixelArt: false,
          antialias: true
        },
        input: {
          activePointers: 3, // Support multiple simultaneous touches (1 mouse + 2 touches)
          touch: true,
          mouse: true
        }
      };

      new Phaser.Game(config);
    }, 100);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎮 DEGEN MILITIA</h1>
        <p style={styles.subtitle}>Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <PrivyAuth onAuthenticated={handleAuthenticated} />;
  }

  return null;
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #10002B 0%, #240046 50%, #3C096C 100%)',
  },
  title: {
    fontSize: '56px',
    fontWeight: 'bold',
    color: '#9D4EDD',
    textShadow: '0 0 20px rgba(157, 78, 221, 0.5)',
    marginBottom: '20px',
  },
  subtitle: {
    fontSize: '22px',
    color: '#00F5FF',
  },
};

// Mount React app
const container = document.getElementById('auth-container');
const root = createRoot(container);
root.render(<App />);

