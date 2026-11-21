import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function listTables() {
  const tablesToCheck = ['coupons', 'user_coupons', 'ai_tips', 'achievements', 'user_achievements', 'user_missions', 'user_streaks'];
  for (const t of tablesToCheck) {
      const { data, error } = await supabase.from(t).select('*').limit(1);
      console.log(`Table ${t}:`, data ? (data[0] ? Object.keys(data[0]) : "Empty") : `Error: ${error?.message}`);
  }
}
listTables();
