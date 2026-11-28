import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  ShieldCheck,
  Vote,
  Cpu,
  Files,
  ExternalLink,
  Info,
  FileText,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { isSafeExternalUrl } from '../services/personalCivicService';

const DigitalGov: React.FC = () => {
  const { user, isRtl } = useApp();
  const [activeTab, setActiveTab] = useState<'services' | 'civic' | 'transparency'>('services');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [s, p] = await Promise.all([
          supabase.from('government_services').select('*').eq('is_active', true),
          user?.id
            ? supabase.from('citizen_requests').select('*, service:service_id(*)').eq('user_id', user.id)
            : Promise.resolve({ data: [] }),
        ]);

        if (!active) return;

        const mappedServices = (s.data || []).map((item: any) => ({
          ...item,
          id: item.id || item.service_id,
          name_ar: item.name_ar || item.service_name_ar || '',
          name_en: item.name_en || item.service_name_en || '',
          description_ar: item.description_ar || item.description || '',
          description_en: item.description_en || item.description || '',
          url: item.url || item.official_portal_url || '',
        }));

        setServices(mappedServices);
        setRequests(p.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {isRtl ? 'دليل الخدمات الرسمية الموثقة' : 'Official Services Directory'}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                {isRtl
                  ? 'روابط البوابات الحكومية المسجلة ومتابعة الطلبات دون أي ادعاء تكامل غير موثق.'
                  : 'Verified portal links and personal records directory.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'services', icon: Cpu, label: isRtl ? 'الخدمات' : 'Services' },
              { id: 'civic', icon: Vote, label: isRtl ? 'المتابعة المحلية' : 'Local Track' },
              { id: 'transparency', icon: ShieldCheck, label: isRtl ? 'الشفافية' : 'Transparency' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            {isRtl
              ? 'يعرض MoEco الروابط الرسمية الموثقة فقط للوصول المباشر، ولا ينتحل صفة جهة حكومية ولا يعرض ميزانيات أو سجلات رقابية غير موثقة.'
              : 'MoEco links directly to verified portals only and does not represent a government agency.'}
          </p>
        </div>
      </header>

      {activeTab === 'services' && (
        <section className="space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500 font-bold">
              {isRtl ? 'جاري التحقق من قائمة الخدمات...' : 'Checking services list...'}
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
              <p className="text-base font-extrabold text-slate-900">
                {isRtl ? 'لا توجد خدمات مسجلة في قاعدة البيانات حاليًا' : 'No verified services loaded'}
              </p>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                {isRtl
                  ? 'يمكنك استخدام أداة «شكواي ما تضيعش» للوصول مباشرةً إلى الروابط الرسمية الموثقة (بوابة الشكاوى الحكومية، الكهرباء، المياه) وحفظ مسوداتك.'
                  : 'Use My Complaints to access verified complaint portals and store your drafts.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-1">
                <Link
                  to="/my-complaints"
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isRtl ? 'الانتقال إلى «شكواي ما تضيعش»' : 'Go to the complaint assistant'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => (
                <article
                  key={s.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700">
                        <Files className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        {isRtl ? 'خدمة مدرجة' : 'Listed Service'}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {isRtl ? s.name_ar : s.name_en}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {isRtl ? s.description_ar : s.description_en}
                    </p>
                  </div>

                  {isSafeExternalUrl(s.url) ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
                    >
                      <span>{isRtl ? 'فتح البوابة الرسمية' : 'Open Official Portal'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 font-bold">
                      {isRtl ? 'لا يتوفر رابط خارجي موثق حاليًا' : 'No verified URL'}
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'civic' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {isRtl ? 'متابعة مشروعات منطقتك وطلباتك' : 'Local Projects & Requests'}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {isRtl
                  ? 'لا تعرض هذه الصفحة أي أرقام ميزانيات أو مشروعات افتراضية دون مصدر رسمي موثق.'
                  : 'No unverified budgets or mock civic records are displayed.'}
              </p>
            </div>
            <Link
              to="/local-projects"
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>{isRtl ? 'فتح «مشروعي في منطقتي»' : 'Open My Local Project'}</span>
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs text-slate-600">
              {isRtl
                ? 'لا توجد طلبات مسجلة مرتبطة بحسابك حاليًا.'
                : 'No requests found for your account.'}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req: any) => (
                <div
                  key={req.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-bold text-slate-900">
                    {req.service?.name_ar || req.service_id || 'طلب خدمة'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-bold text-slate-700">
                    {req.status || (isRtl ? 'محفوظ' : 'Saved')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'transparency' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-extrabold text-slate-900">
              {isRtl ? 'سجل الشفافية والتحقق' : 'Transparency & Verification Policy'}
            </h2>
          </div>
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 space-y-2 text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900">
              {isRtl
                ? 'لا توجد بيانات رقابية أو مالية حكومية مربوطة حاليًا'
                : 'No live government financial or audit feed is connected.'}
            </p>
            <p>
              {isRtl
                ? 'لتجنب تضليل المستخدم، لا يعرض MoEco أي أرقام ميزانيات أو إشعارات تخصيص موارد غير موثقة. يمكنك الاطلاع على شفافية الحسابات البيئية عبر صفحة المنهجية.'
                : 'To avoid misleading numbers, unverified budgets and mock audit feeds have been removed.'}
            </p>
            <div className="pt-2">
              <Link
                to="/methodology"
                className="min-h-[40px] inline-flex items-center gap-1.5 text-emerald-700 font-bold underline"
              >
                <span>{isRtl ? 'مراجعة صفحة المنهجية والشفافية' : 'Review the methodology & transparency page'}</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default DigitalGov;
