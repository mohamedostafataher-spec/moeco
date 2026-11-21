import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkMoreTables() {
  const tables = ['emergency_contacts', 'news_articles', 'scientific_data', 'government_services'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (error) console.log(`Table ${t} error:`, error.message);
    else console.log(`Table ${t} exists.`);
  }
}
checkMoreTables();
