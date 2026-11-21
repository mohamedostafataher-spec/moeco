import { createClient } from '@supabase/supabase-js';
const URL = process.env.VITE_SUPABASE_URL || 'https://awwbrmgzdqazhpsrznpq.supabase.co';
const KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__KqCxPd9F40H2LytPW0vAQ_BqzwbpUg';
const supabase = createClient(URL, KEY);
async function checkTable(table: string) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    console.log(`Table ${table} error:`, error.message);
  } else {
    console.log(`Table ${table} columns:`, data.length > 0 ? Object.keys(data[0]) : 'Empty table');
  }
}
async function run() {
  await checkTable('consumption_records');
  await checkTable('coupons');
  await checkTable('notifications');
  await checkTable('commodity_prices');
  await checkTable('carbon_activities');
}
run();
