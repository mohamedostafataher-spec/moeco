CREATE TABLE IF NOT EXISTS public.walking_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    distance_km FLOAT NOT NULL,
    co2_saved_kg FLOAT NOT NULL,
    green_tokens_earned INTEGER NOT NULL,
    route_geo JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.walking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own walking sessions" 
    ON public.walking_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own walking sessions" 
    ON public.walking_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own walking sessions" 
    ON public.walking_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own walking sessions" 
    ON public.walking_sessions FOR DELETE 
    USING (auth.uid() = user_id);
    
-- also make sure transport_logs exists in case it doesn't
CREATE TABLE IF NOT EXISTS public.transport_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transport_mode TEXT NOT NULL,
    distance_km FLOAT NOT NULL,
    co2_emitted_kg FLOAT NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transport_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trans logs select" ON public.transport_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trans logs insert" ON public.transport_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
