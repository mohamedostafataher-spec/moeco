import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Family, User } from '../types';
import { 
  Users, Trophy, TrendingDown, ShieldCheck, Plus, Target, 
  UserPlus, Share2, Award, Activity, Zap, Droplets, Flame,
  ChevronRight, LayoutGrid, History, Loader2, Sparkles, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

const FamilyHub: React.FC = () => {
  const { language, user: currentUser, setUser, theme } = useApp();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [familyActivity, setFamilyActivity] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [weatherAdvice, setWeatherAdvice] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetchFamilyData();
    fetchLeaderboard();

    // Realtime listeners for family data
    const channel = supabase.channel('family_hub_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families' }, () => fetchFamilyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members' }, () => fetchFamilyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_goals' }, () => fetchFamilyData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const fetchFamilyData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const f = await storageService.getFamily(currentUser.id);
      if (f) {
        setFamily(f);
        const m = await storageService.getFamilyMembers(f.id);
        const memberList = (m || []).map((member: any) => ({
          ...(member.user || {}),
          role: member.role
        }));
        setMembers(memberList);
        
        // Activity Log from points transactions of members
        const { data: activityData } = await supabase
          .from('points_transactions')
          .select('*, user:user_id(full_name)')
          .in('user_id', memberList.map(mem => mem.id))
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (activityData) setFamilyActivity(activityData);

        const goals = await storageService.getFamilyGoals(f.id);
        setChallenges(goals);
      }
    } catch (err) {
      console.error("Failed to fetch family data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const boards = await storageService.getFamilyLeaderboard();
      setLeaderboard(boards);
    } catch (e) {
      console.error("Leaderboard fetch failed", e);
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=30.04&longitude=31.23&current=temperature_2m`);
        const data = await res.json();
        if (data && data.current) {
          const temp = data.current.temperature_2m;
          setWeatherAdvice(temp);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchWeather();
  }, []);

  const handleCreateFamily = async () => {
    if (!currentUser || isCreating) return;
    const familyName = prompt(language === 'ar' ? 'أدخل اسم العائلة:' : 'Enter family name:');
    if (!familyName) return;
    
    setIsCreating(true);
    try {
      const savedFamily = await storageService.createFamily(familyName, currentUser.id);
      const updatedUser = { ...currentUser, familyId: savedFamily.id };
      setUser(updatedUser);
      setFamily(savedFamily as any);
      setMembers([currentUser]);
      notificationService.success(language === 'ar' ? 'تم إنشاء العائلة بنجاح' : 'Family created successfully');
    } catch (err) {
      console.error("Failed to create family:", err);
      notificationService.error(language === 'ar' ? 'فشل في إنشاء العائلة' : 'Failed to create family');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!family || !currentUser) return;
    
    const inviteLink = `${window.location.origin}${window.location.pathname}#/family?join=${family.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my MoEco Family',
          text: `Join my family "${family.name}" on MoEco to save the environment together!`,
          url: inviteLink
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(inviteLink);
      notificationService.success(language === 'ar' ? 'تم نسخ رابط الدعوة!' : 'Invite link copied!');
    }
  };

  const handleLeaveFamily = async () => {
    if (!currentUser || isLeaving) return;
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من مغادرة العائلة؟' : 'Are you sure you want to leave the family?')) return;
    
    setIsLeaving(true);
    try {
      const updatedUser = await storageService.leaveFamily();
      if (updatedUser) {
        setUser(updatedUser);
        setFamily(null);
        setMembers([]);
        notificationService.success(language === 'ar' ? 'تمت مغادرة العائلة' : 'Left family successfully');
      }
    } catch (err) {
      console.error("Failed to leave family:", err);
      notificationService.error(language === 'ar' ? 'فشل في مغادرة العائلة' : 'Failed to leave family');
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-egypt-gold animate-spin" />
        <p className="text-stone-500 font-black uppercase tracking-widest text-xs">Synchronizing Family Data...</p>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-12">
        <div className="relative inline-block">
          <div className="w-32 h-32 bg-egypt-gold/10 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-16 h-16 text-egypt-gold" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-full border-4 border-egypt-black flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-black font-arabic">{language === 'ar' ? 'لم تنضم لعائلة بعد' : 'No Family Hub Active'}</h1>
          <p className="text-xl text-stone-500 font-bold max-w-md mx-auto">
            {language === 'ar' 
              ? 'اجمع أفراد أسرتك في مكان واحد، تنافسوا على توفير الطاقة، واحصلوا على جوائز جماعية!' 
              : 'Gather your family in one place, compete in energy saving, and earn collective rewards!'}
          </p>
        </div>

        <button 
          onClick={handleCreateFamily}
          disabled={isCreating}
          className="w-full py-6 bg-egypt-gold text-egypt-black rounded-3xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
          {language === 'ar' ? 'تفعيل مركز العائلة' : 'Activate Family Hub'}
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 overflow-x-hidden ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 relative z-10">
      {/* Header HUD */}
      <header className="flex flex-col md:flex-row justify-between items-start gap-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-6 md:p-8 rounded-[3rem] border border-white/20 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-emerald-500/20 shadow-[-10px_10px_30px_-5px]">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl sm:text-4xl font-black">{family.name}</h1>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest shrink-0 shadow-inner">Active</div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold">{language === 'ar' ? 'لوحة تحكم الاستدامة العائلية' : 'Family Sustainability Dashboard'}</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {weatherAdvice !== null && (
             <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col justify-center text-right hidden sm:flex backdrop-blur-md">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">{language === 'ar' ? 'حرارة الجو' : 'Local Temp'}</span>
                <span className="font-black text-sm">{weatherAdvice}°C</span>
             </div>
          )}
          <button 
            onClick={handleInvite}
            className="flex-1 md:flex-none px-6 py-4 bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            {language === 'ar' ? 'دعوة أفراد' : 'Invite'}
          </button>
          <button 
            onClick={handleLeaveFamily}
            disabled={isLeaving}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all group shrink-0"
            title={language === 'ar' ? 'مغادرة العائلة' : 'Leave Family'}
          >
            {isLeaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogOut className="w-6 h-6 text-rose-500 group-hover:text-white" />}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-8 rounded-[2.5rem] border shadow-xl space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}>
          <div className="flex justify-between items-start">
            <div className="p-4 bg-blue-500/10 rounded-2xl shadow-inner border border-blue-500/20">
              <TrendingDown className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'التوفير الشهري' : 'Monthly Saving'}</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{Math.round((family?.totalPoints || 0) * 0.5)} <span className="text-sm font-normal text-slate-400">EGP</span></p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase">
              <span>{language === 'ar' ? 'كفاءة الترشيد' : 'Efficiency'}</span>
              <span className="text-blue-500">{Math.min(99, 85 + members.length * 2)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(99, 85 + members.length * 2)}%` }} className="h-full bg-blue-500 drop-shadow-md" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`p-8 rounded-[2.5rem] border shadow-xl space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}>
          <div className="flex justify-between items-start">
            <div className="p-4 bg-amber-500/10 rounded-2xl shadow-inner border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'إجمالي النقاط' : 'Total Points'}</p>
              <p className="text-3xl font-black text-amber-500 dark:text-amber-400">{family.totalPoints} <span className="text-sm font-normal text-slate-400">pts</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
              {language === 'ar' 
                ? `#${leaderboard.findIndex(f => f.id === family.id) + 1 || 1} في منطقتك`
                : `#${leaderboard.findIndex(f => f.id === family.id) + 1 || 1} Locally`}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={`p-8 rounded-[2.5rem] border shadow-xl space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}>
          <div className="flex justify-between items-start">
            <div className="p-4 bg-purple-500/10 rounded-2xl shadow-inner border border-purple-500/20">
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'التحدي النشط' : 'Active Challenge'}</p>
              <p className="text-lg font-black overflow-hidden whitespace-nowrap text-ellipsis max-w-[120px]">
                {challenges.length > 0 
                  ? (language === 'ar' ? challenges[0].title.ar || challenges[0].title : challenges[0].title.en || challenges[0].title)
                  : (language === 'ar' ? 'لا يوجد تحدي حالي' : 'No Challenge')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400">{challenges.length > 0 && challenges[0]?.target_value ? `Target: ${challenges[0].target_value}` : ''}</span>
            <span className="text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">{challenges.length > 0 && challenges[0]?.end_date ? new Date(challenges[0].end_date).toLocaleDateString() : ''}</span>
          </div>
        </motion.div>
      </div>

      {/* Members Section */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500 p-1.5 bg-emerald-500/10 rounded-xl" />
            {language === 'ar' ? 'أعضاء العائلة' : 'Family Members'}
          </h2>
          <span className="px-4 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-inner">{members.length} Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m, idx) => (
            <motion.div
              layout
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border shadow-xl flex items-center justify-between group hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {m.avatar_url ? (
                    <img src={m.avatar_url || m.avatar} alt={m.name} className="w-14 h-14 rounded-[1.2rem] border border-white/20 object-cover shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-[1.2rem] border border-white/20 bg-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-inner">
                      {m.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black truncate">{m.name || m.full_name}</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate">{m.email}</p>
                </div>
              </div>
              <div className="text-right pl-4">
                <p className="text-lg font-black text-amber-500">{m.points || 0}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pts</p>
              </div>
            </motion.div>
          ))}
          
          <button 
            onClick={handleInvite}
            className={`p-6 rounded-[2.5rem] border-2 border-dashed bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm flex flex-col items-center justify-center gap-3 group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}
          >
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-[1rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 transition-all">
              <Plus className="w-5 h-5 text-slate-500 group-hover:text-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-500">{language === 'ar' ? 'إضافة فرد' : 'Add Member'}</p>
          </button>
        </div>
      </section>

      {/* Activity Log HUD */}
      <section className={`p-8 sm:p-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[3rem] border shadow-2xl ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-xl font-black flex items-center gap-3">
            <History className="w-6 h-6 text-slate-400" />
            {language === 'ar' ? 'سجل النشاط' : 'Activity Log'}
          </h3>
          <button className="px-4 py-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-500 transition-colors">View All</button>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
          {familyActivity.length > 0 ? familyActivity.map((log, i) => (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} key={i} className="flex flex-wrap sm:flex-nowrap items-center justify-between p-4 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-2.5 rounded-xl border border-white/10 shadow-sm shrink-0 ${log.points > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black truncate">{log.reason}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{log.user?.full_name} • {new Date(log.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto mt-2 sm:mt-0">
                <span className={`text-[11px] sm:text-xs font-black px-3 py-1 rounded-full ${log.points > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {log.points > 0 ? '+' : ''}{log.points} PTS
                </span>
              </div>
            </motion.div>
          )) : (
            <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              {language === 'ar' ? 'لا يوجد نشاط مؤخراً' : 'No recent activity'}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
};

export default FamilyHub;
