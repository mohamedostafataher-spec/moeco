import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const URL = process.env.VITE_SUPABASE_URL || 'https://awwbrmgzdqazhpsrznpq.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__KqCxPd9F40H2LytPW0vAQ_BqzwbpUg';
const supabase = createClient(URL, KEY);

async function run() {
  const sql = fs.readFileSync('CREATE_WALKING.sql', 'utf8');
  console.log("SQL:", sql);
}
run();
