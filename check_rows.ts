import { supabase } from './services/supabaseClient';
async function run() {
  const t1 = await supabase.from('carbon_activities').select('id', { count: 'exact' });
  const t2 = await supabase.from('consumption_records').select('id', { count: 'exact' });
  const t3 = await supabase.from('carbon_footprint_logs').select('id', { count: 'exact' });
  console.log("carbon_activities:", t1.error?.message || t1.count);
  console.log("consumption_records:", t2.error?.message || t2.count);
  console.log("carbon_footprint_logs:", t3.error?.message || t3.count);
}
run();
