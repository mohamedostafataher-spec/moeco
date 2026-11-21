import { supabase } from './services/supabaseClient.ts';

async function list() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log('users schema keys:', data && data[0] ? Object.keys(data[0]) : 'no data');
  const { data: d2 } = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles schema keys:', d2 && d2[0] ? Object.keys(d2[0]) : 'no data');
}
list();
