
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Car, Clock, Navigation, Search, 
  ChevronLeft, Info, AlertCircle, CheckCircle2,
  DollarSign, ShieldCheck, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { dailyServices } from '../services/dailyServices';

const ParkingFinder: React.FC = () => {
  const { language, isRtl, theme } = useApp();
  const navigate = useNavigate();
  const [parkings, setParkings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchParking = async () => {
      const data = await dailyServices.getParkingStatus(30.0444, 31.2357);
      setParkings(data);
      setLoading(false);
    };
    fetchParking();
  }, []);

  const filteredParkings = parkings.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              {language === 'ar' ? 'ركن ذكي' : 'Smart Parking'}
            </h1>
            <p className="text-zinc-500 font-bold mt-1">
              {language === 'ar' ? 'اعثر على أقرب مكان لركن سيارتك بسهولة' : 'Find the nearest parking spot for your car easily'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute top-1/2 left-6 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن جراج أو منطقة ركن...' : 'Search for parking or garage...'}
            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-egypt-black border border-zinc-100 dark:border-white/5 rounded-3xl font-bold shadow-lg focus:border-egypt-gold outline-none transition-all"
          />
        </div>

        {/* Parking List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-egypt-gold/20 border-t-egypt-gold rounded-full animate-spin" />
              <p className="text-zinc-500 font-bold">{language === 'ar' ? 'جاري البحث عن أماكن...' : 'Searching for spots...'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredParkings.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-egypt-black p-8 rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-xl"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-6">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${parseInt(p.available) > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        <Car className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black font-arabic">{p.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs font-bold text-zinc-500">
                            <DollarSign className="w-4 h-4" />
                            <span>{p.price}</span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-black uppercase ${parseInt(p.available) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            <Zap className="w-4 h-4" />
                            <span>{parseInt(p.available) > 0 ? (language === 'ar' ? 'متاح' : 'AVAILABLE') : (language === 'ar' ? 'مزدحم' : 'FULL')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {(p.lat && p.lng) ? (
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" className="p-5 bg-egypt-gold text-egypt-black rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-egypt-gold/20" title={language === 'ar' ? 'الاتجاهات' : 'Directions'}>
                        <Navigation className="w-6 h-6" />
                      </a>
                    ) : (
                      <span className="p-5 bg-egypt-gold text-egypt-black rounded-2xl opacity-30 cursor-not-allowed" title={language === 'ar' ? 'الموقع غير متاح' : 'Location unavailable'}>
                        <Navigation className="w-6 h-6" />
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10">
                      <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">{language === 'ar' ? 'السعة الإجمالية' : 'TOTAL CAPACITY'}</p>
                      <p className="text-xl font-black">{p.capacity}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10">
                      <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">{language === 'ar' ? 'الأماكن المتاحة' : 'AVAILABLE SPOTS'}</p>
                      <p className={`text-xl font-black ${parseInt(p.available) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{p.available}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {filteredParkings.length === 0 && !loading && (
          <div className="p-10 text-center bg-white dark:bg-egypt-black rounded-[2.5rem] border border-zinc-100 dark:border-white/5 mb-8">
            <Car className="w-10 h-10 mx-auto text-zinc-300 mb-4" />
            <p className="font-black text-zinc-400">{language === 'ar' ? 'لا توجد بيانات أماكن ركن متاحة حالياً' : 'No parking data available right now'}</p>
            <p className="text-xs font-bold text-zinc-400 mt-2">{language === 'ar' ? 'خدمة بيانات الركن غير متوفرة في الوقت الحالي - جرّب لاحقاً' : 'The parking data service is unavailable at the moment - try again later'}</p>
          </div>
        )}

        {/* Community Tip */}
        <div className="mt-12 p-8 bg-blue-500/10 border border-blue-500/20 rounded-[3rem] flex items-start gap-6">
          <div className="p-4 bg-blue-500/20 rounded-2xl shrink-0">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h4 className="text-lg font-black font-arabic text-blue-500 mb-2">{language === 'ar' ? 'نصيحة ذكية' : 'Smart Tip'}</h4>
            <p className="text-sm font-bold text-zinc-500 leading-relaxed">
              {language === 'ar' 
                ? 'جراج التحرير عادة ما يكون مزدحماً بين الساعة 8 صباحاً و 10 صباحاً. ننصح بالوصول مبكراً أو استخدام جراج العتبة كبديل.' 
                : 'Tahrir Garage is usually crowded between 8 AM and 10 AM. We recommend arriving early or using Ataba Garage as an alternative.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingFinder;
