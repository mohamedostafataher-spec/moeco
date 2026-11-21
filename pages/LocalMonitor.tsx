import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ArrowLeft,
  Filter,
  Droplets,
  Trash2,
  Sun,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  civicActionService,
  LocalInitiative,
  REPORT_CATEGORY_META,
  ReportCategory,
} from '../services/civicActionService';
import { notificationService } from '../services/notificationService';

interface MonitorMetrics {
  totalReports: number;
  openCount: number;
  closedCount: number;
  hasResponseTimestamps: boolean;
  avgResponseHours: number | null;
  topIssues: { category: ReportCategory; label: string; count: number }[];
  byRegionList: { region: string; count: number }[];
  hasDemoData: boolean;
}

const INITIATIVE_STATUS_AR: Record<LocalInitiative['status'], { label: string; cls: string }> = {
  proposed: { label: 'مقترحة', cls: 'bg-amber-500/15 text-amber-300 border-amber-400/40' },
  coordinating: { label: 'قيد التنسيق', cls: 'bg-sky-500/15 text-sky-300 border-sky-400/40' },
  in_progress: { label: 'قيد التنفيذ', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40' },
  verified: { label: 'تم التحقق', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40' },
};

const INITIATIVE_CAT_ICON: Record<LocalInitiative['category'], React.FC<{ className?: string }>> = {
  water: Droplets,
  waste: Trash2,
  heat_shade: Sun,
  awareness: Sparkles,
};

const LocalMonitor: React.FC = () => {
  const [includeDemo, setIncludeDemo] = useState(true);
  const [metrics, setMetrics] = useState<MonitorMetrics | null>(null);
  const [initiatives, setInitiatives] = useState<LocalInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (withDemo: boolean) => {
    setLoading(true);
    setError('');
    try {
      const [m, inits] = await Promise.all([
        civicActionService.getLocalMonitorMetrics(withDemo),
        Promise.resolve(civicActionService.getInitiatives()),
      ]);
      setMetrics(m);
      setInitiatives(inits);
    } catch (e) {
      console.error('LocalMonitor load error:', e);
      setError('تعذر تحميل مؤشرات المتابعة المحلية حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(includeDemo);
  }, [includeDemo]);

  const handleToggleInitiative = (id: string, title: string, currentlyJoined?: boolean) => {
    const updated = civicActionService.toggleJoinInitiative(id);
    setInitiatives(updated);
    notificationService.success(
      currentlyJoined
        ? `تم إلغاء انضمامك إلى «${title}»`
        : `تم تسجيل انضمامك إلى «${title}» (تجريبي محلياً)`
    );
  };

  const maxCategoryCount = Math.max(1, ...(metrics?.topIssues.map((i) => i.count) || [1]));
  const maxRegionCount = Math.max(1, ...(metrics?.byRegionList.map((r) => r.count) || [1]));

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-6" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-white">لوحة المتابعة المحلية</h1>
                {(includeDemo || metrics?.hasDemoData) && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                    بيانات تجريبية مدمجة
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1">
                مؤشرات مجمّعة للبلاغات والمبادرات المحلية دون عرض أي بيانات شخصية أو مواقع دقيقة للمواطنين.
              </p>
            </div>
          </div>

          <Link
            to="/eco-watch"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
          >
            <span>تقديم بلاغ بيئي</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Data Source Toggle & Honesty Banner */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              تُحسب الأرقام التالية مباشرةً من سجلات البلاغات المحفوظة في التطبيق. عند تفعيل وضع «بلاغات المستخدمين فقط» تُستبعد العينات التجريبية الأولية ولا تُختلق أي نسب أو مدد استجابة غير مسجلة.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0" role="group" aria-label="تصفية مصدر البيانات">
            <button
              type="button"
              onClick={() => setIncludeDemo(true)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                includeDemo
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5 inline ml-1.5" />
              شامل البيانات التجريبية
            </button>
            <button
              type="button"
              onClick={() => setIncludeDemo(false)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                !includeDemo
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              بلاغات المستخدمين فقط
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-rose-500/15 border border-rose-400/40 rounded-2xl p-4 text-rose-200 text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : metrics ? (
        <>
          {/* KPI Summary Cards */}
          <section aria-label="ملخص المؤشرات المجمعة" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>إجمالي البلاغات المجمّعة</span>
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white tabular-nums">{metrics.totalReports}</p>
              <span className="inline-block text-[11px] font-bold text-slate-400">
                {includeDemo ? 'تقديري / يتضمن عينات تجريبية' : 'مسجل من المستخدمين'}
              </span>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>بلاغات مفتوحة</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-300 tabular-nums">{metrics.openCount}</p>
              <span className="inline-block text-[11px] text-slate-400">
                تشمل: تم الاستلام، قيد المراجعة، أُحيل لشريك
              </span>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>بلاغات مغلقة</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-300 tabular-nums">{metrics.closedCount}</p>
              <span className="inline-block text-[11px] text-slate-400">
                تم التحقق من الحل أو تعذّر التحقق
              </span>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>متوسط زمن الاستجابة</span>
                <Clock className="w-4 h-4 text-sky-400" />
              </div>
              {metrics.hasResponseTimestamps && metrics.avgResponseHours !== null ? (
                <>
                  <p className="text-3xl font-black text-sky-300 tabular-nums">
                    {metrics.avgResponseHours} <span className="text-sm font-bold">ساعة</span>
                  </p>
                  <span className="inline-block text-[11px] text-emerald-400">
                    محسوب من طوابع الاستجابة الفعلية
                  </span>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-slate-300">غير متوفر حالياً</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    لا توجد طوابع زمنية فعلية لاستجابة الجهات بعد؛ لن نعرض رقماً افتراضياً.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Breakdowns */}
          {metrics.totalReports === 0 ? (
            <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-10 text-center space-y-3">
              <Info className="w-10 h-10 text-slate-400 mx-auto" />
              <h2 className="text-lg font-black text-white">لا توجد بلاغات مسجلة من المستخدمين بعد</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                أضف بلاغك الأول من قسم «بلاغ بيئي» أو فعّل عرض البيانات التجريبية لمعاينة التوزيع.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Category */}
              <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">أكثر المشكلات تكراراً حسب النوع</h2>
                  <span className="text-xs font-bold text-slate-400">إجمالي: {metrics.totalReports}</span>
                </div>
                <div className="space-y-3">
                  {metrics.topIssues.map((item) => {
                    const pct = Math.round((item.count / maxCategoryCount) * 100);
                    const meta = REPORT_CATEGORY_META[item.category];
                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-200">{item.label}</span>
                          <span className={`${meta?.color || 'text-emerald-400'} tabular-nums`}>
                            {item.count} بلاغ
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* By Governorate */}
              <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">التوزيع الجغرافي العام (حسب المحافظة)</h2>
                  <MapPin className="w-5 h-5 text-sky-400" />
                </div>
                <p className="text-xs text-slate-400">
                  يُعرض التوزيع على مستوى المحافظة فقط لحماية خصوصية المواقع الفردية.
                </p>
                <div className="space-y-3">
                  {metrics.byRegionList.map((reg) => {
                    const pct = Math.round((reg.count / maxRegionCount) * 100);
                    return (
                      <div key={reg.region} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-200">{reg.region}</span>
                          <span className="text-sky-400 tabular-nums">{reg.count} بلاغ</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* Local Initiatives */}
          <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">المبادرات المحلية القابلة للانضمام</h2>
                <p className="text-xs text-slate-400 mt-1">
                  مبادرات مجتمعية تجريبية لتنظيم العمل التطوعي على مستوى الحي والمنطقة.
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                نماذج مبادرات تجريبية
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {initiatives.map((init) => {
                const Icon = INITIATIVE_CAT_ICON[init.category] || Users;
                const st = INITIATIVE_STATUS_AR[init.status];
                return (
                  <article
                    key={init.id}
                    className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white leading-snug">{init.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{init.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-sky-400" />
                          {init.governorate} - {init.area}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          {init.participantsCount} مشارك
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500">تحديث: {init.lastUpdated}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleInitiative(init.id, init.title, init.joinedByMe)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                          init.joinedByMe
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-400/40'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        }`}
                        aria-label={init.joinedByMe ? `إلغاء الانضمام إلى ${init.title}` : `انضمام إلى ${init.title}`}
                      >
                        {init.joinedByMe ? 'منضم (اضغط للإلغاء)' : 'انضم للمبادرة'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/50 border border-white/5 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                يُستخدم الانضمام إلى المبادرات المحلية كأحد شروط التحقق في قسم «التحديات والأثر الحقيقي».
              </span>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default LocalMonitor;
