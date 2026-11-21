
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, AlertTriangle, Trash2, Droplets, Zap, X, Plus, Clock, Shield, Info, Filter, Flame, Wind, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { carbonDataService } from '../services/carbonDataService';
import { smartAiService } from '../services/smartAiService';
import { supabase } from '../services/supabaseClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const EnvironmentalReporting: React.FC = () => {
  const { language, theme, user, isRtl } = useApp();
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'water'>('reports');
  const [waterIssues, setWaterIssues] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    category: 'trash',
    location_lat: 30.0444,
    location_lng: 31.2357,
    photo_url: '',
    severity_level: 'medium'
  });

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('public:environmental_reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'environmental_reports' }, (payload) => {
         setReports(prev => [payload.new, ...prev]);
         notificationService.info(language === 'ar' ? 'تم إضافة بلاغ جديد' : 'New report submitted');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [language]);

  const fetchReports = async () => {
    try {
      const [reportsData, waterData] = await Promise.all([
        storageService.getEnvironmentalReports(),
        storageService.getWaterIssues()
      ]);
      setReports(reportsData || []);
      setWaterIssues(waterData || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await storageService.uploadImage(file, 'environmental-reports');
      setNewReport({ ...newReport, photo_url: publicUrl });
      notificationService.success(language === 'ar' ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      notificationService.error(language === 'ar' ? "فشل رفع الصورة" : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewReport({
            ...newReport,
            location_lat: position.coords.latitude,
            location_lng: position.coords.longitude
          });
          notificationService.success(language === 'ar' ? "تم تحديد موقعك بنجاح" : "Location captured successfully");
        },
        (error) => {
          console.error("Geolocation error:", error);
          notificationService.error(language === 'ar' ? "فشل تحديد الموقع" : "Failed to capture location");
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!newReport.photo_url) {
      notificationService.error(language === 'ar' ? "يرجى إرفاق صورة كدليل" : "Please attach a photo as evidence");
      return;
    }
    setLoading(true);
    try {
      // Free AI replacement for expert reports:
      const calculatedSeverity = await smartAiService.classifySeverity(newReport.description, language);

      const finalReport = {
        ...newReport,
        severity_level: calculatedSeverity
      };

      await storageService.saveEnvironmentalReport(finalReport);
      
      if (user) {
        await carbonDataService.logEnvironmentalAction(
          user.id,
          'community_report',
          -5,
          'Report submitted for ' + newReport.category
        );
      }

      setIsModalOpen(false);
      fetchReports();
      setNewReport({
        title: '',
        description: '',
        category: 'trash',
        location_lat: 30.0444,
        location_lng: 31.2357,
        photo_url: '',
        severity_level: 'medium'
      });
      notificationService.success(language === 'ar' ? "تم إرسال البلاغ بنجاح" : "Report submitted successfully");
    } catch (error) {
      console.error("Error saving report:", error);
      notificationService.error(language === 'ar' ? "فشل إرسال البلاغ" : "Error submitting report");
    } finally {
      setLoading(false);
    }
  };

  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const categories = [
    { id: 'garbage', icon: Trash2, label: language === 'ar' ? 'تراكم قمامة' : 'Garbage Accumulation', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'burning', icon: Flame, label: language === 'ar' ? 'حرق مخلفات' : 'Waste Burning', color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'water_pollution', icon: Droplets, label: language === 'ar' ? 'تلوث مياه' : 'Water Pollution', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'tree_cutting', icon: Zap, label: language === 'ar' ? 'قطع أشجار' : 'Tree Cutting', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'industrial_smell', icon: Wind, label: language === 'ar' ? 'روائح صناعية' : 'Industrial Smells', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'dangerous_pole', icon: AlertTriangle, label: language === 'ar' ? 'عمود خطر' : 'Dangerous Pole', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        setNewReport(prev => ({
          ...prev,
          location_lat: e.latlng.lat,
          location_lng: e.latlng.lng
        }));
      },
    });
    return (
      <Marker position={[newReport.location_lat, newReport.location_lng]} />
    );
  };

  return (
    <div className="section-container pb-32 pt-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. CINEMATIC HERO */}
      <section className="relative h-[50vh] rounded-[3.5rem] overflow-hidden group mb-16 border border-white/5 shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop" 
          alt="Environment" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="space-y-6 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full"
            >
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Global Sentinel Grid</span>
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl font-black text-white font-arabic italic leading-[0.8] tracking-tighter">
              {language === 'ar' ? 'صوتك هو التغيير' : 'YOUR VOICE IS THE SHIELD'}
            </h1>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${activeTab === 'reports' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
              >
                {language === 'ar' ? 'شبكة البلاغات' : 'INTEL NETWORK'}
              </button>
              <button 
                onClick={() => setActiveTab('water')}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${activeTab === 'water' ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
              >
                {language === 'ar' ? 'مراقب النقاء' : 'PURITY SCANNER'}
              </button>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative px-12 py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Plus className="w-5 h-5" />
              {language === 'ar' ? 'إرسال بلاغ طوارئ' : 'DEPLOY REPORT'}
            </span>
            <div className="absolute inset-0 bg-rose-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'reports' ? (
          <motion.div 
            key="reports" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -30 }} 
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            <div className="lg:col-span-4 space-y-8">
              <div className="aeon-glass-panel p-10 border-white/5 space-y-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                   </div>
                   <h2 className="text-xl font-black uppercase tracking-tighter italic">{language === 'ar' ? 'تحليل الأثر' : 'IMPACT ANALYTICS'}</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Reports Deployed</p>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-black tabular-nums">{reports.length}</span>
                      <span className="text-[10px] font-black text-rose-500 mb-2 uppercase tracking-widest">Active Cases</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Guardian Credits</p>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-black tabular-nums text-emerald-500">{reports.length * 50}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Threat Categories</p>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${cat.color}`}>
                            <cat.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{cat.label}</span>
                        </div>
                        <span className="text-xs font-black tabular-nums text-zinc-500 transition-colors">
                          {reports.filter(r => r.category === cat.id).length.toString().padStart(2, '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-3xl font-black font-arabic italic tracking-tight">{language === 'ar' ? 'البلاغات النشطة' : 'ACTIVE INTEL'}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {language === 'ar' ? 'الكل' : 'All'}
                  </button>
                  <button 
                    onClick={() => setFilter('verified')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'verified' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {language === 'ar' ? 'الموثقة' : 'Verified'}
                  </button>
                  <button 
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:gap-8">
                {filteredReports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="aeon-glass-panel p-2 border-white/5 group overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row h-full">
                       <div className="w-full md:w-48 lg:w-64 h-48 md:h-auto rounded-2xl md:rounded-[2rem] overflow-hidden relative">
                          <img 
                            src={report.photo_url || `https://picsum.photos/seed/${report.id}/600/600`} 
                            alt={report.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
                          <div className={`absolute top-3 left-3 md:top-4 md:left-4 px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${categories.find(c => c.id === report.category)?.bg || 'bg-white/10'} ${categories.find(c => c.id === report.category)?.color || 'text-white'} backdrop-blur-md border border-white/10`}>
                             {categories.find(c => c.id === report.category)?.label || report.category}
                          </div>
                          
                          {report.status === 'verified' && (
                            <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-emerald-500 text-white px-2 md:px-3 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5 md:gap-2">
                               <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" />
                               {language === 'ar' ? 'بلاغ موثق من خبير' : 'EXPERT VERIFIED'}
                            </div>
                          )}
                       </div>
                       
                       <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
                          <div className="space-y-3 md:space-y-4">
                             <div className="flex justify-between items-start">
                                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter group-hover:text-rose-500 transition-colors leading-none truncate md:whitespace-normal">{report.title}</h3>
                                <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded shrink-0 ml-2">
                                  ID: {report.id?.slice(0, 8)}
                                </span>
                             </div>
                             <p className="text-xs md:text-sm text-zinc-500 font-bold leading-relaxed line-clamp-2 md:line-clamp-3">
                                {report.description}
                             </p>
                          </div>

                          <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                             <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                                <div className="flex items-center gap-2">
                                   <MapPin className="w-3 h-3 md:w-4 md:h-4 text-rose-500" />
                                   <span className="text-[9px] md:text-[10px] font-black text-zinc-500 tabular-nums uppercase">{report.location_lat?.toFixed(4)} / {report.location_lng?.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Clock className="w-3 h-3 md:w-4 md:h-4 text-zinc-600" />
                                   <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${report.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_10px_currentColor]`} />
                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${report.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  STATUS: {report.status}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}

                {reports.length === 0 && (
                  <div className="aeon-glass-panel border-dashed p-32 text-center opacity-40">
                    <AlertTriangle className="w-16 h-16 text-zinc-500 mx-auto mb-6" />
                    <p className="text-sm font-black uppercase tracking-[0.3em]">No Active Intelligence Nodes</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="water" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }} 
            className="space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-4 space-y-8">
                 <div className="aeon-glass-panel p-10 border-white/5 space-y-8">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-[1.8rem] flex items-center justify-center border border-cyan-500/20 text-cyan-500">
                      <Droplets className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black font-arabic tracking-tight mb-2 uppercase">{language === 'ar' ? 'مراقب النقاء' : 'PURITY NODE'}</h3>
                       <p className="text-sm font-bold text-zinc-500 leading-relaxed uppercase tracking-tight">
                         {language === 'ar' ? 'شبكة استشعار متموضعة لتتبع جودة الموارد المائية في الوقت الفعلي.' : 'Distributed sensor network tracking hydro-resource quality in real-time.'}
                       </p>
                    </div>
                    
                    <div className="pt-8 border-t border-white/5 space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3 px-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Network Health</span>
                          <span className="text-sm font-black text-emerald-500">98.4%</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: '98.4%' }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-zinc-500 uppercase">Detection Nodes</p>
                            <p className="text-2xl font-black tabular-nums">{120 + waterIssues.length}</p>
                         </div>
                         <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-zinc-500 uppercase">Verified Leaks</p>
                            <p className="text-2xl font-black tabular-nums text-rose-500">{(waterIssues.filter((i: any) => i.status === 'verified').length).toString().padStart(2, '0')}</p>
                         </div>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="md:col-span-8 h-[300px] sm:h-[650px] aeon-glass-panel p-2 border-white/5 relative z-0">
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/5">
                   <MapContainer center={[30.0444, 31.2357]} zoom={11} style={{ height: '100%', width: '100%' }}>
                     <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                     {waterIssues.map(issue => (
                       <Marker key={issue.id} position={[issue.location_lat, issue.location_lng]} />
                     ))}
                   </MapContainer>
                </div>
                <div className="absolute top-8 right-8 z-[1000] aeon-glass-panel border-white/20 p-6 shadow-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-1">Visual Legend</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-white">{language === 'ar' ? 'جودة مثالية' : 'PRISTINE'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-white">{language === 'ar' ? 'فحص مطلوب' : 'SCAN REQ'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-white">{language === 'ar' ? 'منطقة حرجة' : 'CRITICAL'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
            >
              <div className="flex flex-col md:flex-row h-full overflow-y-auto">
                <div className="flex-1 p-6 md:p-10 space-y-6 md:space-y-8">
                  <div className="flex justify-between items-center text-white sticky top-0 bg-slate-900 z-10 pb-4">
                    <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic">
                      {language === 'ar' ? 'تقديم بلاغ جديد' : 'NEW INTEL DEPLOY'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2 text-white">
                      <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Report Title</label>
                      <input 
                        type="text" 
                        value={newReport.title}
                        onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                        placeholder="e.g., Waste pile at Maadi"
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 text-sm md:text-base font-bold focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-2 text-white">
                      <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Detailed Log</label>
                      <textarea 
                        rows={3}
                        value={newReport.description}
                        onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                        placeholder="Describe the environmental threat..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 text-sm md:text-base font-bold focus:ring-2 focus:ring-rose-500 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Threat Classification</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setNewReport({...newReport, category: cat.id})}
                            className={`flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${
                              newReport.category === cat.id 
                                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                                : 'bg-white/5 border-white/10 text-zinc-500 hover:border-rose-500/50'
                            }`}
                          >
                            <cat.icon className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-80 lg:w-96 bg-white/[0.02] p-6 lg:p-10 space-y-6 md:space-y-8 border-t md:border-t-0 md:border-l border-white/5">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Visual Evidence</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video md:aspect-square rounded-2xl md:rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-rose-500 transition-all relative overflow-hidden"
                      >
                        {newReport.photo_url ? (
                          <img src={newReport.photo_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 md:w-8 md:h-8 border-2 md:border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                            <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Processing...</span>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 md:p-4 bg-white/5 rounded-full group-hover:scale-110 transition-all">
                              <Camera className="w-6 h-6 md:w-8 md:h-8 text-zinc-500 group-hover:text-rose-500" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sync Media</span>
                          </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Geographic Fix</label>
                       <div className="h-32 md:h-48 rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 relative z-0">
                          <MapContainer 
                            center={[newReport.location_lat, newReport.location_lng]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <LocationPicker />
                          </MapContainer>
                          <button 
                            onClick={getCurrentLocation}
                            className="absolute bottom-2 left-2 right-2 z-[1000] bg-slate-900/90 backdrop-blur-md p-2 md:p-3 rounded-lg md:rounded-xl border border-white/10 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Pin Current Coord</p>
                          </button>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSubmit}
                    disabled={loading || !newReport.title}
                    className="w-full py-4 md:py-5 bg-white text-black rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl"
                  >
                    {loading ? "INITIALIZING..." : (language === 'ar' ? 'إرسال البلاغ' : 'DEPLOY INTEL')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnvironmentalReporting;
