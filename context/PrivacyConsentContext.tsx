import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  getSafeSession,
  formatSupabaseErrorAr,
} from '../services/supabaseClient';
import {
  supabaseDataService,
  UserPrivacyProfile,
  UsageEventName,
} from '../services/supabaseDataService';

export interface SupabaseAuthIdentity {
  id: string;
  isAnonymous: boolean;
  email: string | null;
}

export interface PrivacyConsentContextValue {
  isConfigured: boolean;
  loading: boolean;
  authUser: SupabaseAuthIdentity | null;
  profile: UserPrivacyProfile | null;
  hasCoreConsent: boolean;
  analyticsEnabled: boolean;
  isOwnerAdmin: boolean;
  adminCheckLoading: boolean;
  consentModalOpen: boolean;
  consentReason: string | null;
  openConsentModal: (reason?: string) => void;
  closeConsentModal: () => void;
  acceptConsentAndSignIn: (options: {
    analyticsOptIn: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  toggleAnalyticsConsent: (enabled: boolean) => Promise<{ ok: boolean; error?: string }>;
  linkEmailAccount: (email: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  trackUsageEvent: (
    eventName: UsageEventName,
    meta?: { feature?: string; status?: string },
  ) => Promise<void>;
  refreshPrivacyState: () => Promise<void>;
  signOutSession: () => Promise<void>;
}

const PrivacyConsentContext = createContext<PrivacyConsentContextValue | undefined>(undefined);

function mapAuthUser(user: any): SupabaseAuthIdentity | null {
  if (!user?.id) return null;
  return {
    id: user.id,
    isAnonymous: Boolean(user.is_anonymous ?? !user.email),
    email: user.email || null,
  };
}

export const PrivacyConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<SupabaseAuthIdentity | null>(null);
  const [profile, setProfile] = useState<UserPrivacyProfile | null>(null);
  const [isOwnerAdmin, setIsOwnerAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentReason, setConsentReason] = useState<string | null>(null);

  const loadForSessionUser = useCallback(async (sessionUser: any | null) => {
    const mapped = mapAuthUser(sessionUser);
    setAuthUser(mapped);

    if (!isSupabaseConfigured || !mapped) {
      setProfile(null);
      setIsOwnerAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setAdminCheckLoading(true);
      const [fetchedProfile, adminFlag] = await Promise.all([
        supabaseDataService.getProfile(mapped.id).catch(() => null),
        supabaseDataService.isCurrentUserAdmin().catch(() => false),
      ]);
      setProfile(fetchedProfile);
      setIsOwnerAdmin(adminFlag);
    } finally {
      setAdminCheckLoading(false);
      setLoading(false);
    }
  }, []);

  const refreshPrivacyState = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setAuthUser(null);
      setProfile(null);
      setIsOwnerAdmin(false);
      setLoading(false);
      return;
    }
    const session = await getSafeSession();
    await loadForSessionUser(session?.user || null);
  }, [loadForSessionUser]);

  useEffect(() => {
    let mounted = true;
    refreshPrivacyState();

    if (!isSupabaseConfigured) return;

    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (!mounted) return;
      loadForSessionUser(session?.user || null);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, [refreshPrivacyState, loadForSessionUser]);

  const openConsentModal = useCallback((reason?: string) => {
    setConsentReason(reason || null);
    setConsentModalOpen(true);
  }, []);

  const closeConsentModal = useCallback(() => {
    setConsentModalOpen(false);
    setConsentReason(null);
  }, []);

  const acceptConsentAndSignIn = useCallback(
    async ({ analyticsOptIn }: { analyticsOptIn: boolean }) => {
      if (!isSupabaseConfigured) {
        return {
          ok: false,
          error: formatSupabaseErrorAr({ code: 'SUPABASE_NOT_CONFIGURED' }),
        };
      }

      try {
        let activeSession = await getSafeSession();
        let currentUser = activeSession?.user || null;

        if (!currentUser) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error || !data?.user) {
            return {
              ok: false,
              error: formatالخادمErrorAr(error || new Error('تعذر إنشاء جلسة مجهولة')),
            };
          }
          currentUser = data.user;
        }

        const mapped = mapAuthUser(currentUser);
        if (!mapped) {
          return { ok: false, error: 'تعذر التحقق من معرّف الجلسة في الخادم.' };
        }

        const savedProfile = await supabaseDataService.upsertConsentProfile({
          userId: mapped.id,
          analyticsEnabled: Boolean(analyticsOptIn),
          accountKind: mapped.isAnonymous ? 'anonymous' : 'linked',
        });

        setAuthUser(mapped);
        setProfile(savedProfile);
        setConsentModalOpen(false);
        setConsentReason(null);
        return { ok: true };
      } catch (err: any) {
        return {
          ok: false,
          error: err?.message || formatSupabaseErrorAr(err),
        };
      }
    },
    [],
  );

  const toggleAnalyticsConsent = useCallback(
    async (enabled: boolean) => {
      if (!isSupabaseConfigured || !authUser) {
        return {
          ok: false,
          error: 'يجب تفعيل جلسة الحفظ الأساسية والموافقة أولًا قبل تعديل تفضيل الإحصاءات.',
        };
      }
      try {
        const updated = await supabaseDataService.updateAnalyticsPreference(authUser.id, enabled);
        setProfile(updated);
        return { ok: true };
      } catch (err: any) {
        return {
          ok: false,
          error: err?.message || formatSupabaseErrorAr(err),
        };
      }
    },
    [authUser],
  );

  const linkEmailAccount = useCallback(
    async (rawEmail: string) => {
      const email = rawEmail.trim();
      if (!isSupabaseConfigured || !authUser) {
        return {
          ok: false,
          error: 'أنشئ جلسة استخدام أولًا قبل ربط البريد الإلكتروني.',
        };
      }
      if (!email || !email.includes('@')) {
        return { ok: false, error: 'يُرجى إدخال بريد إلكتروني صحيح.' };
      }

      try {
        const { data, error } = await supabase.auth.updateUser({ email });
        if (error) {
          return { ok: false, error: formatSupabaseErrorAr(error) };
        }
        if (data?.user) {
          const mapped = mapAuthUser(data.user);
          if (mapped) setAuthUser(mapped);
        }
        await supabaseDataService.updateAccountKind(authUser.id, 'linked');
        if (profile?.analyticsEnabled) {
          await supabaseDataService.logUsageEvent(authUser.id, true, 'account_linked', {
            feature: 'my_data',
            status: 'email_requested',
          });
        }
        await refreshPrivacyState();
        return {
          ok: true,
          message:
            'تم إرسال رسالة تأكيد إلى بريدك الإلكتروني عبر الخادم. بعد فتح الرابط تصبح سجلاتك الحالية مرتبطة ببريدك ويمكن استعادتها على جهاز آخر.',
        };
      } catch (err: any) {
        return { ok: false, error: formatSupabaseErrorAr(err) };
      }
    },
    [authUser, profile?.analyticsEnabled, refreshPrivacyState],
  );

  const hasCoreConsent = Boolean(authUser && profile?.coreConsentAcceptedAt);
  const analyticsEnabled = Boolean(hasCoreConsent && profile?.analyticsEnabled);

  const trackUsageEvent = useCallback(
    async (eventName: UsageEventName, meta?: { feature?: string; status?: string }) => {
      if (!isSupabaseConfigured || !authUser || !hasCoreConsent || !analyticsEnabled) return;
      await supabaseDataService.logUsageEvent(authUser.id, true, eventName, meta);
    },
    [authUser, hasCoreConsent, analyticsEnabled],
  );

  const signOutSession = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
    setIsOwnerAdmin(false);
  }, []);

  return (
    <PrivacyConsentContext.Provider
      value={{
        isConfigured: isSupabaseConfigured,
        loading,
        authUser,
        profile,
        hasCoreConsent,
        analyticsEnabled,
        isOwnerAdmin,
        adminCheckLoading,
        consentModalOpen,
        consentReason,
        openConsentModal,
        closeConsentModal,
        acceptConsentAndSignIn,
        toggleAnalyticsConsent,
        linkEmailAccount,
        trackUsageEvent,
        refreshPrivacyState,
        signOutSession,
      }}
    >
      {children}
    </PrivacyConsentContext.Provider>
  );
};

export function usePrivacyConsent(): PrivacyConsentContextValue {
  const ctx = useContext(PrivacyConsentContext);
  if (!ctx) {
    throw new Error('usePrivacyConsent must be used inside PrivacyConsentProvider');
  }
  return ctx;
}
