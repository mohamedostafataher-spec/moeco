import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function check() {
  const tables = ['consumption_records', 'point_transactions', 'bills', 'carbon_activities', 'transport_logs'];
  for (const t of tables) {
    try {
        const { error } = await supabase.from(t).select('id').limit(1);
        if(error) console.log(`${t} error:`, JSON.stringify(error));
        else console.log(`${t} OK`);
    } catch (e: any) {
        console.log(`${t} JS error:`, e.message);
    }
  }
}
check();
