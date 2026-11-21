import { supabase } from './server/services/supabaseClient';

async function test() {
  const attempts = ['carbon_impact', 'co2_impact', 'co2', 'impact'];
  for(const col of attempts) {
    const { error } = await supabase.from('consumption_records').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // dummy
      sector: 'electricity',
      value: 100,
      [col]: 10
    });
    console.log(`Column ${col}: ${error?.message || 'Success'}`);
  }
}
test();
