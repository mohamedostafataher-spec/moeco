-- Setup Transport and Walking System Control
-- This script prepares the database for administrative control over transport and walking metrics.

-- Ensure app_config exists for system-wide parameters if not present
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert or Update default transport/walking configuration parameters
INSERT INTO public.app_config (config_key, config_value, description)
VALUES 
('transport_config', '{"co2_per_km_walking": 0.2, "tokens_per_km_walking": 2.0, "co2_per_km_bus": 0.08, "tokens_per_km_bus": 1.0}', 'Configuration for transport and walking rewards and CO2 factors')
ON CONFLICT (config_key) DO UPDATE SET 
config_value = EXCLUDED.config_value, 
updated_at = NOW();

-- Ensure Transport Tables exist
CREATE TABLE IF NOT EXISTS public.transport_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    line_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_stations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_id UUID REFERENCES public.transport_lines(id),
    name TEXT NOT NULL,
    location_lat NUMERIC,
    location_lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
