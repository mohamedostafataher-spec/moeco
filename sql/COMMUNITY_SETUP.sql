-- MoEco: Community & Digital Neighbor Setup (2026)
-- This script initializes tables for Help Exchange, Neighbor Watch, Green Street, and Gam'eya.
-- REWROTE TO DROP TABLES FIRST FOR FRESH START (User Request)

-- DROP EXISTING TABLES
DROP TABLE IF EXISTS public.local_businesses CASCADE;
DROP TABLE IF EXISTS public.gameya_members CASCADE;
DROP TABLE IF EXISTS public.gameyas CASCADE;
DROP TABLE IF EXISTS public.street_project_members CASCADE;
DROP TABLE IF EXISTS public.street_projects CASCADE;
DROP TABLE IF EXISTS public.emergency_alerts CASCADE;
DROP TABLE IF EXISTS public.neighborhood_requests CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;

-- 1. HELP EXCHANGE (neighborhood_requests)
CREATE TABLE public.neighborhood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('Request', 'Offer')) NOT NULL,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    reward INTEGER DEFAULT 50,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    helper_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    distance TEXT,
    governorate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NEIGHBOR WATCH (emergency_alerts)
CREATE TABLE public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., Fire, Theft, Medical, Other
    location JSONB, -- {lat, lng}
    governorate TEXT,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 3. GREEN STREET (street_projects)
CREATE TABLE public.street_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    goal TEXT,
    progress INTEGER DEFAULT 0,
    governorate TEXT,
    street_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.street_project_members (
    project_id UUID REFERENCES public.street_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 4. GAM'EYA (gameyas)
CREATE TABLE public.gameyas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    monthly_amount DECIMAL NOT NULL,
    duration_months INTEGER NOT NULL,
    max_members INTEGER DEFAULT 10,
    current_members INTEGER DEFAULT 1,
    status TEXT DEFAULT 'collecting', -- collecting, active, completed
    type TEXT DEFAULT 'saving', -- saving, environmental_project
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.gameya_members (
    gameya_id UUID REFERENCES public.gameyas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    position INTEGER, -- turn in receiving the money
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (gameya_id, user_id)
);

-- 5. AI CHAT HISTORY
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LOCAL BUSINESSES
CREATE TABLE public.local_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT,
    description_ar TEXT,
    description_en TEXT,
    location JSONB,
    governorate TEXT,
    logo_url TEXT,
    rating DECIMAL DEFAULT 0,
    phone TEXT,
    is_eco_friendly BOOLEAN DEFAULT false,
    offers_discounts BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REWARDS LOGS (For Stats)
CREATE TABLE public.rewards_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT,
    source TEXT DEFAULT 'neighborhood',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RLS POLICIES
ALTER TABLE public.neighborhood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.street_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.street_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameyas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameya_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_logs ENABLE ROW LEVEL SECURITY;

-- Simple public read policies
CREATE POLICY "Public Read Requests" ON public.neighborhood_requests FOR SELECT USING (true);
CREATE POLICY "Public Read Alerts" ON public.emergency_alerts FOR SELECT USING (true);
CREATE POLICY "Public Read Projects" ON public.street_projects FOR SELECT USING (true);
CREATE POLICY "Public Read Members" ON public.street_project_members FOR SELECT USING (true);
CREATE POLICY "Public Read Gameyas" ON public.gameyas FOR SELECT USING (true);
CREATE POLICY "Public Read Gameya Members" ON public.gameya_members FOR SELECT USING (true);
CREATE POLICY "Public Read Businesses" ON public.local_businesses FOR SELECT USING (true);
CREATE POLICY "Public Read Rewards" ON public.rewards_logs FOR SELECT USING (true);

-- User-specific write policies
CREATE POLICY "Users can manage own requests" ON public.neighborhood_requests 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create alerts" ON public.emergency_alerts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat" ON public.ai_conversations 
FOR ALL USING (auth.uid() = user_id);

-- 9. SEED DATA
INSERT INTO public.street_projects (title_en, title_ar, goal, progress, governorate) VALUES
('Solar Street Lights', 'إضاءة الشارع بالطاقة الشمسية', '10/10 Lights', 65, 'Cairo'),
('Neighborhood Recycling', 'إعادة تدوير مخلفات الحي', '5 Bins', 30, 'Giza');

INSERT INTO public.gameyas (name, monthly_amount, duration_months, max_members, status) VALUES
('Eco-Solar Fund', 2000, 10, 10, 'collecting'),
('Green Roof Initiative', 1000, 12, 12, 'collecting');

INSERT INTO public.local_businesses (name_ar, name_en, category, governorate, is_eco_friendly, offers_discounts, rating, phone) VALUES
('سوبر ماركت الهدى - خالي من البلاستيك', 'Al-Huda Supermarket - Plastic Free', 'Groceries', 'Cairo', true, true, 4.8, '01234567890'),
('ورشة تصليح الأجهزة الإلكترونية', 'Electronic Repair Hub', 'Repair', 'Giza', true, false, 4.5, '01111222333');
