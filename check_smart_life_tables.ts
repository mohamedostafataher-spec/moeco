import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

const tables = ['products_prices', 'places', 'gov_services', 'environmental_data'];

async function checkTablesLive() {
    for (const d of tables) {
        const { data, error } = await supabase.from(d).select('*').limit(1);
        if (error) {
            console.log(`Table ${d} error: ${error.message}`);
        } else {
            console.log(`Table ${d} exists. Columns: ${data[0] ? Object.keys(data[0]) : "empty, exists"}`);
        }
    }
}
checkTablesLive();
