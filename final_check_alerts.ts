import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('alerts').select('*').limit(1);
  if (error) console.log("Alerts Table Error:", error.message);
  else console.log("Alerts Table exists.");
}
check();
