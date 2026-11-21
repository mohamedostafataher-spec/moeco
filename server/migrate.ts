import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Starting migration...');
  
  // Fix coupons table
  const { error: couponError } = await supabase.rpc('execute_sql', {
    sql: `
      ALTER TABLE IF EXISTS coupons ADD COLUMN IF NOT EXISTS discount TEXT;
      ALTER TABLE IF EXISTS gov_services ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE;
    `
  });
  
  if (couponError) {
    console.error('Migration failed:', couponError.message);
  } else {
    console.log('Migration applied successfully.');
  }
}

migrate();
