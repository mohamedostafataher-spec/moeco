import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    const sqlContent = fs.readFileSync(path.join(process.cwd(), 'database', 'UPDATE_MONORAIL_PRICING.sql'), 'utf-8');
    
    // Use an RPC or fallback to direct inserts since RPC to execute raw SQL is often restricted.
console.log("Supabase URL: ", supabaseUrl);
    console.log("Emptying old monorail prices from utility_tiers...");
    await supabase.from('utility_tiers').delete().match({ sector: 'monorail' });
    
    console.log("Inserting new monorail prices...");
    const { error } = await supabase.from('utility_tiers').insert([
        { sector: 'monorail', min: 0, max: 5, price: 20 },
        { sector: 'monorail', min: 6, max: 10, price: 40 },
        { sector: 'monorail', min: 11, max: 15, price: 55 },
        { sector: 'monorail', min: 16, max: 999, price: 80 }
    ]);

    if (error) {
        console.error("Error inserting prices:", error);
    } else {
        console.log("Successfully updated monorail prices!");
        
        // Also update scientific_data as fallback
        const { data: scientificData, error: sErr } = await supabase
            .from('scientific_data')
            .select('value')
            .eq('key', 'transport_config_2026')
            .single();
            
        if (scientificData && !sErr) {
            let config = typeof scientificData.value === 'string' ? JSON.parse(scientificData.value) : scientificData.value;
            config.monorail = {
                "fares": [
                    { stops: 5, price: 20 },
                    { stops: 10, price: 40 },
                    { stops: 15, price: 55 },
                    { stops: 999, price: 80 }
                ]
            };
            await supabase.from('scientific_data').update({ value: config }).eq('key', 'transport_config_2026');
            console.log("Updated scientific_data transport_config_2026");
        }
    }
  } catch (err) {
    console.error("Failed to execute:", err);
  }
}

main();
