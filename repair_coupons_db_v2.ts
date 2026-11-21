
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://awwbrmgzdqazhpsrznpq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__KqCxPd9F40H2LytPW0vAQ_BqzwbpUg';

if (!supabaseKey) {
  console.warn("Using fallback key. Admin operations might fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
DO $$
BEGIN
    -- Ensure coupons table exists
    CREATE TABLE IF NOT EXISTS public.coupons (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Ensure source column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='source') THEN
        ALTER TABLE public.coupons ADD COLUMN source TEXT;
    END IF;

    -- Ensure link column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='link') THEN
        ALTER TABLE public.coupons ADD COLUMN link TEXT;
    END IF;

    -- Ensure description column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='description') THEN
        ALTER TABLE public.coupons ADD COLUMN description TEXT;
    END IF;

    -- Ensure category column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='category') THEN
        ALTER TABLE public.coupons ADD COLUMN category TEXT;
    END IF;

    -- Ensure discount column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='discount') THEN
        ALTER TABLE public.coupons ADD COLUMN discount TEXT;
    END IF;

    -- Ensure expiry_date column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='expiry_date') THEN
        ALTER TABLE public.coupons ADD COLUMN expiry_date TIMESTAMPTZ;
    END IF;

    -- Ensure is_active column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='is_active') THEN
        ALTER TABLE public.coupons ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Ensure updated_at column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='updated_at') THEN
        ALTER TABLE public.coupons ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure user_emissions table exists
    CREATE TABLE IF NOT EXISTS public.user_emissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      source TEXT NOT NULL,
      source_id TEXT,
      amount FLOAT NOT NULL,
      date TIMESTAMPTZ DEFAULT NOW()
    );

    -- Ensure unique constraint exists for upsert
    -- Drop old constraint if exists with different name or just try to add
    BEGIN
        ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_source_key UNIQUE (code, source);
    EXCEPTION
        WHEN duplicate_table THEN
            NULL;
        WHEN others THEN
            NULL;
    END;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
`;

async function repair() {
  console.log("Repairing coupons table...");
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    const { error: error2 } = await supabase.rpc('exec', { sql_string: sql });
    if (error2) {
      console.error("Repair failed:", error.message, error2.message);
      console.log("If RPCs don't exist, run this SQL in Supabase Dashboard:");
      console.log(sql);
    } else {
      console.log("Coupons table repaired successfully via 'exec'.");
    }
  } else {
    console.log("Coupons table repaired successfully via 'exec_sql'.");
  }
}

repair();
