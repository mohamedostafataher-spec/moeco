
import { supabase } from './services/supabaseClient';

async function seedReports() {
  console.log("Seeding reports...");
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users?.[0]?.id;

  if (!userId) {
    console.log("No users found to link reports.");
    return;
  }

  const sampleReports = [
    {
      type: 'user',
      month: 4,
      year: 2026,
      reference_id: userId,
      file_url_pdf: '#',
      file_url_excel: '#',
      created_at: new Date().toISOString()
    },
    {
      type: 'governorate',
      month: 3,
      year: 2026,
      reference_id: 'Cairo',
      file_url_pdf: '#',
      file_url_excel: '#',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString()
    },
    {
      type: 'country',
      month: 12,
      year: 2025,
      reference_id: 'Egypt',
      file_url_pdf: '#',
      file_url_excel: '#',
      created_at: new Date(Date.now() - 86400000 * 120).toISOString()
    }
  ];

  const { error } = await supabase.from('reports').insert(sampleReports);
  if (error) console.error("Error seeding reports:", error.message);
  else console.log("Reports seeded successfully!");
}

seedReports();
