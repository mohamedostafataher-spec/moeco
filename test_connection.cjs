const { supabase } = require('./services/supabaseClient');

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .limit(1);
    
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      console.log("Successfully fetched users:", data);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

testConnection();
