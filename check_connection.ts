import { supabase } from "./services/supabaseClient";

async function check() {
  console.log("Checking DB Connection...");
  const { data, error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("DB Connection SUCCESS! Count:", data?.length);
  }
}
check();
