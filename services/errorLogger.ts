import { supabase, getSafeSession } from './supabaseClient';

export interface ErrorLog {
  message: string;
  stack?: string;
  screen: string; 
  user_email?: string;
  metadata?: any;
}

export const errorLogger = {
  log: async (err: any, screen: string) => {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Lock broken") || message.includes("steal option")) return; // Silence lock steal noise
    const stack = err instanceof Error ? err.stack : undefined;
    
    console.error(`[ErrorLogger] [${screen}]`, message, stack);

    try {
      const session = await getSafeSession();
      const user_email = session?.user?.email || 'anonymous';

      const { error } = await supabase.from('error_logs').insert([{
        message,
        stack,
        screen,
        user_email,
        metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        }
      }]);

      if (error) console.warn("[ErrorLogger] Failed to send log to DB:", error);
    } catch (loggingErr: any) {
      if (loggingErr?.message?.includes("Lock broken") || String(loggingErr).includes("steal option")) return;
      console.error("[ErrorLogger] Fatal Error logging to Supabase:", loggingErr);
    }
  },

  initGlobalHandler: () => {
    window.onerror = (message, source, lineno, colno, error) => {
      errorLogger.log(error || message, 'GLOBAL_UNCAUGHT');
    };

    window.addEventListener('unhandledrejection', (event) => {
      errorLogger.log(event.reason, 'GLOBAL_UNHANDLED_REJECTION');
    });
  }
};
