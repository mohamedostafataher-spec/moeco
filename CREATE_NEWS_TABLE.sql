-- Recreate the news table
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT UNIQUE NOT NULL,
    image_url TEXT,
    source TEXT,
    source_url TEXT,
    category TEXT DEFAULT 'general',
    target_screen TEXT DEFAULT 'eco_news',
    priority TEXT DEFAULT 'normal',
    is_alert BOOLEAN DEFAULT false,
    alert_type TEXT DEFAULT 'normal',
    country TEXT DEFAULT 'Global',
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public News Access" ON news;
CREATE POLICY "Public News Access" ON news FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service Role News Upsert" ON news;
CREATE POLICY "Service Role News Upsert" ON news USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
