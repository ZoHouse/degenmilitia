/**
 * Test Environment Configuration
 * Verifies all credentials are working
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Degen Militia Environment\n');

// Check Privy
console.log('🔐 Privy Configuration:');
if (process.env.VITE_PRIVY_APP_ID) {
  console.log('   ✅ App ID configured:', process.env.VITE_PRIVY_APP_ID);
} else {
  console.log('   ❌ App ID missing');
}

if (process.env.PRIVY_APP_SECRET) {
  console.log('   ✅ App Secret configured:', process.env.PRIVY_APP_SECRET.slice(0, 10) + '...');
} else {
  console.log('   ❌ App Secret missing');
}

// Check Supabase
console.log('\n💾 Supabase Configuration:');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl) {
  console.log('   ✅ URL configured:', supabaseUrl);
} else {
  console.log('   ❌ URL missing');
}

if (supabaseAnonKey) {
  console.log('   ✅ Anon Key configured:', supabaseAnonKey.slice(0, 20) + '...');
} else {
  console.log('   ❌ Anon Key missing');
}

// Test Supabase connection
if (supabaseUrl && supabaseAnonKey) {
  console.log('\n📡 Testing Supabase connection...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase.from('players').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ⚠️  Table not found - run database setup first');
        console.log('   💡 See SETUP-SERVICES.md for SQL schema');
      } else {
        console.log('   ❌ Connection error:', error.message);
      }
    } else {
      console.log('   ✅ Connection successful!');
      console.log('   ✅ Database is ready');
    }
  } catch (err) {
    console.log('   ❌ Connection failed:', err.message);
  }
}

// Summary
console.log('\n📊 Summary:');
const allGood = 
  process.env.VITE_PRIVY_APP_ID &&
  process.env.PRIVY_APP_SECRET &&
  process.env.VITE_SUPABASE_URL &&
  process.env.VITE_SUPABASE_ANON_KEY;

if (allGood) {
  console.log('   ✅ All environment variables configured!');
  console.log('\n🚀 Ready to start:');
  console.log('   npm run dev\n');
} else {
  console.log('   ❌ Some variables are missing');
  console.log('   📝 Check your .env file\n');
}

