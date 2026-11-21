-- OFFICIAL 2026 EGYPT UTILITY PRICES UPDATE
-- To execute this, please run it in your Supabase SQL Editor.

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

-- Note: We do not drop the table, we just clear the old prices to repopulate.
TRUNCATE TABLE public.prices;

-- Insert Water Prices (2026)
INSERT INTO public.prices (category, type, segment, min_consumption, max_consumption, price, fixed_fee, unit, source) VALUES
('water', 'water_residential', 'tier_1', 0, 10, 2.00, 0, 'EGP/m3', 'Ministry of Housing'),
('water', 'water_residential', 'tier_2', 11, 20, 3.00, 0, 'EGP/m3', 'Ministry of Housing'),
('water', 'water_residential', 'tier_3', 21, 30, 5.00, 0, 'EGP/m3', 'Ministry of Housing'),
('water', 'water_residential', 'tier_4', 31, 40, 7.00, 0, 'EGP/m3', 'Ministry of Housing'),
('water', 'water_residential', 'tier_5', 41, 99999, 10.00, 0, 'EGP/m3', 'Ministry of Housing');

-- Insert Electricity Prices (2026)
-- Based on the user feedback (112 kWh -> 112 EGP + 10 EGP cleaning)
-- Calculation: (112 * 0.95) + 6 service fee = 112.4 EGP
INSERT INTO public.prices (category, type, segment, min_consumption, max_consumption, price, fixed_fee, unit, source) VALUES
('electricity', 'electricity_residential', 'tier_1', 0, 50, 0.68, 1, 'EGP/kWh', 'Ministry of Electricity'),
('electricity', 'electricity_residential', 'tier_2', 51, 100, 0.78, 2, 'EGP/kWh', 'Ministry of Electricity'),
('electricity', 'electricity_residential', 'tier_3', 0, 200, 0.95, 6, 'EGP/kWh', 'Ministry of Electricity'),
('electricity', 'electricity_residential', 'tier_4', 201, 350, 1.55, 11, 'EGP/kWh', 'Ministry of Electricity'),
('electricity', 'electricity_residential', 'tier_5', 351, 650, 1.95, 15, 'EGP/kWh', 'Ministry of Electricity'),
('electricity', 'electricity_residential', 'tier_6', 0, 1000, 2.10, 25, 'EGP/kWh', 'Ministry of Electricity'),
('electricity', 'electricity_residential', 'tier_7', 1001, 99999, 2.58, 40, 'EGP/kWh', 'Ministry of Electricity'),
('electricity', 'electricity_commercial', 'all_tiers_avg', 0, 99999, 2.50, 0, 'EGP/kWh', 'Ministry of Electricity');

-- Insert Gas Prices (2026)
INSERT INTO public.prices (category, type, segment, min_consumption, max_consumption, price, unit, source) VALUES
('gas', 'gas_residential', 'tier_1', 0, 30, 6.00, 'EGP/m3', 'Ministry of Petroleum'),
('gas', 'gas_residential', 'tier_2', 31, 60, 8.00, 'EGP/m3', 'Ministry of Petroleum'),
('gas', 'gas_residential', 'tier_3', 61, 99999, 12.00, 'EGP/m3', 'Ministry of Petroleum'),
('gas', 'gas_bottled', 'cylinder_12kg', 0, 0, 275.00, 'EGP/Cylinder', 'Ministry of Petroleum'),
('gas', 'gas_bottled', 'cylinder_25kg', 0, 0, 550.00, 'EGP/Cylinder', 'Ministry of Petroleum'),
('gas', 'car_fuel', 'car_gas', 0, 0, 13.00, 'EGP/m3', 'Ministry of Petroleum');

-- Optional: Enable Realtime if replication is enabled
ALTER TABLE public.prices REPLICA IDENTITY FULL;
