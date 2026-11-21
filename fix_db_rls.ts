import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  const sql = `
    DROP POLICY IF EXISTS "Users can manage own records" ON public.consumption_records;
    DROP POLICY IF EXISTS "Users Manage Own Consumption" ON public.consumption_records;
    DROP POLICY IF EXISTS "Allow All for Records" ON public.consumption_records;
    DROP POLICY IF EXISTS "Enable all for anon" ON public.consumption_records;
    DROP POLICY IF EXISTS "User write cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User insert cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User select cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User update cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User delete cr" ON public.consumption_records;
    
    ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage own consumption_records" ON public.consumption_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  `;
  try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('SQL Execution failed:', error);
      } else {
        console.log('Success!', data);
      }
  } catch (e) {
      console.error('Runtime error:', e);
  }
}
run();
