-- ============================================================================
-- الجزء الأول: تفعيل الامتدادات وإنشاء الجداول الجغرافية بالكامل (Part 1 - Schemas & Structs)
-- ============================================================================

-- Enable required PostGIS & UUID extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PRE-REBUILD CLEANUP (Drops conflicting duplicate tables in correct dependency order)
DROP TABLE IF EXISTS public.station_landmarks CASCADE;
DROP TABLE IF EXISTS public.transport_route_stations CASCADE;
DROP TABLE IF EXISTS public.transport_prices CASCADE;
DROP TABLE IF EXISTS public.environmental_data CASCADE;
DROP TABLE IF EXISTS public.air_quality_logs CASCADE;
DROP TABLE IF EXISTS public.government_services CASCADE;
DROP TABLE IF EXISTS public.tourist_places CASCADE;
DROP TABLE IF EXISTS public.gis_layers CASCADE;
DROP TABLE IF EXISTS public.transport_stations CASCADE;
DROP TABLE IF EXISTS public.transport_routes CASCADE;
DROP TABLE IF EXISTS public.transport_services CASCADE;

-- -------------------------------------------------------------
-- 0. SCHEMA-INTEGRATION: LEGACY TRANSIT BRIDGE (transport_services)
-- Supporting all client-side queries executing old-schema fetches
-- Uses JSONB for stops and current_location to bypass array type mismatch
-- -------------------------------------------------------------
CREATE TABLE public.transport_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    route_name TEXT,
    price NUMERIC NOT NULL DEFAULT 10,
    carbon_impact_kg NUMERIC NOT NULL DEFAULT 0.045,
    live_status TEXT DEFAULT 'active',
    stops JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_location JSONB NOT NULL DEFAULT '{}'::jsonb,
    service_name TEXT,
    service_type TEXT,
    base_fare NUMERIC DEFAULT 10,
    coverage_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 1. TABLE: transport_routes (المسارات العامة لشبكة النقل)
