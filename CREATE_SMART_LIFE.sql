-- SMART LIFE PLATFORM: PAYMENTS, MAPS, AI MODELS

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT, -- coupon, service, upgrade
    method TEXT, -- vodafone_cash, instapay, manual
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    reference_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT, -- service, place, partner
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT, -- rules, templates
    rules JSONB,
    response_templates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for user transactions" ON public.transactions;
CREATE POLICY "Enable all access for user transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable read access for locations" ON public.locations;
CREATE POLICY "Enable read access for locations" ON public.locations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for ai_models" ON public.ai_models;
CREATE POLICY "Enable read access for ai_models" ON public.ai_models FOR SELECT USING (true);

-- Mock Data for locations
INSERT INTO public.locations (name, type, latitude, longitude, description) VALUES
('مكتب البريد المركزي', 'service', 30.0444, 31.2357, 'خدمات حكومية وبريدية'),
('محطة شحن GreenCharge', 'partner', 30.0600, 31.2500, 'محطة شحن للسيارات الكهربائية'),
('متجر المنتجات العضوية', 'partner', 30.0381, 31.2112, 'منتجات صحية وبيئية')
ON CONFLICT DO NOTHING;
