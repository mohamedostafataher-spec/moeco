import fs from "fs";
const files = [
  "./server/services/supabaseClient.ts",
  "./insert_rss_sources.ts",
  "./.env.example",
  "./scripts/populate_rss.ts",
  "./scripts/clear_news.ts",
  "./test_rss_schema.ts",
  "./run_repair.ts",
  "./run_rss_update.ts",
  "./exec_perf_sql.ts"
];
for(const f of files) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, "utf8");
    content = content.replace(/sb_publishable_uiYJnMWVQbH9NpHeC0657A_lsouyTsz/g, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYm91dGR2YmpvaXBkcGVxcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwMjUsImV4cCI6MjA1Njc5MzAyNX0.VwXh_n3v2Q9K-F33c7r2qM_54Q63V2QoN_pGq8mB3H8");
    fs.writeFileSync(f, content);
  }
}
console.log("Done replacing keys");
