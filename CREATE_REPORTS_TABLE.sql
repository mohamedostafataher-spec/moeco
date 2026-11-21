-- Monthly Reporting System

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('user', 'sector', 'governorate', 'country')),
    reference_id TEXT,
    file_url_pdf TEXT,
    file_url_excel TEXT,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure mapping for missing elements
CREATE OR REPLACE FUNCTION update_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_reports_updated ON reports;
CREATE TRIGGER tr_reports_updated
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE PROCEDURE update_reports_timestamp();

-- Create storage bucket if possible via SQL
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true) ON CONFLICT (id) DO NOTHING;

