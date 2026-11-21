import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkRpc() {
  const { data, error } = await supabase.rpc('get_functions'); // Some custom RPCs might exist
  if (error) console.log("RPC check error:", error.message);
  else console.log("Available RPCs:", data);
}
checkRpc();
