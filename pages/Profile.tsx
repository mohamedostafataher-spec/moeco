import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Edit3, X, Leaf, Zap, Droplets, Trophy,
  MapPin, Globe, ShieldCheck, Settings, Bell, Accessibility,
  Moon, Sun, Languages, Bus, Activity, ChevronRight, LogOut, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; user: any; onSave: (data: any) => Promise<void> }> = ({ isOpen, onClose, user, onSave }) => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  
  const [formData, setFormData] = useState({
    name: user?.full_name || user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.governorate || user?.city || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user?.full_name || user?.name || '',
        bio: user?.bio || '',
        phone: user?.phone || '',
        location: user?.governorate || user?.city || ''
      });
    }
  }, [isOpen, user]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-black text-white">{isRtl ? 'تعديل الهوية' : 'Edit Identity'}</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-1 space-y-5 custom-scrollbar pb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'الاسم بالكامل' : 'Full Name'}</label>
            <input 
              type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950/50 border border-white/10 text-white outline-none focus:border-emerald-500/50 transition-colors focus:bg-slate-950" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'نبذة' : 'Bio'}</label>
            <textarea 
              value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950/50 border border-white/10 text-white outline-none focus:border-emerald-500/50 transition-colors focus:bg-slate-950 min-h-[100px] resize-none" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'الموقع' : 'Location'}</label>
            <input 
              type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950/50 border border-white/10 text-white outline-none focus:border-emerald-500/50 transition-colors focus:bg-slate-950" 
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex gap-3 shrink-0">
          <button onClick={handleSubmit} disabled={isSaving} className="flex-1 bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRtl ? 'حفظ التحديثات' : 'Save Updates')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Profile: React.FC = () => {
  const { language, theme, setTheme, setLanguage, user, setUser } = useApp();
  const navigate = useNavigate();
  const isRtl = language === 'ar';
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Realtime States
  const [stats, setStats] = useState({
    carbonSaved: 0,
    transportUsage: 0,
    waterSaved: 0,
    rank: 1500,
  });

  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial profile data & stats
    const fetchRealtimeData = async () => {
      try {
        const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (dbUser) {
           setUser({ ...user, ...dbUser });
           storageService.saveUser({ ...user, ...dbUser });
        }

        const { data: records } = await supabase.from('consumption_records').select('*').eq('user_id', user.id);
        if (records) {
           const carbon = records.reduce((acc, r) => acc + (r.co2 < 0 ? Math.abs(r.co2) : 0) + (r.carbon_impact ? Math.abs(r.carbon_impact) : 0), 0);
           const transport = records.filter(r => r.sector === 'transport').length;
           const water = records.filter(r => r.sector === 'water').reduce((acc, r) => acc + (r.value || 0), 0);
           setStats(prev => ({ ...prev, carbonSaved: Math.round(carbon), transportUsage: transport, waterSaved: water }));
        }
      } catch (e) {
        console.error("Profile auto-discovery failed", e);
      }
    };
    fetchRealtimeData();

    // Stream live profile updates
    const sub = supabase.channel('profile_sync_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
         console.log("Realtime Profile Update received:", payload.new);
         setUser(prev => ({ ...prev, ...payload.new as any }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consumption_records', filter: `user_id=eq.${user.id}` }, () => {
         // Silently re-fetch strict stats if a consumption record comes in
         fetchRealtimeData();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setIsUploading(true);
    try {
      const publicUrl = await storageService.uploadImage(file, 'avatars');
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      notificationService.success(isRtl ? 'تم تغيير الصورة بنجاح' : 'Avatar updated seamlessly');
    } catch (err) {
      console.error(err);
      notificationService.error(isRtl ? 'فشل الرفع' : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (data: any) => {
    try {
      const payload = {
        full_name: data.name,
        bio: data.bio,
        phone: data.phone,
        governorate: data.location,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('users').update(payload).eq('id', user.id);
      if (error) throw error;
      notificationService.success(isRtl ? 'تم مزامنة بياناتك' : 'Profile synced globally');
    } catch (e) {
       console.error("Save profile error", e);
       notificationService.error(isRtl ? 'خطأ بالشبكة' : 'Network error');
    }
  };

  const logout = async () => {
    await storageService.logout();
    navigate('/');
  };

  const displayAvatar = user?.avatar_url || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
  const displayName = user?.full_name || user?.name || (isRtl ? 'مواطن ذكي' : 'Smart Citizen');

  return (
    <div className="w-full min-h-screen bg-slate-950 pb-32 pt-6 md:pt-10 px-4 md:px-8 text-white selection:bg-emerald-500/30" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

        {/* TOP COMPONENT: GLASS HEADER */}
        <div className="relative w-full rounded-[2.5rem] md:rounded-[3.5rem] bg-slate-900/40 backdrop-blur-3xl border border-white/5 overflow-hidden shadow-2xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
           {/* Glows */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
           
           {/* AVATAR SYSTEM */}
           <div className="relative shrink-0 group mx-auto md:mx-0">
             <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-slate-800 shadow-2xl overflow-hidden relative z-10 transition-transform duration-500 group-hover:scale-105 ${isUploading ? 'opacity-50' : ''}`}>
                <img src={displayAvatar} alt="Eco Avatar" className="w-full h-full object-cover" />
             </div>
             {/* Circular Progress (Visual Polish) */}
             <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] z-0 -rotate-90 pointer-events-none opacity-50 text-emerald-500">
               <circle cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="300" strokeDashoffset={300 - (300 * Math.min((user?.points || 0), 2000)) / 2000} className="transition-all duration-1000" />
             </svg>
             
             <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
             <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 md:bottom-2 md:right-2 p-3 bg-emerald-500 text-slate-950 rounded-2xl z-20 shadow-xl hover:scale-110 active:scale-95 transition-all text-white disabled:opacity-50">
               <Camera size={20} className="text-slate-950" />
             </button>
           </div>

           {/* DETAILS & ACTIONS */}
           <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-start relative z-10">
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-3xl md:text-5xl font-black tracking-tight">{displayName}</h1>
                 {user?.isVerified && <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-sm md:text-base text-slate-400 font-medium mb-6 max-w-lg leading-relaxed line-clamp-2">
                 {user?.bio || (isRtl ? 'عضو نشط في مجتمع التنقل الأخضر للحفاظ على مصر المستدامة.' : 'Active member of the green mobility network for a sustainable Egypt.')}
              </p>

              {/* Meta Stats Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                 {user?.governorate && (
                   <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                     <MapPin size={14} className="text-emerald-400" />
                     <span className="text-xs font-bold">{user.governorate}</span>
                   </div>
                 )}
                 <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                   <Globe size={14} className="text-blue-400" />
                   <span className="text-xs font-bold">{user?.tier || (isRtl ? 'عضو أساسي' : 'Standard')}</span>
                 </div>
              </div>

              {/* Action Array */}
              <div className="flex w-full md:w-auto items-stretch gap-3">
                 <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-500 text-slate-950 font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs">
                    <Edit3 size={16} />
                    {isRtl ? 'تعديل البيانات' : 'Edit Profile'}
                 </button>
                 <button onClick={logout} className="px-6 py-3.5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs">
                    <LogOut size={16} />
                    <span className="hidden md:inline">{isRtl ? 'خروج' : 'Logout'}</span>
                 </button>
              </div>
           </div>
        </div>

        {/* AI INSIGHTS 2040 */}
        <div className="w-full bg-slate-900/40 backdrop-blur-3xl border border-emerald-500/20 rounded-[2.5rem] p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden flex items-center gap-5">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center shrink-0 relative z-10">
            <Zap className="text-emerald-400 w-7 h-7 animate-pulse" />
          </div>
          <div className="relative z-10 w-full overflow-hidden">
            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">{isRtl ? 'تحليل هويتك البيئية' : 'Eco Identity Insight'}</h3>
            <p className="text-xs md:text-sm font-semibold text-slate-300 leading-relaxed truncate">
              {isRtl ? 'نمط تنقلك يظهر اعتمادية على المترو. استمر لتقليل 40 كجم من الكربون هذا الشهر.' : 'Your mobility pattern shows high Metro dependency. Keep it up to save 40kg of Carbon.'}
            </p>
          </div>
        </div>

        {/* ANALYTICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group">
              <Leaf className="text-emerald-500 mb-4 h-8 w-8 opacity-80 group-hover:scale-110 transition-transform" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mb-1">{isRtl ? 'كربون مدخر' : 'Carbon Saved'}</p>
                 <h3 className="text-3xl font-black text-white">{stats.carbonSaved} <span className="text-sm font-bold text-emerald-500">kg</span></h3>
              </div>
           </div>
           
           <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group">
              <Bus className="text-blue-500 mb-4 h-8 w-8 opacity-80 group-hover:scale-110 transition-transform" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 mb-1">{isRtl ? 'رحلات ذكية' : 'Smart Trips'}</p>
                 <h3 className="text-3xl font-black text-white">{stats.transportUsage}</h3>
              </div>
           </div>

           <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group">
              <Activity className="text-amber-500 mb-4 h-8 w-8 opacity-80 group-hover:scale-110 transition-transform" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-1">{isRtl ? 'الترتيب العام' : 'Global Rank'}</p>
                 <h3 className="text-3xl font-black text-white">#{stats.rank}</h3>
              </div>
           </div>

           <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group">
              <Zap className="text-purple-500 mb-4 h-8 w-8 opacity-80 group-hover:scale-110 transition-transform" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-purple-500/70 mb-1">{isRtl ? 'مستوى الطاقة' : 'Energy Level'}</p>
                 <h3 className="text-3xl font-black text-white">{user?.level || 1}</h3>
              </div>
           </div>
        </div>

        {/* SETTINGS CENTER */}
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-xl">
           <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <Settings className="text-emerald-500" />
              {isRtl ? 'مركز الضبط الذكي' : 'Smart Control Center'}
           </h3>
           
           <div className="space-y-4">
              {/* Option 1: Accessibility */}
              <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300">
                       <Accessibility size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm">{isRtl ? 'ذوي الهمم وإمكانية الوصول' : 'Accessibility options'}</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isRtl ? 'إدارة التفضيلات' : 'Manage preferences'}</p>
                    </div>
                 </div>
                 <ChevronRight size={18} className={`text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
              </div>

              {/* Option 2: Language */}
              <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300">
                       <Languages size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm">{isRtl ? 'لغة النظام' : 'System Language'}</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{language === 'ar' ? 'العربية' : 'English'}</p>
                    </div>
                 </div>
                 <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-black uppercase hover:bg-emerald-500 hover:text-slate-950 transition-colors">
                    {isRtl ? 'تغيير' : 'Switch'}
                 </button>
              </div>

              {/* Option 2: Theme */}
              <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300">
                       {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                       <h4 className="font-bold text-sm">{isRtl ? 'مظهر واجهة المستخدم' : 'UI Appearance'}</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{theme === 'dark' ? (isRtl ? 'داكن' : 'Dark Mode') : (isRtl ? 'مضيء' : 'Light Mode')}</p>
                    </div>
                 </div>
                 <div className="bg-slate-900 border border-white/10 rounded-xl p-1 flex">
                    <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-colors ${theme === 'light' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>Light</button>
                    <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-colors ${theme === 'dark' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>Dark</button>
                 </div>
              </div>

              {/* Option 3: Notifications */}
              <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors opacity-70">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300">
                       <Bell size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm">{isRtl ? 'إشعارات النظام' : 'System Notifications'}</h4>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isRtl ? 'مفعلة' : 'Enabled'}</p>
                    </div>
                 </div>
                 {/* Push Notifications Toggle */}
                 <div className="w-10 h-5 bg-emerald-500 rounded-full cursor-not-allowed flex justify-end items-center px-1"><div className="w-3.5 h-3.5 bg-white rounded-full"></div></div>
              </div>
           </div>
        </div>

      </div>

      <AnimatePresence>
         <EditProfileModal isOpen={isEditing} onClose={() => setIsEditing(false)} user={user} onSave={handleSaveProfile} />
      </AnimatePresence>
    </div>
  );
};

export default Profile;
