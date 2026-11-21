-- 1. التأكد من وجود جدول الكوبونات مع الأعمدة اللازمة
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  discount TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  source TEXT,
  link TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code, source)
);

-- Ensure 'source' column exists in 'coupons' table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='coupons' AND column_name='source'
    ) THEN
        ALTER TABLE coupons ADD COLUMN source TEXT;
    END IF;
END $$;

-- التأكد من وجود الأعمدة المفقودة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='coupons' AND column_name='discount'
    ) THEN
        ALTER TABLE coupons ADD COLUMN discount TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='coupons' AND column_name='expiry_date'
    ) THEN
        ALTER TABLE coupons ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
