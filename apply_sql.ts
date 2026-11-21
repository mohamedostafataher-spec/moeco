
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

let url = process.env.VITE_SUPABASE_URL;
if (url && url.includes('/rest/v1')) {
  url = url.split('/rest/v1')[0];
}
if (url && url.endsWith('/')) {
  url = url.slice(0, -1);
}
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runSql() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error("Please provide a SQL file name");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`File ${fileName} not found`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Executing ${fileName} via RPC...`);

  // We try exec_sql or execute_sql or try_sql
  const rpcNames = ['exec_sql', 'execute_sql', 'run_sql'];
  let success = false;

  for (const rpcName of rpcNames) {
    console.log(`Trying RPC: ${rpcName}`);
    try {
      const { data, error } = await supabase.rpc(rpcName, { sql_query: sql });
      if (!error) {
        console.log(`Success with ${rpcName}:`, data);
        success = true;
        break;
      } else {
        console.warn(`${rpcName} failed: ${error.message}`);
      }
    } catch (e) {
      console.warn(`${rpcName} threw error`);
    }
  }

  if (!success) {
    console.error("All RPC attempts failed. Please run the SQL manually in Supabase Dashboard.");
    console.log("SQL CONTENT:\n", sql);
  }
}

runSql();
