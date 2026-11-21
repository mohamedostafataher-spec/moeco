import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.log("Profiles error:", error.message);
  } else {
    console.log("Profiles columns:", data?.[0] ? Object.keys(data[0]) : "No data to infer columns");
  }

  // Try to describe the table via RPC if possible or just try to insert a test record and see errors
}
checkProfiles();
