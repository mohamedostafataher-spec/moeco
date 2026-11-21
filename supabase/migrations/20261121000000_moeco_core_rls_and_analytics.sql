-- MoEco Core Privacy-First Supabase Migration
-- Reproducible SQL setup: tables, strict RLS, minimal analytics allowlist, aggregated owner stats RPC, and retention cleanup.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.moeco_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. User Profiles (linked to Supabase Auth anonymous or email-linked UUID)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  core_consent_accepted_at TIMESTAMPTZ,
  analytics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  account_kind TEXT NOT NULL DEFAULT 'anonymous' CHECK (account_kind IN ('anonymous', 'linked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.moeco_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 3. Explicit Consent Audit Log (Core storage vs Optional Analytics)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('core_storage', 'usage_analytics')),
  consent_version TEXT NOT NULL DEFAULT '1.0',
  granted BOOLEAN NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_user_created ON public.consents(user_id, created_at DESC);

-- 4. Household Utility Readings (My Home / ملف بيتي)
CREATE TABLE IF NOT EXISTS public.household_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  utility_type TEXT NOT NULL CHECK (utility_type IN ('electricity', 'water')),
  entry_kind TEXT NOT NULL CHECK (entry_kind IN ('reading', 'consumption')),
  value NUMERIC(14, 4) NOT NULL CHECK (value > 0),
  unit TEXT NOT NULL CHECK (char_length(trim(unit)) > 0 AND char_length(unit) <= 40),
  date_mode TEXT NOT NULL DEFAULT 'single_date' CHECK (date_mode IN ('single_date', 'billing_period')),
  reading_date DATE,
  period_start DATE,
  period_end DATE,
  amount_paid NUMERIC(14, 2) CHECK (amount_paid IS NULL OR amount_paid >= 0),
  currency TEXT CHECK (currency IS NULL OR char_length(currency) <= 16),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 1000),
  attachment_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_reading_dates_order CHECK (
    period_start IS NULL OR period_end IS NULL OR period_end >= period_start
  )
);

DROP TRIGGER IF EXISTS trg_household_readings_updated_at ON public.household_readings;
CREATE TRIGGER trg_household_readings_updated_at
  BEFORE UPDATE ON public.household_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.moeco_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_household_readings_user_date
  ON public.household_readings(user_id, reading_date DESC, created_at DESC);

-- 5. Personal Complaint Drafts (شكواي ما تضيعش)
CREATE TABLE IF NOT EXISTS public.complaint_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN (
      'environment_waste',
      'water_sanitation',
      'electricity',
      'transport_rail',
      'consumer_protection',
      'other'
    )
  ),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 200),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0 AND char_length(description) <= 4000),
  approximate_location TEXT NOT NULL CHECK (char_length(trim(approximate_location)) > 0 AND char_length(approximate_location) <= 300),
  occurred_at TEXT,
  private_notes TEXT CHECK (private_notes IS NULL OR char_length(private_notes) <= 2000),
  location_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'external_site_opened', 'user_added_reference', 'closed_by_user')
  ),
  official_channel_url_used TEXT,
  official_channel_opened_at TIMESTAMPTZ,
  user_entered_reference TEXT CHECK (user_entered_reference IS NULL OR char_length(user_entered_reference) <= 120),
  official_entity_name TEXT CHECK (official_entity_name IS NULL OR char_length(official_entity_name) <= 200),
  official_submitted_date DATE,
  follow_up_notes TEXT CHECK (follow_up_notes IS NULL OR char_length(follow_up_notes) <= 2000),
  reminder_at TIMESTAMPTZ,
  attachment_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_complaint_drafts_updated_at ON public.complaint_drafts;
CREATE TRIGGER trg_complaint_drafts_updated_at
  BEFORE UPDATE ON public.complaint_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.moeco_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_complaint_drafts_user_updated
  ON public.complaint_drafts(user_id, updated_at DESC);

-- 6. Verified Public / Official Sources (مشروعي في منطقتي — NO fake seed data)
CREATE TABLE IF NOT EXISTS public.official_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  governorate TEXT,
  sector TEXT,
  status_text TEXT,
  source_url TEXT NOT NULL,
  source_owner TEXT NOT NULL,
  record_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_published_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  data_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (
    data_status IN ('verified', 'archived', 'needs_review')
  ),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_official_sources_published
  ON public.official_sources(is_published, data_status, imported_at DESC);

-- 7. User Personal Notes on Verified Official Sources
CREATE TABLE IF NOT EXISTS public.saved_project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.official_sources(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  personal_note TEXT NOT NULL DEFAULT '',
  reported_error_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_saved_project_notes_user_source UNIQUE (user_id, source_id)
);

