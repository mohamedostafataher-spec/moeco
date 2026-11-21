CREATE TABLE IF NOT EXISTS public.ride_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    seats_available INTEGER NOT NULL,
    price_per_seat FLOAT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ride_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ride_shares" ON public.ride_shares FOR SELECT USING (status = 'active');
CREATE POLICY "Drivers can manage own ride_shares" ON public.ride_shares FOR ALL USING (auth.uid() = driver_id);
