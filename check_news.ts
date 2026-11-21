import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkNews() {
  console.log("Checking news table...");
  const { data, error, count } = await supabase.from('news').select('*', { count: 'exact', head: true });
  if (error) {
    console.error("News query failed:", error.message);
  } else {
    console.log(`News table has ${count} records.`);
    
    const { data: emergencyNews } = await supabase.from('news').select('id, title, target_screen').eq('target_screen', 'emergency').limit(5);
    console.log("Emergency examples:", emergencyNews);
  }
}

checkNews();
