
CREATE TABLE IF NOT EXISTS public.user_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT,
  condition_value REAL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  badge_id INTEGER REFERENCES public.badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL,
  reward_points INTEGER,
  category TEXT
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  challenge_id INTEGER REFERENCES public.challenges(id),
  progress REAL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT,
  screen TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
