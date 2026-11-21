import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function tryCreate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title_ar TEXT,
        title_en TEXT,
        description_ar TEXT,
        description_en TEXT,
        severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        is_active BOOLEAN DEFAULT true,
        governorate TEXT,
        source TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS public.gov_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title_ar TEXT,
        title_en TEXT,
        name_ar TEXT,
        name_en TEXT,
        description_ar TEXT,
        description_en TEXT,
        category TEXT,
        icon TEXT,
        url TEXT,
        external_url TEXT,
        target_screen TEXT,
        is_active BOOLEAN DEFAULT true,
        usage_count INTEGER DEFAULT 0,
        carbon_impact_type TEXT,
        carbon_impact_kg DOUBLE PRECISION,
        payment_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  // Try common rpc names for running sql
  const rpcs = ['exec_sql', 'run_sql', 'sql'];
  for (const rpc of rpcs) {
    const { error } = await supabase.rpc(rpc, { query: sql, sql: sql });
    if (!error) {
       console.log(`Success with RPC: ${rpc}`);
       return;
    }
    console.log(`Failed with RPC ${rpc}:`, error.message);
  }
}

tryCreate();