DROP TRIGGER IF EXISTS trg_saved_project_notes_updated_at ON public.saved_project_notes;
CREATE TRIGGER trg_saved_project_notes_updated_at
  BEFORE UPDATE ON public.saved_project_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.moeco_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_saved_project_notes_user
  ON public.saved_project_notes(user_id, updated_at DESC);

-- 8. Minimal Allowlisted Usage Analytics Events (Strict NO-PII constraint)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL CHECK (
    event_name IN (
      'feature_opened',
      'reading_saved',
      'reading_deleted',
      'complaint_draft_created',
      'complaint_external_opened',
      'account_linked',
      'data_exported',
      'data_deleted'
    )
  ),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Only 'feature' and 'status' keys allowed; prevents leaking bill amounts, complaint texts, GPS, or emails.
  CONSTRAINT chk_usage_events_metadata_allowlist CHECK (
    jsonb_typeof(metadata) = 'object'
    AND (metadata - 'feature' - 'status') = '{}'::jsonb
    AND char_length(metadata::text) <= 256
  )
);

CREATE INDEX IF NOT EXISTS idx_usage_events_occurred ON public.usage_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_occurred ON public.usage_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_name_occurred ON public.usage_events(event_name, occurred_at DESC);

-- 9. Server-Managed Owner/Admin Allowlist (NO client access at all)
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'analyst')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Enable & Force Strict RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.household_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_readings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.complaint_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_drafts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_sources FORCE ROW LEVEL SECURITY;

ALTER TABLE public.saved_project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_project_notes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events FORCE ROW LEVEL SECURITY;

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_admins FORCE ROW LEVEL SECURITY;

-- Revoke broad anon access explicitly
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.consents FROM anon;
REVOKE ALL ON public.household_readings FROM anon;
REVOKE ALL ON public.complaint_drafts FROM anon;
REVOKE ALL ON public.saved_project_notes FROM anon;
REVOKE ALL ON public.usage_events FROM anon;
REVOKE ALL ON public.app_admins FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_readings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_project_notes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.usage_events TO authenticated;
GRANT SELECT ON public.official_sources TO anon, authenticated;

-- Profiles RLS
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_delete_own ON public.profiles;
CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Consents RLS
DROP POLICY IF EXISTS consents_select_own ON public.consents;
CREATE POLICY consents_select_own ON public.consents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS consents_insert_own ON public.consents;
CREATE POLICY consents_insert_own ON public.consents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS consents_update_own ON public.consents;
CREATE POLICY consents_update_own ON public.consents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS consents_delete_own ON public.consents;
CREATE POLICY consents_delete_own ON public.consents
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Household Readings RLS
DROP POLICY IF EXISTS household_readings_select_own ON public.household_readings;
CREATE POLICY household_readings_select_own ON public.household_readings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS household_readings_insert_own ON public.household_readings;
CREATE POLICY household_readings_insert_own ON public.household_readings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS household_readings_update_own ON public.household_readings;
CREATE POLICY household_readings_update_own ON public.household_readings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS household_readings_delete_own ON public.household_readings;
CREATE POLICY household_readings_delete_own ON public.household_readings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Complaint Drafts RLS
DROP POLICY IF EXISTS complaint_drafts_select_own ON public.complaint_drafts;
CREATE POLICY complaint_drafts_select_own ON public.complaint_drafts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS complaint_drafts_insert_own ON public.complaint_drafts;
CREATE POLICY complaint_drafts_insert_own ON public.complaint_drafts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS complaint_drafts_update_own ON public.complaint_drafts;
CREATE POLICY complaint_drafts_update_own ON public.complaint_drafts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS complaint_drafts_delete_own ON public.complaint_drafts;
CREATE POLICY complaint_drafts_delete_own ON public.complaint_drafts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Saved Project Notes RLS
DROP POLICY IF EXISTS saved_project_notes_select_own ON public.saved_project_notes;
CREATE POLICY saved_project_notes_select_own ON public.saved_project_notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_project_notes_insert_own ON public.saved_project_notes;
CREATE POLICY saved_project_notes_insert_own ON public.saved_project_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_project_notes_update_own ON public.saved_project_notes;
CREATE POLICY saved_project_notes_update_own ON public.saved_project_notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_project_notes_delete_own ON public.saved_project_notes;
CREATE POLICY saved_project_notes_delete_own ON public.saved_project_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Official Sources RLS: read-only published verified/archived rows
DROP POLICY IF EXISTS official_sources_select_published ON public.official_sources;
CREATE POLICY official_sources_select_published ON public.official_sources
  FOR SELECT TO anon, authenticated
  USING (is_published = TRUE AND data_status IN ('verified', 'archived'));

