/**
 * Environment Configuration
 * Centralized access to environment variables
 */

export const env = {
  // Privy (Authentication)
  privy: {
    appId: import.meta.env.VITE_PRIVY_APP_ID || '',
  },

  // Supabase (Database)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // Game Settings
  game: {
    version: import.meta.env.VITE_GAME_VERSION || '1.0.0',
    maxPlayers: parseInt(import.meta.env.VITE_MAX_PLAYERS) || 8,
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  },

  // Multiplayer Server
  multiplayer: {
    wsServerUrl: import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:3001',
  },

  // Environment
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
};

// Validation: Check if required env vars are set
export const validateEnv = () => {
  const required = [
    { key: 'VITE_PRIVY_APP_ID', value: env.privy.appId, name: 'Privy App ID' },
    { key: 'VITE_SUPABASE_URL', value: env.supabase.url, name: 'Supabase URL' },
    { key: 'VITE_SUPABASE_ANON_KEY', value: env.supabase.anonKey, name: 'Supabase Anon Key' },
  ];

  const missing = required.filter(({ value }) => !value);

  // Only warn in production, don't throw during build
  if (missing.length > 0 && env.isProduction) {
    console.warn('⚠️  Missing required environment variables:');
    missing.forEach(({ name, key }) => {
      console.warn(`   - ${name} (${key})`);
    });
  }

  if (missing.length > 0 && env.isDevelopment) {
    console.warn('⚠️  Missing environment variables (development mode):');
    missing.forEach(({ name, key }) => {
      console.warn(`   - ${name} (${key})`);
    });
  }

  return missing.length === 0;
};

