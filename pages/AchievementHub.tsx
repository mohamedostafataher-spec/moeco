import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, CheckCircle2, Star, Zap, Droplets, Trash2, ArrowRight, 
  Clock, Award, Info, Loader2, Map as MapIcon, List, Trophy, 
  Medal, Crown, TrendingUp, Landmark, Sword, Users, Shield, MapPin, 
  Plus, X, Heart, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';
import { smartAiService } from '../services/smartAiService';
import {
  civicActionService,
  REAL_IMPACT_CHALLENGES,
  CivicChallenge,
  ChallengeSubmission,
  VerificationStatus,
} from '../services/civicActionService';
import { Link } from 'react-router-dom';

type HubTab = 'real_impact' | 'missions' | 'challenges' | 'leaderboard' | 'wars';

const VERIF_STATUS_BADGE: Record<VerificationStatus, { label: string; labelEn: string; cls: string }> = {
  logged: { label: 'مُسجّل', labelEn: 'Logged', cls: 'bg-slate-700/60 text-slate-200 border-slate-500/40' },
  needs_review: { label: 'بحاجة إلى مراجعة', labelEn: 'Needs review', cls: 'bg-amber-500/15 text-amber-300 border-amber-400/40' },
  verified: { label: 'تم التحقق', labelEn: 'Verified', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40' },
};

const CHALLENGE_EN: Record<string, { title: string; description: string; verificationRule: string }> = {
  'chg-verified-report': {
    title: 'Document a real environmental issue and pass review',
    description: 'Submit an environmental report with a precise description and a clear area. Verified points are not granted on submission, only after the report is reviewed and verified.',
    verificationRule: 'Moves from "Needs review" to "Verified" once the report is reviewed and approved.',
  },
  'chg-recycling-handover': {
    title: 'Deliver recyclable materials to a collection point',
    description: 'Log the weight of sorted materials handed to a collection point. Without a receipt or documented weight, only a symbolic participation badge is granted.',
    verificationRule: 'Requires a documented delivery with a real weight and a known impact factor to count verified points.',
  },
  'chg-local-campaign': {
    title: 'Join a local initiative or campaign',
    description: 'Join a local water-saving, shading or cleanup initiative in your area and document your participation.',
    verificationRule: 'Attendance or participation confirmed by the initiative coordinator.',
  },
  'chg-initiative-followup': {
    title: 'Follow an initiative through closure and verified resolution',
    description: 'Follow a report or initiative from the proposal/review stage until its closure is documented.',
    verificationRule: 'Linked to the "Solution verified" status on a followed report or initiative.',
  },
};

const AchievementHub: React.FC = () => {
  const { language, theme, user, isRtl } = useApp();
  const ar = language === 'ar';
  const [activeTab, setActiveTab] = useState<HubTab>('real_impact');
  const [loading, setLoading] = useState(true);

  // REAL-IMPACT CHALLENGES STATE
  const [civicSubmissions, setCivicSubmissions] = useState<ChallengeSubmission[]>([]);
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});
  const [submittingChallengeId, setSubmittingChallengeId] = useState<string | null>(null);

  // MISSIONS STATE
  const [missions, setMissions] = useState<any[]>([]);
  const [userMissions, setUserMissions] = useState<any[]>([]);
  const [streak, setStreak] = useState(user?.streak_count || 0);
  const [dailyAiMission, setDailyAiMission] = useState<any>(null);
  
  // CHALLENGES STATE
  const [challenges, setChallenges] = useState<any[]>([]);
  
  // LEADERBOARD STATE
  const [leaders, setLeaders] = useState<any[]>([]);

  // WARS STATE
  const [warStats, setWarStats] = useState<any[]>([]);
  const [userGovStats, setUserGovStats] = useState<any>(null);

  useEffect(() => {
    fetchAllData();

    // Setup robust realtime listeners for all achievement-related tables
    const channel = supabase.channel('achievements_hub_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streaks' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchAllData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, language]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const uid = user?.id || 'guest-user-2026';
      setCivicSubmissions(civicActionService.getChallengeSubmissions(uid));

      if (!user) return;

      // Fetching from the new requested tables
      const [achRes, progRes, streakRes, aiMission, badgesRes, leadRes, warRes] = await Promise.all([
        supabase.from('achievements').select('*').order('created_at', { ascending: false }),
        supabase.from('user_progress').select('*').eq('user_id', user.id),
        supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle(),
        smartAiService.generateDailyContent('mission', language as any),
        supabase.from('badges').select('*'),
        storageService.getLeaderboard(),
        storageService.getGovernorateWarStats(user.governorate || 'Cairo')
      ]);

      setMissions(achRes.data || []);
      setUserMissions(progRes.data || []);
      setStreak(streakRes.data?.current_streak || 0);
      setDailyAiMission(aiMission);
      
      // Map badges to challenges for UI display
      setChallenges((badgesRes.data || []).map(b => ({
        id: b.id,
        title: isRtl ? b.name_ar : b.name_en,
        description: isRtl ? b.description_ar : b.description_en,
        icon_url: b.image_url || '🎖️',
        progress: userMissions.some((up: any) => up.achievement_id === b.id && up.is_completed) ? 100 : 0,
        is_completed: userMissions.some((up: any) => up.achievement_id === b.id && up.is_completed)
      })));

      setLeaders(leadRes);
      
      if (warRes && 'all' in warRes) {
        setWarStats(warRes.all);
        setUserGovStats(warRes.userGov);
      } else {
        setWarStats(warRes);
      }

    } catch (e) {
      console.error("Hub data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      await storageService.completeMission(missionId);
      notificationService.success(isRtl ? 'تم إكمال المهمة!' : 'Mission completed!');
      fetchAllData();
    } catch (e) {
      notificationService.error(isRtl ? 'لقد أكملت هذه المهمة بالفعل' : 'Already completed today');
    }
  };

  const handleClaimChallenge = async (chId: string) => {
    try {
      await storageService.completeChallenge(chId);
      notificationService.success(isRtl ? 'تم استلام الجائزة!' : 'Reward claimed!');
      fetchAllData();
    } catch (e) {
      notificationService.error(isRtl ? 'حدث خطأ في الاستلام' : 'Error claiming reward');
    }
  };

  const handleWarContribute = async () => {
    if (!user) return;
    try {
      await storageService.awardPoints(user.id, 100, `Contribution to ${user.governorate || 'Cairo'} War`, 'neighborhood_war');
      notificationService.success(isRtl ? 'تمت إضافة ١٠٠ نقطة لمحافظتك!' : '100 points added to your governorate!');
      fetchAllData();
    } catch (e) { console.error(e); }
  };

  const handleSubmitCivicChallenge = async (challenge: CivicChallenge) => {
    const uid = user?.id || 'guest-user-2026';
    const evidence = (evidenceInputs[challenge.id] || '').trim();
    if (evidence.length < 5) {
      notificationService.error(ar ? 'يرجى كتابة وصف موجز أو رقم مرجعي يوضح الإجراء المنفذ (5 أحرف على الأقل).' : 'Please write a brief description or a reference number for the completed action (at least 5 characters).');
      return;
    }
    setSubmittingChallengeId(challenge.id);
    try {
      const res = await civicActionService.submitChallengeClaim({
        userId: uid,
        challenge,
        evidenceSummary: evidence,
      });
      if (!res.ok) {
        notificationService.warning(res.message);
      } else {
        notificationService.success(res.message);
        setEvidenceInputs((prev) => ({ ...prev, [challenge.id]: '' }));
        setCivicSubmissions(civicActionService.getChallengeSubmissions(uid));
      }
    } finally {
      setSubmittingChallengeId(null);
    }
  };

  const totalSymbolicPoints = civicSubmissions.reduce((s, c) => s + c.symbolicPointsAwarded, 0);
  const totalVerifiedPoints = civicSubmissions.reduce((s, c) => s + c.verifiedPointsAwarded, 0);

  const getText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      const v = val[language] || val.ar || val.en;
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
      return JSON.stringify(val);
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-eco-green animate-spin mb-4" />
        <p className="font-black text-xs uppercase tracking-widest text-zinc-500">{isRtl ? 'جاري تحميل الإنجازات...' : 'Loading Achievements...'}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-40 overflow-x-hidden ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans relative`}>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[40rem] h-[40rem] bg-amber-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
        <div className="safe-area-top" />
        
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
           <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none">
                 {isRtl ? 'مركز الإنجازات' : 'ACHIEVEMENT HUB'}
              </h1>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                 {isRtl ? `لديك ${user?.points || 0} نقطة إجمالية` : `You have ${user?.points || 0} total points`}
              </p>
           </div>
           
           <div className="flex flex-wrap bg-zinc-900/80 p-1.5 rounded-2xl border border-white/10 gap-1">
              {(['real_impact', 'missions', 'challenges', 'leaderboard', 'wars'] as const).map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                     activeTab === tab ? 'bg-eco-green text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'
                   }`}
                 >
                    {tab === 'real_impact' ? <Shield size={14} /> : tab === 'missions' ? <Target size={14} /> : tab === 'challenges' ? <Award size={14} /> : tab === 'leaderboard' ? <Trophy size={14} /> : <Sword size={14} />}
                    <span>
                      {tab === 'real_impact'
                        ? (isRtl ? 'تحديات الأثر الحقيقي' : 'Real Impact')
                        : tab === 'missions'
                          ? (isRtl ? 'مهمات' : 'Missions')
                          : tab === 'challenges'
                            ? (isRtl ? 'الشارات' : 'Badges')
                            : tab === 'leaderboard'
                              ? (isRtl ? 'الترتيب' : 'Rankings')
                              : (isRtl ? 'المحافظات' : 'Wars')}
                    </span>
                 </button>
              ))}
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'real_impact' && (
            <motion.div key="real_impact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" dir={ar ? 'rtl' : 'ltr'}>
              {/* Separation of Verified vs Symbolic Points + No Cash Redemption Disclaimer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-400">{ar ? 'نقاط الأثر المؤكدة (تم التحقق)' : 'Verified impact points'}</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1 tabular-nums">{totalVerifiedPoints} {ar ? 'نقطة' : 'pts'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{ar ? 'لا تُحتسب إلا عند تحقق الشرط ومراجعته فعلياً.' : 'Counted only when the condition is actually met and reviewed.'}</p>
                </div>
                <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-400">{ar ? 'نقاط مشاركة رمزية (قيد المراجعة)' : 'Symbolic participation points (under review)'}</p>
                  <p className="text-3xl font-black text-amber-300 mt-1 tabular-nums">{totalSymbolicPoints} {ar ? 'نقطة' : 'pts'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{ar ? 'تُمنح لتوثيق خطوة المشاركة دون ادعاء أثر مؤكد.' : 'Granted for documenting a participation step without claiming verified impact.'}</p>
                </div>
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ar ? <><strong>ضوابط النقاط ومنع التلاعب:</strong> جميع النقاط للتقدير المجتمعي فقط ولا تُحوّل إلى أموال نقدية. توجد فترة انتظار بين المطالبات ويشترط وجود سجل فعلي داعم (بلاغ / تسليم تدوير / مبادرة).</> : <><strong>Points rules and anti-abuse:</strong> All points are for community recognition only and cannot be converted to cash. A cooldown applies between claims and a supporting real record is required (report / recycling delivery / initiative).</>}
                  </p>
                </div>
              </div>

              {/* Real Impact Challenges Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {REAL_IMPACT_CHALLENGES.map((chg) => {
                  const relatedSubs = civicSubmissions.filter((s) => s.challengeId === chg.id);
                  const latestSub = relatedSubs[0];
                  const verifBadge = latestSub ? VERIF_STATUS_BADGE[latestSub.status] : null;
                  const actionLink =
                    chg.actionType === 'verified_report' || chg.actionType === 'initiative_followup'
                      ? { to: '/eco-watch', label: ar ? 'افتح «بلاغ بيئي»' : 'Open Environmental Report' }
                      : chg.actionType === 'recycling_delivery'
                        ? { to: '/waste-to-income', label: ar ? 'افتح «المخلفات إلى دخل»' : 'Open Waste to Income' }
                        : { to: '/local-monitor', label: ar ? 'افتح «لوحة المتابعة والمبادرات»' : 'Open the Monitoring & Initiatives dashboard' };

                  return (
                    <article key={chg.id} className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="text-lg font-black text-white">{ar ? chg.title : CHALLENGE_EN[chg.id]?.title || chg.title}</h2>
                        {verifBadge && (
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${verifBadge.cls}`}>
                            {ar ? verifBadge.label : verifBadge.labelEn}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{ar ? chg.description : CHALLENGE_EN[chg.id]?.description || chg.description}</p>

                      <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{ar ? 'نقاط المشاركة الرمزية:' : 'Symbolic participation points:'}</span>
                          <span className="font-black text-amber-300">+{chg.symbolicPoints} {ar ? 'نقطة رمزية' : 'symbolic pts'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{ar ? 'نقاط بعد التحقق:' : 'Points after verification:'}</span>
                          <span className="font-black text-emerald-300">+{chg.verifiedPoints} {ar ? 'نقطة مؤكدة' : 'verified pts'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pt-1 border-t border-white/10">
                          {ar ? 'شرط التحقق' : 'Verification rule'}: {ar ? chg.verificationRule : CHALLENGE_EN[chg.id]?.verificationRule || chg.verificationRule} ({ar ? 'فترة انتظار' : 'cooldown'}: {chg.cooldownHours} {ar ? 'ساعة' : 'h'})
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor={`ev-${chg.id}`} className="block text-xs font-bold text-slate-300">
                          {ar ? 'وصف التوثيق أو الإجراء المنفذ' : 'Description of the evidence or completed action'}
                        </label>
                        <input
                          id={`ev-${chg.id}`}
                          type="text"
                          value={evidenceInputs[chg.id] || ''}
                          onChange={(e) => setEvidenceInputs((prev) => ({ ...prev, [chg.id]: e.target.value }))}
                          placeholder={ar ? 'مثال: تم تقديم بلاغ تسريب بالمعادي أو تسليم 3 كجم بلاستيك' : 'Example: filed a leak report in Maadi or delivered 3 kg of plastic'}
                          className="w-full min-h-[44px] bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <Link
                          to={actionLink.to}
                          className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-sky-300 hover:bg-white/10 transition"
                        >
                          {actionLink.label}
                        </Link>
                        <button
                          type="button"
                          disabled={submittingChallengeId === chg.id}
                          onClick={() => handleSubmitCivicChallenge(chg)}
                          className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition disabled:opacity-50"
                        >
                          {submittingChallengeId === chg.id ? (ar ? 'جاري الفحص...' : 'Checking...') : (ar ? 'إرسال للمراجعة والتحقق' : 'Submit for review and verification')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Submission History */}
              {civicSubmissions.length > 0 && (
                <div className="bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-3">
                  <h3 className="text-base font-black text-white">{ar ? 'سجل مطالبات التحقق' : 'Verification claims log'}</h3>
                  <div className="space-y-2.5">
                    {civicSubmissions.map((sub) => {
                      const badge = VERIF_STATUS_BADGE[sub.status];
                      const chg = REAL_IMPACT_CHALLENGES.find((c) => c.id === sub.challengeId);
                      return (
                        <div key={sub.id} className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">{chg?.title || sub.challengeId}</p>
                            <p className="text-xs text-slate-300 mt-0.5">{sub.evidenceSummary}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{new Date(sub.submittedAt).toLocaleString(ar ? 'ar-EG' : 'en-GB')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.cls}`}>{ar ? badge.label : badge.labelEn}</span>
                            <span className="text-xs font-bold text-amber-300">+{sub.symbolicPointsAwarded} {ar ? 'رمزية' : 'symbolic'}</span>
                            {sub.verifiedPointsAwarded > 0 && (
                              <span className="text-xs font-black text-emerald-300">+{sub.verifiedPointsAwarded} {ar ? 'مؤكدة' : 'verified'}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'missions' && (
            <motion.div key="missions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
               {/* Streak Section */}
               <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-10">
                   <div className="relative shrink-0">
                      <div className="w-24 h-24 bg-egypt-gold rounded-[2rem] flex items-center justify-center shadow-2xl">
                         <Zap className="text-black w-12 h-12" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-600 border-4 border-white dark:border-zinc-900 rounded-full flex items-center justify-center text-white font-black">{streak}</div>
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-black mb-2">{isRtl ? 'سلسلة التميز البيئي' : 'Eco-Streak'}</h3>
                      <div className="flex gap-2 mb-4 justify-center md:justify-start">
                         {[1,2,3,4,5,6,7].map(d => (
                           <div key={d} className={`h-2 flex-1 max-w-[40px] rounded-full ${streak >= d ? 'bg-egypt-gold' : 'bg-zinc-200 dark:bg-white/10'}`} />
                         ))}
                      </div>
                      <p className="text-xs font-bold text-zinc-500">{isRtl ? 'أكمل مهمة واحدة يومياً للحفاظ على السلسلة وزيادة المكافآت!' : 'Complete one mission daily to keep your streak and boost rewards!'}</p>
                   </div>
               </div>

               {/* AI Mission Banner */}
               {dailyAiMission && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-all"><Sparkles size={120} /></div>
                     <div className="relative z-10">
                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 inline-block">AI Daily Special</span>
                        <h2 className="text-3xl font-black mb-2">{getText(dailyAiMission.title) || 'AI Mission'}</h2>
                        <p className="text-white/70 font-bold max-w-xl mb-8">{getText(dailyAiMission.description) || 'Daily special AI mission.'}</p>
                        <button onClick={() => handleCompleteMission('ai-daily')} className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Start Mission +{dailyAiMission.points} Pts</button>
                     </div>
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(missions || []).map(m => {
                    const done = (userMissions || []).some((um: any) => um.mission_id === m.id);
                    return (
                      <div key={m.id} className={`p-8 rounded-[3rem] border transition-all ${done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 shadow-xl'}`}>
                         <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center"><Target /></div>
                            {done && <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Done</div>}
                         </div>
                         <h4 className="text-xl font-black mb-2">{getText(m.title) || 'Mission'}</h4>
                         <p className="text-xs font-bold text-zinc-500 mb-8">{getText(m.description) || 'Complete the task'}</p>
                         <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <span className="text-sm font-black text-egypt-gold">+{m.points} Pts</span>
                            {!done && <button onClick={() => handleCompleteMission(m.id)} className="p-3 bg-zinc-950 text-white rounded-xl hover:bg-eco-green transition-all"><ArrowRight size={18} /></button>}
                         </div>
                      </div>
                    )
                  })}
               </div>
            </motion.div>
          )}

          {activeTab === 'challenges' && (
            <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(challenges || []).map(ch => (
                    <div key={ch.id} className={`p-8 rounded-[3.5rem] border shadow-xl ${ch.is_completed ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white dark:bg-zinc-950 border-white/5'}`}>
                        <div className="text-5xl mb-6">{ch.icon_url || '🌟'}</div>
                        <h4 className="text-2xl font-black mb-2">{isRtl ? getText(ch.title_ar || ch.title) : getText(ch.title_en || ch.title)}</h4>
                        <p className="text-xs font-bold text-zinc-500 mb-8">{isRtl ? getText(ch.description_ar || ch.description) : getText(ch.description_en || ch.description)}</p>
                        
                        <div className="space-y-2 mb-8">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                             <span>Progress</span>
                             <span>{ch.progress || 0}%</span>
                           </div>
                           <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${ch.progress || 0}%` }} className="h-full bg-blue-500 shadow-lg shadow-blue-500/40" />
                           </div>
                        </div>

                        <button 
                          onClick={() => handleClaimChallenge(ch.id)}
                          disabled={ch.is_completed || ch.progress < 100}
                          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            ch.is_completed ? 'bg-emerald-500 text-white' : ch.progress === 100 ? 'bg-blue-600 text-white shadow-xl' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'
                          }`}
                        >
                           {ch.is_completed ? 'Completed' : ch.progress === 100 ? 'Claim Reward' : 'In Progress'}
                        </button>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
               {/* Podium */}
               <div className="flex flex-col md:flex-row gap-8 md:gap-4 lg:gap-8 pt-10 md:pt-20 items-center md:items-end justify-center">
                  {(leaders || []).slice(0, 3).map((l, idx) => {
                    const posOrder = [1, 0, 2]; // 2nd, 1st, 3rd display
                    const rank = posOrder[idx];
                    const leader = leaders?.[rank];
                    if (!leader) return null;
                    return (
                      <div 
                        key={leader.id} 
                        className={`bg-white dark:bg-zinc-900/50 p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] border relative flex flex-col items-center justify-end group transition-all hover:-translate-y-2 w-full md:w-1/3 max-w-[340px] md:max-w-none 
                          ${rank === 0 
                            ? 'h-[380px] sm:h-[450px] border-amber-500/30 md:scale-105 z-10' 
                            : rank === 1 
                              ? 'h-[320px] sm:h-[380px] border-zinc-400/20' 
                              : 'h-[300px] sm:h-[340px] border-orange-700/20'
                          }
                          ${idx === 0 ? 'order-2 md:order-1' : idx === 1 ? 'order-1 md:order-2' : 'order-3'}
                        `}
                      >
                         <div className={`absolute top-0 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[2.5rem] sm:rounded-[3.5rem] border-4 overflow-hidden shadow-2xl ${rank === 0 ? 'border-amber-500' : 'border-zinc-500'}`}>
                            <img src={leader.avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                         </div>
                         <div className="text-center w-full">
                            <h3 className="text-xl sm:text-2xl font-black truncate">{leader.name}</h3>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 mb-6 sm:mb-8">{leader.governorate || 'Rookie'}</p>
                            <div className="flex justify-center gap-6 sm:gap-10 border-t border-white/5 pt-6 sm:pt-8">
                               <div className="text-center"><p className="text-[10px] font-black text-zinc-500 uppercase">Score</p><p className="text-lg sm:text-xl font-black">{leader.points}</p></div>
                               <div className="text-center"><p className="text-[10px] font-black text-zinc-500 uppercase">Rank</p><p className="text-lg sm:text-xl font-black">#{rank + 1}</p></div>
                            </div>
                         </div>
                      </div>
                    )
                  })}
               </div>
               
               {/* Leader Table */}
               <div className="bg-white dark:bg-zinc-900/50 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-[600px] md:min-w-0">
                       <thead className="bg-white/5 border-b border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          <tr>
                             <th className="px-6 sm:px-10 py-6 text-left">Rank</th>
                             <th className="px-6 sm:px-10 py-6 text-left">Guardian</th>
                             <th className="px-6 sm:px-10 py-6 text-center">Points</th>
                             <th className="px-6 sm:px-10 py-6 text-center">Tier</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {(leaders || []).slice(3, 10).map((l, i) => (
                             <tr key={l.id} className={`group hover:bg-white/5 transition-all ${l.id === user?.id ? 'bg-blue-600/5' : ''}`}>
                                <td className="px-6 sm:px-10 py-6 font-black tabular-nums group-hover:text-white transition-colors">#{i + 4}</td>
                                <td className="px-6 sm:px-10 py-6">
                                   <div className="flex items-center gap-3 sm:gap-4">
                                      <img src={l.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border border-white/10" alt="" referrerPolicy="no-referrer" />
                                      <div className="max-w-[120px] sm:max-w-none">
                                        <p className="font-black text-base truncate">{l.name}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">{l.governorate || 'Global Citizen'}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 sm:px-10 py-6 text-center font-black">{l.points}</td>
                                <td className="px-6 sm:px-10 py-6 text-center"><span className="px-3 sm:px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase">Lv.{l.level}</span></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'wars' && (
            <motion.div key="wars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="flex-1 space-y-6">
                     <div className="p-10 bg-egypt-red/10 border border-red-500/20 rounded-[4rem] relative overflow-hidden">
                        <Sword className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5" />
                        <h2 className="text-4xl font-black italic mb-2">{isRtl ? 'حرب المحافظات' : 'WAR OF TERRITORIES'}</h2>
                        <p className="text-zinc-500 font-bold mb-8">{isRtl ? 'دافع عن محافظتك بجمع النقاط وتصدر الترتيب القومي.' : 'Defend your governorate by collecting points and topping the national ranking.'}</p>
                        <div className="flex items-center gap-4 p-8 bg-zinc-950 rounded-[3rem] border border-white/5">
                           <div className="w-16 h-16 bg-egypt-gold rounded-3xl flex items-center justify-center"><MapPin className="text-black" size={32} /></div>
                           <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'محافظتك' : 'YOUR TERRITORY'}</p>
                              <h4 className="text-2xl font-black text-white">{user?.governorate || 'Cairo'}</h4>
                           </div>
                           <button onClick={handleWarContribute} className="ml-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/30">Join Battle +100</button>
                        </div>
                     </div>
                  </div>

                  <div className="w-full md:w-80 bg-zinc-100 dark:bg-zinc-900/50 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                     <h4 className="text-lg font-black mb-6 border-b border-white/5 pb-4">{isRtl ? 'إحصائيات الميدان' : 'Field Stats'}</h4>
                     <div className="space-y-6">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-500 uppercase">Your Rank</span><span className="font-black text-egypt-gold">#{userGovStats?.rank || '---'}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-500 uppercase">Growth</span><span className="font-black text-emerald-500">+{userGovStats?.growth_rate || 0}%</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-500 uppercase">Citizens</span><span className="font-black">{userGovStats?.active_citizens?.toLocaleString() || 0}</span></div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(warStats || []).map((item, i) => (
                    <div key={item.id || i} className={`p-8 rounded-[3rem] border flex items-center justify-between transition-all ${item.governorate === user?.governorate ? 'bg-egypt-gold/10 border-egypt-gold shadow-2xl scale-102' : 'bg-white dark:bg-zinc-900 border-white/5 shadow-xl'}`}>
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${i === 0 ? 'bg-egypt-gold text-black shadow-xl shadow-yellow-500/20' : 'bg-zinc-100 dark:bg-black/40 text-zinc-500'}`}>#{i+1}</div>
                          <div><h5 className="text-2xl font-black">{item.governorate}</h5><p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">{item.neighborhood || 'Major Hub'}</p></div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black">{item.total_points.toLocaleString()}</p>
                          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Total Impact</p>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AchievementHub;
