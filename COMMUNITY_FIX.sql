
-- REFRESH COMMUNITY TABLES
DROP TABLE IF EXISTS public.community_likes;
DROP TABLE IF EXISTS public.community_posts;

-- 1. جدول المنشورات (Posts)
CREATE TABLE public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول الإعجابات (Likes)
CREATE TABLE public.community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

-- 3. تفعيل الحماية (RLS)
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit/delete own posts" ON public.community_posts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes" ON public.community_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.community_likes FOR DELETE USING (auth.uid() = user_id);

-- 4. وظيفة زيادة الإعجابات (RPC)
CREATE OR REPLACE FUNCTION increment_likes(post_id_val UUID)
RETURNS void AS $$
BEGIN
    UPDATE community_posts
    SET likes_count = likes_count + 1
    WHERE id = post_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إضافة بيانات تجريبية (Seeds)
INSERT INTO public.community_posts (content, likes_count, comments_count)
VALUES 
('اليوم قمت بزراعة 5 أشجار في حي المعادي! شعور رائع بالمساهمة في بيئة أفضل. 🌳', 15, 3),
('I just switched to a fully electric bike for my daily commute. No more carbon emissions! 🚲⚡', 24, 7),
('نصيحة اليوم: استخدم فلاتر المياه بدلاً من الزجاجات البلاستيكية لتقليل النفايات. 💧', 42, 12);

GRANT ALL ON public.community_posts TO authenticated;
GRANT ALL ON public.community_likes TO authenticated;
GRANT ALL ON public.community_posts TO anon; -- For public viewing if needed
