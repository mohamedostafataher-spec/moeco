
-- Fix challenges table schema
ALTER TABLE IF EXISTS public.challenges 
DROP COLUMN IF EXISTS title;

ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS title_ar TEXT,
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Re-insert basic challenges
INSERT INTO public.challenges (title_ar, title_en, description_ar, description_en, target_value, reward_points, category, condition_type)
VALUES 
('رحالة المترو', 'Metro Traveler', 'استخدم المترو 10 مرات هذا الشهر', 'Use metro 10 times this month', 10, 500, 'transport', 'count'),
('بطل التوفير', 'Saving Hero', 'وفر 50 كيلو من الكربون', 'Save 50kg of carbon', 50, 1000, 'carbon', 'value')
ON CONFLICT DO NOTHING;
