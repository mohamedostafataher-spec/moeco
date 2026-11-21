import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('scientific_data').upsert({
    key: 'sustainability_goals',
    value: [
      { label: 'الطاقة المتجددة', labelEn: 'Renewable Energy', progress: 28.5, target: 42, color: 'bg-emerald-500' },
      { label: 'خفض انبعاثات الكربون', labelEn: 'Carbon Reduction', progress: 15.2, target: 30, color: 'bg-blue-500' },
      { label: 'إعادة تدوير المخلفات', labelEn: 'Waste Recycling', progress: 14.0, target: 25, color: 'bg-amber-500' }
    ]
  }, { onConflict: 'key' }).select();

  if (error) console.log("Error upserting:", error.message);
  else console.log("Success:", data);
}
run();
