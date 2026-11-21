-- COUPONS, AI, AND ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_value TEXT,
    required_points INTEGER DEFAULT 0,
    partner_name TEXT,
    expiry_date DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_type TEXT,
    condition_value INTEGER,
    message_ar TEXT,
    message_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT,
    name_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    condition TEXT,
    reward_points INTEGER,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for coupons" ON public.coupons;
CREATE POLICY "Enable all for coupons" ON public.coupons FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for user_coupons" ON public.user_coupons;
CREATE POLICY "Enable all for user_coupons" ON public.user_coupons FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable all for ai_tips" ON public.ai_tips;
CREATE POLICY "Enable all for ai_tips" ON public.ai_tips FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for achievements" ON public.achievements;
CREATE POLICY "Enable all for achievements" ON public.achievements FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for user_achievements" ON public.user_achievements;
CREATE POLICY "Enable all for user_achievements" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);

-- Insert dummy data for coupons
INSERT INTO public.coupons (title, description, discount_value, required_points, partner_name)
VALUES 
('خصم 20% على منتجات بطاقات', 'احصل على خصم عند شراء منتجات من القطن العضوي', '20%', 500, 'EcoStore'),
('شحن مجاني للسيارات الكهربائية', 'احصل على شحن مجاني لمدة يوم كامل', '100%', 1000, 'GreenCharge');

-- Insert AI Tips
INSERT INTO public.ai_tips (condition_type, condition_value, message_ar, message_en)
VALUES 
('electricity_high', 50, '💡 استهلاكك للكهرباء مرتفع اليوم. حاول إطفاء الأجهزة غير المستخدمة لتقليل الانبعاثات.', '💡 Your electricity usage is high today. Try turning off idle devices to save energy.'),
('transport_high', 15, '🚗 انبعاثات النقل الخاصة بك تتزايد. فكر في استخدام وسائل النقل العام أوالدراجة غدًا!', '🚗 Your transport emissions are growing. Consider public transit or biking tomorrow!'),
('electricity_low', 10, '🌟 أداء ممتاز! استهلاكك للكهرباء منخفض جداً اليوم، أنت تسهم في حماية البيئة.', '🌟 Great job! Your electricity usage is very low today, you are helping the planet.');

-- Insert Achievements
INSERT INTO public.achievements (name_ar, name_en, description_ar, description_en, condition, reward_points, icon)
VALUES 
('بداية خضراء', 'Green Start', 'أكمل أول مهمة لك', 'Complete your first mission', 'first_mission', 50, 'Leaf'),
('بطل التوفير', 'Saving Hero', 'قلل استهلاكك للكهرباء لثلاثة أيام متتالية', 'Reduce electricity for 3 consecutive days', 'streak_3', 100, 'Zap'),
('صديق البيئة', 'Eco Friend', 'سجل 10 أنشطة صديقة للبيئة', 'Log 10 eco-friendly activities', 'log_10', 200, 'Globe');
