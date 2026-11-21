import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, ''), 
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function findTables() {
  const { data, error } = await supabase.rpc('get_tables'); 
  // Probably won't work, postgrest doesn't allow information_schema reads.
  // Instead, let's read the swagger OpenAPI spec:
  try {
     const res = await fetch(`${process.env.VITE_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, '')}/rest/v1/`, {
         headers: {
             apikey: process.env.VITE_SUPABASE_ANON_KEY!
         }
     });
     const openapi = await res.json();
     console.log('Tables:', Object.keys(openapi.components?.schemas || openapi.definitions || {}));
  } catch(e) {
      console.log(e);
  }
}
findTables();
