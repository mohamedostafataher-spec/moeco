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
      setErrorMsg(err?.message || (isRtl ? 'تعذر تحميل المشروعات. جرّب مرة تانية.' : 'Could not load projects. Please try again.'));
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
      openConsentModal(isRtl ? 'حفظ ملاحظات المشروعات الموثقة' : 'Saving verified project notes');
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
      setErrorMsg(err?.message || (isRtl ? 'تعذر حفظ الملاحظة.' : 'Could not save the note.'));
    }
  };


  return (
    <div
      className="max-w-4xl mx-auto pb-10 space-y-6 text-slate-900"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <PageHero
        icon={<Building2 className="w-6 h-6" />}
        eyebrow={isRtl ? "مصادر رسمية" : "Official sources"}
        title={isRtl ? "مشروعي في منطقتي" : "Projects in My Area"}
        subtitle={isRtl ? "تابع المشروعات المعلنة رسميًا في منطقتك، وكل مشروع معاه اسم الجهة والرابط الأصلي." : "Follow officially announced projects in your area, each with its authority name and original link."}
      >
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className="min-h-[44px] px-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={activeTab === 'all' ? { background: '#fff', color: '#064e3f' } : { background: 'rgba(255,255,255,.15)', color: '#fff' }}
          >
            {isRtl ? `المشروعات (${officialSources.length})` : `Projects (${officialSources.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={activeTab === 'saved' ? { background: '#fff', color: '#064e3f' } : { background: 'rgba(255,255,255,.15)', color: '#fff' }}
          >
            <Bookmark className="w-4 h-4" />
            <span>{isRtl ? `المحفوظة (${savedNotes.length})` : `Saved (${savedNotes.length})`}</span>
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
          <h2 className="text-lg font-bold text-slate-900">{isRtl ? 'مشروعاتي المحفوظة وملاحظاتي الخاصة' : 'My saved projects and private notes'}</h2>
          {!hasCoreConsent ? (
            <ConsentRequiredNotice featureTitle={isRtl ? "حفظ ملاحظات المشروعات" : "Saving project notes"} />
          ) : savedNotes.length === 0 ? (
            <EmptyState
              title={isRtl ? "مفيش مشروعات محفوظة" : "No saved projects"}
              text={isRtl ? "احفظ أي مشروع تتابعه وضيف عليه ملاحظاتك." : "Save any project you follow and add your notes."}
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
                    <p className="text-xs text-slate-600">{isRtl ? 'المصدر: ' : 'Source: '}{item.sourceName}</p>
                    {item.personalNote && (
                      <p className="text-xs text-slate-800">{isRtl ? 'ملاحظتي الخاصة: ' : 'My private note: '}{item.personalNote}</p>
                    )}
                    {item.reportedErrorNote && (
                      <p className="text-xs text-amber-800">
                        {item.reportedErrorTag || (isRtl ? 'ملاحظة مستخدم غير متحققة' : 'Unverified user note')}: {item.reportedErrorNote}
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
                    <span>{isRtl ? 'إزالة' : 'Remove'}</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          <span>{isRtl ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      ) : officialSources.length === 0 ? (
        <EmptyState
          title={isRtl ? "لسه مفيش مشروعات في منطقتك" : "No projects in your area yet"}
          text={isRtl ? "لما تتنشر مشروعات من جهات رسمية هتظهر هنا مع مصدرها. مش بنعرض أي أرقام غير مؤكدة." : "When authorities publish projects they will appear here with their source. We never show unverified figures."}
        />
      ) : (
        <section className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label={isRtl ? "بحث في المشروعات الموثقة" : "Search verified projects"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? "ابحث باسم المشروع أو المحافظة أو الجهة المصدرية..." : "Search by project, governorate, or source authority..."}
              className="w-full min-h-[44px] pe-10 ps-4 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
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
                          {project.dataStatus === 'verified' ? (isRtl ? 'مصدر موثق' : 'Verified source') : (isRtl ? 'أرشيف تاريخي' : 'Historical archive')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {[project.governorate, project.sector, project.statusText]
                          .filter(Boolean)
                          .join(' · ') || (isRtl ? 'بيانات رسمية منشورة' : 'Published official data')}
                      </p>
                      <p className="text-xs text-emerald-700 font-semibold">
                        {isRtl ? 'الجهة المصدرية: ' : 'Source authority: '}{project.sourceOwner}{isRtl ? ' · تاريخ الاستيراد: ' : ' · Imported: '}{' '}
                        <span className="num-ltr">
                          {new Date(project.importedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB')}
                        </span>
                        {project.verifiedAt && (
                          <>
                            {' '}
                            {isRtl ? ' · تاريخ التحقق: ' : ' · Verified: '}{' '}
                            <span className="num-ltr">
                              {new Date(project.verifiedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB')}
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
                        <span>{isRtl ? 'المصدر الرسمي' : 'Official source'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isRtl ? 'ملاحظة شخصية خاصة (تُحفظ لجلستك فقط)' : 'Private personal note (saved to your session only)'}</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteVal}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
                          }
                          placeholder={isRtl ? "احفظ ملاحظة متابعة لنفسك..." : "Save a follow-up note for yourself..."}
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveProjectNote(project, noteVal, saved?.reportedErrorNote)}
                          className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        >
                          {isRtl ? 'حفظ' : 'Save'}
                        </button>
                      </div>
                    </div>


                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isRtl ? 'إبلاغ عن خطأ في البيانات (ملاحظة غير متحققة)' : 'Report a data error (unverified note)'}</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={flagVal}
                          onChange={(e) =>
                            setErrorFlagDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
                          }
                          placeholder={isRtl ? "وصف الخطأ المنسوب للمصدر..." : "Describe the error attributed to the source..."}
                          className="flex-1 min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveProjectNote(project, noteVal, flagVal)}
                          className="min-h-[44px] px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold"
                        >
                          {isRtl ? 'تسجيل الملاحظة' : 'Record note'}
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
