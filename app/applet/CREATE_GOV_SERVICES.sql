CREATE TABLE IF NOT EXISTS gov_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,
    category TEXT,
    icon TEXT,
    target_screen TEXT,
    external_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gov_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Gov Services Access" ON gov_services;
CREATE POLICY "Public Gov Services Access" ON gov_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service Role Gov Services Access" ON gov_services;
CREATE POLICY "Service Role Gov Services Access" ON gov_services USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
