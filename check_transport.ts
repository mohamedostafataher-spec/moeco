import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTransport() {
    const { data, error } = await supabase.from('transport_logs').select('*').limit(1);
    console.log(`transport_logs: ${error ? error.message : 'exists'}`);
}
checkTransport();
