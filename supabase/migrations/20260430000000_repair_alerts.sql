-- Repair Alerts Table to match requested production schema
DO $$ 
BEGIN
    -- Ensure columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'title_ar') THEN
        ALTER TABLE alerts ADD COLUMN title_ar TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'title_en') THEN
        ALTER TABLE alerts ADD COLUMN title_en TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'description_ar') THEN
        ALTER TABLE alerts ADD COLUMN description_ar TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'description_en') THEN
        ALTER TABLE alerts ADD COLUMN description_en TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'severity') THEN
        ALTER TABLE alerts ADD COLUMN severity TEXT DEFAULT 'medium';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'type') THEN
        ALTER TABLE alerts ADD COLUMN type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'source') THEN
        ALTER TABLE alerts ADD COLUMN source TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'location') THEN
        ALTER TABLE alerts ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'lat') THEN
        ALTER TABLE alerts ADD COLUMN lat DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'lng') THEN
        ALTER TABLE alerts ADD COLUMN lng DOUBLE PRECISION;
    END IF;

    -- Migrate old data if necessary
    UPDATE alerts SET title_ar = title WHERE title_ar IS NULL AND title IS NOT NULL;
    UPDATE alerts SET description_ar = description WHERE description_ar IS NULL AND description IS NOT NULL;

END $$;
