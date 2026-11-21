import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkColumnsTest() {
    console.log('Testing consumption_records.co2_impact...');
    const { data: data1, error: e1 } = await supabase
        .from('consumption_records')
        .select('co2_impact')
        .limit(1);
    
    console.log('Result for co2_impact:', e1 ? e1.message : 'Success');

    console.log('Testing carbon_activities.metadata...');
    const { data: data2, error: e2 } = await supabase
        .from('carbon_activities')
        .select('metadata')
        .limit(1);
    
    console.log('Result for metadata:', e2 ? e2.message : 'Success');
}
checkColumnsTest();
