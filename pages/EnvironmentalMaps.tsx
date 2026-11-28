import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, 
  Layers, 
  AlertTriangle, 
  Wind, 
  Thermometer, 
  Waves, 
  Camera, 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  X,
  Plus,
  Send,
  Loader2,
  Filter,
  CheckCircle2,
  Navigation2,
  Flame,
  Zap,
  Leaf,
  Info,
  Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { useAccessibility } from '../context/AccessibilityContext';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Hotspot {
  id: string;
  type: 'pollution' | 'traffic' | 'climate' | 'hazard';
  intensity: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  description: string;
  created_at: string;
  title: string;
}

interface EnvironmentalReport {
  id: string;
  user_id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
}

interface CommunityGarden {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  area_sqm: number;
  type: string;
}

const EnvironmentalMaps: React.FC = () => {
  const { language, theme, user, isRtl } = useApp();
  const { speak, vibration } = useAccessibility();
  const [activeLayer, setActiveLayer] = useState<'all' | 'pollution' | 'traffic' | 'climate' | 'reporting' | 'gardens' | 'predictive'>('all');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [reports, setReports] = useState<EnvironmentalReport[]>([]);
  const [gardens, setGardens] = useState<CommunityGarden[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportForm, setReportForm] = useState({
    category: 'garbage',
    description: '',
    latitude: 30.0444,
    longitude: 31.2357,
    image: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.0444, 31.2357]);
  const [isLoading, setIsLoading] = useState(true);
  const [predictiveResults, setPredictiveResults] = useState<any[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);

  const categories = [
    { id: 'garbage', icon: AlertTriangle, label: isRtl ? 'تراكم قمامة' : 'Garbage Accumulation' },
    { id: 'burning', icon: Flame, label: isRtl ? 'حرق مخلفات' : 'Waste Burning' },
    { id: 'water_pollution', icon: Waves, label: isRtl ? 'تلوث مياه' : 'Water Pollution' },
    { id: 'tree_cutting', icon: Zap, label: isRtl ? 'قطع أشجار' : 'Tree Cutting' },
    { id: 'industrial_smell', icon: Wind, label: isRtl ? 'روائح صناعية' : 'Industrial Smells' },
    { id: 'traffic_jam', icon: Navigation2, label: isRtl ? 'بلاغ زحام' : 'Traffic Jam Report' }
  ];

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (!isReporting) {
          setReportForm(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
          setIsReporting(true);
        }
      }
    });
    return null;
  };

  useEffect(() => {
    fetchData();
    if (activeLayer === 'predictive') {
      runPrediction();
    }
  }, [activeLayer]);

  const runPrediction = async () => {
    setIsPredicting(true);
    try {
      // 1. First attempt to fetch real GIS data from Supabase
      const { data, error } = await supabase
        .from('gis_features')
        .select('*')
        .limit(20);
      
      if (!error && data && data.length > 0) {
        setPredictiveResults(data.map(item => {
          // Extract coordinates from geography POINT(lng lat)
          // Note: loc is often a string or a geojson object depending on how PostGIS returns it
          let lat = 30.04;
          let lng = 31.23;
          
          if (typeof item.location === 'string') {
            const matches = item.location.match(/\((.*) (.*)\)/);
            if (matches) {
              lng = parseFloat(matches[1]);
              lat = parseFloat(matches[2]);
            }
          }
          
          return {
            id: item.id,
            lat: lat,
            lng: lng,
            type: item.name_en,
            value: (item.properties as any)?.aqi ? (item.properties as any).aqi / 100 : 0.5
          };
        }));
      } else {
        setPredictiveResults([]);
      }
      setIsPredicting(false);
    } catch (e) {
      console.warn("GIS Fetch failed", e);
      setIsPredicting(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: hotspotData } = await supabase.from('pollution_hotspots').select('id, type, intensity, latitude, longitude, title, description, created_at');
      const { data: reportData } = await supabase.from('environmental_reports').select('id, user_id, category, description, latitude, longitude, status, created_at');
      const { data: trafficData } = await supabase.from('traffic_reports').select('id, latitude, longitude, description, created_at');
      const { data: gardenData } = await supabase.from('community_gardens').select('id, name, type, latitude, longitude, area_sqm');
      
      const trafficHotspots = (trafficData || []).map(t => ({
        id: t.id,
        type: 'traffic' as const,
        intensity: 'medium' as const,
        latitude: t.latitude,
        longitude: t.longitude,
        title: isRtl ? 'بلاغ زحام مستخدم' : 'User Traffic Report',
        description: t.description || 'Reported via community assistant',
        created_at: t.created_at
      }));

      setHotspots([...(hotspotData || []), ...trafficHotspots]);
      setReports(reportData || []);
      setGardens(gardenData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationDetection = () => {
    if (!navigator.geolocation) {
      notificationService.error(isRtl ? 'تحديد الموقع غير مدعوم' : 'Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      setReportForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
      notificationService.success(isRtl ? 'تم تحديد موقعك بدقة' : 'Location detected accurately');
      speak(isRtl ? 'تم تحديد موقعك' : 'Location detected');
    });
  };

  const handleSubmitReport = async () => {
    if (!user) {
      notificationService.error(isRtl ? 'يجب تسجيل الدخول أولاً' : 'Must be logged in');
      return;
    }
    if (!reportForm.description) {
      notificationService.error(isRtl ? 'يرجى كتابة وصف' : 'Please provide a description');
      return;
    }

    setIsSubmitting(true);
    try {
      // In real scenario, upload image to supabase storage first
      const { error } = await supabase.from('environmental_reports').insert({
        user_id: user.id,
        category: reportForm.category,
        description: reportForm.description,
        latitude: reportForm.latitude,
        longitude: reportForm.longitude,
        status: 'pending'
      });

      if (error) throw error;

      notificationService.success(isRtl ? 'تم إرسال البلاغ بنجاح وسيتم المتابعة' : 'Report submitted successfully. We will follow up.');
      speak(isRtl ? 'شكراً لك، تم استلام بلاغك البيئي' : 'Thank you, your environmental report has been received');
      if (vibration) navigator.vibrate([100, 50, 100]);
      
      setIsReporting(false);
      setReportForm({ category: 'garbage', description: '', latitude: 30.0444, longitude: 31.2357, image: null });
      fetchData();
    } catch (error) {
      notificationService.error(isRtl ? 'فشل إرسال البلاغ' : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#7f1d1d';
      default: return '#3b82f6';
    }
  };

  const filteredHotspots = hotspots.filter(h => activeLayer === 'all' || h.type === activeLayer);

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header Over Map */}
      <div className="absolute top-8 left-4 right-4 z-50 pointer-events-none">
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl p-4 rounded-[2rem] border border-white/20 shadow-2xl flex items-center gap-4">
              <div className="p-3 bg-egypt-gold/20 rounded-2xl">
                <MapIcon className="w-6 h-6 text-egypt-gold" />
              </div>
              <div>
                <h1 className="text-xl font-black">{isRtl ? 'الخرائط البيئية التفاعلية' : 'Interactive Eco Maps'}</h1>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                  {isRtl ? 'رصد لحظي للتلوث وتغير المناخ' : 'Real-time Pollution & Climate Monitoring'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsReporting(true)}
              className="bg-egypt-gold text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 pointer-events-auto"
            >
              <Plus className="w-6 h-6" />
              <span className="hidden sm:inline font-black text-xs uppercase tracking-widest">{isRtl ? 'بلاغ جديد' : 'New Report'}</span>
            </button>
          </div>

          {/* Layer Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pointer-events-auto no-scrollbar">
            {[
              { id: 'all', label: isRtl ? 'الكل' : 'All', icon: Layers },
              { id: 'pollution', label: isRtl ? 'التلوث' : 'Pollution', icon: Wind },
              { id: 'traffic', label: isRtl ? 'الزحام' : 'Traffic', icon: Navigation2 },
              { id: 'climate', label: isRtl ? 'المناخ' : 'Climate', icon: Thermometer },
              { id: 'reporting', label: isRtl ? 'البلاغات' : 'Reports', icon: AlertTriangle },
              { id: 'gardens', label: isRtl ? 'الحدائق' : 'Gardens', icon: Leaf },
              { id: 'predictive', label: isRtl ? 'التنبؤ البيئي' : 'Predictive', icon: Sparkles },
            ].map(layer => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all whitespace-normal sm:whitespace-nowrap break-words text-xs font-black uppercase tracking-widest ${
                  activeLayer === layer.id 
                    ? 'bg-egypt-black text-white border-egypt-gold' 
                    : 'bg-white/80 dark:bg-black/50 text-zinc-500 border-white/10 dark:border-white/5'
                }`}
              >
                <layer.icon className="w-4 h-4" />
                {layer.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={12} 
          className="h-full w-full"
          style={{ background: theme === 'dark' ? '#020617' : '#f8fafc' }}
        >
          <MapEvents />
          <TileLayer
            url={theme === 'dark' 
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}' 
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
          />
          
          {/* Active Hotspots */}
          {filteredHotspots.map(hotspot => (
            <Circle
              key={hotspot.id}
              center={[hotspot.latitude, hotspot.longitude]}
              radius={800}
              pathOptions={{ 
                fillColor: getIntensityColor(hotspot.intensity), 
                color: getIntensityColor(hotspot.intensity), 
                weight: 2, 
                fillOpacity: 0.3 
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 w-full sm:w-auto sm:min-w-full sm:max-w-[200px]">
                  <h3 className="font-black text-sm mb-1">{hotspot.title}</h3>
                  <p className="text-[10px] text-zinc-400 mb-2">{hotspot.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      hotspot.intensity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {hotspot.intensity} intensity
                    </span>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* User Reports */}
          {(activeLayer === 'all' || activeLayer === 'reporting') && reports.map(report => (
            <Marker key={report.id} position={[report.latitude, report.longitude]}>
              <Popup>
                <div className="p-2 w-full sm:w-auto sm:min-w-full sm:max-w-[150px]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-egypt-gold" />
                    <h3 className="font-black text-sm uppercase tracking-widest">
                      {categories.find(c => c.id === report.category)?.label || report.category}
                    </h3>
                  </div>
                  <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${
                      report.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      Status: {report.status}
                    </span>
                    <span className="text-[8px] text-zinc-600">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Community Gardens */}
          {(activeLayer === 'all' || activeLayer === 'gardens') && gardens.map(garden => (
            <Marker key={garden.id} position={[garden.latitude, garden.longitude]}>
              <Popup>
                <div className="p-2 w-full sm:w-auto sm:min-w-full sm:max-w-[150px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-black text-sm uppercase tracking-widest">{garden.name}</h3>
                  </div>
                  <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">
                    {isRtl ? `مساحة: ${garden.area_sqm} متر مربع` : `Area: ${garden.area_sqm} sqm`} <br />
                    {isRtl ? `نوع: ${garden.type}` : `Type: ${garden.type}`}
                  </p>
                  <button className="w-full py-1.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {isRtl ? 'زيارة الحديقة' : 'Visit Garden'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* GIS Predictive Layers */}
          {activeLayer === 'predictive' && predictiveResults.map(p => (
            <Circle
              key={p.id}
              center={[p.lat, p.lng]}
              radius={1000}
              pathOptions={{ 
                fillColor: '#8b5cf6', 
                color: '#8b5cf6', 
                weight: 1, 
                fillOpacity: 0.2,
                dashArray: '5, 10'
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-black text-xs text-indigo-500 uppercase mb-1">GIS Prediction</h3>
                  <p className="text-[10px] font-bold">Type: {p.type}</p>
                  <p className="text-[10px] text-zinc-500">Predicted Risk: {(p.value * 100).toFixed(1)}%</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Reporting Modal */}
      <AnimatePresence>
        {isReporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-egypt-black w-full max-w-2xl rounded-[3rem] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-egypt-gold/20 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-egypt-gold text-white rounded-2xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{isRtl ? 'بلاغ بيئي جديد' : 'New Environmental Report'}</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {isRtl ? 'ساهم في تحسين البيئة من حولك' : 'Contribute to improving your environment'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReporting(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
                {/* Category Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-egypt-gold">
                    {isRtl ? 'نوع البلاغ' : 'Category'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setReportForm(prev => ({ ...prev, category: cat.id }))}
                        className={`p-4 rounded-3xl border transition-all flex flex-col items-center gap-3 ${
                          reportForm.category === cat.id 
                            ? 'bg-egypt-gold border-egypt-gold text-white shadow-xl shadow-egypt-gold/20' 
                            : 'bg-white/5 border-white/5 hover:border-white/10 text-zinc-500'
                        }`}
                      >
                        <cat.icon className={`w-6 h-6 ${reportForm.category === cat.id ? 'text-white' : 'text-egypt-gold'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-center">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-egypt-gold">
                    {isRtl ? 'الوصف والتفاصيل' : 'Description & Details'}
                  </h3>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={isRtl ? 'اكتب تفاصيل ما تراه...' : 'Write details about what you see...'}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm font-bold resize-none focus:border-egypt-gold outline-none transition-colors"
                  />
                </div>

                {/* Location Display/Action */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-egypt-gold/5 p-6 rounded-[2rem] border border-egypt-gold/10">
                  <div className="p-3 bg-egypt-gold/20 rounded-2xl">
                    <MapPin className="w-6 h-6 text-egypt-gold" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-xs font-black">{isRtl ? 'موقع البلاغ' : 'Report Location'}</h4>
                    <p className="text-[10px] font-bold text-zinc-500">
                      {reportForm.latitude.toFixed(6)}, {reportForm.longitude.toFixed(6)}
                    </p>
                  </div>
                  <button 
                    onClick={handleLocationDetection}
                    className="flex items-center gap-2 px-6 py-3 bg-egypt-gold text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <Navigation2 className="w-4 h-4" />
                    {isRtl ? 'تحديث الموقع' : 'Update Location'}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-white/5 bg-zinc-950/50 flex items-center justify-between">
                <button 
                  onClick={() => setIsReporting(false)}
                  className="px-8 py-3 text-zinc-500 font-black text-xs uppercase tracking-widest"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={handleSubmitReport}
                  className="bg-egypt-gold text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-egypt-gold/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isRtl ? 'إرسال البلاغ' : 'Submit Report'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Legend Card */}
      <div className="absolute bottom-24 right-4 z-40 hidden md:block">
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl space-y-4 w-64 border-l-4 border-l-egypt-gold">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-egypt-gold" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">{isRtl ? 'دليل الخريطة' : 'Map Legend'}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
              <span className="text-zinc-500">{isRtl ? 'حرج' : 'Critical'}</span>
              <div className="w-12 h-1.5 rounded-full bg-red-900" />
            </div>
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
              <span className="text-zinc-500">{isRtl ? 'عالي' : 'High'}</span>
              <div className="w-12 h-1.5 rounded-full bg-red-500" />
            </div>
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
              <span className="text-zinc-500">{isRtl ? 'متوسط' : 'Medium'}</span>
              <div className="w-12 h-1.5 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
              <span className="text-zinc-500">{isRtl ? 'منخفض' : 'Low'}</span>
              <div className="w-12 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalMaps;
