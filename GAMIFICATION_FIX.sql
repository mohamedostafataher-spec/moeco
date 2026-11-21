-- GAMIFICATION & RETENTION SYSTEM SCHEMA
-- This script adds the necessary tables and columns for the Habit Loop, Leveling, and Insights.

-- 1. Levels and Streaks in Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_checkin_date DATE;

-- 2. Daily Check-ins Table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date DATE DEFAULT CURRENT_DATE,
    points_awarded INTEGER DEFAULT 10,
    streak_day INTEGER DEFAULT 1,
    UNIQUE(user_id, checkin_date)
);

-- 3. Experience Points Transaction Log
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Dynamic Badges Table (if not exists)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon_url TEXT,
    requirement_type TEXT, -- 'carbon_saved', 'streak', 'levels'
    requirement_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. User Badges Junction
CREATE TABLE IF NOT EXISTS public.user_badges_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- 6. RLS and Permissions
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can check themselves in" ON public.daily_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own XP logs" ON public.xp_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Badges are public" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users can view their own badges" ON public.user_badges_v2 FOR SELECT USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON public.daily_checkins TO authenticated;
GRANT ALL ON public.xp_logs TO authenticated;
GRANT SELECT ON public.badges TO authenticated;
GRANT ALL ON public.user_badges_v2 TO authenticated;

-- Seed initial badges
INSERT INTO public.badges (code, title_ar, title_en, description_ar, description_en, requirement_type, requirement_value)
VALUES 
('green_starter', 'مبتدأ أخضر', 'Green Starter', 'أول خطوة في رحلة التوفير', 'First step in the saving journey', 'logs_count', 1),
('energy_saver', 'موفر الطاقة', 'Energy Saver', 'تقليل استهلاك الكهرباء بنسبة 10%', 'Reduced electricity by 10%', 'carbon_saved', 50),
('walker_pro', 'محترف المشي', 'Walker Pro', 'المشي لمسافة 10 كم بدلاً من السيارة', 'Walking 10km instead of car', 'distance', 10),
('eco_hero', 'بطل البيئة', 'Eco Hero', 'الوصول للمستوى 10', 'Reached Level 10', 'level', 10)
ON CONFLICT (code) DO NOTHING;
