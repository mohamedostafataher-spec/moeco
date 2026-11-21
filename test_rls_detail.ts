import { supabase } from './server/services/supabaseClient';

async function test() {
  const { data: users, error: selectErr } = await supabase.from('auth.users').select('*').limit(1); // not allowed from client
  const { data: usersRPC } = await supabase.rpc('get_users');
}
test();
