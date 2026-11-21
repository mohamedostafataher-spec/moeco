-- CLEAN UP CONFLICTING POLICIES WITH ARABIC NAMES
DO $$
BEGIN
    -- Profiles
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'الملفات الشخصية العامة قابلة للعرض من قبل الجميع' AND tablename = 'profiles') THEN
        DROP POLICY "الملفات الشخصية العامة قابلة للعرض من قبل الجميع" ON public.profiles;
    END IF;

    -- If there are any other specific policies mentioned in errors, add them here
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'يمكن للمستخدمين تحديث ملفاتهم الشخصية الخاصة' AND tablename = 'profiles') THEN
        DROP POLICY "يمكن للمستخدمين تحديث ملفاتهم الشخصية الخاصة" ON public.profiles;
    END IF;
    
    -- Ensure clean slate for our standard policies
    DROP POLICY IF EXISTS "Allow All for Profiles" ON public.profiles;
    CREATE POLICY "Allow All for Profiles" ON public.profiles FOR ALL USING (true);
    
    -- Sync permissions
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
END $$;
