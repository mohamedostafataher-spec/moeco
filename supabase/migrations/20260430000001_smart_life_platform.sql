-- Smart Life Platform Schema Expansion

-- 1. Economy: products_prices
CREATE TABLE IF NOT EXISTS products_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,
    price DOUBLE PRECISION,
    unit TEXT,
    currency TEXT DEFAULT 'EGP',
    location TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    source TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Lifestyle: places
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,
    description TEXT,
    description_en TEXT,
    location TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    address TEXT,
    rating DOUBLE PRECISION,
    source TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Government Services: gov_services
CREATE TABLE IF NOT EXISTS gov_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,
    description TEXT,
    description_en TEXT,
    location TEXT, -- e.g., 'Cairo Governorate'
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    address TEXT,
    phone TEXT,
    working_hours TEXT,
    source TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Environment: environmental_data
CREATE TABLE IF NOT EXISTS environmental_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    name_en TEXT,
    category TEXT NOT NULL, -- e.g., 'AQI', 'Temperature', 'Pollution'
    value DOUBLE PRECISION NOT NULL,
    unit TEXT,
    location TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    source TEXT,
    severity TEXT, -- 'low', 'medium', 'high', 'critical'
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- End of Smart Life Platform Schema Expansion
