import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { env } from './env.js';

/**
 * Privy Configuration
 * Handles authentication with social logins and wallets
 */

export const privyConfig = {
  appId: env.privy.appId,
  config: {
    // Appearance
    appearance: {
      theme: 'dark',
      accentColor: '#9D4EDD',
      logo: '/logo.png', // Add your logo
    },
    
    // Login methods
    loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord'],
    
    // Wallet settings
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
    
    // Legal
    legal: {
      termsAndConditionsUrl: '/terms',
      privacyPolicyUrl: '/privacy',
    },
  },
};

/**
 * Auth Hook - Easy access to Privy functions
 */
export const useAuth = () => {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkEmail,
    linkWallet,
    linkGoogle,
    linkTwitter,
    linkDiscord,
  } = usePrivy();

  const { wallets } = useWallets();

  return {
    // State
    isReady: ready,
    isAuthenticated: authenticated,
    user,
    wallets,
    
    // Actions
    login,
    logout,
    
    // Link additional accounts
    linkEmail,
    linkWallet,
    linkGoogle,
    linkTwitter,
    linkDiscord,
    
    // User info helpers
    userId: user?.id,
    email: user?.email?.address,
    wallet: wallets[0]?.address,
    hasWallet: wallets.length > 0,
  };
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Anonymous';
  
  // Try different sources
  if (user.google?.name) return user.google.name;
  if (user.twitter?.username) return `@${user.twitter.username}`;
  if (user.discord?.username) return user.discord.username;
  if (user.email?.address) {
    // Use first part of email
    return user.email.address.split('@')[0];
  }
  if (user.wallet?.address) {
    // Truncated wallet address
    const addr = user.wallet.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }
  
  return 'Player';
};

/**
 * Get user avatar URL
 */
export const getUserAvatar = (user) => {
  if (!user) return null;
  
  if (user.google?.picture) return user.google.picture;
  if (user.twitter?.profilePictureUrl) return user.twitter.profilePictureUrl;
  if (user.discord?.avatar) return user.discord.avatar;
  
  // Generate avatar from wallet/email
  const identifier = user.wallet?.address || user.email?.address || user.id;
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${identifier}`;
};

export default privyConfig;

