-- 🎁 Rewards & Coupons
CREATE TABLE IF NOT EXISTS eco_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  points_required INT,
  reward_type TEXT,
  image_url TEXT,
  sponsor_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eco_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES eco_rewards(id) ON DELETE CASCADE,
  coupon_code TEXT,
  discount_percentage INT,
  expires_at TIMESTAMP,
  usage_limit INT DEFAULT 1,
  current_usage INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  reward_id UUID REFERENCES eco_rewards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP DEFAULT NOW()
);

-- 💼 Green Jobs
CREATE TABLE IF NOT EXISTS green_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  company TEXT,
  location TEXT,
  salary_range TEXT,
  job_type TEXT,
  apply_url TEXT,
  eco_category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  job_id UUID REFERENCES green_jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT NOW()
);

-- 🧠 Expert Reports
CREATE TABLE IF NOT EXISTS expert_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  report_type TEXT,
  title TEXT,
  description TEXT,
  image_url TEXT,
  severity_level TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expert_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES expert_reports(id) ON DELETE CASCADE,
  expert_name TEXT,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 🚨 Emergency Alerts
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  alert_type TEXT,
  severity TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_alert_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  alert_id UUID REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW()
);

-- Enables realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE eco_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE eco_coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE green_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE expert_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;
