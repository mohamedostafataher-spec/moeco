import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Bookmark,
  ExternalLink,
  Search,
  ShieldAlert,
  Flag,
  MessageSquare,
  Trash2,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  VERIFIED_PUBLIC_PROJECTS,
  SavedPublicProjectNote,
  getSavedProjectNotes,
  upsertSavedProjectNote,
  removeSavedProjectNote,
  isSafeExternalUrl,
} from '../services/personalCivicService';

const LocalProjects: React.FC = () => {
  const { user, isRtl } = useApp();
  const userId = user?.id || 'guest-local';

  const [savedNotes, setSavedNotes] = useState<SavedPublicProjectNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [errorFlagDrafts, setErrorFlagDrafts] = useState<Record<string, string>>({});

  const reloadSaved = () => setSavedNotes(getSavedProjectNotes(userId));

  useEffect(() => {
    reloadSaved();
  }, [userId]);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return VERIFIED_PUBLIC_PROJECTS.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.governorate.toLowerCase().includes(q) ||
        p.sector.toLowerCase().includes(q)
      );
    });
  }, [searchTerm]);

  return (
    <div
      className="max-w-5xl mx-auto px-4 pb-24 space-y-6 text-slate-100"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="bg-slate-950/90 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Building2 className="w-4 h-4" />
              <span>متابعة المشروعات العامة الموثقة</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">مشروعي في منطقتي</h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              مساحة لمتابعة المشروعات العامة عند توفر مصدر رسمي موثق، مع حفظ المشروعات المهمة
              لك وكتابة ملاحظاتك الشخصية الخاصة.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition ${
                activeTab === 'all'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-900 border-white/10 text-slate-300'
              }`}
            >
              مصادر المشروعات الموثقة
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                activeTab === 'saved'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-900 border-white/10 text-slate-300'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>مشروعاتي المحفوظة ({savedNotes.length})</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-sky-500/25 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">سياسة التوثيق الصارمة:</p>
            <p>
              لا ينشر MoEco أسماء مشروعات أو نسب تنفيذ أو ميزانيات أو إحداثيات غير مستمدة من مصدر
              رسمي موثق ومرخّص داخل التطبيق.
            </p>
          </div>
        </div>
      </header>

      {activeTab === 'saved' ? (
        <section className="bg-slate-950/90 border border-white/10 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-black text-white">مشروعاتي المحفوظة وملاحظاتي الخاصة</h2>
          {savedNotes.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-white/15 rounded-2xl p-8 text-center space-y-2">
              <p className="text-base font-black text-white">لا توجد مشروعات محفوظة لديك حاليًا</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                عند توفر بيانات مشروعات موثقة من مصدر رسمي معتمد، يمكنك حفظ أي مشروع هنا
                وإضافة ملاحظاتك الشخصية أو الإشارة إلى أخطاء بيانات منسوبة للمصدر.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedNotes.map((item) => (
                <article
                  key={item.id}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white">{item.projectTitle}</h3>
                    <p className="text-xs text-slate-400">المصدر: {item.sourceName}</p>
                    {item.personalNote && (
                      <p className="text-xs text-slate-200">ملاحظتي الخاصة: {item.personalNote}</p>
                    )}
                    {item.reportedErrorNote && (
                      <p className="text-xs text-amber-300">
                        {item.reportedErrorTag || 'ملاحظة مستخدم غير متحققة'}: {item.reportedErrorNote}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeSavedProjectNote(userId, item.projectId);
                      reloadSaved();
                    }}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 text-rose-300 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>إزالة</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : VERIFIED_PUBLIC_PROJECTS.length === 0 ? (
        /* Honest Empty State Required When No Verified Project Source Exists in Codebase */
        <section
          aria-label="حالة توفر بيانات المشروعات الموثقة"
          className="bg-slate-950/90 border border-white/10 rounded-3xl p-8 text-center space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
            <Info className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-white">
            لا توجد بيانات مشروعات موثقة متاحة داخل MoEco حاليًا
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            بعد فحص ملفات ومصادر التطبيق الحالية، لا يتصل MoEco بأي واجهة برمجة تطبيقات أو قاعدة
            بيانات رسمية منشورة وموثقة لمشروعات المحافظات أو خطة المواطن، ولا يعرض أي مشروعات
            نموذجية أو نسب إنجاز افتراضية.
          </p>

          <div className="max-w-2xl mx-auto bg-slate-900/80 border border-white/10 rounded-2xl p-5 text-right space-y-2 text-xs text-slate-300">
            <p className="font-bold text-white">ما الذي يلزم لتفعيل عرض المشروعات هنا بصورة موثقة؟</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>مصدر بيانات رسمي مفتوح ومعتمد أو واجهة ربط مصرح بها (مثل بيانات خطة المواطن / المحافظات).</li>
              <li>تضمين اسم الجهة المصدرية، ورابط المصدر الرسمي الموثق لكل مشروع، وتاريخ آخر تحديث للبيانات.</li>
              <li>عرض الحقول الرسمية فقط كما وردت في المصدر دون استنتاج أو تخمين للنسب أو الإحداثيات.</li>
            </ul>
          </div>
        </section>
      ) : (
        /* Interactive Verified Projects Renderer (Activates automatically when real verified feed is wired) */
        <section className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="بحث في المشروعات الموثقة"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المشروع أو المحافظة أو القطاع..."
              className="w-full min-h-[44px] pr-10 pl-4 rounded-2xl bg-slate-950 border border-white/15 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map((project) => {
              const saved = savedNotes.find((s) => s.projectId === project.id);
              const noteVal = noteDrafts[project.id] ?? saved?.personalNote ?? '';
              const flagVal = errorFlagDrafts[project.id] ?? saved?.reportedErrorNote ?? '';

              return (
                <article
                  key={project.id}
                  className="bg-slate-950/90 border border-white/10 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-white">{project.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {project.governorate} · {project.sector} · الحالة: {project.statusText}
                      </p>
                      <p className="text-xs text-emerald-300 mt-1">
                        المصدر الرسمي: {project.sourceName}
                        {project.lastUpdated ? ` (آخر تحديث: ${project.lastUpdated})` : ''}
                      </p>
                    </div>
                    {isSafeExternalUrl(project.sourceUrl) && (
                      <a
                        href={project.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-emerald-300"
                      >
                        <span>المصدر الرسمي</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ملاحظة شخصية خاصة (لا تُنشر)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteVal}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
                          }
                          placeholder="احفظ ملاحظة متابعة لنفسك..."
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            upsertSavedProjectNote(userId, {
                              projectId: project.id,
                              projectTitle: project.title,
                              sourceName: project.sourceName,
                              sourceUrl: project.sourceUrl,
                              personalNote: noteVal.trim(),
                              reportedErrorNote: saved?.reportedErrorNote,
                              reportedErrorTag: saved?.reportedErrorTag,
                            });
                            reloadSaved();
                          }}
                          className="min-h-[44px] px-4 rounded-xl bg-emerald-500 text-slate-950 font-black"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-amber-400" />
                        <span>إبلاغ عن خطأ في البيانات (تُسجّل كملاحظة مستخدم غير متحققة)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={flagVal}
                          onChange={(e) =>
                            setErrorFlagDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
                          }
                          placeholder="وصف الخطأ المنسوب للمصدر..."
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            upsertSavedProjectNote(userId, {
                              projectId: project.id,
                              projectTitle: project.title,
                              sourceName: project.sourceName,
                              sourceUrl: project.sourceUrl,
                              personalNote: noteVal.trim(),
                              reportedErrorNote: flagVal.trim(),
                              reportedErrorTag: 'ملاحظة مستخدم غير متحققة',
                            });
                            reloadSaved();
                          }}
                          className="min-h-[44px] px-4 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold"
                        >
                          تسجيل الملاحظة
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default LocalProjects;
