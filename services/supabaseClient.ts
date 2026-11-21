import { createClient, SupabaseClient } from '@supabase/supabase-js';

let rawUrl = '';
let rawAnonKey = '';

try {
  // @ts-ignore - Vite browser runtime
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
    // @ts-ignore
    rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch {
  // Ignore when not running under Vite
}

try {
  if ((!rawUrl || !rawAnonKey) && typeof process !== 'undefined' && process.env) {
    rawUrl = rawUrl || process.env.VITE_SUPABASE_URL || '';
    rawAnonKey = rawAnonKey || process.env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch {
  // Ignore in browser without process polyfill
}

const sanitizeSupabaseUrl = (val: string): string => {
  let clean = (val || '').trim();
  if (!clean || clean === 'undefined' || clean === 'null') return '';
  if (clean.endsWith('/')) clean = clean.slice(0, -1);
  if (clean.includes('/rest/v1')) clean = clean.split('/rest/v1')[0];
  return clean;
};

const isPlaceholderValue = (val: string): boolean => {
  const v = (val || '').trim().toLowerCase();
  if (!v) return true;
  return (
    v.includes('your-project') ||
    v.includes('your_project') ||
    v.includes('your-anon-key') ||
    v.includes('example.supabase.co')
  );
};

export const SUPABASE_URL = sanitizeSupabaseUrl(rawUrl);
const SUPABASE_ANON_KEY = (rawAnonKey || '').trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !isPlaceholderValue(SUPABASE_URL) &&
    !isPlaceholderValue(SUPABASE_ANON_KEY) &&
    /^https?:\/\//i.test(SUPABASE_URL),
);

const notConfiguredError = () => ({
  message: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  code: 'SUPABASE_NOT_CONFIGURED',
});

// Safe non-throwing stub when env vars are missing so legacy screens don't crash on import
const createStubQuery = () => {
  const result = { data: null, error: notConfiguredError(), count: 0 };
  const builder: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (val: any) => void) => resolve(result);
        }
        return () => builder;
      },
    },
  );
  return builder;
};

const createUnconfiguredClient = (): any => ({
  from: () => createStubQuery(),
  rpc: async () => ({ data: null, error: notConfiguredError() }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: notConfiguredError() }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: async () => ({ data: null, error: notConfiguredError() }),
    }),
  },
  channel: () => {
    const ch: any = {
      on: () => ch,
      subscribe: () => ch,
      unsubscribe: () => {},
    };
    return ch;
  },
  removeChannel: () => {},
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInAnonymously: async () => ({ data: { user: null, session: null }, error: notConfiguredError() }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: notConfiguredError() }),
    signUp: async () => ({ data: { user: null, session: null }, error: notConfiguredError() }),
    updateUser: async () => ({ data: { user: null }, error: notConfiguredError() }),
    resetPasswordForEmail: async () => ({ data: null, error: notConfiguredError() }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
  },
});

const isServer = typeof window === 'undefined';
let supabaseInstance: SupabaseClient | any = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: !isServer,
        autoRefreshToken: !isServer,
        detectSessionInUrl: !isServer,
        storageKey: 'moeco-auth-token-2026',
      },
    });

    if (!isServer) {
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('Lock broken by another request')) {
          event.preventDefault();
        }
      });
    }
  } catch (e) {
    console.error('[Supabase] Client initialization failed:', e);
    supabaseInstance = createUnconfiguredClient();
  }
} else {
  supabaseInstance = createUnconfiguredClient();
}

export const supabase = supabaseInstance;

let sessionPromise: Promise<any> | null = null;

export const getSafeSession = async () => {
  if (!isSupabaseConfigured) return null;
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session Timeout')), 5000),
      );
      const {
        data: { session },
        error,
      } = (await Promise.race([supabaseInstance.auth.getSession(), timeoutPromise])) as any;
      if (error) return null;
      return session;
    } catch {
      return null;
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
};

