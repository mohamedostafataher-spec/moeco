import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.storage.getBucket('reports');
  if (error) {
     console.log("no bucket, trying to create");
     const { data: d2, error: e2 } = await supabase.storage.createBucket('reports', { public: true });
     if (e2) console.error("create error:", e2.message);
     else console.log("Created Bucket");
  } else {
     console.log("Bucket exists");
  }
}
run();
