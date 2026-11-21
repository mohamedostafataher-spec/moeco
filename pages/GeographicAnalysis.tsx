
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { carbonDataService, CarbonDataPoint } from '../services/carbonDataService';
import { 
  Globe, MapPin, TrendingUp, ArrowRight, BarChart3, 
  Activity, Scale, Search, X, Info, Calendar, History, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for Leaflet default icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const governorateCoords: Record<string, [number, number]> = {
  'Cairo': [30.0444, 31.2357],
  'Alexandria': [31.2001, 29.9187],
  'Giza': [30.0131, 31.2089],
  'Dakahlia': [31.0364, 31.3807],
  'Red Sea': [27.2579, 33.8116],
  'Beheira': [31.0364, 30.4694],
  'Fayyum': [29.3084, 30.8428],
  'Gharbia': [30.7865, 31.0004],
  'Ismailia': [30.5965, 32.2715],
  'Monufia': [30.5972, 30.9876],
  'Minya': [28.0991, 30.7503],
  'Qalyubia': [30.4591, 31.1786],
  'New Valley': [25.4514, 30.5472],
  'Suez': [29.9668, 32.5498],
  'Aswan': [24.0889, 32.8998],
  'Assiut': [27.1783, 31.1859],
  'Beni Suef': [29.0744, 31.0978],
  'Port Said': [31.2653, 32.3019],
  'Damietta': [31.4175, 31.8144],
  'South Sinai': [28.5063, 33.9225],
  'Kafr El Sheikh': [31.1107, 30.9388],
  'Matrouh': [31.3543, 27.2373],
  'Luxor': [25.6872, 32.6396],
  'Qena': [26.1551, 32.7160],
  'North Sinai': [30.8325, 33.8358],
  'Sohag': [26.5570, 31.6948],
  'Sharqia': [30.7327, 31.7133]
};

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 10, { duration: 1.5 });
  }, [center, map]);
  return null;
};

