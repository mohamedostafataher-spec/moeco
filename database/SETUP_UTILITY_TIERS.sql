CREATE TABLE IF NOT EXISTS public.utility_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  min numeric NOT NULL DEFAULT 0,
  max numeric, 
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Electricity
INSERT INTO public.utility_tiers (type, min, max, price) VALUES
('electricity', 0, 50, 0.68),
('electricity', 50, 100, 0.78),
('electricity', 100, 200, 0.95),
('electricity', 200, 350, 1.55),
('electricity', 350, 650, 1.95),
('electricity', 650, 1000, 2.10),
('electricity', 1000, 2000, 2.23),
('electricity', 2000, 999999, 2.58);

-- Gas
INSERT INTO public.utility_tiers (type, min, max, price) VALUES
('gas', 0, 30, 6),
('gas', 30, 60, 8),
('gas', 60, 999999, 12);

-- Water
INSERT INTO public.utility_tiers (type, min, max, price) VALUES
('water', 0, 10, 0.66),
('water', 10, 20, 1.65),
('water', 20, 30, 2.27),
('water', 30, 40, 2.76),
('water', 40, 999999, 3.00);
