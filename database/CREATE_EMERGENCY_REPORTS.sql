
CREATE TABLE IF NOT EXISTS emergency_reports (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  category TEXT,
  title TEXT,
  description TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
