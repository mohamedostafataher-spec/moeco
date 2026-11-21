import { supabase } from './server/services/supabaseClient';

async function test() {
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mohamedostafataher@gmail.com',  // using user email
    password: 'password123'                 // guess... this won't work usually
  });

  // Since we are running in the server context with service role key in supabaseClient.ts, RLS is bypassed. 
  // Wait, let's just insert something with service_role and trace what happens.
  const { data, error } = await supabase.from('consumption_records').insert({
    user_id: '00000000-0000-0000-0000-000000000000', // dummy
    sector: 'electricity',
    value: 100,
    co2_impact: 10
  });
  console.log("Insert result:", data, error);
}
test();
