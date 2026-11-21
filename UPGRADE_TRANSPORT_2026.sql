
-- Upgrade MoEco Transport System 2026
-- 1. Create Usage Table for live tracking
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'location', 'trip', 'carbon'
    lat FLOAT,
    lng FLOAT,
    value FLOAT, -- distance or carbon value
    carbon FLOAT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Monorail Pricing Table
CREATE TABLE IF NOT EXISTS public.monorail_pricing (
    id SERIAL PRIMARY KEY,
    stations_count INTEGER UNIQUE,
    price FLOAT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert Initial Monorail Pricing data
INSERT INTO public.monorail_pricing (stations_count, price) VALUES
(5, 20),
(10, 40),
(15, 55),
(20, 80)
ON CONFLICT (stations_count) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- 4. Enable RLS
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monorail_pricing ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage;
CREATE POLICY "Users can insert own usage" ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own usage" ON public.usage;
CREATE POLICY "Users can view own usage" ON public.usage FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view monorail pricing" ON public.monorail_pricing;
CREATE POLICY "Anyone can view monorail pricing" ON public.monorail_pricing FOR SELECT USING (true);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_user ON public.usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_type ON public.usage(type);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON public.usage(created_at);

NOTIFY pgrst, 'reload schema';
