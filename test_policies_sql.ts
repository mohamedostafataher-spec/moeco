import { supabase } from './server/services/supabaseClient';

async function test() {
  const { data, error } = await supabase.rpc('execute_sql', { query: `
    SELECT * FROM pg_policies WHERE tablename = 'consumption_records';
  `});
  console.log("Policies:", data, error);
}
test();
