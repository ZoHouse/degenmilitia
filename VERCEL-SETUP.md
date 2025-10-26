# Vercel Deployment Setup

## Required Environment Variables

You **must** add these environment variables in your Vercel project settings for the app to work:

### 1. Go to Vercel Dashboard
- Navigate to your project
- Click **Settings** → **Environment Variables**

### 2. Add These Variables

| Variable Name | Description | Where to Get It |
|--------------|-------------|-----------------|
| `VITE_PRIVY_APP_ID` | Privy authentication app ID | [Privy Dashboard](https://dashboard.privy.io) → Your App → Settings |
| `VITE_SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API |

### 3. Set Environment Scope
For each variable:
- ✅ Check **Production**
- ✅ Check **Preview**
- ✅ Check **Development**

### 4. Redeploy
After adding the variables:
1. Go to **Deployments**
2. Click the **•••** menu on the latest deployment
3. Click **Redeploy**

---

## Optional Environment Variables

These have defaults but can be customized:

| Variable Name | Default Value | Description |
|--------------|---------------|-------------|
| `VITE_GAME_VERSION` | `1.0.0` | Game version number |
| `VITE_MAX_PLAYERS` | `8` | Maximum players per room |
| `VITE_ENABLE_DEBUG` | `false` | Enable debug mode |
| `VITE_ENVIRONMENT` | `production` | Environment name |

---

## Quick Setup

1. **Get Privy App ID:**
   - Sign up at https://dashboard.privy.io
   - Create a new app
   - Copy your App ID from Settings

2. **Get Supabase Credentials:**
   - Sign up at https://supabase.com
   - Create a new project
   - Go to Settings → API
   - Copy the **URL** and **anon public** key

3. **Add to Vercel:**
   ```
   VITE_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxxx
   VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Redeploy** and your app will work! 🎮

---

## Troubleshooting

### Build Fails
- Make sure all three required env vars are set
- Check that there are no typos in variable names
- Variables must start with `VITE_` for Vite to expose them

### App Loads But Auth Doesn't Work
- Double-check your Privy App ID is correct
- Verify your domain is added in Privy Dashboard → Allowed Origins

### Database Errors
- Verify Supabase URL and key are correct
- Check that your Supabase project is running
- Make sure RLS policies are set up correctly

---

## Local Development

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Then add your actual credentials to `.env`.

**Note:** Never commit `.env` to git! It's already in `.gitignore`.

