import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data: rates, error: e2 } = await supabase.from('scientific_data').select('value').eq('key', 'utility_rates_egypt_2026').single();
    console.log(JSON.stringify(rates?.value, null, 2));
}

test();
