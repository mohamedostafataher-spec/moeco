-- Create necessary tables for Transport Hub
CREATE TABLE IF NOT EXISTS transport_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    seats_total INT,
    seats_available INT,
    price_per_seat NUMERIC,
    driver_id UUID,
    driver_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS traffic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    location TEXT,
    longitude NUMERIC,
    latitude NUMERIC,
    description TEXT,
    user_id UUID,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS walking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    distance NUMERIC,
    duration NUMERIC,
    co2_saved NUMERIC,
    tokens_earned INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carbon_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    carbon NUMERIC,
    type TEXT,
    distance NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE walking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public transport_trips access" ON transport_trips;
CREATE POLICY "Public transport_trips access" ON transport_trips FOR SELECT USING (true);
DROP POLICY IF EXISTS "User can insert transport_trips" ON transport_trips;
CREATE POLICY "User can insert transport_trips" ON transport_trips FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "User can update transport_trips" ON transport_trips;
CREATE POLICY "User can update transport_trips" ON transport_trips FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public traffic_reports access" ON traffic_reports;
CREATE POLICY "Public traffic_reports access" ON traffic_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "User can insert traffic_reports" ON traffic_reports;
CREATE POLICY "User can insert traffic_reports" ON traffic_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "User walking_sessions access" ON walking_sessions;
CREATE POLICY "User walking_sessions access" ON walking_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "User can insert walking_sessions" ON walking_sessions;
CREATE POLICY "User can insert walking_sessions" ON walking_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "User carbon_logs access" ON carbon_logs;
CREATE POLICY "User carbon_logs access" ON carbon_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "User can insert carbon_logs" ON carbon_logs;
CREATE POLICY "User can insert carbon_logs" ON carbon_logs FOR INSERT WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
