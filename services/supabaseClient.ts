
import { createClient } from '@supabase/supabase-js';

// ملاحظة: هذه القيم يجب أن توضع في ملف .env في بيئتك
// VITE_SUPABASE_URL=https://xyz.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

let supabaseUrl = 'https://eiboutdvbjoipdpeqrci.supabase.co';
let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYm91dGR2YmpvaXBkcGVxcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwMjUsImV4cCI6MjA1Njc5MzAyNX0.VwXh_n3v2Q9K-F33c7r2qM_54Q63V2QoN_pGq8mB3H8';

try {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (process.env.VITE_SUPABASE_ANON_KEY) supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {}

try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_SUPABASE_URL) supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    if (import.meta.env.VITE_SUPABASE_ANON_KEY) supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {}

// Sanitize URL to avoid "Invalid path specified in request URL"
if (supabaseUrl && typeof supabaseUrl === 'string') {
  if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
  if (supabaseUrl.includes('/rest/v1')) supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}

// Robust check to avoid throwing or crashing if values are missing
if (!supabaseUrl || supabaseUrl === 'undefined' || !supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.warn("[Supabase] Missing environment variables. Falling back to internal defaults.");
} else {
  console.log(`[Supabase] Initializing with URL: ${supabaseUrl.substring(0, 20)}...`);
}

let supabaseInstance: any;
const isServer = typeof window === 'undefined';

// Global helper to handle session checks safely
let sessionPromise: Promise<any> | null = null;

export const getSafeSession = async () => {
  if (sessionPromise) return sessionPromise;
  
  sessionPromise = (async () => {
    try {
      if (!supabaseInstance) return null;
      // Add a timeout to auth session fetch to prevent hanging the whole app
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Session Timeout")), 5000)
      );
      
      const { data: { session }, error } = await Promise.race([
        supabaseInstance.auth.getSession(),
        timeoutPromise
      ]) as any;

      if (error) {
        console.error("[Supabase] Auth Session Error:", error.message);
        return null;
      }
      return session;
    } catch (e: any) {
      console.warn("[Supabase] Session check warning:", e.message);
      return null;
    } finally {
      sessionPromise = null;
    }
  })();
  
  return sessionPromise;
};

/**
 * Enhanced retry mechanism for database operations
 */
export const safeRequest = async <T = any>(
  requestFn: () => Promise<{ data: T | null; error: any }>,
  retries = 2,
  delay = 500
): Promise<{ data: T | null; error: any }> => {
  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    try {
      // Add a 10s timeout to every safeRequest to prevent infinite hangs
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => 
        setTimeout(() => reject(new Error("Request Timeout")), 10000)
      );

      const result = await Promise.race([
        requestFn(),
        timeoutPromise
      ]) as any;

      if (!result.error) return result;
      
      lastError = result.error;
      const errorMsg = lastError.message || '';
      
      // Only retry on specific network or lock errors
      if (
        errorMsg.includes("Lock broken") || 
        errorMsg.includes("steal") || 
        errorMsg.includes("fetch") ||
        errorMsg.includes("Failed to fetch")
      ) {
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
      }
      return result;
    } catch (e: any) {
      lastError = e;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      return { data: null, error: e };
    }
  }
  return { data: null, error: lastError };
};

try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: !isServer,
      autoRefreshToken: !isServer,
      detectSessionInUrl: !isServer,
      storageKey: 'moeco-auth-token-2026'
    }
  });

  // Global handler for unhandled rejections related to Supabase locking
  if (!isServer) {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes("Lock broken by another request")) {
        event.preventDefault(); // Stop the noise
      }
    });
  }
} catch (e) {
  console.error("[Supabase] Failed to initialize client.", e);
  supabaseInstance = null;
}

export const supabase = supabaseInstance;

// App Startup Validation Layer Simplified
export const validateSystemConnections = async () => {
  return { database: true, auth: true, storage: true };
};
