-- MO ECO SUPABASE REPAIR & ENHANCEMENT
-- Run this in your Supabase SQL Editor to fix registration and data issues.

-- 1. FIX PROFILES TABLE (Add missing columns and better RLS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS governorate_id UUID REFERENCES public.governorates(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_bracket TEXT DEFAULT 'middle';

-- Ensure RLS allows insertion byauthenticated users for their own id
DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
CREATE POLICY "Users can insert own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. FIX TRIGGER (Automate profile creation with metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    avatar_url, 
    country_id, 
    governorate_id, 
    city_id, 
    social_bracket,
    country,
    governorate,
    city
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', ''), 
    new.email, 
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'country_id')::UUID,
    (new.raw_user_meta_data->>'governorate_id')::UUID,
    (new.raw_user_meta_data->>'city_id')::UUID,
    new.raw_user_meta_data->>'social_bracket',
    new.raw_user_meta_data->>'country_name', -- Fallback text
    new.raw_user_meta_data->>'governorate_name',
    new.raw_user_meta_data->>'city_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    country_id = EXCLUDED.country_id,
    governorate_id = EXCLUDED.governorate_id,
    city_id = EXCLUDED.city_id,
    social_bracket = EXCLUDED.social_bracket,
    country = EXCLUDED.country,
    governorate = EXCLUDED.governorate,
    city = EXCLUDED.city,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. POPULATE COUNTRIES (Initial Data)
INSERT INTO public.countries (name_en, name_ar, code)
VALUES 
  ('Egypt', 'مصر', 'EG'),
  ('Saudi Arabia', 'السعودية', 'SA'),
  ('United Arab Emirates', 'الإمارات', 'AE'),
  ('Jordan', 'الأردن', 'JO'),
  ('Kuwait', 'الكويت', 'KW')
ON CONFLICT (name_en) DO NOTHING;

-- 4. UPDATE RSS FEEDS (Functional Sources)
INSERT INTO public.rss_feeds (name, url, category)
VALUES 
  ('Ahram Online - Environment', 'https://english.ahram.org.eg/rss/Environment', 'news'),
  ('Egypt Independent - Science', 'https://www.egyptindependent.com/section/science-and-technology/feed/', 'news'),
  ('BBC Arabic - Tech & Science', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'news'),
  ('Al Arabiya - Economy', 'https://www.alarabiya.net/.mrss/ar/aswaq.xml', 'economy')
ON CONFLICT (url) DO UPDATE SET is_active = TRUE;

-- 5. FIX MISSING TABLES FOR BILLS AND CONSUMPTION
CREATE TABLE IF NOT EXISTS public.gov_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    bill_type TEXT NOT NULL, -- 'Electricity', 'Water', 'Gas'
    amount NUMERIC NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Paid', 'Overdue'
    consumption_value NUMERIC,
    provider_name TEXT,
    payment_date TIMESTAMPTZ,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gov_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own gov bills." ON public.gov_bills FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sector TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    record_date TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'Manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own consumption records." ON public.consumption_records FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.prayer_times_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    timings JSONB NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lat, lng, date)
);

ALTER TABLE public.prayer_times_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read prayer times cache." ON public.prayer_times_cache FOR SELECT USING (true);
CREATE POLICY "Authenticated insert prayer times cache." ON public.prayer_times_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. FIX PROFILES COLUMNS AND COINS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS green_coins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_carbon_saved NUMERIC DEFAULT 0;

-- 7. FIX COUPONS TABLE RLS (Simplified)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view coupons" ON public.coupons;
CREATE POLICY "Public view coupons" ON public.coupons FOR SELECT USING (true);
