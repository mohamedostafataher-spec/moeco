CREATE TABLE IF NOT EXISTS public.trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  from_location text NOT NULL,
  to_location text NOT NULL,
  time text,
  status text DEFAULT 'available',
  fee numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  type text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stations_map (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  type text,
  line_id text
);

-- Seed some mock trips inside the DB since they want available trips
INSERT INTO trips (name, from_location, to_location, time, status, fee) VALUES 
('صباحي مجمع التحرير', 'Ramses', 'Tahrir', '08:00 AM', 'available', 15),
('رحلة التجمع السريعة', 'Maadi', 'Tagamoa', '09:30 AM', 'available', 30),
('باص أكتوبر المباشر', 'Giza', 'October', '07:15 AM', 'available', 20);

-- Seed some stations
INSERT INTO stations_map (name, lat, lng, type) VALUES
('Ramses Station', 30.0636, 31.2467, 'train'),
('Tahrir Square', 30.0444, 31.2357, 'bus'),
('Giza Station', 30.0076, 31.2066, 'train');
