import { supabase } from './services/supabaseClient';

async function checkProcedures() {
  const { data, error } = await supabase.from('government_services').select('*').limit(1);
  if (error) {
    console.error('Error fetching services:', error);
  } else {
    console.log('Columns in government_services:', Object.keys(data[0] || {}));
  }

  const { data: procs, error: err2 } = await supabase.from('government_procedures').select('*').limit(1);
   if (err2) {
    console.log('government_procedures table likely does not exist.');
  } else {
    console.log('Columns in government_procedures:', Object.keys(procs[0] || {}));
  }
}

checkProcedures();
