
-- CREATING TABLES FOR ECO TOURISM & HERITAGE
-- Ensure eco_destinations table exists and has updated schema
DROP TABLE IF EXISTS public.eco_destinations CASCADE;
CREATE TABLE public.eco_destinations (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    category TEXT, -- 'Protected Area', 'Heritage', 'Green Park', etc.
    description_en TEXT,
    description_ar TEXT,
    location_coords JSONB NOT NULL DEFAULT '{"lat": 30.0444, "lng": 31.2357}',
    image_url TEXT,
    green_points_reward INTEGER DEFAULT 30,
    rating NUMERIC DEFAULT 4.5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking user visits
DROP TABLE IF EXISTS public.user_checkins CASCADE;
CREATE TABLE public.user_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_id TEXT REFERENCES public.eco_destinations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, destination_id)
);

-- Table for heritage reviews
DROP TABLE IF EXISTS public.destination_reviews CASCADE;
CREATE TABLE public.destination_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_id TEXT REFERENCES public.eco_destinations(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.eco_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public destinations viewable" ON public.eco_destinations FOR SELECT USING (true);
CREATE POLICY "Public reviews viewable" ON public.destination_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert reviews" ON public.destination_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can check in" ON public.user_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own checkins" ON public.user_checkins FOR SELECT USING (auth.uid() = user_id);

-- Add sample data (Minimal here, as seed service will do it)
INSERT INTO public.eco_destinations (id, name_en, name_ar, category, description_en, description_ar, image_url, green_points_reward)
VALUES 
('siwa-001', 'Siwa Oasis', 'واحة سيوة', 'Protected Area', 'Natural wonder', 'عجيبة طبيعية', 'https://images.unsplash.com/photo-1544971587-b842c27f8e14', 50),
('pyramids-001', 'Giza Pyramids', 'أهرامات الجيزة', 'Heritage', 'Ancient world wonder', 'عجيبة العالم القديم', 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368', 30);
