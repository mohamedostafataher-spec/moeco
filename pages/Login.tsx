
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Leaf, Mail, Lock, User, Sparkles, AlertCircle, Loader2, Key, ArrowRight, ShieldCheck, MapPin, Globe, Zap, ShieldAlert, Droplets } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Footer } from '../components/Footer';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC = () => {
  const { setUser, language, theme, t } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'forgot' | 'recovery'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [connStatus, setConnStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const isRtl = language === 'ar';

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { error } = await supabase.from('countries').select('id').limit(1);
        if (error) throw error;
        setConnStatus('online');
      } catch (err) {
        setConnStatus('offline');
      }
    };
    checkSupabase();
  }, []);

  // Supabase puts the recovery token in the URL hash; the client emits
  // PASSWORD_RECOVERY once it consumes it. Land the user on the reset form.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery');
        setError('');
        setSuccess('');
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === 'login') {
        const loggedUser = await storageService.login(email.trim(), password.trim());
        if (loggedUser) {
          setUser(loggedUser);
          notificationService.success(isRtl ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
          setSuccess(isRtl ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
          setTimeout(() => navigate('/dashboard'), 800);
        }
      } else if (mode === 'recovery') {
        if (password.trim().length < 6) {
          throw new Error(isRtl ? 'كلمة المرور لازم تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
        }
        const { error: updateError } = await supabase.auth.updateUser({ password: password.trim() });
        if (updateError) throw updateError;
        notificationService.success(isRtl ? 'تم تحديث كلمة المرور!' : 'Password updated!');
        setSuccess(isRtl ? 'تم تحديث كلمة المرور! سجّل دخولك بها الآن.' : 'Password updated! Log in with it now.');
        setPassword('');
        setTimeout(() => setMode('login'), 2500);
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetError) throw resetError;
        
        notificationService.info(isRtl ? "تم إرسال تعليمات الاستعادة لبريدك!" : "Recovery instructions sent!");
        setSuccess(isRtl ? "تم إرسال تعليمات الاستعادة لبريدك!" : "Recovery instructions sent!");
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      console.error("DEBUG: Login error details:", err);
      let msg = err.message || (isRtl ? "فشل تسجيل الدخول" : "Login failed");
      
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('not found') || msg.includes('غير صحيحة')) {
        msg = isRtl ? "بيانات الدخول غير صحيحة" : "Invalid login credentials";
      } else if (msg.includes('Email not confirmed')) {
        msg = isRtl ? "يرجى تأكيد بريدك الإلكتروني أولاً" : "Please confirm your email first";
      }
      
      setError(msg);
      notificationService.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] flex items-center justify-center relative transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Decor */}
      <div className="fixed inset-0 cyber-grid opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-full sm:max-w-[600px] h-[400px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000" />
      <div className="fixed bottom-[-10%] left-[-10%] w-full sm:max-w-[600px] h-[400px] sm:h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000" />

      {/* Main Container - Split View on Large Screens */}
      <div className="min-h-[100dvh] sm:min-h-0 w-full sm:max-w-7xl mx-auto sm:my-8 flex flex-col lg:flex-row sm:shadow-2xl sm:rounded-3xl border-0 sm:border border-white/20 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 sm:backdrop-blur-3xl overflow-hidden relative z-10">
        
        {/* Left Side: Branding / Eco Graphic */}
        <div className="hidden lg:flex lg:flex-1 relative flex-col justify-end p-16 bg-gradient-to-br from-emerald-600/90 to-sky-800/90 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative z-10 space-y-8 max-w-md">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: 'spring', stiffness: 100 }}
              className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              <Leaf className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-white leading-tight font-arabic tracking-tight">
                {isRtl ? 'مستقبل مستدام.' : 'Sustainable Future.'}
                <br />
                <span className="text-emerald-200">{isRtl ? 'يبدأ من هنا' : 'Starts Here.'}</span>
              </h1>
              <p className="text-emerald-50 text-lg font-bold leading-relaxed max-w-md">
                {isRtl 
                  ? 'منصة مو-إيكو تجمع بين التكنولوجيا المتقدمة والهوية المصرية لدعم قراراتك البيئية وبناء مدن أذكى.' 
                  : 'MoEco combines advanced technology with Egyptian identity to empower your eco-friendly decisions and build smarter cities.'}
              </p>
            </div>
            
            <div className="flex gap-4 pt-8">
              {/* Badges */}
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-2 text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-black uppercase tracking-widest">{isRtl ? 'آمن ومدعوم حكومياً' : 'Secure & Govt Backed'}</span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-2 text-white">
                <Droplets className="w-4 h-4 text-sky-300" />
                <span className="text-xs font-black uppercase tracking-widest">{isRtl ? 'تحليل لحظي' : 'Real-time Analytics'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex flex-col justify-center relative p-6 sm:p-12 lg:p-16 overflow-y-auto custom-scrollbar">
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-4 z-50">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              <div className={`w-2 h-2 rounded-full ${connStatus === 'online' ? 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-rose-500'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Database</span>
            </div>
            <LanguageSwitcher />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Mobile Header Logo */}
            <div className="lg:hidden flex flex-col items-center mb-10 text-center">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-4 text-emerald-500">
                 <Leaf className="w-8 h-8" />
               </div>
               <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">MoEco</h1>
            </div>

            <div className="mb-10 text-center lg:text-start">
              <h2 className="text-3xl lg:text-4xl font-black mb-3 text-slate-800 dark:text-white font-arabic">
                {mode === 'login' ? t('welcomeBack') : mode === 'recovery' ? (isRtl ? 'كلمة مرور جديدة' : 'New Password') : (isRtl ? 'استعادة الحساب' : 'Reset Access')}
              </h2>
              <p className="text-slate-500 font-bold">
                {mode === 'login' 
                  ? (isRtl ? 'قم بتسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك.' : 'Log in to access your intelligent eco-dashboard.') 
                  : mode === 'recovery'
                    ? (isRtl ? 'اكتب كلمة المرور الجديدة لحسابك.' : 'Type the new password for your account.')
                    : (isRtl ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة.' : 'Enter your email to receive recovery instructions.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black flex items-center gap-3 border border-rose-200 dark:border-rose-500/20"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-black flex items-center gap-3 border border-emerald-200 dark:border-emerald-500/20"
                  >
                    <Sparkles className="w-5 h-5 flex-shrink-0" />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode !== 'recovery' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('email')}</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full rounded-2xl py-4 pl-12 pr-4 outline-none border transition-all font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                    placeholder="name@example.com"
                    required 
                  />
                </div>
              </div>
              )}

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('password')}</label>
                    {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:underline decoration-emerald-500/30 underline-offset-4">
                      {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full rounded-2xl py-4 pl-12 pr-4 outline-none border transition-all font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                      placeholder="••••••••"
                      required 
                    />
                  </div>
                </div>
              )}

              <motion.button 
                whileTap={{ scale: 0.97 }}
                type="submit" 
                disabled={loading} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.5)] flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="font-arabic text-lg tracking-tight">{mode === 'login' ? t('login') : mode === 'recovery' ? (isRtl ? 'تعيين كلمة المرور الجديدة' : 'Set New Password') : (isRtl ? 'إرسال رابط الاستعادة' : 'Send Recovery Link')}</span>
                    <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center space-y-4">
               {mode === 'forgot' && (
                 <button onClick={() => setMode('login')} className="text-slate-500 dark:text-slate-400 text-xs font-black hover:text-emerald-600 transition-colors block mx-auto">
                   {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                 </button>
               )}
               
               <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] uppercase font-black tracking-widest">{isRtl ? 'أو' : 'OR'}</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
               </div>

               <button 
                 type="button"
                 onClick={() => navigate('/register')} 
                 className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black py-4 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all text-lg font-arabic shadow-sm"
               >
                 {isRtl ? 'إنشاء حساب جديد' : 'Create New Account'}
               </button>
            </div>
            
          </motion.div>
          {/* Main Footer inline at the bottom */}
          <div className="mt-8 lg:mt-auto pt-6 w-full text-center">
             <Footer language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

