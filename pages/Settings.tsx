
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { carbonDataService } from '../services/carbonDataService';
import { User as UserIcon, Camera, MapPin, LogOut, Save, Smartphone, Moon, Sun as SunIcon, ShieldCheck, Check, Globe, Layout, Palette, Phone, Loader2, Trash2, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../services/notificationService';
import { civicActionService } from '../services/civicActionService';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  const { 
    t, user, setUser, language, setLanguage, theme, toggleTheme, 
    userCountry, setUserCountry, isRtl
  } = useApp();
  
  const [name, setName] = useState(user?.name || "");
  const [fullName, setFullName] = useState((user as any)?.full_name || "");
  const [phone, setPhone] = useState((user as any)?.phone_number || "");
  const [bio, setBio] = useState((user as any)?.bio || "");
  const [country, setCountry] = useState(userCountry || "EG");
  const [governorate, setGovernorate] = useState(user?.governorate || "Cairo");
  const [city, setCity] = useState(user?.city || "Maadi");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [socialBracket, setSocialBracket] = useState(user?.socialBracket || "middle");
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [confirmClearLocal, setConfirmClearLocal] = useState(false);

  const handleDetectCountry = async () => {
    setDetecting(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.country_name) {
        setUserCountry(data.country_code);
        localStorage.setItem('moeco_country', data.country_code);
        notificationService.success(`Detected: ${data.country_name}`);
      }
    } catch (e) {
      notificationService.error("Location detection failed");
    } finally {
      setDetecting(false);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countries, setCountries] = useState<{id: string, label: string}[]>([]);
  const [governorates, setGovernorates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');

  useEffect(() => {
    const fetchCountries = async () => {
      const c = await carbonDataService.getCountries();
      setCountries(c.map(country => ({ id: country, label: t(country.toLowerCase()) || country })));
    };
    fetchCountries();
  }, [language, t]);

  useEffect(() => {
    const fetchGovs = async () => {
      const govs = await carbonDataService.getGovernoratesByCountry(country);
      setGovernorates(govs);
    };
    fetchGovs();
  }, [country]);

  useEffect(() => {
    const fetchCities = async () => {
      const cts = await carbonDataService.getCitiesByGovernorate(governorate);
      setCities(cts);
    };
    fetchCities();
  }, [governorate]);

  const handleSave = async () => {
    if (!user) return;
    try {
      const updatedUser: any = { 
        ...user, name, full_name: fullName, phone_number: phone, bio,
        country, governorate, city, avatar, socialBracket,
        language, theme
      };
      await storageService.saveUser(updatedUser);
      setUser(updatedUser);
      setUserCountry(country);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      notificationService.success(isRtl ? 'تم حفظ التعديلات' : 'Settings archived');
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

  return (
    <div className="min-h-screen pb-32 space-y-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. HERO HEADER */}
      <div className="relative bg-slate-900 rounded-[3rem] p-12 overflow-hidden shadow-2xl mx-4 mt-4">
         <div className="egyptian-pattern absolute inset-0 opacity-[0.05]" />
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4">
               <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-eco-green/10 rounded-full border border-eco-green/20">
                  <ShieldCheck size={14} className="text-eco-green" />
                  <span className="text-[10px] font-black text-eco-green uppercase tracking-widest">{isRtl ? 'لوحة التحكم بالنظام' : 'System Control Panel'}</span>
               </div>
               <h1 className="text-5xl font-black text-white italic tracking-tighter">
                  {isRtl ? 'إعدادات المواطنة الرقمية' : 'Digital Settings'}
               </h1>
               <p className="text-slate-400 font-bold max-w-lg">{isRtl ? 'قم بتخصيص هويتك الرقمية وتفضيلات النظام لتعزيز كفاءتك البيئية.' : 'Customize your digital identity and system preferences to boost your eco-efficiency.'}</p>
            </div>
            <div className="flex bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
               {[
                 { id: 'profile', label: isRtl ? 'الهوية' : 'Identity' },
                 { id: 'preferences', label: isRtl ? 'التفضيلات' : 'Preferences' }
               ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                     activeTab === tab.id ? 'bg-eco-green text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                 >
                    {tab.label}
                 </button>
               ))}
            </div>
         </div>
      </div>

      <div className="px-4 grid grid-cols-1 md:grid-cols-12 gap-10">
         {/* 2. MAIN FORM AREA */}
         <div className="md:col-span-8">
            <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-slate-100 shadow-xl space-y-12">
               <AnimatePresence mode="wait">
                  {activeTab === 'profile' ? (
                    <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                       {/* AVATAR SECTION */}
                       <div className="flex flex-col items-center gap-6">
                          <div className="relative group">
                             <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 p-1 border-2 border-slate-100 overflow-hidden shadow-2xl group-hover:border-eco-green transition-all">
                                <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover" />
                             </div>
                             <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center border-4 border-white hover:bg-eco-green transition-all shadow-lg">
                                <Camera size={16} />
                             </button>
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setAvatar(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                             }} />
                          </div>
                          <div className="text-center">
                             <h4 className="text-xl font-black text-slate-800 tracking-tight">{name || 'Citizen'}</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: #{user?.id?.slice(0, 8)}</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isRtl ? 'اسم المعرف' : 'Alias'}</label>
                             <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none border-2 border-transparent focus:border-eco-green transition-all" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isRtl ? 'الاسم الكامل' : 'Full Identity'}</label>
                             <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none border-2 border-transparent focus:border-eco-green transition-all" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isRtl ? 'رقم الهاتف' : 'Contact Frequency'}</label>
                             <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none border-2 border-transparent focus:border-eco-green transition-all" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isRtl ? 'الطبقة المستهدفة' : 'National Bracket'}</label>
                             <select value={socialBracket} onChange={e => setSocialBracket(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none border-2 border-transparent focus:border-eco-green transition-all appearance-none">
                                <option value="low">Tier 3 (Subsidized)</option>
                                <option value="middle">Tier 2 (Standard)</option>
                                <option value="high">Tier 1 (Premium)</option>
                             </select>
                          </div>
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div key="prefs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-50 p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                             <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRtl ? 'لغة النظام' : 'Language'}</h5>
                                <p className="text-lg font-black text-slate-800">{language === 'ar' ? 'العربية' : 'English'}</p>
                             </div>
                             <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="px-6 py-3 bg-white rounded-xl font-black text-xs shadow-sm hover:bg-eco-green group-hover:scale-105 transition-all">
                                {language === 'ar' ? 'EN' : 'عربي'}
                             </button>
                          </div>
                          <div className="bg-slate-50 p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                             <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRtl ? 'السمة البصرية' : 'Theme'}</h5>
                                <p className="text-lg font-black text-slate-800 uppercase">{theme}</p>
                             </div>
                             <button onClick={toggleTheme} className="p-4 bg-white rounded-xl shadow-sm hover:bg-eco-green group-hover:scale-105 transition-all">
                                {theme === 'dark' ? <Moon size={20} /> : <SunIcon size={20} />}
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>

               <div className="pt-12 border-t border-slate-100 flex justify-end gap-6">
                  <button onClick={handleSave} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-eco-green transition-all shadow-xl hover:scale-105 flex items-center gap-3">
                     {saved ? <Check size={20} /> : <Save size={20} />}
                     {saved ? (isRtl ? 'تم الحفظ' : 'Archived') : (isRtl ? 'حفظ التعديلات' : 'Commit Changes')}
                  </button>
               </div>
            </div>
         </div>

         {/* 3. SIDEBAR HELP */}
         <aside className="md:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white overflow-hidden relative group">
               <div className="egyptian-pattern absolute inset-0 opacity-[0.03]" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4 text-eco-green">
                     <ShieldCheck size={32} />
                     <h4 className="text-[10px] font-black uppercase tracking-widest">{isRtl ? 'منظومة الأمان' : 'Security Shield'}</h4>
                  </div>
                  <p className="text-sm font-bold text-white/60 leading-relaxed italic">
                     {isRtl ? 'يتم تشفير كافة بياناتك الشخصية ضمن بروتوكولات الأمان الوطنية للشركة المصرية.' : 'All your personal data is encrypted within the national security protocols of the Egyptian Company.'}
                  </p>
                  <button className="w-full py-4 border-2 border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
                     {isRtl ? 'تحميل بياناتي' : 'Export Data Log'}
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الموقع النشط' : 'Active Jurisdiction'}</h4>
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-eco-green transition-all uppercase">
                     <p className="text-[9px] font-black text-slate-400">Country</p>
                     <p className="font-black text-slate-800">{country}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-eco-green transition-all uppercase">
                     <p className="text-[9px] font-black text-slate-400">Governorate</p>
                     <p className="font-black text-slate-800">{governorate}</p>
                  </div>
               </div>
               <button onClick={handleDetectCountry} disabled={detecting} className="w-full py-4 bg-eco-green/10 text-eco-green rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-eco-green hover:text-white transition-all">
                  {detecting ? <Loader2 className="animate-spin mx-auto" /> : (isRtl ? 'تحديث الموقع' : 'Geosync Now')}
               </button>
            </div>

            {/* Privacy & Local Civic Data Management */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/10 text-white space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <EyeOff size={20} />
                <h4 className="text-sm font-black">
                  {isRtl ? 'الخصوصية وإدارة البلاغات والبيانات' : 'Privacy & Civic Data Controls'}
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isRtl
                  ? 'مشاركة الموقع والصورة اختيارية وتُقرب الإحداثيات تلقائياً في العرض العام. يمكنك إخفاء اسمك أو حذف أي بلاغ من صفحة «بلاغاتي» أو مسح بياناتك المحلية هنا.'
                  : 'Location and photos are opt-in and rounded publicly. You can anonymize or delete any report in My Reports, or clear local civic entries here.'}
              </p>
              <Link
                to="/eco-watch"
                className="min-h-[44px] w-full flex items-center justify-center rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                {isRtl ? 'إدارة بلاغاتي (حذف / إخفاء الاسم)' : 'Manage My Reports'}
              </Link>

              {!confirmClearLocal ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearLocal(true)}
                  className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs font-bold text-rose-200 hover:bg-rose-500/25 transition"
                >
                  <Trash2 size={15} />
                  <span>{isRtl ? 'مسح سجلاتي المحلية (بلاغات / تدوير / تحديات)' : 'Clear My Local Civic Data'}</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-400/40 space-y-2">
                  <p className="text-[11px] font-bold text-rose-200">
                    {isRtl ? 'هل تريد حذف جميع بلاغاتك وسجلات التدوير والتحديات المحفوظة على هذا الجهاز؟' : 'Confirm deleting all local civic records on this device?'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        civicActionService.clearMyLocalCivicData(user?.id || 'guest-user-2026');
                        setConfirmClearLocal(false);
                        notificationService.success(isRtl ? 'تم مسح البيانات المجتمعية المحلية بنجاح.' : 'Local civic data cleared.');
                      }}
                      className="min-h-[44px] flex-1 rounded-xl bg-rose-500 text-white text-xs font-black hover:bg-rose-400 transition"
                    >
                      {isRtl ? 'تأكيد المسح' : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearLocal(false)}
                      className="min-h-[44px] flex-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
         </aside>
      </div>
    </div>
  );
};

export default Settings;

