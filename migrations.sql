-- Ride Sharing Table
CREATE TABLE IF NOT EXISTS ride_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    line_id UUID REFERENCES transport_lines(id),
    from_station_id UUID REFERENCES transport_stations(id),
    to_station_id UUID REFERENCES transport_stations(id),
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    seats_available INTEGER NOT NULL DEFAULT 1,
    seats_total INTEGER NOT NULL DEFAULT 4,
    price_per_seat DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, full, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT
);

-- Ride Share Participants
CREATE TABLE IF NOT EXISTS ride_share_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES ride_shares(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Alerts Table (Enhanced)
CREATE TABLE IF NOT EXISTS real_time_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- info, warning, critical
    source_name_ar TEXT,
    source_name_en TEXT,
    source_url TEXT,
    governorate_id UUID REFERENCES governorates(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eco News Table (Enhanced)
CREATE TABLE IF NOT EXISTS eco_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    content_en TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    image_url TEXT,
    source_name_ar TEXT,
    source_name_en TEXT,
    source_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transport Schedules Table
CREATE TABLE IF NOT EXISTS transport_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_id UUID REFERENCES transport_lines(id),
    station_id UUID REFERENCES transport_stations(id),
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    day_of_week INTEGER, -- 0-6, null for daily
    is_real_time BOOLEAN DEFAULT false,
    delay_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
