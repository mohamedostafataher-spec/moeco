import { supabase } from './services/supabaseClient';
async function test() {
  const t = await supabase.from('transport_logs').select('id', { count: 'exact' });
  console.log("transport_logs:", t.error?.message || t.count);
}
test();
