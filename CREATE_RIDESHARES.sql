CREATE TABLE IF NOT EXISTS public.rideshares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    seats_available INTEGER NOT NULL,
    price_per_seat FLOAT,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.rideshares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rideshares" ON public.rideshares FOR SELECT USING (status = 'active');
CREATE POLICY "Drivers can manage own rideshares" ON public.rideshares FOR ALL USING (auth.uid() = driver_id);
