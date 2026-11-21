-- ENABLE POSTGIS EXTENSION
-- This solves the "type geography does not exist" error
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. GIS Features Table
CREATE TABLE IF NOT EXISTS public.gis_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL, -- EmissionZone, Transport, GovService, EcoPoint, PollutionHotspot
    sub_category TEXT,
    location GEOGRAPHY(POINT, 4326),
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Paths Table for mobility analysis
CREATE TABLE IF NOT EXISTS public.user_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    path_name TEXT,
    path_geometry GEOGRAPHY(LINESTRING, 4326),
    emission_saved DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Spatial Analysis Table for predictive modeling
CREATE TABLE IF NOT EXISTS public.spatial_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_type TEXT NOT NULL, -- PopulationDensity, ServiceDensity, EmissionDensity, Heatmap
    region_name TEXT,
    value DOUBLE PRECISION,
    geometry GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Realtime for GIS data
-- We check if they already exist in publication to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'gis_features') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE gis_features;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'spatial_analysis') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE spatial_analysis;
    END IF;
END $$;

-- 5. Seeding some initial GIS predictive data for Cairo
INSERT INTO public.gis_features (name_ar, name_en, category, sub_category, location, properties)
VALUES 
('نقطة تلوث هواء - العباسية', 'Air Pollution Point - Abbasia', 'PollutionHotspot', 'Air', 'POINT(31.28 30.07)', '{"aqi": 85, "main_pollutant": "PM2.5"}'),
('منطقة انبعاثات منخفضة - المعادي', 'Low Emission Zone - Maadi', 'EmissionZone', 'Green', 'POINT(31.25 29.96)', '{"reduction_target": "20%", "status": "Active"}'),
('محطة رصد بيئي - الدقي', 'Env Monitoring Station - Dokki', 'EcoPoint', 'Sensor', 'POINT(31.21 30.04)', '{"status": "Online", "last_update": "Realtime"}')
ON CONFLICT DO NOTHING;
