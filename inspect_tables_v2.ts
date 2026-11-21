import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function inspect() {
  console.log("--- Government Services ---");
  const { data: gov, error: govErr } = await supabase.from('government_services').select('*').limit(1);
  if (govErr) console.error("gov_services error:", govErr.message);
  else console.log("Columns:", gov?.[0] ? Object.keys(gov[0]) : "Empty table");

  console.log("\n--- Alerts ---");
  const { data: alerts, error: alertErr } = await supabase.from('alerts').select('*').limit(1);
  if (alertErr) console.error("alerts error:", alertErr.message);
  else console.log("Columns:", alerts?.[0] ? Object.keys(alerts[0]) : "Empty table");
}

inspect();
