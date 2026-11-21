import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Leaf, User, Mail, Lock, Globe, MapPin, Building, Sparkles, Loader2, ArrowRight, ShieldCheck, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck as Shield, ShieldAlert, Zap, Droplets } from 'lucide-react';
import { Country, Governorate, City } from '../types';
import { Footer } from '../components/Footer';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { motion, AnimatePresence } from 'framer-motion';

const Register: React.FC = () => {
  const { setUser, language, theme, t } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Registration data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Location data
  const [countries, setCountries] = useState<Country[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("other");
  const [selectedGovernorate, setSelectedGovernorate] = useState("other");
  const [socialBracket, setSocialBracket] = useState('middle');
  const [customCountry, setCustomCountry] = useState("");
  const [customGovernorate, setCustomGovernorate] = useState("");

  const isRtl = language === 'ar';

  useEffect(() => {
    const fetchLocations = async () => {
      const { data: cData } = await supabase.from('countries').select('*').order('name_ar');
      if (cData) setCountries(cData);
      
      const egypt = cData?.find(c => c.name_en === 'Egypt');
      if (egypt) {
        setSelectedCountry(egypt.id);
        const { data: gData } = await supabase.from('governorates').select('*').eq('country_id', egypt.id).order('name_ar');
        if (gData) setGovernorates(gData);
      }
    };
    fetchLocations();
  }, []);

  const handleCountryChange = async (cid: string) => {
    setSelectedCountry(cid);
    setSelectedGovernorate("other");
    if (cid !== 'other') {
      const { data } = await supabase.from('governorates').select('*').eq('country_id', cid).order('name_ar');
      if (data) setGovernorates(data);
    } else {
      setGovernorates([]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(isRtl ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError(isRtl ? "كلمة المرور قصيرة جداً (6 أحرف على الأقل)" : "Password too short (min 6 chars)");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const authData = await storageService.signup({
        email,
        password,
        name,
        phone,
        country_id: selectedCountry !== 'other' ? selectedCountry : null,
        governorate_id: selectedGovernorate !== 'other' ? selectedGovernorate : null,
        social_bracket: socialBracket
      });

      if (authData?.user) {
        if (authData.session) {
          // Immediate login if auto-confirm is enabled
          const profile = await storageService.getUserProfile(authData.user.id);
          const enrichedUser = {
            ...authData.user,
            name: profile?.display_name || authData.user.user_metadata?.full_name || name,
            avatar: profile?.avatar_url || authData.user.user_metadata?.avatar_url,
            points: profile?.points || 0,
            level: profile?.level || 1,
            role: profile?.role || 'user'
          } as any;
          setUser(enrichedUser);
          notificationService.success(isRtl ? "تم التسجيل والدخول بنجاح!" : "Registered and logged in successfully!");
          navigate('/dashboard');
        } else {
          setSuccess(isRtl ? "تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب." : "Account created! Please check your email to verify.");
          notificationService.success(isRtl ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!");
          setTimeout(() => navigate('/login'), 3000);
        }
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === 'USER_ALREADY_EXISTS') {
        setError(isRtl ? "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول." : "This email is already registered. Please login.");
        notificationService.info(isRtl ? "المستخدم موجود بالفعل" : "User already exists");
      } else {
        setError(err.message || (isRtl ? "فشل إنشاء الحساب" : "Registration failed"));
        notificationService.error(err.message || (isRtl ? "فشل إنشاء الحساب" : "Registration failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const RegistrationError = () => {
    const isUserExists = error.includes('already registered') || error.includes('مسجل بالفعل');
    return (
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full p-4 mb-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black flex items-center justify-between gap-3 border border-rose-200 dark:border-rose-500/20">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" /> 
              <span>{error}</span>
            </div>
            {isUserExists && (
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] hover:bg-rose-700 transition-colors"
              >
                {t('login')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Decor */}
      <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-full sm:max-w-[600px] h-[400px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000" />
      <div className="absolute bottom-[-10%] left-[-10%] w-full sm:max-w-[600px] h-[400px] sm:h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000" />

      {/* Main Container - Split View on Large Screens */}
      <div className="w-full max-w-7xl mx-auto min-h-screen sm:min-h-[90vh] flex flex-col lg:flex-row-reverse shadow-2xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl lg:rounded-3xl border border-white/20 dark:border-slate-800">
        
        {/* Right Side / Top on mobile: Branding / Eco Graphic */}
        <div className="hidden lg:flex lg:flex-1 relative flex-col justify-end p-16 bg-gradient-to-br from-amber-500/90 to-emerald-800/90 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative z-10 space-y-8 max-w-md ml-auto text-end">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: 'spring', stiffness: 100 }}
              className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] ml-auto"
            >
              <Zap className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-white leading-tight font-arabic tracking-tight">
                {isRtl ? 'انضم إلى الركب.' : 'Join The Movement.'}
                <br />
                <span className="text-amber-200">{isRtl ? 'اصنع فرقًا' : 'Make an Impact'}</span>
              </h1>
              <p className="text-emerald-50 text-lg font-bold leading-relaxed max-w-md">
                {isRtl 
                  ? 'أنشئ حسابك الآن وابدأ في تتبع بصمتك البيئية، احصل على مكافآت، وكن جزءاً من تحول مصر الأخضر.' 
                  : 'Create your account now to start tracking your footprint, earn rewards, and be part of Egypt\'s sustainable transformation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Left Side / Bottom on mobile: Register Form */}
        <div className="flex-1 flex flex-col relative p-6 sm:p-12 lg:p-16 h-full overflow-y-auto custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-xl mx-auto"
          >
            {/* Mobile Header Logo */}
            <div className="lg:hidden flex flex-col items-center mb-8 text-center pt-8">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-4 text-emerald-500">
                 <Leaf className="w-8 h-8" />
               </div>
               <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">MoEco</h1>
            </div>

            <div className="mb-8 text-center lg:text-start">
              <h2 className="text-3xl lg:text-4xl font-black mb-3 text-slate-800 dark:text-white font-arabic">
                {isRtl ? 'إنشاء حساب جديد' : 'Create Account'}
              </h2>
              <p className="text-slate-500 font-bold">
                {isRtl ? 'خطوتك الأولى نحو الاستدامة الرقمية' : 'Your first step to digital sustainability'}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-4 mb-10">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${step === i ? 'bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-500/20' : i < step ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                    {i < step ? <CheckCircle2 className="w-4 h-4" /> : i}
                  </div>
                  {i === 1 && <div className={`h-1 w-16 rounded-full transition-all duration-500 ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <RegistrationError />
              <AnimatePresence mode="wait">
                {success && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 mb-6 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-black flex items-center gap-3 border border-emerald-200 dark:border-emerald-500/20">
                    <Sparkles className="w-5 h-5 flex-shrink-0" /> {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 1 ? (
                <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('fullName')}</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none border transition-all font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder={isRtl ? "الاسم كامل" : "Full Name"} required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('email')}</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none border transition-all font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder="name@example.com" required />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none border transition-all font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder="+201..." required />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('password')}</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none border transition-all font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder="••••••••" required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none border transition-all font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder="••••••••" required />
                      </div>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={() => setStep(2)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.5)] flex items-center justify-center gap-3 transition-all mt-6">
                    <span className="font-arabic text-lg tracking-tight">{isRtl ? 'الخطوة التالية' : 'Next Step'}</span>
                    <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('country')}</label>
                      <select value={selectedCountry} onChange={e => handleCountryChange(e.target.value)} className="w-full rounded-2xl py-3 px-4 outline-none border appearance-none font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm">
                        <option value="other">{isRtl ? 'اختر الدولة' : 'Select Country'}</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{isRtl ? c.name_ar : c.name_en}</option>)}
                        <option value="other">{isRtl ? 'أخرى' : 'Other'}</option>
                      </select>
                    </div>
                    {selectedCountry === 'other' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{isRtl ? 'اسم الدولة' : 'Country Name'}</label>
                        <input type="text" value={customCountry} onChange={e => setCustomCountry(e.target.value)} className="w-full rounded-2xl py-3 px-4 outline-none border font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder="مصر" />
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('governorate')}</label>
                      <select value={selectedGovernorate} onChange={e => setSelectedGovernorate(e.target.value)} className="w-full rounded-2xl py-3 px-4 outline-none border appearance-none font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm">
                        <option value="other">{isRtl ? 'اختر المحافظة' : 'Select Governorate'}</option>
                        {governorates.map(g => <option key={g.id} value={g.id}>{isRtl ? g.name_ar : g.name_en}</option>)}
                        <option value="other">{isRtl ? 'أخرى' : 'Other'}</option>
                      </select>
                    </div>
                    {selectedGovernorate === 'other' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{isRtl ? 'اسم المحافظة' : 'Gov Name'}</label>
                        <input type="text" value={customGovernorate} onChange={e => setCustomGovernorate(e.target.value)} className="w-full rounded-2xl py-3 px-4 outline-none border font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder="القاهرة" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button type="button" onClick={() => setStep(1)} className="px-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:opacity-80 transition-all font-arabic border border-slate-200 dark:border-slate-700">{t('back')}</button>
                    <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.5)] flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      <span className="font-arabic text-lg tracking-tight">{isRtl ? 'إنشاء الحساب' : 'Create Account'}</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </form>

            <div className="mt-8 text-center text-sm font-bold text-slate-500">
               <span>{isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'}</span>
               <button onClick={() => navigate('/login')} className="text-emerald-600 dark:text-emerald-400 hover:underline decoration-emerald-500/30 underline-offset-4 ml-2 font-black">{t('login')}</button>
            </div>
          </motion.div>
        
        </div>
      </div>
    </div>
  );
};

export default Register;
