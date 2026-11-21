-- MONETIZATION AND MARKETPLACE SYSTEM

CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    logo_url TEXT,
    description TEXT,
    contact_email TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.partner_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount_value TEXT,
    required_points INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    expiry_date DATE,
    qr_code TEXT,
    redemption_count INTEGER DEFAULT 0,
    max_usage INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.featured_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT,
    redirect_url TEXT,
    type TEXT, -- offer, service, awareness
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Upgrade existing coupons table if it exists
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.coupons ADD COLUMN qr_code TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    BEGIN
        ALTER TABLE public.coupons ADD COLUMN redemption_count INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    BEGIN
        ALTER TABLE public.coupons ADD COLUMN max_usage INTEGER DEFAULT 1000;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for partners" ON public.partners;
CREATE POLICY "Enable all for partners" ON public.partners FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for partner_offers" ON public.partner_offers;
CREATE POLICY "Enable all for partner_offers" ON public.partner_offers FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for featured_content" ON public.featured_content;
CREATE POLICY "Enable all for featured_content" ON public.featured_content FOR ALL USING (true);

-- Mock Data
INSERT INTO public.partners (name, category, description, is_verified) 
VALUES ('EcoRide', 'Transport', 'Sustainable transport solutions', true),
       ('GreenMart', 'Food', 'Organic food supplier', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.featured_content (title, image_url, redirect_url, type, is_active)
VALUES 
('دليل الترشيد', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&q=80', '/calculator', 'awareness', true),
('عروض ستور بيئي', 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=500&q=80', '/rewards', 'offer', true)
ON CONFLICT DO NOTHING;
