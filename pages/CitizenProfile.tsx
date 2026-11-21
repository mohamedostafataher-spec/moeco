import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { 
  User, Shield, Award, Leaf, Zap, Settings,
  QrCode, Share2, Edit3, LogOut, Flame, Sparkles, ShieldCheck,
  Landmark, Crown, Wallet, ChevronRight, Loader2, X,
  MapPin, Camera, Download, History, ArrowRight,
  TrendingUp, Activity, Bell, FileText, Fingerprint, QrCode as QrCodeIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

const CitizenProfile: React.FC = () => {
  const { language, isRtl, user, logout, setUser, theme } = useApp();
  const navigate = useNavigate();
  
  // Dynamic State
  const [profileData, setProfileData] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    full_name: '', 
    governorate: '', 
    city: '',
    phone: '',
    bio: '',
    avatar_url: '',
    cover_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [footprint, setFootprint] = useState({ total: 0, saved: 0 });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rankInfo, setRankInfo] = useState({ rank: '--', total: '--', percentile: 0 });

  const fetchProfileData = async () => {
    if (!user?.id) return;
    try {
      // 1. Core Profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setProfileData(profile);
        setEditData({
          full_name: profile.full_name || '',
          governorate: profile.governorate || '',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || ''
        });
        
        // Update global user context to keep things in sync
        const enrichedUser = { ...user, ...profile, name: profile.full_name || user.name };
        setUser(enrichedUser as any);
      }

      // 2. Rankings
      const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true });
      const { count: higherRanked } = await supabase.from('users').select('id', { count: 'exact', head: true }).gt('points', profile?.points || 0);
      
      const rank = (higherRanked || 0) + 1;
      const total = totalUsers || 1000;
      setRankInfo({
        rank: rank.toString(),
        total: total.toString(),
        percentile: Math.round(((total - rank) / total) * 100)
      });

      // 3. Badges
      const userBadges = await storageService.getUserBadges(user.id);
      setBadges(userBadges);

      // 4. Carbon Aggregate
      const { data: records } = await supabase
        .from('consumption_records')
        .select('co2, sector')
        .eq('user_id', user.id);
      
      if (records) {
        const stats = records.reduce((acc, curr) => ({
          total: acc.total + (curr.co2 > 0 ? curr.co2 : 0),
          saved: acc.saved + (curr.co2 < 0 ? Math.abs(curr.co2) : 0)
        }), { total: 0, saved: 0 });
        setFootprint(stats);
      }

      // 5. Recent Activity
      const { data: recent } = await supabase
        .from('carbon_footprint_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setActivities(recent || []);

    } catch (err) {
      console.error("Profile sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setIsUploadingAvatar(true);
    try {
      const publicUrl = await storageService.uploadImage(file, 'avatars');
      const { error } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (error) throw error;
      
      setProfileData((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      setEditData((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      
      const updatedUser = { ...user, avatar: publicUrl, avatar_url: publicUrl, avatarUrl: publicUrl };
      setUser(updatedUser as any);
      storageService.saveUser(updatedUser as any);
      
      notificationService.success(isRtl ? 'تم تحديث الصورة بنجاح' : 'Avatar updated successfully');
    } catch (err) {
      notificationService.error(isRtl ? 'فشل تحميل الصورة' : 'Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      const publicUrl = await storageService.uploadImage(file, 'covers');
      
      setProfileData((prev: any) => ({ ...prev, cover_url: publicUrl }));
      setEditData((prev: any) => ({ ...prev, cover_url: publicUrl }));
      
      const updatedUser = { ...user, cover_url: publicUrl };
      setUser(updatedUser as any);
      storageService.saveUser(updatedUser as any);
      
      notificationService.success(isRtl ? 'تم تحديث غلاف الصفحة بنجاح' : 'Cover image updated successfully');
    } catch (err) {
      notificationService.error(isRtl ? 'فشل تحميل الغلاف' : 'Cover upload failed');
    }
  };

  useEffect(() => {
    fetchProfileData();
    // Realtime listener for points/profile updates
    const channel = supabase
      .channel(`profile_realtime_${user?.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user?.id}` }, () => {
        fetchProfileData();
      })
      .subscribe();
    
    return () => { channel.unsubscribe(); };
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editData.full_name,
          governorate: editData.governorate,
          city: editData.city,
          phone: editData.phone,
          bio: editData.bio,
          avatar_url: editData.avatar_url
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      const updatedUser = { 
        ...user, 
        full_name: editData.full_name,
        name: editData.full_name, 
        governorate: editData.governorate,
        city: editData.city,
        phone: editData.phone,
        bio: editData.bio,
        avatar_url: editData.avatar_url,
        avatarUrl: editData.avatar_url,
        cover_url: editData.cover_url
      };
      setUser(updatedUser as any);
      storageService.saveUser(updatedUser as any);
      
      notificationService.success(isRtl ? 'تم تحديث البيانات بنجاح' : 'Identity verified & updated');
      setIsEditing(false);
      fetchProfileData();
    } catch (e) {
      notificationService.error(isRtl ? 'فشل التحديث' : 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCertificate = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [16, 185, 129]; // Emerald 500
    const darkColor = [15, 23, 42]; // Slate 900
    
    // Background Frame
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.rect(0, 0, 297, 210, 'F');
    
    // Border
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 273, 186);

    // Decorative Corners (simulating Egyptian style)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.triangle(10, 10, 30, 10, 10, 30, 'F');
    doc.triangle(287, 10, 267, 10, 287, 30, 'F');
    doc.triangle(10, 200, 30, 200, 10, 180, 'F');
    doc.triangle(287, 200, 267, 200, 287, 180, 'F');

    // Header
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(30);
    doc.text('NATIONAL ECO-CITIZEN CERTIFICATE', 148.5, 45, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text('Official recognition of sustainable lifestyle and carbon reduction efforts', 148.5, 55, { align: 'center' });

    // Body
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('This document certifies that', 148.5, 80, { align: 'center' });

    doc.setFontSize(36);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text((profileData?.full_name || 'Citizen User').toUpperCase(), 148.5, 100, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(70, 105, 227, 105);

    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`Has achieved Level ${profileData?.level || 1} with a total savings of ${Math.round(footprint.saved)}kg CO2 emissions`, 148.5, 120, { align: 'center' });
    doc.text(`Current National Rank: #${rankInfo.rank} (Top ${100 - rankInfo.percentile}%)`, 148.5, 130, { align: 'center' });

    // Official Seal area
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(240, 160, 20);
    doc.setFontSize(8);
    doc.text('OFFICIAL SEAL', 240, 161, { align: 'center' });
    doc.text('MO ECO 2026', 240, 165, { align: 'center' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 25, 185);
    doc.text(`Verify ID: ${user?.id?.substring(0, 16).toUpperCase()}`, 25, 190);
    
    doc.text('Ministry of Environment & Digital Economy', 148.5, 190, { align: 'center' });

    doc.save(`MoEco_Certificate_${user?.id?.substring(0, 8)}.pdf`);
    notificationService.success(isRtl ? 'تم تحميل الشهادة بنجاح' : 'Certificate exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: isRtl ? 'النقاط الوطنية' : 'NATIONAL POINTS', value: profileData?.points || 0, icon: Award, color: 'text-amber-500' },
    { label: isRtl ? 'بصمة الكربون' : 'CARBON FOOTPRINT', value: `${Math.round(footprint.total)}kg`, icon: Leaf, color: 'text-rose-500' },
    { label: isRtl ? 'توفير تراكمي' : 'LIFETIME SAVINGS', value: `${Math.round(footprint.saved)}kg`, icon: Zap, color: 'text-emerald-500' },
    { label: isRtl ? 'سجل الالتزام' : 'ACTIVE STREAK', value: profileData?.current_streak || 0, icon: Flame, color: 'text-orange-500' }
  ];

  return (
    <div className={`min-h-screen bg-slate-50 pb-32 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Dynamic Header / National Registry Identity */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-slate-900">
         {profileData?.cover_url && (
            <img 
               src={profileData.cover_url} 
               className="absolute inset-0 w-full h-full object-cover opacity-60" 
               alt="Cover" 
            />
         )}
         <div className="absolute inset-0 opacity-20 egyptian-pattern pointer-events-none" />
         <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-900" />
         
         <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 md:pt-16 lg:pt-20 relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative group">
               <div className={`w-28 h-28 md:w-40 md:h-40 rounded-[1.8rem] md:rounded-[2.5rem] bg-white/5 backdrop-blur-xl p-1 border-2 border-white/20 shadow-2xl relative overflow-hidden group ${isUploadingAvatar ? 'opacity-50' : ''}`}>
                  <img 
                    src={profileData?.avatar_url || (user as any).avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                    className="w-full h-full object-cover rounded-[1.6rem] md:rounded-[2.3rem] transition-transform group-hover:scale-110" 
                    alt="Profile" 
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-white animate-spin" />
                    </div>
                  )}
                  {profileData?.is_verified && !isUploadingAvatar && (
                    <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-white" />
                    </div>
                  )}
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleAvatarUpload} 
                 accept="image/*" 
                 className="hidden" 
               />
               <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 flex md:flex-col gap-1.5 md:gap-2">
                 <button 
                  onClick={() => setIsEditing(true)}
                  className="w-8 h-8 md:w-10 md:h-10 bg-white text-slate-900 rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                 >
                   <Edit3 size={14} />
                 </button>
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 text-white rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform disabled:opacity-50"
                 >
                   <Camera size={14} />
                 </button>
                 <button 
                  onClick={handleDownloadCertificate}
                  className="w-8 h-8 md:w-10 md:h-10 bg-white text-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform hidden sm:flex"
                  title={isRtl ? 'تحميل الشهادة' : 'Download Certificate'}
                 >
                   <Download size={14} />
                 </button>
               </div>
            </div>

            <div className="flex-1 text-center md:text-left rtl:md:text-right space-y-3 md:space-y-4 w-full">
               <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 md:gap-4 overflow-hidden">
                  <h1 className="text-2xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none truncate max-w-full">
                     {profileData?.full_name || 'Citizen User'}
                  </h1>
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                     <ShieldCheck size={12} />
                     {profileData?.is_verified ? (isRtl ? 'هوية موثقة' : 'VERIFIED ID') : (isRtl ? 'مواطن نشط' : 'ACTIVE CITIZEN')}
                  </div>
               </div>
               
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-6 pt-1 md:pt-2">
                  <div className="flex items-center gap-1.5 md:gap-2 text-white/60">
                     <MapPin size={14} className="text-emerald-500" />
                     <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest">
                       {profileData?.governorate || (isRtl ? 'غير محدد' : 'NOT SPECIFIED')}
                     </p>
                  </div>
                  {profileData?.phone && (
                    <div className="flex items-center gap-1.5 md:gap-2 text-white/60">
                       <Bell size={14} className="text-emerald-500" />
                       <p className="text-[10px] md:text-sm font-medium tracking-widest">{profileData.phone}</p>
                    </div>
                  )}
                  <div className="hidden min-[450px]:flex items-center gap-2 text-white/60">
                     <Fingerprint size={14} className="text-emerald-500" />
                     <p className="font-mono text-[10px] opacity-50 tracking-widest">ID: {user?.id?.substring(0, 12).toUpperCase()}</p>
                  </div>
               </div>

               <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mt-4 overflow-x-auto no-scrollbar pb-2">
                  <div className="px-3 md:px-6 py-2 md:py-3 bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/10 text-center flex-shrink-0 min-w-[80px]">
                     <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5 md:mb-1">{isRtl ? 'المستوى' : 'LEVEL'}</p>
                     <p className="text-sm md:text-2xl font-black text-white italic">{profileData?.level || 1}</p>
                  </div>
                  <div className="px-3 md:px-6 py-2 md:py-3 bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/10 text-center flex-shrink-0 min-w-[80px]">
                     <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5 md:mb-1">{isRtl ? 'الترتيب الوطني' : 'NATIONAL RANK'}</p>
                     <p className="text-sm md:text-2xl font-black text-emerald-500 italic">#{rankInfo.rank}</p>
                  </div>
                  <div className="px-3 md:px-6 py-2 md:py-3 bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/10 text-center flex-shrink-0 min-w-[80px]">
                     <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5 md:mb-1">{isRtl ? 'النسبة' : 'PERCENT'}</p>
                     <p className="text-xs md:text-2xl font-black text-amber-500 italic truncate uppercase">top {100 - rankInfo.percentile}%</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 space-y-8">
         
         {/* Live Telemetry Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="bg-white p-4 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center gap-3 md:gap-4 text-center group hover:border-emerald-500 transition-all hover:-translate-y-1"
               >
                  <div className={`p-3 md:p-4 bg-slate-50 ${stat.color} rounded-xl md:rounded-2xl group-hover:rotate-12 transition-transform`}>
                     <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                     <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                     <p className="text-lg md:text-2xl font-black text-slate-900 tabular-nums leading-none">{stat.value}</p>
                  </div>
               </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
               
               {/* Achievement Vault */}
               <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                     <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                           <Crown size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                           <h2 className="text-base md:text-xl font-black italic tracking-tighter uppercase">{isRtl ? 'خزانة الإنجازات الوطنية' : 'NATIONAL ACHIEVEMENT VAULT'}</h2>
                           <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'الأوسمة التي حصلت عليها رسمياً' : 'Official medals & eco honors earned'}</p>
                        </div>
                     </div>
                     <Link to="/leaderboard" className="p-2 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-lg md:rounded-xl transition-colors">
                        <TrendingUp size={16} className="text-slate-400" />
                     </Link>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 md:gap-6">
                     {badges.length > 0 ? badges.map((badge: any, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 md:gap-3 group">
                           <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg group-hover:scale-110 transition-transform">
                              <div className="w-full h-full bg-slate-900 rounded-[1.1rem] md:rounded-[1.4rem] flex items-center justify-center text-amber-500">
                                 <Award className="w-6 h-6 md:w-7 md:h-7" />
                              </div>
                           </div>
                           <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase text-center leading-tight">
                              {badge.badge_type}
                           </p>
                        </div>
                     )) : (
                        <div className="col-span-full py-8 md:py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl md:rounded-3xl">
                           <Award size={32} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No national honors archived yet</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Activity Ledger */}
               <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                     <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                           <Activity size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                           <h2 className="text-base md:text-xl font-black italic tracking-tighter uppercase">{isRtl ? 'سجل العمليات الأخير' : 'RECENT OPERATION LOG'}</h2>
                           <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'آخر التحولات الكربونية الموثقة' : 'Latest verified carbon transitions'}</p>
                        </div>
                     </div>
                     <Link to="/calculation-records" className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">
                        {isRtl ? 'عرض الكل' : 'VIEW FULL LEDGER'}
                     </Link>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                     {activities.length > 0 ? activities.map((item, idx) => (
                        <div key={idx} className="p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                           <div className="flex items-center gap-4 md:gap-5">
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${
                                 item.co2 > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                              }`}>
                                 {item.co2 > 0 ? <Zap size={18} /> : <Leaf size={18} />}
                              </div>
                              <div>
                                 <p className="text-xs md:text-sm font-black italic uppercase leading-none mb-1">{item.activity_type || item.sector}</p>
                                 <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(item.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={`text-xs md:text-sm font-black tabular-nums ${item.co2 > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                 {item.co2 > 0 ? '+' : '-'}{Math.abs(item.co2).toFixed(1)}kg
                              </p>
                              <p className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase tracking-widest">VERIFIED</p>
                           </div>
                        </div>
                     )) : (
                        <div className="py-8 md:py-10 text-center opacity-30 select-none">
                           <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Awaiting system telemetry...</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Sidebar Actions */}
            <aside className="lg:col-span-4 space-y-8">
               
               {/* Digital Pass / Identity Card CTA */}
               <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                     <Landmark size={120} className="text-emerald-500" />
                  </div>
                  <div className="relative z-10 space-y-6">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-lg">
                        <Fingerprint size={12} />
                        <span className="text-[10px] font-black uppercase tracking-tight">NATIONAL ID</span>
                     </div>
                     <h3 className="text-2xl font-black text-white italic leading-tight">
                        {isRtl ? 'بطاقة الهوية الرقمية الخضراء' : 'Unified National Green ID Card'}
                     </h3>
                     <p className="text-white/40 text-xs font-bold leading-relaxed">
                        {isRtl ? 'اعرض هويتك الرقمية الموثقة وشارك إنجازاتك البيئية رسمياً مع الجهات الحكومية.' : 'Display your verified digital identity and officially share your eco achievements with authorities.'}
                     </p>
                     <Link 
                        to="/digital-id" 
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20"
                     >
                        <QrCode size={16} />
                        {isRtl ? 'عرض البطاقة' : 'SHOW DIGITAL PASS'}
                     </Link>
                  </div>
               </div>

               {/* Profile Protocol Controls */}
               <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">{isRtl ? 'إعدادات البروتوكول' : 'IDENTITY PROTOCOLS'}</h4>
                  <div className="space-y-3">
                     {[
                        { to: '/settings', label: isRtl ? 'إعدادات النظام' : 'SYSTEM SETTINGS', icon: Settings, color: 'emerald' },
                        { to: '/wallet', label: isRtl ? 'المحفظة الرقمية' : 'DIGITAL WALLET', icon: Wallet, color: 'blue' },
                        { to: '/impact', label: isRtl ? 'أداء الأثر' : 'IMPACT PERFORMANCE', icon: TrendingUp, color: 'purple' },
                        { to: '/smart-gov', label: isRtl ? 'الخدمات الحكومية' : 'GOV SERVICES', icon: Landmark, color: 'amber' }
                     ].map((item, idx) => (
                        <Link 
                           key={idx}
                           to={item.to}
                           className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100 group"
                        >
                           <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' : item.color === 'blue' ? 'bg-blue-500/10 text-blue-600' : item.color === 'purple' ? 'bg-purple-500/10 text-purple-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                 <item.icon size={18} />
                              </div>
                              <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase">{item.label}</span>
                           </div>
                           <ChevronRight size={14} className="text-slate-300" />
                        </Link>
                     ))}
                  </div>
               </div>

               {/* Terminate Session */}
               <button 
                  onClick={logout}
                  className="w-full p-6 bg-rose-50 text-rose-500 rounded-[2rem] border border-rose-100 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/5 group"
               >
                  <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                  {isRtl ? 'إنهاء الجلسة الرقمية' : 'TERMINATE SESSION'}
               </button>
            </aside>
         </div>
      </div>

      {/* Profile Edit Overlay */}
      <AnimatePresence>
         {isEditing && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
               onClick={() => setIsEditing(false)}
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 max-w-md w-full shadow-2xl relative border border-white flex flex-col max-h-[90vh]"
                  onClick={e => e.stopPropagation()}
               >
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="absolute top-6 right-6 sm:top-8 sm:right-8 p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors z-10"
                  >
                     <X size={20} />
                  </button>

                  <div className="shrink-0">
                     <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase mb-2 sm:mb-4 pr-12">{isRtl ? 'تعديل المعرف' : 'EDIT PROTOCOL'}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 sm:mb-8 leading-relaxed pr-12">
                        {isRtl ? 'قم بتحديث بياناتك الرسمية المسجلة في النظام.' : 'Verify and update your official identity parameters.'}
                     </p>
                  </div>

                  <div className="space-y-4 sm:space-y-6 overflow-y-auto px-1 flex-1 custom-scrollbar">
                     <div className="relative">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-2">{isRtl ? 'الاسم بالكامل' : 'FULL OFFICIAL NAME'}</label>
                        <input 
                           type="text" 
                           value={editData.full_name} 
                           onChange={e => setEditData({...editData, full_name: e.target.value})}
                           className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all"
                        />
                     </div>

                     <div className="relative">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-2">{isRtl ? 'الوصف الشخصي' : 'PERSONAL BIO'}</label>
                        <textarea 
                           rows={3}
                           value={editData.bio} 
                           onChange={e => setEditData({...editData, bio: e.target.value})}
                           className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all resize-none"
                        />
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-2">{isRtl ? 'المحافظة' : 'GOVERNORATE'}</label>
                           <input 
                              type="text" 
                              value={editData.governorate} 
                              onChange={e => setEditData({...editData, governorate: e.target.value})}
                              className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all"
                           />
                        </div>
                        <div className="relative">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-2">{isRtl ? 'المدينة' : 'CITY'}</label>
                           <input 
                              type="text" 
                              value={editData.city} 
                              onChange={e => setEditData({...editData, city: e.target.value})}
                              className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-2">{isRtl ? 'رقم الهاتف' : 'PHONE NUMBER'}</label>
                           <input 
                              type="text" 
                              value={editData.phone} 
                              onChange={e => setEditData({...editData, phone: e.target.value})}
                              className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all"
                           />
                        </div>
                        <div className="relative">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-2">{isRtl ? 'رابط الصورة' : 'AVATAR URL'}</label>
                           <input 
                              type="text" 
                              value={editData.avatar_url} 
                              onChange={e => setEditData({...editData, avatar_url: e.target.value})}
                              placeholder="https://..."
                              className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all"
                           />
                        </div>
                     </div>

                  </div>
                  <div className="pt-4 shrink-0 mt-2">
                     <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-full py-4 sm:py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck size={18} />}
                        {isRtl ? 'حفظ وتوثيق' : 'COMMIT & VERIFY'}
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
};

export default CitizenProfile;
