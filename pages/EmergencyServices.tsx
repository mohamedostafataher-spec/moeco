
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Droplets, Flame, Wind, Send, CheckCircle, MapPin, Phone, ShieldAlert, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';

interface EmergencyServicesProps {
  language: 'ar' | 'en';
}

const EmergencyServices: React.FC = () => {
  const { language, theme, user, isRtl } = useApp();
  const [type, setType] = useState<'leak' | 'pollution' | 'fire' | 'other'>('leak');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const data = await storageService.getEmergencyReports();
    setReports(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const report = {
      user_id: user?.id,
      type,
      description,
      location_lat: 30.0444, // Default Cairo
      location_lng: 31.2357,
      status: 'pending'
    };
    await storageService.saveEmergencyReport(report);
    await fetchReports();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setDescription('');
    setLocation('');
  };

  const t = {
    title: isRtl ? 'مصفوفة السلامة والإنقاذ' : 'Aeon Safety Matrix',
    subtitle: isRtl ? 'نظام الاستجابة الفورية للطوارئ والبلاغات البيئية' : 'Instant Environmental Emergency Response System',
    type: isRtl ? 'بروتوكول البلاغ' : 'Report Protocol',
    leak: isRtl ? 'تسرب مياه (بلاغ حي)' : 'Water Leak (Neighborhood)',
    pollution: isRtl ? 'تلوث بيئي' : 'Env Pollution',
    fire: isRtl ? 'حريق / دخان' : 'Fire / Smoke',
    other: isRtl ? 'أخرى' : 'Other',
    desc: isRtl ? 'وصف الحادث' : 'Incident Description',
    loc: isRtl ? 'إحداثيات الموقع' : 'Location Coordinates',
    submit: isRtl ? 'إرسال البلاغ' : 'Execute Alert',
    success: isRtl ? 'تم إرسال البلاغ بنجاح. وحدات التدخل في طريقها الآن.' : 'Alert executed. Response units dispatched.',
    history: isRtl ? 'سجل البلاغات' : 'Incident Log',
    hotline: isRtl ? 'قنوات الاتصال المباشرة' : 'Direct Comms Channels',
    gasHotline: isRtl ? 'طوارئ الغاز: 129' : 'Gas Emergency: 129',
    waterHotline: isRtl ? 'طوارئ المياه: 125' : 'Water Emergency: 125',
    elecHotline: isRtl ? 'طوارئ الكهرباء: 121' : 'Electricity Emergency: 121',
    envHotline: isRtl ? 'شكاوى البيئة: 19808' : 'Env Complaints: 19808',
    waterLeakTitle: isRtl ? 'مراقب تسريبات الحي' : 'Neighborhood Leak Reporter',
    waterLeakDesc: isRtl ? 'ساعد في الحفاظ على ثروة مصر المائية. أبلغ عن أي كسر في مواسير المياه في منطقتك فوراً.' : 'Help preserve Egypt\'s water wealth. Report any water pipe breaks in your area immediately.'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Safety HUD Header */}
      <section className="relative p-12 rounded-[3rem] bg-aeon-obsidian border border-aeon-plasma/20 overflow-hidden group">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <div className="absolute top-0 left-0 w-full h-1 bg-aeon-plasma animate-scanline opacity-30" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-aeon-plasma/10 text-aeon-plasma rounded-3xl border border-aeon-plasma/30 shadow-[0_0_20px_rgba(255,45,85,0.2)]">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-aeon-plasma uppercase tracking-[0.4em]">Safety Protocol</span>
                <h1 className="text-5xl font-black tracking-tighter text-white uppercase">{t.title}</h1>
              </div>
            </div>
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest max-w-md">
              {t.subtitle}
            </p>
          </div>
          
          <div className="flex items-center gap-4 p-6 bg-aeon-plasma/5 rounded-[2rem] border border-aeon-plasma/20">
            <div className="w-3 h-3 bg-aeon-plasma rounded-full animate-pulse shadow-[0_0_10px_#FF2D55]" />
            <span className="text-[10px] font-mono font-bold text-aeon-plasma uppercase tracking-widest">Active Monitoring</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Report Form HUD */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aeon-card p-10 space-y-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 cyber-grid opacity-5" />
          
          {submitted ? (
            <div className="text-center py-20 space-y-6 relative z-10">
              <div className="p-8 bg-green-500/10 rounded-full border border-green-500/30 w-fit mx-auto">
                <CheckCircle className="w-20 h-20 text-green-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Transmission Successful</h3>
                <p className="text-white/40 font-mono text-sm uppercase tracking-widest leading-relaxed">{t.success}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.3em]">{t.type}</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'leak', label: t.leak, icon: Droplets },
                    { id: 'pollution', label: t.pollution, icon: Wind },
                    { id: 'fire', label: t.fire, icon: Flame },
                    { id: 'other', label: t.other, icon: AlertTriangle }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as any)}
                      className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${
                        type === item.id 
                          ? 'bg-aeon-plasma/20 border-aeon-plasma text-white shadow-[0_0_20px_rgba(255,45,85,0.2)]' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <item.icon className={`w-8 h-8 ${type === item.id ? 'text-aeon-plasma' : 'text-white/20'}`} />
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.3em]">{t.loc}</label>
                <div className="relative group">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-aeon-plasma transition-colors" />
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder={isRtl ? 'اسم الشارع، المحافظة...' : 'Enter coordinates or address...'}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pl-16 text-white font-mono text-sm uppercase tracking-widest outline-none focus:border-aeon-plasma/50 focus:bg-aeon-plasma/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.3em]">{t.desc}</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder={isRtl ? 'صف ما تراه...' : 'Describe the incident...'}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm uppercase tracking-widest outline-none focus:border-aeon-plasma/50 focus:bg-aeon-plasma/5 transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-6 bg-aeon-plasma text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,45,85,0.3)]"
              >
                <Send className="w-6 h-6" />
                {t.submit}
              </button>
            </form>
          )}
        </motion.div>

        {/* Comms & History HUD */}
        <div className="space-y-10">
          {/* Water Leak Reporter Feature */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aeon-card p-10 bg-blue-500/10 border-blue-500/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 cyber-grid opacity-10" />
            <div className="relative z-10 flex items-center gap-6">
              <div className="p-5 bg-blue-500/20 rounded-3xl border border-blue-500/40">
                <Droplets className="w-10 h-10 text-blue-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.waterLeakTitle}</h3>
                <p className="text-white/60 font-mono text-[10px] uppercase tracking-widest leading-relaxed mt-2">
                  {t.waterLeakDesc}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Direct Comms HUD */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aeon-card p-10 bg-aeon-plasma/5 border-aeon-plasma/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 cyber-grid opacity-5" />
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter">
              <Phone className="w-8 h-8 text-aeon-plasma" />
              {t.hotline}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {[t.gasHotline, t.waterHotline, t.elecHotline, t.envHotline].map((h, i) => (
                <div key={i} className="p-5 bg-aeon-obsidian border border-aeon-plasma/30 rounded-2xl text-white font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-between group hover:bg-aeon-plasma hover:text-aeon-obsidian transition-all cursor-pointer">
                  {h}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Incident Log HUD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aeon-card p-10 space-y-8"
          >
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t.history}</h2>
            <div className="space-y-6 max-h-[300px] sm:h-[500px] overflow-y-auto pr-4 scrollbar-hide">
              {reports.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-8 h-8 text-white/10" />
                  </div>
                  <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.3em]">{isRtl ? 'لا توجد بلاغات سابقة' : 'No Incident Logs Detected'}</p>
                </div>
              ) : (
                reports.map((r, i) => (
                  <div key={i} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:border-aeon-plasma/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-4 py-1.5 bg-aeon-plasma/10 text-aeon-plasma border border-aeon-plasma/20 text-[9px] font-mono font-bold rounded-full uppercase tracking-widest">
                        {r.type}
                      </span>
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{new Date(r.created_at || r.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-white font-mono text-xs uppercase tracking-widest mb-2 group-hover:text-aeon-plasma transition-colors">{r.location}</p>
                    <p className="text-white/40 font-mono text-[10px] leading-relaxed uppercase tracking-wider line-clamp-2">{r.description}</p>
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${r.status === 'pending' ? 'bg-aeon-gold shadow-[0_0_8px_#d4af37]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />
                      <span className="text-[9px] font-mono text-white/40 uppercase font-bold tracking-[0.2em]">{r.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyServices;
