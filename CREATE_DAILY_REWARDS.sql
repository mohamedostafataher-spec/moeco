-- 10. DAILY REWARDS SYSTEM
CREATE TABLE IF NOT EXISTS public.daily_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_name TEXT NOT NULL,
    points_amount INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.daily_reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.daily_rewards(id) ON DELETE CASCADE,
    claim_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, claim_date)
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reward_claims ENABLE ROW LEVEL SECURITY;

-- If policies already exist, this might fail, so use DROPs.
DROP POLICY IF EXISTS "Enable read for all" ON public.daily_rewards;
CREATE POLICY "Enable read for all" ON public.daily_rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for users" ON public.daily_reward_claims;
CREATE POLICY "Enable insert for users" ON public.daily_reward_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable read for users" ON public.daily_reward_claims;
CREATE POLICY "Enable read for users" ON public.daily_reward_claims FOR SELECT USING (auth.uid() = user_id);
