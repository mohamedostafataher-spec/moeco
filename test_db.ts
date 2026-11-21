import { supabase } from './services/supabaseClient';
async function test() {
  const { data, error } = await supabase.from('consumption_records').select('*').limit(1);
  console.log("Records:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
test();
