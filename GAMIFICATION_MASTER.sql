-- MASTER GAMIFICATION & GROWTH SYSTEM
-- Consolidates all tables for Levels, Streaks, Badges, and Challenges

-- 1. Challenges Definition
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  target_value REAL NOT NULL,
  reward_points INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'transport', 'electricity', 'water', 'waste'
  condition_type TEXT NOT NULL, -- 'sum_carbon', 'sum_distance', 'login_streak'
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User Challenges (Progress Tracking)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress REAL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- 3. Experience Points & Leveling (Extended Profile)
-- Ensuring profile columns are ready
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_carbon_saved REAL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_money_saved REAL DEFAULT 0;

-- 4. Audit/Log Table for Points
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category TEXT, -- 'challenge', 'checkin', 'activity'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Real-time RLS Policies
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges readable by all" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Users view personal challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update personal challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);

-- 6. Initial Seed Data: Challenges
INSERT INTO public.challenges (title_ar, title_en, description_ar, description_en, target_value, reward_points, category, condition_type)
VALUES 
('عداء البيئة', 'Eco Walker', 'امشي 5 كم بدلاً من السيارة', 'Walk 5km instead of driving', 5, 500, 'transport', 'sum_distance'),
('حارس الطاقة', 'Energy Guardian', 'وفر 20 كجم من انبعاثات الكربون', 'Save 20kg of CO2', 20, 1000, 'electricity', 'sum_carbon'),
('موفر المياه', 'Water Guardian', 'سجل استهلاك المياه لمدة 7 أيام متتالية', 'Log water usage for 7 days', 7, 750, 'water', 'login_streak')
ON CONFLICT DO NOTHING;

GRANT ALL ON public.challenges TO authenticated;
GRANT ALL ON public.user_challenges TO authenticated;
GRANT ALL ON public.points_transactions TO authenticated;
