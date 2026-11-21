import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, History, AlertTriangle, User, 
  Clock, Search, Filter, Download, ExternalLink,
  CheckCircle2, Info, Activity, Zap, Droplets, Flame
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { TransparencyCenter } from '../services/TransparencyCenter';

const Transparency: React.FC = () => {
  const { theme, language } = useApp();
  const [activeTab, setActiveTab] = useState<'methodology' | 'alerts' | 'audits'>('methodology');
  const [logs, setLogs] = useState<{ alerts: any[], audits: any[] }>({ alerts: [], audits: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await storageService.getTransparencyLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] mb-8 p-10 bg-gradient-to-br from-egypt-gold/20 to-zinc-900 border border-egypt-gold/10">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <ShieldCheck className="w-64 h-64 text-egypt-gold" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black font-arabic mb-4">
            {language === 'ar' ? 'مركز الشفافية الرقمي' : 'Digital Transparency Center'}
          </h1>
          <p className="text-egypt-gold/60 font-bold max-w-2xl leading-relaxed">
            {language === 'ar' 
              ? 'نحن نؤمن بأن البيانات هي حق للجميع. هنا يمكنك مراجعة كيفية حساب المؤشرات، وتدقيق كافة الإنذارات الصادرة، ومتابعة سجل العمليات بكل شفافية.'
              : 'We believe data is a right for everyone. Here you can review how indices are calculated, audit all issued alerts, and follow the operation logs with full transparency.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'methodology', label: language === 'ar' ? 'منهجية الحساب' : 'Methodology', icon: Info },
          { id: 'alerts', label: language === 'ar' ? 'سجل الإنذارات' : 'Alerts History', icon: AlertTriangle },
          { id: 'audits', label: language === 'ar' ? 'سجل العمليات' : 'Audit Logs', icon: History }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm whitespace-normal sm:whitespace-nowrap break-words transition-all ${
              activeTab === tab.id 
                ? 'bg-egypt-gold text-black shadow-lg' 
                : 'bg-zinc-900/50 text-zinc-400 border border-white/5 hover:bg-zinc-800'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-arabic">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'methodology' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TransparencyCenter.info.map((info, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx} 
              className="p-8 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-egypt-gold/20 text-egypt-gold rounded-2xl">
                  {info.sector === 'Electricity' ? <Zap className="w-6 h-6" /> : info.sector === 'Water' ? <Droplets className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
                </div>
                <h3 className="text-2xl font-black font-arabic">{info.sector}</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'طريقة الحساب' : 'Calculation Method'}</p>
                  <p className="text-sm font-bold leading-relaxed">{language === 'ar' ? info.methodAr : info.methodEn}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'المعادلة الرياضية' : 'Mathematical Formula'}</p>
                  <div className="p-4 bg-black/30 rounded-xl font-mono text-xs text-egypt-gold border border-egypt-gold/10">
                    {language === 'ar' ? info.formulaAr : info.formulaEn}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'المصدر' : 'Source'}</p>
                    <a href={info.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:underline">
                      {language === 'ar' ? info.sourceAr : info.sourceEn}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'هامش الخطأ' : 'Error Margin'}</p>
                    <p className="text-sm font-bold text-amber-500">{info.errorMargin}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {logs.alerts.length > 0 ? logs.alerts.map((alert, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={alert.id} 
              className="p-6 bg-zinc-900/50 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-6 items-start"
            >
              <div className={`p-4 rounded-2xl ${alert.severity === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-black font-arabic">
                    {typeof alert.title === 'string' ? alert.title : (language === 'ar' ? (alert.title?.ar || alert.title_ar) : (alert.title?.en || alert.title_en))}
                  </h4>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                    alert.is_active ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {alert.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'مغلق' : 'Closed')}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm font-arabic mb-4">
                  {typeof alert.description === 'string' ? alert.description : (language === 'ar' ? (alert.description?.ar || alert.message_ar || alert.description_ar) : (alert.description?.en || alert.message_en || alert.description_en))}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                    <User className="w-3 h-3" />
                    {alert.confirmed_by ? (language === 'ar' ? 'تم التأكيد بواسطة مسؤول' : 'Confirmed by Admin') : (language === 'ar' ? 'نظام آلي' : 'Auto-System')}
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="py-20 text-center bg-zinc-900/30 rounded-[3rem] border border-dashed border-white/10">
              <ShieldCheck className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold">{language === 'ar' ? 'لا يوجد سجل إنذارات متاح' : 'No alert history available'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audits' && (
        <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-zinc-800/50 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <th className="px-6 py-4">{language === 'ar' ? 'العملية' : 'Action'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'التوقيت' : 'Timestamp'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.audits.map((audit, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-all">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-egypt-gold/10 text-egypt-gold rounded-lg text-[10px] font-black">
                        {audit.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{audit.user_id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{new Date(audit.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-arabic text-zinc-400">{JSON.stringify(audit.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transparency;
