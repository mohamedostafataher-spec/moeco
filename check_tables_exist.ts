import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function setup() {
const tablesToCheck = ['news', 'audit_logs', 'sustainability_goals', 'carbon_activities', 'scientific_data', 'national_metrics', 'app_config', 'alerts'];
  for (const t of tablesToCheck) {
    const { error } = await supabase.from(t).select('id').limit(1);
    console.log(`Checking ${t}:`, error ? error.message : "Exists!");
  }
}

setup();
