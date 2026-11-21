
import dotenv from 'dotenv';
dotenv.config();
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY_START:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10));
