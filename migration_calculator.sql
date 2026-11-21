
-- 1. Create missing tables
CREATE TABLE IF NOT EXISTS public.scientific_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fix app_config
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_config' AND column_name='description') THEN
        ALTER TABLE public.app_config ADD COLUMN description TEXT;
    END IF;
END $$;                

-- Fix Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  source TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='category') THEN
        ALTER TABLE public.coupons ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='source') THEN
        ALTER TABLE public.coupons ADD COLUMN source TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.carbon_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    amount FLOAT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_1_id UUID REFERENCES auth.users(id),
    user_2_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Fix Coupons table if needed (adding category column)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='category') THEN
        ALTER TABLE public.coupons ADD COLUMN category TEXT;
    END IF;
END $$;

-- 2. Seed Scientific Data (Calculator factors & Tiers)
INSERT INTO public.scientific_data (key, value, description)
VALUES 
('utility_rates_egypt_2026', '{
  "electricity": {
    "tiers": [
      {"id": "1", "min": 0, "max": 50, "rate": 0.68},
      {"id": "2", "min": 51, "max": 100, "rate": 0.78},
      {"id": "3", "min": 101, "max": 200, "rate": 0.95},
      {"id": "4", "min": 201, "max": 350, "rate": 1.55},
      {"id": "5", "min": 351, "max": 650, "rate": 1.95},
      {"id": "6", "min": 651, "max": 1000, "rate": 2.10},
      {"id": "7", "min": 1001, "max": 999999, "rate": 2.58}
    ],
    "fixedFees": {"1": 1, "2": 2, "3": 6, "4": 11, "5": 15, "6": 25, "7": 40},
    "serviceFee": 10
  },
  "water": {
    "tiers": [
      {"id": "1", "min": 0, "max": 10, "rate": 2.00, "name": "0-10 m³"},
      {"id": "2", "min": 11, "max": 20, "rate": 3.00, "name": "11-20 m³"},
      {"id": "3", "min": 21, "max": 30, "rate": 5.00, "name": "21-30 m³"},
      {"id": "4", "min": 31, "max": 40, "rate": 7.00, "name": "31-40 m³"},
      {"id": "5", "min": 41, "max": 999999, "rate": 10.00, "name": ">40 m³"}
    ],
    "sewageRate": 0.75
  },
  "gas": {
    "tiers": [
      {"id": "1", "min": 0, "max": 30, "rate": 6.00, "name": "0-30 m³"},
      {"id": "2", "min": 31, "max": 60, "rate": 8.00, "name": "31-60 m³"},
      {"id": "3", "min": 61, "max": 999999, "rate": 12.00, "name": ">60 m³"}
    ],
    "cylinder_home": 275,
    "cylinder_comm": 550,
    "vehicle": 13
  }
}', 'Official Egyptian utility rates for 2026/2027')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.scientific_data (key, value, description)
VALUES 
('emission_factors', '{
  "electricity": 0.5,
  "water": 0.34,
  "gas": 2.1,
  "gas_piped": 2.1,
  "gas_vehicle": 1.9,
  "gas_cylinder_home": 36,
  "gas_cylinder_comm": 72,
  "car_petrol": 0.2,
  "car_diesel": 0.25,
  "car_hybrid": 0.12,
  "car_electric": 0.05,
  "metro": 0.05,
  "river_bus": 0.03,
  "bus": 0.08,
  "food_meat": 7.0,
  "food_veg": 0.5,
  "waste": 1.2
}', 'Standard carbon emission factors (kg CO2 per unit)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. RLS Permissive Policies (to resolve 42501 errors for now in dev)
ALTER TABLE public.consumption_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;

-- Note: In production, we would enable RLS and add policies:
-- ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage own records" ON public.consumption_records FOR ALL USING (auth.uid() = user_id);
-- ... and so on.
