
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Info, Mail, Globe, Award, ShieldCheck, Map, Landmark, Compass, MessageCircle, ShieldAlert, FileText, Send, CheckCircle, XCircle, RefreshCw, Users, Leaf } from 'lucide-react';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';

import { Footer } from '../components/Footer';

const About: React.FC = () => {
  const { t, language, theme } = useApp();
  const isRtl = language === 'ar';
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | null>(null);
  const [supportForm, setSupportForm] = useState({ subject: '', content: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ users: '—', carbon: '—', active: '—' });

  React.useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { data: carbonData } = await supabase.from('consumption_records').select('co2');
        const totalCarbon = carbonData?.reduce((acc, curr) => acc + (curr.co2 < 0 ? Math.abs(curr.co2) : 0), 0) || 0;
        
        setStats({
          users: userCount ? (userCount > 1000 ? `${(userCount / 1000).toFixed(1)}k` : userCount.toString()) : '—',
          carbon: totalCarbon > 1000000 ? `${(totalCarbon / 1000000).toFixed(1)}M` : (totalCarbon > 0 ? `${(totalCarbon / 1000).toFixed(1)}k` : '—'),
          active: '—'
        });
      } catch (e) {
        console.error("Stats fetch error", e);
      }
    };
    fetchLiveStats();
  }, []);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await storageService.saveSupportMessage({
        subject: supportForm.subject,
        content: supportForm.content
      });
      setSubmitted(true);
      setSupportForm({ subject: '', content: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Support submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto space-y-8 md:space-y-12 px-4 md:px-0 pb-20 animate-in fade-in duration-1000 ${theme === 'dark' ? 'text-emerald-100' : ''}`}>
      <div className="text-center space-y-4 md:space-y-6 mb-12 md:mb-16 pt-8 md:pt-12">
        <div className="inline-flex p-4 md:p-6 bg-emerald-50 rounded-2xl md:rounded-[2.5rem] mb-4 md:mb-6 shadow-inner">
          <Landmark className="w-10 h-10 md:w-16 md:h-16 text-emerald-700" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-emerald-950 font-arabic tracking-tighter">
          {isRtl ? 'عن MoEco' : 'About MoEco'}
        </h1>
        <p className="text-xs md:text-sm lg:text-base text-stone-500 font-bold max-w-2xl mx-auto leading-relaxed">
          {isRtl 
            ? 'المنصة الوطنية المتكاملة للاستدامة والبيئة في مصر، تهدف إلى تمكين المواطن من المشاركة في التحول الأخضر وتحقيق أهداف التنمية المستدامة 2030.'
            : 'Egypt\'s integrated national platform for sustainability and environment, aiming to empower citizens to participate in the green transition and achieve Sustainable Development Goals 2030.'}
        </p>
      </div>

      {/* Modern Live Platform Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[3rem] border border-stone-100 flex flex-col items-center justify-center text-center group hover:scale-105 transition-all ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white shadow-xl'}`}>
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Users size={24} />
           </div>
           <p className="text-4xl font-black text-emerald-950 tabular-nums">{stats.users}</p>
           <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">{isRtl ? 'مواطن أخضر' : 'GREEN CITIZENS'}</p>
        </div>
        <div className={`p-8 rounded-[3rem] border border-stone-100 flex flex-col items-center justify-center text-center group hover:scale-105 transition-all ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white shadow-xl'}`}>
           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Leaf size={24} />
           </div>
           <p className="text-4xl font-black text-emerald-950 tabular-nums">{stats.carbon}</p>
           <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">{isRtl ? 'كجم كربون تم توفيره' : 'KG CARBON SAVED'}</p>
        </div>
        <div hidden className={`p-8 rounded-[3rem] border border-stone-100 flex flex-col items-center justify-center text-center group hover:scale-105 transition-all ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white shadow-xl'}`}>
           <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <div className="relative">
                 <RefreshCw size={24} className="animate-spin-slow" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                 </div>
              </div>
           </div>
           <p className="text-4xl font-black text-emerald-950 tabular-nums">{stats.active}</p>
           <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">{isRtl ? 'جلسة نشطة حالياً' : 'LIVE ECO SESSIONS'}</p>
        </div>
      </div>

      {/* Copyright Notice */}
      <div className={`p-8 rounded-[3rem] border border-stone-100 text-center ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}>
        <p className="text-emerald-900 font-black text-xl font-arabic mb-2">
          © 2026 Mohamed Mostafa Taher. All rights reserved.
        </p>
        <p className="text-emerald-700 font-bold font-arabic">
          جميع الحقوق محفوظة لمحمد مصطفى طاهر.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <a href="mailto:mohamedostafataher@gmail.com" className={`p-10 rounded-[4rem] shadow-xl border border-stone-100 flex items-center gap-6 transition-all hover:scale-105 ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}>
           <div className="p-6 bg-red-100 text-red-600 rounded-[2rem]">
              <Mail className="w-10 h-10" />
           </div>
           <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Gmail Account</p>
              <p className="text-lg font-black text-emerald-900 break-all">mohamedostafataher@gmail.com</p>
           </div>
        </a>

        <a href="https://wa.me/201110095403" target="_blank" className={`p-10 rounded-[4rem] shadow-xl border border-stone-100 flex items-center gap-6 transition-all hover:scale-105 ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}>
           <div className="p-6 bg-green-100 text-green-600 rounded-[2rem]">
              <MessageCircle className="w-10 h-10" />
           </div>
           <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">WhatsApp Business</p>
              <p className="text-lg font-black text-emerald-900">+201110095403</p>
           </div>
        </a>
      </div>

      {/* Support Form */}
      <div className={`p-12 md:p-20 rounded-[5rem] shadow-xl border border-stone-100 relative overflow-hidden ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}>
        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl font-black flex items-center gap-4 font-arabic text-emerald-950">
            <ShieldAlert className="w-10 h-10 text-emerald-600" />
            {isRtl ? 'الدعم الفني والشكاوى' : 'Technical Support & Complaints'}
          </h2>
          
          {submitted ? (
            <div className="p-12 bg-emerald-50 rounded-[3rem] text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto" />
              <h3 className="text-2xl font-black text-emerald-900 font-arabic">تم إرسال رسالتك بنجاح</h3>
              <p className="text-emerald-700 font-bold">سيتواصل معك فريق الدعم في أقرب وقت ممكن.</p>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-4">{isRtl ? 'الموضوع' : 'Subject'}</label>
                  <input 
                    type="text"
                    required
                    value={supportForm.subject}
                    onChange={e => setSupportForm({...supportForm, subject: e.target.value})}
                    placeholder={isRtl ? 'عنوان الرسالة...' : 'Message subject...'}
                    className="w-full bg-stone-50 border border-stone-100 rounded-3xl p-6 text-emerald-900 font-bold outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-4">{isRtl ? 'الرسالة' : 'Message'}</label>
                  <textarea 
                    required
                    rows={4}
                    value={supportForm.content}
                    onChange={e => setSupportForm({...supportForm, content: e.target.value})}
                    placeholder={isRtl ? 'اكتب تفاصيل استفسارك أو شكواك هنا...' : 'Write your inquiry or complaint details here...'}
                    className="w-full bg-stone-50 border border-stone-100 rounded-3xl p-6 text-emerald-900 font-bold outline-none focus:border-emerald-500 transition-all resize-none"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-lg font-arabic flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                {isRtl ? 'إرسال الرسالة' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Policies Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => setActivePolicy(activePolicy === 'privacy' ? null : 'privacy')}
          className={`p-10 rounded-[4rem] shadow-xl border border-stone-100 flex flex-col items-center gap-4 transition-all hover:scale-105 ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}
        >
          <div className="p-6 bg-blue-100 text-blue-600 rounded-[2rem]">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-emerald-950 font-arabic">{isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}</h3>
        </button>

        <button 
          onClick={() => setActivePolicy(activePolicy === 'terms' ? null : 'terms')}
          className={`p-10 rounded-[4rem] shadow-xl border border-stone-100 flex flex-col items-center gap-4 transition-all hover:scale-105 ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}
        >
          <div className="p-6 bg-amber-100 text-amber-600 rounded-[2rem]">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-emerald-950 font-arabic">{isRtl ? 'شروط الاستخدام' : 'Terms of Use'}</h3>
        </button>
      </div>

      {/* Policy Content Overlay */}
      {activePolicy && (
        <div className={`p-12 md:p-20 rounded-[5rem] shadow-xl border border-stone-100 relative overflow-hidden animate-in slide-in-from-bottom duration-500 ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}>
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-black font-arabic text-emerald-950">
                {activePolicy === 'privacy' 
                  ? (isRtl ? 'سياسة الخصوصية' : 'Privacy Policy')
                  : (isRtl ? 'شروط الاستخدام' : 'Terms of Use')}
              </h2>
              <button onClick={() => setActivePolicy(null)} className="p-4 bg-stone-100 rounded-full hover:bg-stone-200 transition-all">
                <XCircle className="w-6 h-6 text-stone-500" />
              </button>
            </div>
            
            <div className="prose prose-emerald max-w-none text-stone-500 font-medium leading-relaxed font-arabic">
              {activePolicy === 'privacy' ? (
                <div className="space-y-4">
                  <p>نحن في MoEco نولي أهمية قصوى لخصوصية بياناتك. جميع البيانات التي يتم جمعها تُستخدم فقط لتحسين تجربتك في التطبيق وتقديم تحليلات بيئية دقيقة.</p>
                  <p>• يتم تشفير جميع البيانات المخزنة في Supabase بأعلى معايير الأمان.</p>
                  <p>• لا نقوم بمشاركة بياناتك الشخصية مع أي أطراف ثالثة دون موافقتك الصريحة.</p>
                  <p>• يمكنك طلب حذف بياناتك في أي وقت من خلال إعدادات الحساب.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>باستخدامك لتطبيق MoEco، فإنك توافق على الشروط التالية:</p>
                  <p>• التطبيق مخصص للاستخدام الشخصي والبحثي فقط.</p>
                  <p>• يلتزم المستخدم بتقديم بيانات دقيقة عند الإبلاغ عن حالات الطوارئ أو استهلاك الموارد.</p>
                  <p>• يُحظر استخدام التطبيق لأي أغراض غير قانونية أو تضليلية.</p>
                  <p>• يحتفظ المطور بالحق في تحديث الشروط والميزات لضمان أفضل خدمة للمجتمع.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`p-12 md:p-20 rounded-[5rem] shadow-xl border border-stone-100 relative overflow-hidden ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}>
        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl font-black flex items-center gap-4 font-arabic text-emerald-950">
            <Award className="w-10 h-10 text-emerald-600" />
            {isRtl ? 'الإشراف الأكاديمي' : 'Academic Supervision'}
          </h2>
          <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner border-4 border-emerald-100">
                <Landmark className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="space-y-2 text-center md:text-right">
                <p className="text-2xl font-black text-emerald-950 font-arabic">د. أمل معتوق</p>
                <p className="text-emerald-800 font-bold">{isRtl ? 'كلية الآداب - جامعة العاصمة' : 'Faculty of Arts - Capital University'}</p>
                <p className="text-stone-500 text-sm italic">{isRtl ? 'تحت إشراف أكاديمي وبحثي متميز' : 'Under distinguished academic and research supervision'}</p>
              </div>
            </div>
          </div>
        </div>
        <Landmark className="absolute top-[-40px] left-[-40px] w-full sm:w-96 h-96 opacity-5 rotate-12" />
      </div>

      <div className={`p-12 md:p-20 rounded-[5rem] shadow-xl border border-stone-100 relative overflow-hidden ${theme === 'dark' ? 'bg-[#001a14]' : 'bg-white'}`}>
        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl font-black flex items-center gap-4 font-arabic text-emerald-950">
            <Globe className="w-10 h-10 text-emerald-600" />
            {isRtl ? 'المنهجية العلمية والبيانات المفتوحة' : 'Scientific Methodology & Open Data'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h3 className="text-xl font-black text-emerald-800">{isRtl ? 'قاعدة البيانات السيادية (Sovereign DB)' : 'Sovereign Local Database'}</h3>
              <p className="text-stone-500 leading-relaxed font-medium">
                {isRtl 
                  ? 'يعتمد مو إيكو على قاعدة بيانات محلية مدمجة (Offline-First) تضمن مجانية التطبيق للأبد. تم جمع البيانات من مصادر رسمية تشمل: الجهاز المركزي للتعبئة العامة والإحصاء (CAPMAS)، وزارة الكهرباء والطاقة المتجددة المصرية، والبنك الدولي.'
                  : 'MoEco relies on a built-in local database (Offline-First) ensuring the app remains free forever. Data is aggregated from official sources including: CAPMAS, the Egyptian Ministry of Electricity and Renewable Energy, and the World Bank.'}
              </p>
              <div className="pt-4 space-y-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{isRtl ? 'المصادر العلمية الرسمية' : 'Official Scientific Sources'}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black border border-emerald-100">IPCC 2026</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black border border-emerald-100">World Bank Data</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black border border-emerald-100">IEA Statistics</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black border border-emerald-100">CAPMAS Egypt</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-black text-emerald-800">{isRtl ? 'الدقة الجغرافية والبحثية' : 'Research & Geographical Precision'}</h3>
              <p className="text-stone-500 leading-relaxed font-medium">
                {isRtl 
                  ? 'تم تصميم التطبيق لخدمة الباحثين وطلاب الجغرافيا، حيث يوفر بيانات تاريخية من عام 1990 وحتى 2026، مع إمكانية تصدير البيانات العلمية بصيغة Excel للتحليل الأكاديمي.'
                  : 'The app is designed to serve researchers and geography students, providing historical data from 1990 to 2026, with the ability to export scientific data in Excel format for academic analysis.'}
              </p>
            </div>
          </div>
        </div>
        <Map className="absolute bottom-[-40px] left-[-40px] w-full sm:w-96 h-96 opacity-5 -rotate-12" />
      </div>

      <div className="bg-[#064e3b] text-white p-12 md:p-20 rounded-[5rem] shadow-2xl overflow-hidden relative group text-center md:text-right">
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-4xl font-black mb-10 flex items-center justify-center md:justify-start gap-4 font-arabic">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
            Developer Identity
          </h2>
          <div>
            <p className="text-3xl font-black text-white">Mohamed Mostafa Taher</p>
            <p className="text-emerald-100/60 font-bold mt-1">Lead Software Architect & Sustainability Specialist</p>
          </div>
        </div>
        <Landmark className="absolute top-[-40px] right-[-40px] w-full sm:w-96 h-96 opacity-5 rotate-12" />
      </div>

      <div className="text-center pt-16 border-t border-stone-100">
        <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">
          MoEco v3.0.0 Sovereign Edition • © 2026 Mohamed Mostafa Taher
        </p>
      </div>
      
      <Footer language={language} />
    </div>
  );
};

export default About;
