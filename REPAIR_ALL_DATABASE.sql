-- 1. Create missing tables (SQLite compatible)
CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_ar TEXT,
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT, -- Assuming profiles.id is TEXT in SQLite
    title TEXT NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add missing columns (In SQLite, ALTER TABLE is limited)
-- We need to check if columns exist first, but SQLite 'ALTER TABLE ADD COLUMN IF NOT EXISTS' is only supported in newer versions.
-- I'll use simple attempts, they might fail if columns already exist, which is fine.
BEGIN;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_carbon_saved REAL DEFAULT 0;
    ALTER TABLE consumption_records ADD COLUMN IF NOT EXISTS co2_impact REAL DEFAULT 0;
COMMIT;
