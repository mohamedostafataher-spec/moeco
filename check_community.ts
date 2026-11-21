import { supabase } from "./server/services/supabaseClient.ts";

async function check() {
  const tables = ['community_posts', 'community_comments'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
       console.log(`Table ${t} error:`, error.message);
    } else {
       console.log(`Table ${t} columns:`, data?.[0] ? Object.keys(data[0]) : 'Empty');
    }
  }
}
check();
