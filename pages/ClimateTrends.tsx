
import React, { useState, useEffect } from 'react';
import { CarbonTrends } from '../components/CarbonTrends';
import { useApp } from '../context/AppContext';
import { Globe, ShieldCheck, Zap, ArrowRight, Info, ThermometerSun, CloudRain, Wind, Snowflake, Loader2, Database, TrendingUp, DollarSign, Calendar, Cloud, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { storageService } from '../services/storageService';
import { FuelIntelligenceEngine, FuelPrice } from '../services/FuelIntelligenceEngine';
import { weatherService, WeatherData } from '../services/weatherService';

const ClimateTrends: React.FC = () => {
  const { language, theme, user } = useApp();
  const isRtl = language === 'ar';
  const [climateStats, setClimateStats] = useState<any[]>([]);
  const [fuelData, setFuelData] = useState<FuelPrice[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Official Egypt Utility Tariffs (Updated Oct 2024 - still valid as baseline)
  const utilityData = [
    { source: isRtl ? 'وزارة الكهرباء' : 'Ministry of Electricity', label: isRtl ? 'الشريحة الأولى (0-50 ك.و.س)' : 'Tier 1 (0-50 kWh)', value: '68 قرش', icon: Zap, color: 'text-yellow-500' },
    { source: isRtl ? 'وزارة الكهرباء' : 'Ministry of Electricity', label: isRtl ? 'الشريحة السادسة (>650 ك.و.س)' : 'Tier 6 (>650 kWh)', value: '2.10 ج.م', icon: Zap, color: 'text-red-500' },
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [statsData, fuelPrices, currentPulse, localWeather] = await Promise.all([
          storageService.getScientificData('climate_stats'),
          FuelIntelligenceEngine.getLatestPrices(),
          storageService.getCarbonPulse(user?.id),
          weatherService.getWeather(30.0444, 31.2357, language as 'ar' | 'en') // Cairo as default
        ]);

        setWeatherData(localWeather);

        if (statsData && statsData.length > 0) {
          setClimateStats(statsData.map(s => s.label === 'تركيز CO2' || s.label === 'CO2 Concentration' ? { ...s, value: `${currentPulse} ppm` } : s));
        } else {
          setClimateStats([
            { label: isRtl ? 'تركيز CO2 العام' : 'Global CO2', value: `${currentPulse} ppm`, icon: Wind, color: 'text-egypt-gold', bg: 'bg-egypt-gold/10' },
            { label: isRtl ? 'جودة الهواء' : 'Air Quality (AQI)', value: localWeather?.aqi.toString() || '45', icon: Cloud, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            { label: isRtl ? 'الحرارة الحالية' : 'Current Temp', value: `${localWeather?.temp}°C`, icon: ThermometerSun, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: isRtl ? 'الرطوبة' : 'Humidity', value: `${localWeather?.humidity}%`, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' }
          ]);
        }
        setFuelData(fuelPrices);
      } catch (e) {
        console.error("Data fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [isRtl, language, user?.id]);

  if (loading && climateStats.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-egypt-gold" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      <div className="flex items-center gap-6">
        <div className="p-6 bg-red-600 rounded-[2rem] shadow-2xl shadow-red-500/20">
          <Globe className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white font-arabic">{isRtl ? 'مركز تحليل المناخ العالمي' : 'Global Climate Analysis Hub'}</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Global Climate Intelligence Hub</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {climateStats.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-egypt-black border border-white/10 rounded-[2.5rem] space-y-4"
          >
            <div className={`p-3 ${stat.bg || 'bg-egypt-gold/10'} ${stat.color || 'text-egypt-gold'} rounded-xl w-fit`}>
              {stat.icon && typeof stat.icon === 'string' ? <Info className="w-6 h-6" /> : (stat.icon ? <stat.icon className="w-6 h-6" /> : <Globe className="w-6 h-6" />)}
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color || 'text-white'}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Official Data Observatory */}
      <div className="p-10 bg-zinc-900 border border-white/10 rounded-[4rem] relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="p-4 bg-egypt-gold/20 rounded-2xl border border-egypt-gold/30">
            <Database className="w-8 h-8 text-egypt-gold" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white font-arabic">{isRtl ? 'مرصد الوقود الذكي (2026+)' : 'Smart Fuel Observatory (2026+)'}</h3>
            <p className="text-xs text-zinc-400 font-bold tracking-wide uppercase">{isRtl ? 'أسعار رسمية محدثة تلقائياً' : 'Official Auto-Updated Fuel Prices'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 mb-10">
          {fuelData.map((data, i) => (
            <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-egypt-gold/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase truncate max-w-full sm:max-w-[150px]">{data.source}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-black">
                   <Calendar size={12} />
                   {new Date(data.effective_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </div>
              </div>
              <p className="text-sm font-bold text-zinc-300 font-arabic mb-1">{isRtl ? data.fuel_type.replace('_', ' ') : data.fuel_type.toUpperCase()}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-white">{data.price.toFixed(2)}</p>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">EGP / {isRtl ? 'لتر' : 'L'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-4 relative z-10 border-t border-white/5 pt-10">
          <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white font-arabic">{isRtl ? 'تعريفة المرافق العامة' : 'Public Utility Tariffs'}</h3>
            <p className="text-xs text-zinc-400 font-bold tracking-wide uppercase">{isRtl ? 'الكهرباء والمياه والغاز' : 'Electricity, Water & Gas'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {utilityData.map((data, i) => (
            <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <data.icon className={`w-5 h-5 ${data.color}`} />
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">{data.source}</span>
              </div>
              <p className="text-sm font-bold text-zinc-300 font-arabic mb-2">{data.label}</p>
              <p className={`text-3xl font-black ${data.color}`}>{data.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CarbonTrends />
        </div>
        
        <div className="space-y-8">
          <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[3rem] space-y-6">
            <h3 className="text-xl font-black text-white font-arabic flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              {isRtl ? 'أهداف اتفاقية باريس' : 'Paris Agreement Goals'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isRtl
                ? 'تهدف الاتفاقية إلى الحد من الاحتباس الحراري إلى أقل من 2 درجة مئوية، ويفضل أن يكون 1.5 درجة مئوية، مقارنة بمستويات ما قبل الصناعة.'
                : 'The agreement aims to limit global warming to well below 2°C, preferably 1.5°C, compared to pre-industrial levels.'}
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                  <span className="text-zinc-500">{isRtl ? 'التقدم الحالي' : 'Current progress'}</span>
                  <span className="text-red-500">{isRtl ? 'خطر' : 'At risk'}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-emerald-600 rounded-[3rem] text-white space-y-4 relative overflow-hidden group">
            <Zap className="w-12 h-12 text-emerald-200 mb-2" />
            <h3 className="text-2xl font-black font-arabic">{isRtl ? 'كيف تساهم؟' : 'How can you help?'}</h3>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              {isRtl
                ? 'كل تقليل في استهلاكك اليومي يساهم في كسر هذا المنحنى التصاعدي. ابدأ الآن بحساب بصمتك.'
                : 'Every reduction in your daily consumption helps break this rising curve. Start by calculating your footprint now.'}
            </p>
            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-emerald-600 px-6 py-3 rounded-xl shadow-xl group-hover:gap-4 transition-all">
              {isRtl ? 'ابدأ الحساب' : 'Start calculating'} <ArrowRight className="w-4 h-4" />
            </button>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      <div className="p-10 bg-zinc-900/80 rounded-[4rem] border border-white/10">
        <div className="flex items-center gap-4 mb-8">
          <Info className="w-8 h-8 text-blue-500" />
          <h3 className="text-2xl font-black text-white font-arabic">{isRtl ? 'منهجية البيانات' : 'Data Methodology'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-emerald-400 font-arabic">{isRtl ? 'مصادر القياسات' : 'Measurement sources'}</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {isRtl
                ? 'تعتمد أرقام الكربون في التطبيق على معاملات الانبعاثات القياسية (Standard Emission Factors) الصادرة عن الهيئة الحكومية الدولية المعنية بتغير المناخ (IPCC) ووكالة الطاقة الدولية (IEA).'
                : 'The app carbon figures rely on standard emission factors published by the IPCC and the International Energy Agency (IEA).'}
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-emerald-400 font-arabic">{isRtl ? 'التوقعات المستقبلية' : 'Future projections'}</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {isRtl
                ? 'يتم حساب التوقعات باستخدام نماذج الانحدار الخطي (Linear Regression) بناءً على متوسط النمو السنوي للانبعاثات في العقد الأخير، مع مراعاة التغيرات الكبرى مثل جائحة كورونا.'
                : 'Projections are computed with linear regression models based on the average annual emissions growth over the last decade, accounting for major shifts such as the COVID-19 pandemic.'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClimateTrends;
