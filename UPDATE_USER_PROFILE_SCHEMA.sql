-- Update users table with new profile fields
DO $$ 
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='users' AND column_name='bio') THEN
            ALTER TABLE public.users ADD COLUMN bio TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='users' AND column_name='phone') THEN
            ALTER TABLE public.users ADD COLUMN phone TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='users' AND column_name='city') THEN
            ALTER TABLE public.users ADD COLUMN city TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='users' AND column_name='cover_url') THEN
            ALTER TABLE public.users ADD COLUMN cover_url TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='users' AND column_name='governorate') THEN
            ALTER TABLE public.users ADD COLUMN governorate TEXT;
        END IF;
        
    END IF;

    -- Also update profiles table just in case it's being used instead
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='profiles' AND column_name='bio') THEN
            ALTER TABLE public.profiles ADD COLUMN bio TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='profiles' AND column_name='cover_url') THEN
            ALTER TABLE public.profiles ADD COLUMN cover_url TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='profiles' AND column_name='phone') THEN
            ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        END IF;
        
    END IF;
END $$;
