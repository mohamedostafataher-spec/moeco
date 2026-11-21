import { createClient } from '@supabase/supabase-js';
const URL = process.env.VITE_SUPABASE_URL || 'https://awwbrmgzdqazhpsrznpq.supabase.co';
const KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__KqCxPd9F40H2LytPW0vAQ_BqzwbpUg';
const supabase = createClient(URL, KEY);
async function check() {
  const rs = await fetch(URL + '/rest/v1/transport_logs?limit=1', {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Prefer': 'return=representation' }
  });
  console.log("Headers:", rs.headers);
  const text = await rs.text();
  console.log("Body:", text);
}
check();
