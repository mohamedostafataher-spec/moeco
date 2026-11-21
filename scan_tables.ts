import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, ''), 
  process.env.VITE_SUPABASE_ANON_KEY!
);

const expectedTables = [
    'users',
    'profiles',
    'news',
    'transport_logs',
    'transport_lines',
    'transport_services',
    'utility_tiers',
    'scientific_data',
    'prices',
    'tickets',
    'monorail',
    'pricing',
];

async function scan() {
    for(const table of expectedTables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if(error) {
            console.log(`${table}: MISSING - ${error.message}`);
        } else {
            console.log(`${table}: EXISTS!`);
        }
    }
}

scan();
