import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function tryInsert() {
  const { error } = await supabase.from('carbon_footprint_logs').insert({ id: '00000000-0000-0000-0000-000000000000' });
  if (error) {
    console.log("Error message reveals columns:", error.message);
  }
}
tryInsert();
