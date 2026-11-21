import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkCols() {
  const { data, error } = await supabase.from('carbon_footprint_logs').select('*').limit(1);
  if (error) console.error(error);
  else console.log("Carbon Logs Cols:", data?.[0] ? Object.keys(data[0]) : "No data");
}
checkCols();
