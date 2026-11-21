import { supabase } from './server/services/supabaseClient';

async function listConstraints() {
    const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'rss_sources'::regclass;" 
    });
    
    if (error) {
        console.error('Error:', error);
        // Try fallback query
        const { data: cols } = await supabase.from('rss_sources').select('*').limit(1);
        console.log('Sample data keys:', Object.keys(cols?.[0] || {}));
    } else {
        console.log('Constraints:', data);
    }
}

listConstraints();
