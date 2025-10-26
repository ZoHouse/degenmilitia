# 🎮 DEGEN MILITIA

A multiplayer 2D shooter PWA (Progressive Web App) inspired by Mini Militia, built with Phaser 3, React, and Web3 authentication.

## 🚀 Features

- **Mobile-First Design**: Optimized for mobile gameplay with dual joystick controls
- **Web3 Authentication**: Login with Privy (Twitter/X, Email, or Wallet)
- **Real-time Multiplayer**: Room-based multiplayer with Supabase backend
- **Player Stats & Progression**: Track kills, deaths, K/D ratio, win rate, and level up
- **PWA Support**: Install on mobile devices for native app experience
- **Landscape Mode**: Designed for landscape gameplay on mobile

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Game Engine**: Phaser 3.90
- **Authentication**: Privy.io (Web3 auth)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Styling**: Pure CSS with glassmorphism design

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Privy.io account

### Setup

1. **Clone the repository**
```bash
cd degen-militia-pwa
npm install
```

2. **Configure environment variables**

Create a `.env` file in the `degen-militia-pwa` directory:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Privy Configuration
VITE_PRIVY_APP_ID=your_privy_app_id_here

# Environment
VITE_ENV=development
```

3. **Set up Supabase database**

Run the database schema:
```bash
npm run setup:db
```

Or manually execute the SQL files in Supabase:
- `database-schema-with-auth.sql` - Main schema
- `fix-rls-policies.sql` - Row Level Security policies

4. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` (or your network IP for mobile testing)

## 🌐 Deployment to Vercel

### One-Click Deploy

The easiest way to deploy:

1. **Push to GitHub** (this repo)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `degen-militia-pwa` directory as root

3. **Configure Environment Variables** in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PRIVY_APP_ID`
   - `VITE_ENV=production`

4. **Deploy** - Vercel will automatically build and deploy

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd degen-militia-pwa
vercel

# Or deploy to production
vercel --prod
```

## 🎮 How to Play

1. **Login**: Authenticate with Twitter/X, Email, or Web3 wallet via Privy
2. **Create or Join Room**: 
   - Create a room and share the 6-character code
   - Or join an existing room with a code
3. **Controls** (Mobile):
   - Left joystick: Move player and activate jetpack (push up)
   - Right joystick: Aim and shoot
4. **Controls** (Desktop):
   - WASD/Arrow keys: Move
   - W: Jetpack
   - Mouse: Aim and click to shoot

## 📱 Mobile Installation

To install as a PWA on mobile:

**iOS (Safari)**:
1. Visit the game URL
2. Tap the Share button
3. Select "Add to Home Screen"

**Android (Chrome)**:
1. Visit the game URL
2. Tap the three dots menu
3. Select "Install app" or "Add to Home Screen"

## 🏗️ Project Structure

```
degen-militia-pwa/
├── src/
│   ├── main-with-auth.jsx          # Entry point with Privy auth
│   ├── auth/
│   │   └── PrivyAuth.jsx            # Privy authentication component
│   ├── scenes/                      # Phaser game scenes
│   │   ├── MenuScene.js
│   │   ├── ProfileScene.js
│   │   ├── CreateRoomScene.js
│   │   ├── JoinRoomScene.js
│   │   └── GameScene.js
│   ├── controls/
│   │   └── DualJoystickControls.js  # Mobile touch controls
│   ├── services/
│   │   ├── AuthService.js           # User authentication
│   │   └── UserMetricsService.js    # Stats tracking
│   ├── config/
│   │   ├── env.js                   # Environment config
│   │   ├── privy.js                 # Privy config
│   │   └── supabase.js              # Supabase client
│   └── assets/                      # Game assets (sprites, audio, maps)
├── public/
│   └── manifest.json                # PWA manifest
├── index.html                       # HTML entry point
├── vite.config.js                   # Vite configuration
└── vercel.json                      # Vercel deployment config
```

## 🔧 Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run test:env    # Test environment variables
npm run setup:db    # Setup Supabase database
```

## 🎨 Game Mechanics

- **Movement**: WASD/Arrow keys or left joystick
- **Jetpack**: W key or push left joystick up
- **Shooting**: Mouse click or right joystick
- **Health System**: 100 HP with regeneration
- **Jetpack Fuel**: Auto-regenerating fuel system
- **Platforms**: 2D platformer with gravity and collisions

## 📊 Database Schema

The game uses Supabase with the following main tables:

- `profiles`: User profiles and wallet addresses
- `player_stats`: Game statistics (kills, deaths, K/D, etc.)
- `game_rooms`: Multiplayer room management
- `game_sessions`: Active game sessions

See `database-schema-with-auth.sql` for complete schema.

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Authenticated users can only modify their own data
- API keys are environment variables (never committed)
- Privy handles secure Web3 authentication

## 🐛 Troubleshooting

**Game won't load:**
- Check browser console for errors
- Verify all environment variables are set
- Check Supabase connection

**Authentication issues:**
- Verify Privy App ID is correct
- Check if Privy dashboard shows your domain
- Clear browser cache and cookies

**Mobile controls not working:**
- Ensure you're in landscape mode
- Check if touch events are blocked
- Try refreshing the page

## 📄 License

MIT License - Feel free to use for learning and personal projects

## 🙏 Credits

- Inspired by Mini Militia (Doodle Army 2)
- Built with Phaser 3 game engine
- Authentication by Privy.io
- Backend by Supabase

## 🚧 Roadmap

- [ ] More weapons and power-ups
- [ ] Additional game modes (Team Deathmatch, CTF)
- [ ] Custom map editor
- [ ] Leaderboards
- [ ] In-game chat
- [ ] Tournament system
- [ ] NFT weapon skins

---

**Made with 💜 by the Degen community**
