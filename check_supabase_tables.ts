import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSupabase() {
  const { data, error } = await supabase.from('news').select('id', { head: true, count: 'exact' });
  if (error) {
    console.error('Error checking news table:', error.message);
  } else {
    console.log('News table found.');
  }

  const { data: mData, error: mError } = await supabase.from('matches').select('id', { head: true, count: 'exact' });
  if (mError) {
    console.error('Error checking matches table:', mError.message);
  } else {
    console.log('Matches table found.');
  }
}
checkSupabase();
