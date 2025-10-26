import React, { useEffect } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

const PRIVY_APP_ID = 'cmh7hev2x001ri70b4z4jmf8q';

// Inner component that uses Privy hooks
function AuthContent({ onAuthenticated }) {
  const { ready, authenticated, user, login } = usePrivy();
  const [hasTriggeredAuth, setHasTriggeredAuth] = React.useState(false);

  useEffect(() => {
    if (ready && authenticated && user && !hasTriggeredAuth) {
      // User is authenticated, save to AuthService and start game
      setHasTriggeredAuth(true);
      onAuthenticated(user);
    }
  }, [ready, authenticated, user, hasTriggeredAuth]);

  if (!ready) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>🎮 DEGEN MILITIA</h1>
          <p style={styles.subtitle}>Initializing...</p>
        </div>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>🎮 DEGEN MILITIA</h1>
          <p style={styles.subtitle}>Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>🎮 DEGEN MILITIA</h1>
        <p style={styles.subtitle}>Mobile Multiplayer Shooter</p>
        
        <button 
          onClick={login}
          style={styles.loginButton}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 30px rgba(157, 78, 221, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 20px rgba(157, 78, 221, 0.4)';
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
        >
          🚀 LOGIN WITH X
        </button>

        <p style={styles.info}>
          Secure sign-in powered by Privy
        </p>
      </div>
    </div>
  );
}

// Main component with Privy provider
export function PrivyAuth({ onAuthenticated }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['twitter', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#9D4EDD',
          logo: undefined,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <AuthContent onAuthenticated={onAuthenticated} />
    </PrivyProvider>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #10002B 0%, #240046 50%, #3C096C 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    textAlign: 'center',
    padding: '40px',
  },
  title: {
    fontSize: '56px',
    fontWeight: 'bold',
    color: '#9D4EDD',
    textShadow: '0 0 20px rgba(157, 78, 221, 0.5)',
    marginBottom: '20px',
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '22px',
    color: '#00F5FF',
    marginBottom: '40px',
  },
  loginButton: {
    padding: '18px 56px',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    background: 'linear-gradient(135deg, #9D4EDD 0%, #7B2CBF 100%)',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 20px rgba(157, 78, 221, 0.4)',
    outline: 'none',
    letterSpacing: '0.5px',
  },
  info: {
    marginTop: '30px',
    fontSize: '14px',
    color: '#888888',
  },
};

