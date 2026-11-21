-- GAMIFICATION SYSTEM
CREATE TABLE IF NOT EXISTS public.onboarding_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    housing_type TEXT,
    transport_type TEXT,
    electricity_level TEXT,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_type TEXT NOT NULL,
    description TEXT,
    points_reward INTEGER DEFAULT 10,
    status TEXT DEFAULT 'pending', -- pending, completed
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_name TEXT NOT NULL,
    points_amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Helper policies (assuming basic authenticated access)
CREATE POLICY "Enable all for users" ON public.onboarding_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Enable all for users" ON public.user_missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Enable all for users" ON public.user_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Enable all for users" ON public.user_rewards FOR ALL USING (auth.uid() = user_id);
