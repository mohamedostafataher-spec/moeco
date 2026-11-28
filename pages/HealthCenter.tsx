
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Activity, Phone, MapPin, Clock, 
  ChevronLeft, Search, Navigation, AlertCircle,
  ShieldCheck, Pill, Hospital, Stethoscope
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { dailyServices } from '../services/dailyServices';
import { weatherService, WeatherData } from '../services/weatherService';

const HealthCenter: React.FC = () => {
  const { language, isRtl, theme } = useApp();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [air, setAir] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async (lat: number, lng: number) => {
      setLoading(true);
      const data = await dailyServices.getHealthFacilities(lat, lng);
      setFacilities(data);
      setLoading(false);
    };

    const fetchAir = async (lat: number, lng: number) => {
      const w = await weatherService.getWeather(lat, lng, language === 'ar' ? 'ar' : 'en');
      setAir(w);
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { fetchHealth(pos.coords.latitude, pos.coords.longitude); fetchAir(pos.coords.latitude, pos.coords.longitude); },
        () => { fetchHealth(30.0444, 31.2357); fetchAir(30.0444, 31.2357); } // Fallback to Cairo
      );
    } else {
      fetchHealth(30.0444, 31.2357);
      fetchAir(30.0444, 31.2357);
    }
  }, []);

  const filteredFacilities = facilities.filter(f => 
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.type.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!typeFilter || f.type === typeFilter)
  );

  return (
    <div className="min-h-screen pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-4 mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all"
          >
            <ChevronLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-4xl font-black font-arabic">
              {language === 'ar' ? 'المركز الصحي' : 'Health Center'}
            </h1>
            <p className="text-zinc-500 font-bold mt-1">
              {language === 'ar' ? 'خدمات الرعاية الصحية والطوارئ في متناول يدك' : 'Healthcare and emergency services at your fingertips'}
            </p>
          </div>
        </div>

        {/* Emergency Call Card */}
        <div className="bg-red-500 text-white p-8 rounded-[3rem] shadow-xl flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-3xl animate-pulse">
              <Phone className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase opacity-60">{language === 'ar' ? 'الإسعاف المصري' : 'EGYPTIAN AMBULANCE'}</p>
              <h2 className="text-4xl font-black tracking-tighter">123</h2>
            </div>
          </div>
          <a href="tel:123" className="px-8 py-4 bg-white text-red-500 rounded-2xl font-black hover:scale-105 transition-transform">
            {language === 'ar' ? 'اتصال فوري' : 'Call Now'}
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute top-1/2 left-6 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن مستشفى، صيدلية، أو عيادة...' : 'Search for hospital, pharmacy, or clinic...'}
            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-egypt-black border border-zinc-100 dark:border-white/5 rounded-3xl font-bold shadow-lg focus:border-egypt-gold outline-none transition-all"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: language === 'ar' ? 'مستشفيات' : 'Hospitals', icon: Hospital, color: 'text-blue-500', bg: 'bg-blue-500/10', type: 'hospital' },
            { label: language === 'ar' ? 'صيدليات' : 'Pharmacies', icon: Pill, color: 'text-emerald-500', bg: 'bg-emerald-500/10', type: 'pharmacy' },
            { label: language === 'ar' ? 'عيادات' : 'Clinics', icon: Stethoscope, color: 'text-purple-500', bg: 'bg-purple-500/10', type: 'clinic' },
            { label: language === 'ar' ? 'طوارئ' : 'Emergency', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', type: 'emergency' },
          ].map((item) => (
            <button key={item.label} onClick={() => item.type === 'emergency' ? (window.location.href = 'tel:123') : setTypeFilter(typeFilter === item.type ? null : item.type)} className={`p-6 rounded-[2rem] ${item.bg} border ${typeFilter === item.type ? 'border-egypt-gold ring-2 ring-egypt-gold/30' : 'border-white/5'} flex flex-col items-center gap-3 hover:scale-105 transition-transform`}>
              <item.icon className={`w-8 h-8 ${item.color}`} />
              <span className="text-xs font-black">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Facilities List */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black font-arabic px-2">{language === 'ar' ? 'المرافق القريبة' : 'Nearby Facilities'}</h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-egypt-gold/20 border-t-egypt-gold rounded-full animate-spin" />
              <p className="text-zinc-500 font-bold">{language === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredFacilities.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-egypt-black p-6 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${f.type === 'hospital' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {f.type === 'hospital' ? <Hospital className="w-8 h-8" /> : <Pill className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className="text-xl font-black font-arabic">{f.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                          <MapPin className="w-3 h-3" />
                          <span>{f.distance}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{f.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {f.phone ? (
                      <a href={`tel:${f.phone}`} className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all" title={language === 'ar' ? 'اتصال' : 'Call'}>
                        <Phone className="w-5 h-5" />
                      </a>
                    ) : (
                      <span className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl opacity-30 cursor-not-allowed" title={language === 'ar' ? 'لا يوجد رقم متاح' : 'No number available'}>
                        <Phone className="w-5 h-5" />
                      </span>
                    )}
                    {(f.lat && f.lng) ? (
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`} target="_blank" rel="noreferrer" className="p-4 bg-egypt-gold text-egypt-black rounded-2xl hover:scale-110 transition-transform" title={language === 'ar' ? 'الاتجاهات' : 'Directions'}>
                        <Navigation className="w-5 h-5" />
                      </a>
                    ) : (
                      <span className="p-4 bg-egypt-gold text-egypt-black rounded-2xl opacity-30 cursor-not-allowed" title={language === 'ar' ? 'الموقع غير متاح' : 'Location unavailable'}>
                        <Navigation className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {filteredFacilities.length === 0 && !loading && (
          <div className="p-10 text-center bg-white dark:bg-egypt-black rounded-[2.5rem] border border-zinc-100 dark:border-white/5">
            <Hospital className="w-10 h-10 mx-auto text-zinc-300 mb-4" />
            <p className="font-black text-zinc-400">{language === 'ar' ? 'لا توجد بيانات مرافق متاحة حالياً' : 'No facility data available right now'}</p>
            <p className="text-xs font-bold text-zinc-400 mt-2">{language === 'ar' ? 'خدمة البحث عن المرافق غير متوفرة في الوقت الحالي - جرّب لاحقاً' : 'The facility lookup service is unavailable at the moment - try again later'}</p>
          </div>
        )}

        {/* Air Quality Advisory — live data (Open-Meteo), hidden when unavailable */}
        {air && !air.isFallback && (() => {
          const severe = air.aqi >= 151 || air.pm10 >= 155;
          const sensitive = air.aqi >= 101 || air.pm10 >= 55;
          const tone = severe ? 'red' : sensitive ? 'amber' : 'emerald';
          const toneClasses = {
            red: { wrap: 'bg-red-500/10 border-red-500/20', chip: 'bg-red-500/20', icon: 'text-red-500', title: 'text-red-500' },
            amber: { wrap: 'bg-amber-500/10 border-amber-500/20', chip: 'bg-amber-500/20', icon: 'text-amber-500', title: 'text-amber-500' },
            emerald: { wrap: 'bg-emerald-500/10 border-emerald-500/20', chip: 'bg-emerald-500/20', icon: 'text-emerald-500', title: 'text-emerald-500' },
          }[tone] as { wrap: string; chip: string; icon: string; title: string };
          const title = severe
            ? (language === 'ar' ? 'تنبيه: موجة غبار كثيفة الآن' : 'Alert: Heavy dust levels right now')
            : sensitive
              ? (language === 'ar' ? 'جودة الهواء قد تؤثر على الفئات الحساسة' : 'Air quality may affect sensitive groups')
              : (language === 'ar' ? 'جودة الهواء جيدة اليوم' : 'Air quality is good today');
          const body = severe
            ? (language === 'ar'
                ? `مستويات الغبار مرتفعة حالياً (PM10: ${air.pm10} µg/m³، مؤشر جودة الهواء: ${air.aqi}). ننصح مرضى الحساسية والجيوب الأنفية بارتداء الكمامة وتجنب الخروج إلا للضرورة.`
                : `Dust levels are high right now (PM10: ${air.pm10} µg/m³, AQI: ${air.aqi}). We advise allergy and sinus patients to wear a mask and avoid going out unless necessary.`)
            : sensitive
              ? (language === 'ar'
                  ? `مؤشر جودة الهواء الحالي ${air.aqi} (PM10: ${air.pm10} µg/m³). إذا كنت تعاني من الحساسية أو أمراض الصدر، يُفضل تقليل المجهود الخارجي.`
                  : `Current AQI is ${air.aqi} (PM10: ${air.pm10} µg/m³). If you have allergies or respiratory conditions, consider reducing outdoor exertion.`)
              : (language === 'ar'
                  ? `مؤشر جودة الهواء الحالي ${air.aqi}. لا توجد تحذيرات صحية متعلقة بالهواء الآن.`
                  : `Current AQI is ${air.aqi}. No air-related health warnings right now.`);
          return (
            <div className={`mt-12 p-8 border ${toneClasses.wrap} rounded-[3rem] flex items-start gap-6`}>
              <div className={`p-4 ${toneClasses.chip} rounded-2xl shrink-0`}>
                <AlertCircle className={`w-8 h-8 ${toneClasses.icon}`} />
              </div>
              <div>
                <h4 className={`text-lg font-black font-arabic ${toneClasses.title} mb-2`}>{title}</h4>
                <p className="text-sm font-bold text-zinc-500 leading-relaxed">{body}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default HealthCenter;