-- Usage Events RLS: Users can ONLY insert if analytics_enabled = TRUE in profiles!
DROP POLICY IF EXISTS usage_events_select_own ON public.usage_events;
CREATE POLICY usage_events_select_own ON public.usage_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_events_insert_consented ON public.usage_events;
CREATE POLICY usage_events_insert_consented ON public.usage_events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.analytics_enabled = TRUE
    )
  );

DROP POLICY IF EXISTS usage_events_delete_own ON public.usage_events;
CREATE POLICY usage_events_delete_own ON public.usage_events
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 11. Server-Verified Admin Helper & Aggregated-Only Analytics RPC
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_admins a
    WHERE a.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_owner_usage_summary(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
  v_since TIMESTAMPTZ := NOW() - make_interval(days => v_days);
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'forbidden: owner admin role required' USING ERRCODE = '42501';
  END IF;

  WITH event_window AS (
    SELECT user_id, event_name, occurred_at, metadata
    FROM public.usage_events
    WHERE occurred_at >= v_since
  ),
  user_day_counts AS (
    SELECT user_id, COUNT(DISTINCT DATE(occurred_at)) AS active_days
    FROM event_window
    GROUP BY user_id
  ),
  daily_features AS (
    SELECT
      TO_CHAR(DATE(occurred_at), 'YYYY-MM-DD') AS day,
      COALESCE(NULLIF(metadata->>'feature', ''), event_name) AS feature,
      COUNT(*) AS total
    FROM event_window
    GROUP BY DATE(occurred_at), COALESCE(NULLIF(metadata->>'feature', ''), event_name)
    ORDER BY DATE(occurred_at) ASC
  ),
  event_totals AS (
    SELECT event_name, COUNT(*) AS total
    FROM event_window
    GROUP BY event_name
    ORDER BY total DESC
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'generated_at', NOW(),
    'total_profiles', (SELECT COUNT(*) FROM public.profiles),
    'anonymous_profiles', (SELECT COUNT(*) FROM public.profiles WHERE account_kind = 'anonymous'),
    'linked_profiles', (SELECT COUNT(*) FROM public.profiles WHERE account_kind = 'linked'),
    'analytics_opted_in_profiles', (SELECT COUNT(*) FROM public.profiles WHERE analytics_enabled = TRUE),
    'active_users_in_window', (SELECT COUNT(DISTINCT user_id) FROM event_window),
    'returning_users_in_window', (SELECT COUNT(*) FROM user_day_counts WHERE active_days >= 2),
    'total_readings_count', (SELECT COUNT(*) FROM public.household_readings),
    'total_complaint_drafts_count', (SELECT COUNT(*) FROM public.complaint_drafts),
    'published_official_sources_count', (
      SELECT COUNT(*) FROM public.official_sources
      WHERE is_published = TRUE AND data_status IN ('verified', 'archived')
    ),
    'feature_opens_by_day', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('day', day, 'feature', feature, 'count', total)) FROM daily_features),
      '[]'::jsonb
    ),
    'events_by_type', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('event_name', event_name, 'count', total)) FROM event_totals),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_owner_usage_summary(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_usage_summary(INTEGER) TO authenticated;

-- 12. Full Self-Deletion RPC (deletes all personal MoEco records cleanly)
CREATE OR REPLACE FUNCTION public.delete_my_moeco_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.saved_project_notes WHERE user_id = v_uid;
  DELETE FROM public.household_readings WHERE user_id = v_uid;
  DELETE FROM public.complaint_drafts WHERE user_id = v_uid;
  DELETE FROM public.usage_events WHERE user_id = v_uid;
  DELETE FROM public.consents WHERE user_id = v_uid;
  DELETE FROM public.profiles WHERE user_id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_moeco_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_moeco_data() TO authenticated;

-- 13. Retention Cleanup Function for Usage Events (run via pg_cron or SQL Editor)
CREATE OR REPLACE FUNCTION public.prune_old_usage_events(p_retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER := GREATEST(COALESCE(p_retention_days, 90), 7);
  v_deleted INTEGER := 0;
BEGIN
  -- Allow only service_role (auth.uid() IS NULL in SQL Editor / cron) or verified admin
  IF auth.uid() IS NOT NULL AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.usage_events
  WHERE occurred_at < NOW() - make_interval(days => v_days);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_old_usage_events(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_old_usage_events(INTEGER) TO authenticated;
