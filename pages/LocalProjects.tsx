import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHero, EmptyState } from '../components/ui';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { ConsentRequiredNotice } from '../components/ConsentGateModal';
import { SavedPublicProjectNote, isSafeExternalUrl } from '../services/personalCivicService';
import { supabaseDataService, OfficialSourceRecord } from '../services/supabaseDataService';

const LocalProjects: React.FC = () => {
  const { isRtl } = useApp();
  const { isConfigured, authUser, hasCoreConsent, analyticsEnabled, openConsentModal, trackUsageEvent } =
    usePrivacyConsent();
  const userId = authUser?.id || '';

  const [officialSources, setOfficialSources] = useState<OfficialSourceRecord[]>([]);
  const [savedNotes, setSavedNotes] = useState<SavedPublicProjectNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [errorFlagDrafts, setErrorFlagDrafts] = useState<Record<string, string>>({});

  const loadSourcesAndNotes = useCallback(async () => {
    if (!isConfigured) {
      setOfficialSources([]);
      setSavedNotes([]);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sources, notes] = await Promise.all([
        supabaseDataService.listPublishedOfficialSources(),
        userId && hasCoreConsent
          ? supabaseDataService.listSavedProjectNotes(userId)
          : Promise.resolve([]),
      ]);
      setOfficialSources(sources);
      setSavedNotes(notes);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر تحميل المشروعات. جرّب مرة تانية.');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, userId, hasCoreConsent]);

  useEffect(() => {
    loadSourcesAndNotes();
  }, [loadSourcesAndNotes]);

  useEffect(() => {
    if (analyticsEnabled) {
      trackUsageEvent('feature_opened', { feature: 'local_projects' });
    }
  }, [analyticsEnabled, trackUsageEvent]);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return officialSources.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.governorate || '').toLowerCase().includes(q) ||
        (p.sector || '').toLowerCase().includes(q) ||
        p.sourceOwner.toLowerCase().includes(q)
      );
    });
  }, [officialSources, searchTerm]);

  const handleSaveProjectNote = async (
    project: OfficialSourceRecord,
    personalNote: string,
    reportedErrorNote?: string,
  ) => {
    if (!hasCoreConsent || !userId) {
      openConsentModal('حفظ ملاحظات المشروعات الموثقة');
      return;
    }
    try {
      await supabaseDataService.upsertSavedProjectNote(userId, {
        projectId: project.id,
        projectTitle: project.title,
        sourceName: project.sourceOwner,
        sourceUrl: project.sourceUrl,
        personalNote: personalNote.trim(),
        reportedErrorNote: reportedErrorNote?.trim() || undefined,
      });
      await loadSourcesAndNotes();
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر حفظ الملاحظة.');
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto pb-10 space-y-6 text-slate-900"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <PageHero
        icon={<Building2 className="w-6 h-6" />}
        eyebrow="مصادر رسمية"
        title="مشروعي في منطقتي"
        subtitle="تابع المشروعات المعلنة رسميًا في منطقتك، وكل مشروع معاه اسم الجهة والرابط الأصلي."
      >
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className="min-h-[44px] px-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={activeTab === 'all' ? { background: '#fff', color: '#064e3f' } : { background: 'rgba(255,255,255,.15)', color: '#fff' }}
          >
            المشروعات ({officialSources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={activeTab === 'saved' ? { background: '#fff', color: '#064e3f' } : { background: 'rgba(255,255,255,.15)', color: '#fff' }}
          >
            <Bookmark className="w-4 h-4" />
            <span>المحفوظة ({savedNotes.length})</span>
          </button>
        </div>
      </PageHero>

      {errorMsg && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {activeTab === 'saved' ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">مشروعاتي المحفوظة وملاحظاتي الخاصة</h2>
          {!hasCoreConsent ? (
            <ConsentRequiredNotice featureTitle="حفظ ملاحظات المشروعات" />
          ) : savedNotes.length === 0 ? (
            <EmptyState
              title="مفيش مشروعات محفوظة"
              text="احفظ أي مشروع تتابعه وضيف عليه ملاحظاتك."
            />
          ) : (
            <div className="space-y-3">
              {savedNotes.map((item) => (
                <article
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{item.projectTitle}</h3>
                    <p className="text-xs text-slate-600">المصدر: {item.sourceName}</p>
                    {item.personalNote && (
                      <p className="text-xs text-slate-800">ملاحظتي الخاصة: {item.personalNote}</p>
                    )}
                    {item.reportedErrorNote && (
                      <p className="text-xs text-amber-800">
                        {item.reportedErrorTag || 'ملاحظة مستخدم غير متحققة'}: {item.reportedErrorNote}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabaseDataService.deleteSavedProjectNote(userId, item.projectId);
                      await loadSourcesAndNotes();
                    }}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>إزالة</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          <span>جاري التحميل...</span>
        </div>
      ) : officialSources.length === 0 ? (
        <EmptyState
          title="لسه مفيش مشروعات في منطقتك"
          text="لما تتنشر مشروعات من جهات رسمية هتظهر هنا مع مصدرها. مش بنعرض أي أرقام غير مؤكدة."
        />
      ) : (
        <section className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="بحث في المشروعات الموثقة"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المشروع أو المحافظة أو الجهة المصدرية..."
              className="w-full min-h-[44px] pr-10 pl-4 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
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
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{project.title}</h3>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                            project.dataStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {project.dataStatus === 'verified' ? 'مصدر موثق' : 'أرشيف تاريخي'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {[project.governorate, project.sector, project.statusText]
                          .filter(Boolean)
                          .join(' · ') || 'بيانات رسمية منشورة'}
                      </p>
                      <p className="text-xs text-emerald-700 font-semibold">
                        الجهة المصدرية: {project.sourceOwner} · تاريخ الاستيراد:{' '}
                        <span className="num-ltr">
                          {new Date(project.importedAt).toLocaleDateString('ar-EG')}
                        </span>
                        {project.verifiedAt && (
                          <>
                            {' '}
                            · تاريخ التحقق:{' '}
                            <span className="num-ltr">
                              {new Date(project.verifiedAt).toLocaleDateString('ar-EG')}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    {isSafeExternalUrl(project.sourceUrl) && (
                      <a
                        href={project.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-emerald-700"
                      >
                        <span>المصدر الرسمي</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>ملاحظة شخصية خاصة (تُحفظ لجلستك فقط)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteVal}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
                          }
                          placeholder="احفظ ملاحظة متابعة لنفسك..."
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveProjectNote(project, noteVal, saved?.reportedErrorNote)}
                          className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-amber-700" />
                        <span>إبلاغ عن خطأ في البيانات (ملاحظة غير متحققة)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={flagVal}
                          onChange={(e) =>
                            setErrorFlagDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
                          }
                          placeholder="وصف الخطأ المنسوب للمصدر..."
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveProjectNote(project, noteVal, flagVal)}
                          className="min-h-[44px] px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold"
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
