import { supabase } from './services/supabaseClient';
import * as dotenv from 'dotenv';
dotenv.config();
async function run() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log("Users:", error ? error.message : "Exists");
  // Let's use information_schema over rest
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`);
  const json = await res.json();
  console.log("REST Schema Entities:", Object.keys(json.definitions || {}).join(", "));
}
run();
