import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkRssSources() {
  console.log("Checking rss_sources columns...");
  const { data, error } = await supabase.from('rss_sources').select('*').limit(1);
  if (error) {
    console.error("Query failed:", error.message);
    if (error.message.includes("column") && error.message.includes("does not exist")) {
      console.log("CRITICAL: Columns are missing. Running auto-repair...");
    }
  } else {
    console.log("Query successful. Found columns:", Object.keys(data[0] || {}).join(', '));
  }
}

checkRssSources();
