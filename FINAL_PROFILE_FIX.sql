
-- FINAL PROFILE & AI NEIGHBOR SCHEMA
-- Ensures profile editing and AI memory are supported

-- 1. Enable Profile Editing & New Fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. AI Neighbor Memory (Conversations)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their AI chats" ON public.ai_conversations 
    FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON public.ai_conversations TO authenticated;

-- 4. Neighborhood Help Exchange
CREATE TABLE IF NOT EXISTS public.neighborhood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Request' or 'Offer'
    reward INTEGER DEFAULT 50,
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'completed'
    distance TEXT DEFAULT '100m',
    governorate TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.neighborhood_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read neighborhood" ON public.neighborhood_requests FOR SELECT USING (true);
CREATE POLICY "Users can create neighborhood posts" ON public.neighborhood_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.neighborhood_requests TO authenticated;

-- 5. Emergency Alerts (Neighbor Watch)
CREATE TABLE IF NOT EXISTS public.neighborhood_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    governorate TEXT,
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.neighborhood_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read alerts" ON public.neighborhood_alerts FOR SELECT USING (true);
CREATE POLICY "Users can create alerts" ON public.neighborhood_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.neighborhood_alerts TO authenticated;
