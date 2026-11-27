import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Droplets,
  FileText,
  Calculator,
  BookOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sprout,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { ConsentRequiredNotice } from '../components/ConsentGateModal';
import { storageService } from '../services/storageService';
import { HomeUtilityRecord, PersonalComplaint } from '../services/personalCivicService';
import DailyCarbonCard from '../components/DailyCarbonCard';
import AirTodayCard from '../components/AirTodayCard';
import BillCO2Card from '../components/BillCO2Card';
import { supabaseDataService } from '../services/supabaseDataService';

const Home: React.FC = () => {
  const { language, user, isRtl } = useApp();
  const { isConfigured, authUser, hasCoreConsent, analyticsEnabled, trackUsageEvent } =
    usePrivacyConsent();

  const [loading, setLoading] = useState(true);
  const [utilityRecords, setUtilityRecords] = useState<HomeUtilityRecord[]>([]);
  const [complaints, setComplaints] = useState<PersonalComplaint[]>([]);
  const [carbonSummary, setCarbonSummary] = useState<{
    totalKg: number;
    entriesCount: number;
    lastDate?: string;
  }>({ totalKg: 0, entriesCount: 0 });

  useEffect(() => {
    let active = true;

    const loadPersonalOverview = async () => {
      if (!isConfigured || !authUser?.id || !hasCoreConsent) {
        if (active) {
          setUtilityRecords([]);
          setComplaints([]);
          setCarbonSummary({ totalKg: 0, entriesCount: 0 });
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const [remoteUtils, remoteComplaints, logs] = await Promise.all([
          supabaseDataService.listHouseholdReadings(authUser.id).catch(() => []),
          supabaseDataService.listComplaintDrafts(authUser.id).catch(() => []),
          storageService.getCarbonLogs(20, authUser.id).catch(() => []),
        ]);

        if (!active) return;
        setUtilityRecords(remoteUtils);
        setComplaints(remoteComplaints);

        if (Array.isArray(logs) && logs.length > 0) {
          const total = logs.reduce(
            (sum, item) => sum + (Number(item.co2 ?? item.co2_impact ?? item.carbon_impact) || 0),
            0,
          );
          setCarbonSummary({
            totalKg: Number(total.toFixed(1)),
            entriesCount: logs.length,
            lastDate: logs[0]?.created_at,
          });
        } else {
          setCarbonSummary({ totalKg: 0, entriesCount: 0 });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPersonalOverview();
    return () => {
      active = false;
    };
  }, [isConfigured, authUser?.id, hasCoreConsent]);

  useEffect(() => {
    if (analyticsEnabled) {
      trackUsageEvent('feature_opened', { feature: 'home' });
    }
  }, [analyticsEnabled, trackUsageEvent]);

  const latestElectricity = useMemo(
    () => utilityRecords.find((r) => r.serviceType === 'electricity'),
    [utilityRecords],
  );
  const latestWater = useMemo(
    () => utilityRecords.find((r) => r.serviceType === 'water'),
    [utilityRecords],
  );

  const hasAnyPersonalData =
    utilityRecords.length > 0 || complaints.length > 0 || carbonSummary.entriesCount > 0;

  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  const formattedToday = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const activeComplaintsCount = complaints.filter((c) => c.status !== 'closed_by_user').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <DailyCarbonCard />
      <AirTodayCard />
      <BillCO2Card />
      <section
        aria-label={isRtl ? 'الترحيب والتعريف بالتطبيق' : 'Welcome and overview'}
        className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">{formattedToday}</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
              {user?.name && user.name !== 'زائر مو إيكو' && user.name !== 'User'
                ? isRtl
                  ? `مرحبًا، ${user.name.split(' ')[0]}`
                  : `Welcome, ${user.name.split(' ')[0]}`
                : isRtl
                  ? 'مرحبًا بك في MoEco'
                  : 'Welcome to MoEco'}
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl leading-relaxed">
              {isRtl
                ? 'سجّل قراءات الكهرباء والمياه في منزلك، نظّم شكاواك للقنوات الرسمية، وتابع أثرك البيئي دون الحاجة لإنشاء حساب تقليدي.'
                : 'Log your household electricity and water readings, organize your complaints, and track your environmental footprint transparently.'}
            </p>
          </div>

          <div
            className="hidden sm:flex w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Sprout className="w-6 h-6" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <Link
            to="/my-home?new=1"
            className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm md:text-base inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <Plus className="w-5 h-5" />
            <span>
              {utilityRecords.length === 0
                ? isRtl
                  ? 'سجّل أول قراءة الآن'
                  : 'Log your first reading'
                : isRtl
                  ? 'أضف قراءة جديدة'
                  : 'Add new reading'}
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/my-complaints"
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs md:text-sm inline-flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>{isRtl ? 'تجهيز شكوى' : 'Prepare complaint'}</span>
            </Link>

            <Link
              to="/calculator"
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs md:text-sm inline-flex items-center gap-1.5 transition-colors"
            >
              <Calculator className="w-4 h-4 text-slate-500" />
              <span>{isRtl ? 'حاسبة الأثر' : 'Footprint calculator'}</span>
            </Link>

            <Link
              to="/privacy"
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs md:text-sm inline-flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{isRtl ? 'الخصوصية والبيانات' : 'Privacy'}</span>
            </Link>
          </div>
        </div>
      </section>

      {!hasCoreConsent && <ConsentRequiredNotice featureTitle="حفظ السجلات في MoEco" />}

      {hasCoreConsent && (
        <section aria-label={isRtl ? 'ملخصك الشخصي' : 'Personal summary'} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900">
              {isRtl ? 'ملخصك المسجل في Supabase' : 'Your Recorded Summary'}
            </h2>
            <Link
              to="/methodology"
              className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 px-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isRtl ? 'كيف نحسب الأثر؟' : 'Methodology'}</span>
            </Link>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
              {isRtl ? 'جاري تحميل سجلاتك...' : 'Loading your records...'}
            </div>
          ) : !hasAnyPersonalData ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">
                {isRtl ? 'لا توجد قراءات مسجلة حتى الآن' : 'No recorded readings yet'}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {isRtl
                  ? 'أضف أول قراءة كهرباء أو مياه لمتابعة استهلاكك الشخصي عبر الفترات في قاعدة بيانات MoEco.'
                  : 'Add your first electricity or water reading to track your household usage over time.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/my-home?new=1"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-emerald-700 text-emerald-700 hover:bg-emerald-50 font-bold text-sm transition-colors"
                >
                  <span>{isRtl ? 'الانتقال إلى ملف بيتي' : 'Go to My Home'}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestElectricity && (
                <Link
                  to="/my-home"
                  className="bg-white border border-slate-200 hover:border-emerald-600/50 rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {isRtl ? 'آخر سجل للكهرباء' : 'Latest Electricity'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isRtl ? 'محفوظ في Supabase' : 'Saved'}
                    </span>
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      <span className="num-ltr">
                        {latestElectricity.value} {latestElectricity.unit}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 tabular-nums">
                      {isRtl ? 'الفترة / التاريخ: ' : 'Date: '}
                      {latestElectricity.dateMode === 'billing_period'
                        ? `${latestElectricity.periodStart} → ${latestElectricity.periodEnd}`
                        : latestElectricity.readingDate}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    {isRtl ? 'آخر تحديث: ' : 'Updated: '}
                    {new Date(latestElectricity.updatedAt).toLocaleDateString(
                      isRtl ? 'ar-EG' : 'en-US',
                    )}
                  </p>
                </Link>
              )}

              {latestWater && (
                <Link
                  to="/my-home"
                  className="bg-white border border-slate-200 hover:border-emerald-600/50 rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {isRtl ? 'آخر سجل للمياه' : 'Latest Water'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isRtl ? 'محفوظ في Supabase' : 'Saved'}
                    </span>
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      <span className="num-ltr">
                        {latestWater.value} {latestWater.unit}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 tabular-nums">
                      {isRtl ? 'الفترة / التاريخ: ' : 'Date: '}
                      {latestWater.dateMode === 'billing_period'
                        ? `${latestWater.periodStart} → ${latestWater.periodEnd}`
                        : latestWater.readingDate}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    {isRtl ? 'آخر تحديث: ' : 'Updated: '}
                    {new Date(latestWater.updatedAt).toLocaleDateString(
                      isRtl ? 'ar-EG' : 'en-US',
                    )}
                  </p>
                </Link>
              )}

              {complaints.length > 0 && (
                <Link
                  to="/my-complaints"
                  className="bg-white border border-slate-200 hover:border-emerald-600/50 rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {isRtl ? 'ملف شكواي' : 'My Complaints'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isRtl ? 'مسودات Supabase' : 'Saved Drafts'}
                    </span>
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {complaints.length}{' '}
                      <span className="text-sm font-semibold text-slate-600">
                        {isRtl ? 'سجلات' : 'records'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl
                        ? `منها ${activeComplaintsCount} قيد المتابعة الشخصية`
                        : `${activeComplaintsCount} active for follow-up`}
                    </p>
                  </div>
                </Link>
              )}

              {carbonSummary.entriesCount > 0 && (
                <Link
                  to="/calculator"
                  className="bg-white border border-slate-200 hover:border-emerald-600/50 rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {isRtl ? 'الأثر المحسوب' : 'Calculated Impact'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {isRtl ? 'تقدير محسوب' : 'Calculated Estimate'}
                    </span>
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      <span className="num-ltr">{carbonSummary.totalKg} kg CO₂e</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl
                        ? `مجموع ${carbonSummary.entriesCount} عملية حساب مسجلة`
                        : `Sum of ${carbonSummary.entriesCount} logged calculations`}
                    </p>
                  </div>

                  {carbonSummary.lastDate && (
                    <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                      {isRtl ? 'آخر عملية: ' : 'Last logged: '}
                      {new Date(carbonSummary.lastDate).toLocaleDateString(
                        isRtl ? 'ar-EG' : 'en-US',
                      )}
                    </p>
                  )}
                </Link>
              )}
            </div>
          )}
        </section>
      )}

      <div className="pt-1">
        <Link
          to="/more"
          className="w-full min-h-[52px] bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl px-5 py-3 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-emerald-700" />
            <div>
              <span className="block text-sm font-bold text-slate-900">
                {isRtl ? 'استكشف بقية الأدوات والخدمات' : 'Explore more tools & services'}
              </span>
              <span className="block text-xs text-slate-500">
                {isRtl
                  ? 'بياناتي، الخصوصية، المشروعات الموثقة، والإعدادات'
                  : 'My Data, Privacy, verified projects, and settings'}
              </span>
            </div>
          </div>
          <ArrowIcon className="w-4 h-4 text-slate-400" />
        </Link>
      </div>
    </div>
  );
};

export default Home;
