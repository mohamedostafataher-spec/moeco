import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let url = process.env.VITE_SUPABASE_URL!;
if (url.endsWith('/')) url = url.slice(0, -1);
if (url.includes('/rest/v1')) url = url.split('/rest/v1')[0];

const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!);

async function setupGov() {
  const services = [
    {
      name_ar: 'فاتورة الكهرباء',
      name_en: 'Electricity Bill Payment',
      category: 'electricity',
      url: 'https://www.eehc.gov.eg/eehcportal/faces/oracle/webcenter/portalapp/pages/billing.jspx'
    },
    {
      name_ar: 'فاتورة الغاز',
      name_en: 'Gas Bill Payment',
      category: 'gas',
      url: 'https://www.petrotrade.com.eg/billing/billq.aspx'
    },
    {
      name_ar: 'فاتورة المياه',
      name_en: 'Water Bill Payment',
      category: 'water',
      url: 'https://www.hcww.com.eg/'
    }
  ];

  for (const service of services) {
    const { data, error } = await supabase.from('government_services').insert(service);
    if (error) console.error("Error inserting service:", service.name_en, error.message);
    else console.log("Success:", service.name_en);
  }
}
setupGov();
