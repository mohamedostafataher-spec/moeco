import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function tryExec() {
    const sql = "SELECT 1 as num;";
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    console.log({data, error});
}
tryExec();
