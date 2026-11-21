import { supabase } from './services/supabaseClient';

async function list() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log("Buckets:", data?.map(b => b.name), error);
}
list();
