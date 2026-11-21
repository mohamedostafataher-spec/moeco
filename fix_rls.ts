import { supabase } from './server/services/supabaseClient';

async function fixRLS() {
  const sql = `
    ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own records" ON public.consumption_records;
    DROP POLICY IF EXISTS "Users Manage Own Consumption" ON public.consumption_records;
    DROP POLICY IF EXISTS "Allow All for Records" ON public.consumption_records;
    DROP POLICY IF EXISTS "Enable all for anon" ON public.consumption_records;
    DROP POLICY IF EXISTS "User write cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User insert cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User select cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User update cr" ON public.consumption_records;
    DROP POLICY IF EXISTS "User delete cr" ON public.consumption_records;
    
    CREATE POLICY "Users can manage own records" ON public.consumption_records
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  `;
  const { error } = await supabase.rpc('execute_sql_script', { sql });
  console.log("RLS Fix:", error?.message || 'Success');
}
// Note: no execute_sql_script exists. Let me create it to bypass the problem.
