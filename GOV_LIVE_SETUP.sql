-- ============================================  
-- LIVE INTELLIGENCE LAYER TABLES
-- ============================================  

-- Table for community-sourced updates
CREATE TABLE IF NOT EXISTS service_live_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
  field TEXT NOT NULL, -- 'documents', 'steps', 'location', 'fees', 'working_hours'
  new_value JSONB NOT NULL,
  source TEXT DEFAULT 'user', -- 'user', 'admin', 'system'
  confidence_score DECIMAL DEFAULT 0.5,
  verified_by_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for tracking real usage and wait times
CREATE TABLE IF NOT EXISTS service_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES government_services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'started', -- 'started', 'completed', 'cancelled'
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ENABLE REALTIME
ALTER TABLE service_live_updates REPLICA IDENTITY FULL;
ALTER TABLE service_usage_logs REPLICA IDENTITY FULL;

-- Ensure office_location in government_services can handle arrays
-- (JSONB already supports this, so no structural change needed, just data migration)