const GeographicAnalysis: React.FC = () => {
  const { language, theme } = useApp();
  const isRtl = language === 'ar';
  const [level, setLevel] = useState<'global' | 'country' | 'governorate' | 'city'>('governorate');
  const [primaryLocation, setPrimaryLocation] = useState<string>('Cairo');
  const [secondaryLocation, setSecondaryLocation] = useState<string | null>(null);
  const [compareYear, setCompareYear] = useState<number>(1990);
  const [showSelector, setShowSelector] = useState<'primary' | 'secondary' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFootprint, setUserFootprint] = useState<any>(null);

  useEffect(() => {
    const fetchUserFootprint = async () => {
      const user = storageService.getUser();
      if (user) {
        const footprint = await storageService.getUserFootprint(user.id);
        setUserFootprint(footprint);
      }
    };
    fetchUserFootprint();
  }, []);

  const [primaryData, setPrimaryData] = useState<CarbonDataPoint[]>([]);
  const [secondaryData, setSecondaryData] = useState<CarbonDataPoint[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      const locs = await carbonDataService.getAvailableLocations(level);
      setAvailableLocations(locs);
    };
    fetchLocations();
  }, [level]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        let pData: CarbonDataPoint[] = [];
        if (level === 'global') pData = await carbonDataService.getGlobalData();
        else if (level === 'country') pData = await carbonDataService.getCountryData(primaryLocation);
        else if (level === 'governorate') pData = await carbonDataService.getGovernorateData(primaryLocation);
        else pData = await carbonDataService.getCityData(primaryLocation);
        setPrimaryData(pData);

        if (secondaryLocation) {
          let sData: CarbonDataPoint[] = [];
          if (level === 'country') sData = await carbonDataService.getCountryData(secondaryLocation);
          else if (level === 'governorate') sData = await carbonDataService.getGovernorateData(secondaryLocation);
          else sData = await carbonDataService.getCityData(secondaryLocation);
          setSecondaryData(sData);
        } else {
          setSecondaryData([]);
        }
      } catch (error) {
        console.error("Error fetching geographic data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [level, primaryLocation, secondaryLocation]);

  const chartData = useMemo(() => {
    const years = Array.from(new Set([
      ...primaryData.map(d => d.year),
      ...secondaryData.map(d => d.year)
    ])).sort();

    return years.map(year => ({
      year,
      primary: primaryData.find(d => d.year === year)?.rate,
      secondary: secondaryData.find(d => d.year === year)?.rate,
    }));
  }, [primaryData, secondaryData]);

  const historicalComparison = useMemo(() => {
    const baseline = primaryData.find(d => d.year === compareYear);
    const current = primaryData.find(d => d.year === 2026) || primaryData[primaryData.length - 1];
    
    if (!baseline || !current) return null;
    
    const diff = current.rate - baseline.rate;
    const percent = (diff / baseline.rate) * 100;
    
    return {
      baselineRate: baseline.rate,
      currentRate: current.rate,
      diff,
      percent
    };
  }, [primaryData, compareYear]);

  const filteredLocations = useMemo(() => {
    return availableLocations.filter(loc => 
      loc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableLocations, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 bg-egypt-black min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-egypt-gold/20 text-egypt-gold rounded-3xl border border-egypt-gold/30">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              {isRtl ? 'التحليل الجغرافي والمقارنة التاريخية' : 'Geographic Analysis & Historical Comparison'}
            </h1>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
              {isRtl ? 'تتبع الانبعاثات منذ عام 1990' : 'Tracking emissions since 1990'}
            </p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {(['global', 'country', 'governorate', 'city'] as const).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLevel(l);
                setSecondaryLocation(null);
                if (l === 'global') setPrimaryLocation('Global');
                else if (l === 'country') setPrimaryLocation('Egypt');
                else if (l === 'governorate') setPrimaryLocation('Cairo');
                else setPrimaryLocation('Maadi');
              }}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                level === l 
                  ? 'bg-egypt-gold text-black shadow-lg shadow-egypt-gold/20' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRtl ? (l === 'global' ? 'عالمي' : l === 'country' ? 'دولة' : l === 'governorate' ? 'محافظة' : 'مدينة') : l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[300px] sm:h-[500px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
            <MapContainer 
              center={governorateCoords[primaryLocation] || [26.8206, 30.8025]} 
              zoom={6} 
              style={{ height: '100%', width: '100%', background: '#111' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <MapUpdater center={governorateCoords[primaryLocation] || [26.8206, 30.8025]} />
              {level === 'governorate' && Object.entries(governorateCoords).map(([name, coords]) => (
                <Marker 
                  key={name} 
                  position={coords}
                  eventHandlers={{
                    click: () => setPrimaryLocation(name)
                  }}
                >
                  <Popup>
                    <div className="p-2 text-egypt-black">
                      <h3 className="font-bold">{name}</h3>
                      <p className="text-xs">
                        {isRtl ? 'انقر للتحليل' : 'Click to analyze'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            <div className="absolute top-6 left-6 z-[1000] space-y-2">
              <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                  {isRtl ? 'الموقع المختار' : 'Selected Location'}
                </p>
                <p className="text-xl font-black text-egypt-gold">{primaryLocation}</p>
              </div>
            </div>
          </div>

          {/* Historical Comparison Controls */}
          <div className="bg-zinc-900/50 p-8 rounded-[3rem] border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-3">
                <History className="w-6 h-6 text-egypt-gold" />
                {isRtl ? 'مقارنة تاريخية (منذ 1990)' : 'Historical Comparison (Since 1990)'}
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {isRtl ? 'سنة الأساس' : 'Baseline Year'}
                </span>
                <select 
                  value={compareYear}
                  onChange={(e) => setCompareYear(Number(e.target.value))}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-egypt-gold/50"
                >
                  {[1990, 1995, 2000, 2005, 2010, 2015, 2020].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {historicalComparison && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    {isRtl ? `انبعاثات ${compareYear}` : `${compareYear} Emissions`}
                  </p>
                  <p className="text-3xl font-black text-white">
                    {historicalComparison.baselineRate.toFixed(1)}
                    <span className="text-xs text-zinc-500 ml-2">MtCO2</span>
                  </p>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    {isRtl ? 'الانبعاثات الحالية (2026)' : 'Current Emissions (2026)'}
                  </p>
                  <p className="text-3xl font-black text-white">
                    {historicalComparison.currentRate.toFixed(1)}
                    <span className="text-xs text-zinc-500 ml-2">MtCO2</span>
                  </p>
                </div>
                <div className="bg-egypt-gold/10 p-6 rounded-3xl border border-egypt-gold/20">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    {isRtl ? 'إجمالي التغير' : 'Total Change'}
                  </p>
                  <p className={`text-3xl font-black ${historicalComparison.percent > 0 ? 'text-egypt-red' : 'text-emerald-400'}`}>
                    {historicalComparison.percent > 0 ? '+' : ''}{historicalComparison.percent.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Analysis */}
        <div className="space-y-8">
          {/* Location Selectors */}
          <div className="space-y-4">
            <button 
              onClick={() => setShowSelector('primary')}
              className="w-full bg-zinc-900/50 p-6 rounded-3xl border border-white/5 hover:border-egypt-gold/30 transition-all text-left"
            >
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                {isRtl ? 'الموقع الأساسي' : 'Primary Location'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black">{primaryLocation}</span>
                <Search className="w-5 h-5 text-egypt-gold" />
              </div>
            </button>

            <button 
              onClick={() => setShowSelector('secondary')}
              className={`w-full p-6 rounded-3xl border transition-all text-left ${
                secondaryLocation 
                  ? 'bg-zinc-900/50 border-white/5 hover:border-egypt-gold/30' 
                  : 'bg-white/5 border-dashed border-white/10 hover:bg-white/10'
              }`}
            >
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                {isRtl ? 'مقارنة مع' : 'Compare With'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-zinc-400">
                  {secondaryLocation || (isRtl ? 'أضف موقعاً' : 'Add Location')}
                </span>
                {secondaryLocation ? (
                  <X className="w-5 h-5 text-egypt-red" onClick={(e) => { e.stopPropagation(); setSecondaryLocation(null); }} />
                ) : (
                  <Plus className="w-5 h-5 text-zinc-500" />
                )}
              </div>
            </button>
          </div>

          {/* Trend Chart */}
          <div className="bg-zinc-900/50 p-8 rounded-[3rem] border border-white/5">
            <h3 className="text-lg font-black mb-6 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-egypt-gold" />
              {isRtl ? 'منحنى الانبعاثات' : 'Emission Curve'}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C09304" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C09304" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#666' }}
                  />
                  <YAxis 
                    hide 
                    orientation={isRtl ? 'right' : 'left'}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="primary" 
                    stroke="#C09304" 
                    strokeWidth={3}
                    fill="url(#colorPrim)" 
                  />
                  {secondaryLocation && (
                    <Area 
                      type="monotone" 
                      dataKey="secondary" 
                      stroke="#71717a" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent" 
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4">
            {userFootprint && (
              <div className="bg-egypt-gold/10 p-8 rounded-[3rem] border border-egypt-gold/20 space-y-4">
                <div className="flex items-center gap-3">
                  <Scale className="w-6 h-6 text-egypt-gold" />
                  <h3 className="font-black text-sm uppercase tracking-widest">{isRtl ? 'مقارنة بصمتك الشخصية' : 'Personal Footprint Comparison'}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{isRtl ? 'بصمتك الحالية' : 'Your Current Footprint'}</p>
                    <p className="text-3xl font-black text-white">{(userFootprint.total_emissions / 1000).toFixed(2)} <span className="text-xs text-zinc-500">tCO2e</span></p>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((userFootprint.total_emissions / 1000) / 5 * 100, 100)}%` }}
                      className="h-full bg-egypt-gold"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500">
                    {isRtl 
                      ? `بصمتك تمثل ${((userFootprint.total_emissions / 1000) / 2.4 * 100).toFixed(0)}% من متوسط المحافظة` 
                      : `Your footprint is ${((userFootprint.total_emissions / 1000) / 2.4 * 100).toFixed(0)}% of the governorate average`}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {isRtl ? 'كثافة الانبعاثات' : 'Emission Intensity'}
                </span>
              </div>
              <p className="text-2xl font-black">2.4 <span className="text-xs text-zinc-500">tCO2/Capita</span></p>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {isRtl ? 'الترتيب الوطني' : 'National Rank'}
                </span>
              </div>
              <p className="text-2xl font-black">#3 <span className="text-xs text-zinc-500">{isRtl ? 'في مصر' : 'in Egypt'}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-xs">
                  {isRtl ? 'اختر الموقع' : 'Select Location'}
                </h3>
                <button onClick={() => setShowSelector(null)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text"
                    placeholder={isRtl ? 'بحث...' : 'Search...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-egypt-gold/50 text-sm font-bold"
                  />
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {filteredLocations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        if (showSelector === 'primary') setPrimaryLocation(loc);
                        else setSecondaryLocation(loc);
                        setShowSelector(null);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-6 py-4 rounded-2xl hover:bg-egypt-gold text-black transition-all text-sm font-black flex items-center justify-between group"
                    >
                      <span>{loc}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <Info className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-2xl font-black text-white">
            {isRtl ? 'عن البيانات التاريخية' : 'About Historical Data'}
          </h4>
          <p className="text-emerald-400/80 leading-relaxed max-w-3xl">
            {isRtl 
              ? 'يتم تجميع هذه البيانات من مصادر رسمية تشمل البنك الدولي، الهيئة العامة للأرصاد الجوية، وتقارير التنمية المستدامة. تهدف هذه المقارنة إلى تسليط الضوء على التغيرات المناخية الكبرى التي شهدتها مصر منذ مطلع التسعينات وحتى اليوم.' 
              : 'This data is compiled from official sources including the World Bank, the General Authority for Meteorology, and sustainable development reports. This comparison aims to highlight the major climate changes Egypt has witnessed from the early nineties to the present day.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalysis;
