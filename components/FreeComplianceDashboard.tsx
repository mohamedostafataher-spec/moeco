
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Zap, Database, Globe, Activity, Download, AlertTriangle } from 'lucide-react';
import { FreeComplianceEngine, DependencyStatus } from '../services/FreeComplianceEngine';
import { CostAnomalyDetector } from '../services/SelfHealingFreeSystem';
import { storageService } from '../services/storageService';
import { useApp } from '../context/AppContext';

export const FreeComplianceDashboard: React.FC = () => {
  const { theme, language } = useApp();
  const [audit, setAudit] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [storageUsage, setStorageUsage] = useState(0);
  const isRtl = language === 'ar';

  useEffect(() => {
    const data = FreeComplianceEngine.audit();
    setAudit(data);
    
    const checkUsage = async () => {
      const u = await CostAnomalyDetector.monitor();
      setUsage(u);
      setStorageUsage(storageService.getStorageUsage());
    };
    checkUsage();
  }, []);

  if (!audit) return null;

  return (
    <div className={`p-8 rounded-[3rem] border shadow-2xl ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20 text-white' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-4 rounded-2xl ${audit.status === 'PASS' ? 'bg-emerald-500' : 'bg-red-500'} text-white shadow-lg`}>
          {audit.status === 'PASS' ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>
        <div>
          <h2 className="text-3xl font-black font-arabic">
            {isRtl ? 'نظام الامتثال المجاني' : 'Free Compliance Engine'}
          </h2>
          <p className="text-[10px] font-black text-egypt-gold uppercase tracking-widest">
            {isRtl ? 'ضمان استمرارية النظام مجاناً بنسبة 100%' : 'Ensuring 100% Permanent Free Operation'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-zinc-100 dark:bg-white/5 rounded-3xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-egypt-gold" />
            <h3 className="font-black text-xs uppercase">{isRtl ? 'حالة الامتثال' : 'Compliance Status'}</h3>
          </div>
          <div className={`text-2xl font-black ${audit.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>
            {audit.status}
          </div>
          <p className="text-[10px] font-bold opacity-60 mt-2">
            {isRtl ? 'تم التحقق من جميع التبعيات' : 'All dependencies verified'}
          </p>
        </div>

        <div className="p-6 bg-zinc-100 dark:bg-white/5 rounded-3xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-blue-500" />
            <h3 className="font-black text-xs uppercase">{isRtl ? 'استهلاك التخزين' : 'Storage Usage'}</h3>
          </div>
          <div className="text-2xl font-black">
            {(storageUsage / 1024 / 1024).toFixed(2)} MB
          </div>
          <div className="w-full bg-zinc-200 dark:bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (storageUsage / storageService.STORAGE_QUOTA) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-bold opacity-60 mt-2">
            Quota: {(storageService.STORAGE_QUOTA / 1024 / 1024).toFixed(0)} MB
          </p>
        </div>

        <div className="p-6 bg-zinc-100 dark:bg-white/5 rounded-3xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-black text-xs uppercase">{isRtl ? 'وضع التحسين' : 'Optimization Mode'}</h3>
          </div>
          <div className={`text-2xl font-black ${usage?.status === 'WARNING' ? 'text-yellow-500' : 'text-emerald-500'}`}>
            {usage?.status === 'WARNING' ? 'ACTIVE' : 'IDLE'}
          </div>
          <p className="text-[10px] font-bold opacity-60 mt-2">
            {usage?.status === 'WARNING' ? 'Aggressive caching enabled' : 'System running normally'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-4 px-4 text-[10px] font-black uppercase text-zinc-500">{isRtl ? 'التبعية' : 'Dependency'}</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-zinc-500">{isRtl ? 'النوع' : 'Type'}</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-zinc-500">{isRtl ? 'الحد' : 'Limit'}</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-zinc-500">{isRtl ? 'البديل' : 'Replacement'}</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-zinc-500">{isRtl ? 'الحالة' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>
            {audit.report.map((dep: DependencyStatus, idx: number) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4 font-bold text-sm">{dep.name}</td>
                <td className="py-4 px-4">
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                    dep.type === 'Free' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {dep.type}
                  </span>
                </td>
                <td className="py-4 px-4 text-xs font-bold opacity-60">{dep.limit}</td>
                <td className="py-4 px-4 text-xs font-bold opacity-60">{dep.replacement}</td>
                <td className="py-4 px-4">
                  <div className={`flex items-center gap-2 font-black text-[10px] ${
                    dep.status === 'PASS' ? 'text-emerald-500' : dep.status === 'RISK' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      dep.status === 'PASS' ? 'bg-emerald-500' : dep.status === 'RISK' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {dep.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-6 bg-egypt-gold/10 rounded-3xl border border-egypt-gold/20">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-egypt-gold" />
          <h4 className="font-black text-sm uppercase">{isRtl ? 'شهادة الامتثال' : 'Compliance Certification'}</h4>
        </div>
        <p className="text-xs font-bold opacity-80 leading-relaxed">
          {isRtl 
            ? 'هذا النظام معتمد كبنية تحتية مجانية بنسبة 100%. لا توجد اشتراكات مخفية أو تكاليف متدرجة. في حالة تجاوز حدود الاستخدام المجاني، سيقوم النظام تلقائياً بالتبديل إلى المعالجة المحلية والتخزين المؤقت لضمان استمرارية الخدمة دون تكلفة.'
            : 'This system is certified as 100% Free Infrastructure. No hidden subscriptions or scaling costs. If free usage limits are exceeded, the system automatically switches to local processing and caching to ensure service continuity at zero cost.'}
        </p>
      </div>
    </div>
  );
};