-- -------------------------------------------------------------
CREATE TABLE public.transport_routes (
    route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name_ar VARCHAR(255) NOT NULL,
    route_name_en VARCHAR(255) NOT NULL,
    mode_type VARCHAR(50) NOT NULL CHECK (mode_type IN ('metro', 'monorail', 'lrt', 'brt', 'tram', 'train', 'bus', 'microbus', 'river_ferry')),
    operator_name VARCHAR(150) NOT NULL DEFAULT 'Ministry of Transport',
    line_color VARCHAR(7) CHECK (line_color ~ '^#[0-9A-Fa-f]{6}$'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 2. TABLE: transport_stations (المحطات المفصلة جغرافياً)
-- -------------------------------------------------------------
CREATE TABLE public.transport_stations (
    station_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_name_ar VARCHAR(255) NOT NULL,
    station_name_en VARCHAR(255) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    station_type VARCHAR(50) NOT NULL CHECK (station_type IN ('underground', 'elevated', 'at-grade', 'interchange', 'marine_dock')),
    governorate VARCHAR(100) NOT NULL,
    operating_hours_start TIME NOT NULL DEFAULT '05:00:00',
    operating_hours_end TIME NOT NULL DEFAULT '01:00:00',
    station_density_level VARCHAR(20) DEFAULT 'moderate' CHECK (station_density_level IN ('low', 'moderate', 'high', 'critical')),
    estimated_emissions_factor NUMERIC(10, 4) DEFAULT 0.0000, -- g CO2 per passenger km
    image_url VARCHAR(512),
    station_status VARCHAR(50) DEFAULT 'active' CHECK (station_status IN ('active', 'under_rehabilitation', 'planned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transport_stations_geom ON public.transport_stations USING gist(geom);

-- -------------------------------------------------------------
-- 3. TABLE: transport_route_stations (الربط بين المسارات والمحطات - ترتيب تسلسلي)
-- -------------------------------------------------------------
CREATE TABLE public.transport_route_stations (
    route_id UUID REFERENCES public.transport_routes(route_id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.transport_stations(station_id) ON DELETE CASCADE,
    station_order INT NOT NULL,
    PRIMARY KEY (route_id, station_id),
    CONSTRAINT unique_route_station_sequence UNIQUE(route_id, station_order)
);

-- -------------------------------------------------------------
-- 4. TABLE: transport_prices (تسعير تذاكر شبكة المواصلات واشتراكاتها المعتمدة)
-- -------------------------------------------------------------
CREATE TABLE public.transport_prices (
    price_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES public.transport_routes(route_id) ON DELETE CASCADE,
    units_min INT NOT NULL, -- Minimum stations
    units_max INT,          -- Maximum stations (NULL means infinity)
    price_egp NUMERIC(6, 2) NOT NULL,
    egp_price_concession NUMERIC(6, 2), -- Seniors, disabilities, students
    is_subscription_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 5. TABLE: tourist_places (المزارات السياحية والأثرية والمواقع الترفيهية)
-- -------------------------------------------------------------
CREATE TABLE public.tourist_places (
    place_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_name_ar VARCHAR(255) NOT NULL,
    place_name_en VARCHAR(255) NOT NULL,
    place_description_ar TEXT,
    place_description_en TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    foreigner_adult_fee NUMERIC(8, 2) NOT NULL,
    foreigner_student_fee NUMERIC(8, 2) NOT NULL,
    egyptian_adult_fee NUMERIC(8, 2) NOT NULL,
    egyptian_student_fee NUMERIC(8, 2) NOT NULL,
    working_hours JSONB, -- Flextime (summer/winter/Ramadan)
    place_category VARCHAR(50) CHECK (place_category IN ('monument', 'museum', 'mosque', 'church', 'corniche', 'park', 'hotel', 'cafe', 'restaurant', 'mall')),
    official_website VARCHAR(255),
    ratings NUMERIC(2, 1) CHECK (ratings BETWEEN 1.0 AND 5.0),
    image_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tourist_places_geom ON public.tourist_places USING gist(geom);

-- -------------------------------------------------------------
-- 6. TABLE: station_landmarks (الربط المرجعي المكاني والتحليلي للمسافات مع المحطات)
-- -------------------------------------------------------------
CREATE TABLE public.station_landmarks (
    association_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.transport_stations(station_id) ON DELETE CASCADE,
    place_id UUID REFERENCES public.tourist_places(place_id) ON DELETE CASCADE,
    distance_meters NUMERIC(10, 2) NOT NULL,
    is_walkable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 7. TABLE: environmental_data (سجلات البصمة البيئية والاستهلاك والطاقة الإقليمية)
-- -------------------------------------------------------------
CREATE TABLE public.environmental_data (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.transport_stations(station_id) ON DELETE SET NULL,
    aqi_us INT NOT NULL,
    pm25_concentration NUMERIC(6, 2),
    pm10_concentration NUMERIC(6, 2),
    co_concentration NUMERIC(6, 2),
    so2_concentration NUMERIC(6, 2),
    no2_concentration NUMERIC(6, 2),
    o3_concentration NUMERIC(6, 2),
    temperature_celsius NUMERIC(4, 1),
    humidity_percentage INT CHECK (humidity_percentage BETWEEN 0 AND 100),
    wind_speed_kmh NUMERIC(5, 2),
    kwh_consumption_energy NUMERIC(12, 2), -- Infrastructure power
    water_consumption_m3 NUMERIC(10, 2),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 8. TABLE: air_quality_logs (الرصد الفوري واللحظي عبر الحساسات الهوائية والبيئية)
-- -------------------------------------------------------------
CREATE TABLE public.air_quality_logs (
    sensor_id VARCHAR(100) NOT NULL,
    sensor_name VARCHAR(150),
    geom GEOMETRY(Point, 4326) NOT NULL,
    current_aqi INT NOT NULL,
    primary_pollutant VARCHAR(20),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (sensor_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_air_quality_logs_geom ON public.air_quality_logs USING gist(geom);

-- -------------------------------------------------------------
-- 9. TABLE: government_services (دليل بوابة مصر الرقمية والخدمات الحكومية المفتوحة)
-- -------------------------------------------------------------
CREATE TABLE public.government_services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name_ar VARCHAR(255) NOT NULL,
    service_name_en VARCHAR(255) NOT NULL,
    official_portal_url VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    schedule_fees JSONB NOT NULL, -- Fees breakdown (in EGP)
    required_documents TEXT NOT NULL,
    working_hours TEXT,
    office_coordinates GEOMETRY(Point, 4326),
    closest_station_id UUID REFERENCES public.transport_stations(station_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_government_services_geom ON public.government_services USING gist(office_coordinates);

-- -------------------------------------------------------------
-- 10. TABLE: gis_layers (طبقات الخرائط المتجهة والمساحات الخضراء والحدود الإدارية لـ 27 محافظة)
-- -------------------------------------------------------------
CREATE TABLE public.gis_layers (
    layer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_name VARCHAR(150) NOT NULL UNIQUE,
    layer_type VARCHAR(50) NOT NULL CHECK (layer_type IN ('boundary_governorate', 'boundary_city', 'road_network', 'transit_track', 'green_grid', 'population_density', 'thermal_index')),
    geom GEOMETRY(Geometry, 4326) NOT NULL,
    metadata_payload JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gis_layers_geom ON public.gis_layers USING gist(geom);

-- Notify PostgREST proxy layer to reload caching immediately
NOTIFY pgrst, 'reload schema';
