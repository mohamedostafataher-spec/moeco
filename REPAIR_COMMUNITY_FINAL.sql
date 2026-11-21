-- REPAIR GREEN COMMUNITY SCHEMA (2026)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DROP OLD TABLES
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_likes CASCADE;

-- 2. CREATE POSTS TABLE
CREATE TABLE public.community_posts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    image_url text,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. CREATE COMMENTS TABLE
CREATE TABLE public.community_comments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. CREATE LIKES TABLE
CREATE TABLE public.community_likes (
    post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);

-- 5. ATOMIC INCREMENT FUNCTIONS
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id_param uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.community_posts
    SET likes_count = likes_count + 1
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(post_id_param uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.community_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_post_comments(post_id_param uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.community_posts
    SET comments_count = comments_count + 1
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS POLICIES
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Allow public read comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Allow public read likes" ON public.community_likes FOR SELECT USING (true);

CREATE POLICY "Allow auth insert posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow auth insert comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow auth insert likes" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. SEED INITIAL DATA
INSERT INTO public.community_posts (content, user_id, likes_count, comments_count)
SELECT 'أهلاً بكم في المجتمع الأخضر! دعونا نحافظ على بيئتنا سوياً. 🌍', id, 15, 2
FROM public.users LIMIT 1;
