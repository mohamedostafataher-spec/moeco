CREATE TABLE IF NOT EXISTS public.prices (
  id SERIAL PRIMARY KEY,
  category TEXT,
  type TEXT,
  segment TEXT,
  min_consumption INTEGER,
  max_consumption INTEGER,
  price REAL,
  fixed_fee REAL DEFAULT 0,
  unit TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delete existing monorail prices to avoid duplicates
DELETE FROM public.prices WHERE category = 'transport' AND type = 'monorail';

-- Insert Monorail Prices (2026)
INSERT INTO public.prices (category, type, segment, min_consumption, max_consumption, price, unit, source) VALUES
('transport', 'monorail', '5_stations', 0, 5, 20.00, 'EGP', 'Ministry of Transport'),
('transport', 'monorail', '10_stations', 6, 10, 40.00, 'EGP', 'Ministry of Transport'),
('transport', 'monorail', '15_stations', 11, 15, 55.00, 'EGP', 'Ministry of Transport'),
('transport', 'monorail', 'more_than_15', 16, 999, 80.00, 'EGP', 'Ministry of Transport');
