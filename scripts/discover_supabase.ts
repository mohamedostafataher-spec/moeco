
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function discover() {
  console.log("Starting Supabase Auto-Discovery...");
  
  // Try to get all tables by querying the RPC or information_schema if possible
  // Since we might not have RPCs, we'll try to guess based on the SQL files and types
  
  const tablesToTest = [
    'profiles', 'eco_actions', 'rewards', 'coupons', 'alerts', 'news', 
    'rss_sources', 'consumption_records', 'carbon_activities', 'user_scores',
    'green_jobs', 'environmental_reports', 'water_issues', 'products', 'donations',
    'governorates', 'cities', 'sectors', 'utility_meters', 'utility_readings',
    'walking_activities', 'transport_logs', 'challenges', 'badges', 'gov_services'
  ];

  const report: any = {
    connected: false,
    url: supabaseUrl,
    tables: {}
  };

  try {
    const { data: health, error: healthError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (!healthError) {
      report.connected = true;
      console.log("Connected to Supabase successfully.");
    } else {
       console.error("Connection error:", healthError);
    }

    for (const table of tablesToTest) {
      console.log(`Checking table: ${table}...`);
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
      
      if (!error) {
        report.tables[table] = {
          exists: true,
          rowCount: count,
          columns: data && data.length > 0 ? Object.keys(data[0]) : ['unknown']
        };
      } else {
        report.tables[table] = {
          exists: false,
          error: error.message
        };
      }
    }

    fs.writeFileSync('SUPABASE_AUDIT_REPORT.json', JSON.stringify(report, null, 2));
    console.log("Discovery complete! Report saved to SUPABASE_AUDIT_REPORT.json");

  } catch (err) {
    console.error("Fatal discovery error:", err);
  }
}

discover();