export const safeRequest = async <T = any>(
  requestFn: () => Promise<{ data: T | null; error: any }>,
  retries = 1,
  delay = 400,
): Promise<{ data: T | null; error: any }> => {
  if (!isSupabaseConfigured) {
    return { data: null, error: notConfiguredError() };
  }

  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Request Timeout')), 10000),
      );

      const result = (await Promise.race([requestFn(), timeoutPromise])) as any;
      if (!result.error) return result;

      lastError = result.error;
      const errorMsg = lastError?.message || '';
      if (
        (errorMsg.includes('Lock broken') || errorMsg.includes('Failed to fetch')) &&
        i < retries
      ) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      return result;
    } catch (e: any) {
      lastError = e;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      return { data: null, error: e };
    }
  }
  return { data: null, error: lastError };
};

/**
 * Translates Supabase/PostgreSQL/Auth/Free-Tier errors into honest, clear Arabic messages.
 */
export function formatSupabaseErrorAr(err: unknown): string {
  const raw =
    typeof err === 'string'
      ? err
      : (err as any)?.message || (err as any)?.error_description || '';
  const code = String((err as any)?.code || '');
  const status = Number((err as any)?.status || 0);
  const lower = raw.toLowerCase();

  if (code === 'SUPABASE_NOT_CONFIGURED' || lower.includes('not configured')) {
    return 'قاعدة بيانات Supabase غير مهيأة بعد. أضف VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY في ملف البيئة.';
  }
  if (lower.includes('anonymous sign-ins are disabled') || lower.includes('anonymous provider')) {
    return 'تسجيل الدخول المجهول غير مُفعّل في مشروع Supabase. يرجى تفعيله من Authentication -> Providers -> Anonymous في لوحة Supabase.';
  }
  if (
    status === 429 ||
    status === 503 ||
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('insufficient') ||
    lower.includes('project is paused') ||
    lower.includes('egress')
  ) {
    return 'الخدمة السحابية مشغولة حاليًا أو تم بلوغ حد الاستخدام المجاني/توقف المشروع مؤقتًا في Supabase. لن نفترض الحفظ؛ حاول لاحقًا أو صدّر بياناتك احتياطيًا.';
  }
  if (
    lower.includes('already been registered') ||
    lower.includes('already exists') ||
    lower.includes('email_exists') ||
    code === '23505'
  ) {
    return 'هذا البريد الإلكتروني مستخدم أو مسجل مسبقًا بحساب آخر. لم يتم استبدال بياناتك الحالية؛ يمكنك استخدام بريد آخر أو تسجيل الدخول للحساب القائم.';
  }
  if (code === '42501' || lower.includes('row-level security') || lower.includes('forbidden')) {
    return 'لا تملك صلاحية تنفيذ هذا الإجراء أو انتهت جلستك. تأكد من تفعيل الموافقة وجلسة الاستخدام.';
  }
  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    status === 404 ||
    lower.includes('could not find the table') ||
    lower.includes('relation') && lower.includes('does not exist')
  ) {
    return 'جداول MoEco المطلوبة لم تُنشأ بعد في مشروع Supabase المتصل؛ يُرجى تشغيل ملف الترحيل 20261121000000_moeco_core_rls_and_analytics.sql في SQL Editor ثم إعادة المحاولة.';
  }
  if (lower.includes('timeout') || lower.includes('failed to fetch') || lower.includes('network')) {
    return 'تعذر الوصول إلى خادم Supabase (تأكد من الاتصال بالإنترنت أو حالة المشروع). لم يتم حفظ التعديل.';
  }
  return raw ? `تعذر إتمام العملية في Supabase: ${raw}` : 'حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات.';
}

export const validateSystemConnections = async () => {
  return {
    database: isSupabaseConfigured,
    auth: isSupabaseConfigured,
    storage: isSupabaseConfigured,
  };
};
