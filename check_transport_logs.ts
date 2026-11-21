import { createClient } from '@supabase/supabase-js';
const URL = process.env.VITE_SUPABASE_URL || 'https://awwbrmgzdqazhpsrznpq.supabase.co';
const KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__KqCxPd9F40H2LytPW0vAQ_BqzwbpUg';
const supabase = createClient(URL, KEY);
async function check() {
  const { data, error } = await supabase.from('transport_logs').select('*').limit(1);
  console.log("transport_logs Data:", data);
  console.log("transport_logs Error:", error?.message);
}
check();
