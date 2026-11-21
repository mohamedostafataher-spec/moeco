
-- fuel_prices table
CREATE TABLE IF NOT EXISTS fuel_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuel_type TEXT UNIQUE NOT NULL,
    price FLOAT NOT NULL,
    currency TEXT DEFAULT 'EGP',
    source TEXT,
    effective_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE fuel_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON fuel_prices
    FOR SELECT USING (true);

-- Ensure updated_at updates on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fuel_prices_updated_at
    BEFORE UPDATE ON fuel_prices
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
