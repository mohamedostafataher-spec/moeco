import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { 
  Zap, Droplets, Flame, AlertTriangle, Footprints, 
  Wind, CloudRain, Info, Layers, Filter, ChevronRight, Scale,
  Activity, ShieldAlert, Cloud, Globe, Navigation, Search,
  Compass, Crosshair, Map as MapIcon, Maximize2, Leaf, 
  Sun, Recycle, Factory, MapPin, RefreshCcw, Bell, 
  ShieldCheck, ArrowRight, Target, ZapOff, ThermometerSun,
  Train, Bus, Car, Building2, Hospital, Landmark, ShoppingBag,
  Stethoscope, Map as MapIconLucide
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../services/notificationService';
import { AdvancedMap } from '../components/AdvancedMap';
import { MapDashboard } from '../components/MapDashboard';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

const SmartEcoMap: React.FC = () => {
  const { language, user, theme } = useApp();
  const [location, setLocation] = useState<[number, number]>([30.0444, 31.2357]);
  const [records, setRecords] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [transportStations, setTransportStations] = useState<any[]>([]);
  const [nearbyServices, setNearbyServices] = useState<any[]>([]);
  const [ecoSpots, setEcoSpots] = useState<any[]>([]);
  
  const [isSovereignView, setIsSovereignView] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeGovernorate, setActiveGovernorate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'dashboard' | 'routing'>('map');

  // Routing State
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  const [activeLayers, setActiveLayers] = useState({
    electricity: true,
    water: true,
    gas: true,
    envAlerts: true,
    ecoSpots: true,
    transport: true,
    services: true,
    heatMap: true,
    nearbyUsers: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRecords, activeAlerts, envReports, spots, stations, services] = await Promise.all([
        storageService.getRecords(),
        storageService.getAlerts({ isActive: true }),
        storageService.getEnvironmentalReports(),
        storageService.getEcoSpots(),
        storageService.getTransportStations(activeGovernorate),
        storageService.getNearbyServices(activeGovernorate)
      ]);
      
      setRecords(allRecords.filter(r => r.lat && r.lng));
      
      setAlerts(activeAlerts);
      setReports(envReports);
      setEcoSpots(spots);
      setTransportStations(stations);
      setNearbyServices(services);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation([latitude, longitude]);
          await storageService.updateUserLocation(latitude, longitude);
          const users = await storageService.getNearbyUsers(latitude, longitude, 10);
          setNearbyUsers(users);
        }, async () => {
          const users = await storageService.getNearbyUsers(30.0444, 31.2357, 10);
          setNearbyUsers(users);
        });
      } else {
        const users = await storageService.getNearbyUsers(30.0444, 31.2357, 10);
        setNearbyUsers(users);
      }
    } catch (err) {
      console.error("Map data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, activeGovernorate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    notificationService.success(language === 'ar' ? 'تم تحديث بيانات الخريطة' : 'Map data updated');
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    notificationService.vibrate();
  };

  const governorates = [
    { name: 'Cairo', name_ar: 'القاهرة', lat: 30.0444, lng: 31.2357 },
    { name: 'Alexandria', name_ar: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
    { name: 'Giza', name_ar: 'الجيزة', lat: 30.0131, lng: 31.2089 },
    { name: 'Luxor', name_ar: 'الأقصر', lat: 25.6872, lng: 32.6396 },
    { name: 'Aswan', name_ar: 'أسوان', lat: 24.0889, lng: 32.8998 },
    { name: 'Port Said', name_ar: 'بورسعيد', lat: 31.2653, lng: 32.3019 },
    { name: 'Suez', name_ar: 'السويس', lat: 29.9668, lng: 32.5498 },
    { name: 'Ismailia', name_ar: 'الإسماعيلية', lat: 30.5965, lng: 32.2715 },
    { name: 'Mansoura', name_ar: 'المنصورة', lat: 31.0409, lng: 31.3785 },
    { name: 'Tanta', name_ar: 'طنطا', lat: 30.7865, lng: 31.0004 }
  ];

  const getTransportIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'metro': return Train;
      case 'lrt': return Train;
      case 'brt': return Bus;
      case 'train': return Train;
      case 'bus': return Bus;
      case 'tram': return Train;
      case 'taxi': return Car;
      default: return Navigation;
    }
  };

  const getServiceIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hospital': return Hospital;
      case 'pharmacy': return Stethoscope;
      case 'bank': return Landmark;
      case 'supermarket': return ShoppingBag;
      default: return Building2;
    }
  };

  const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, activeGovernorate ? 12 : 7);
    }, [center, map]);
    return null;
  };

  const [nationalMetrics, setNationalMetrics] = useState<any>(null);

  useEffect(() => {
    storageService.getNationalMetrics().then(res => {
      if (res.data) setNationalMetrics(res.data);
    }).catch(console.error);
  }, []);

  return (
    <div className={`h-[calc(100vh-140px)] relative rounded-[4rem] overflow-hidden border shadow-2xl ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-200'}`}>
      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 z-[1001] p-4 sm:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pointer-events-none">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 sm:p-4 bg-egypt-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl flex items-center gap-3 sm:gap-4 shadow-2xl"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-egypt-gold rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h2 className="text-xs sm:text-sm font-black text-white leading-none">MOECO MAPS</h2>
              <span className="w-fit bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[6px] sm:text-[7px] font-black uppercase">
                {language === 'ar' ? 'مباشر' : 'LIVE'}
              </span>
            </div>
          </motion.div>

          <div className="flex items-center gap-2 p-2 bg-egypt-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-x-auto no-scrollbar">
            <Filter className="w-4 h-4 text-stone-500 ml-2 flex-shrink-0" />
            <select 
              value={activeGovernorate}
              onChange={(e) => {
                setActiveGovernorate(e.target.value);
                const gov = governorates.find(g => g.name === e.target.value);
                if (gov) setLocation([gov.lat, gov.lng]);
              }}
              className="bg-transparent border-none text-[10px] sm:text-xs text-white focus:ring-0 min-w-[120px] font-black uppercase"
            >
              <option value="" className="bg-egypt-black">{language === 'ar' ? 'كل المحافظات' : 'All Governorates'}</option>
              {governorates.map(gov => (
                <option key={gov.name} value={gov.name} className="bg-egypt-black">
                  {language === 'ar' ? gov.name_ar : gov.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          <button 
            onClick={() => setViewMode(viewMode === 'routing' ? 'map' : 'routing')}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border shadow-xl relative overflow-hidden ${
              viewMode === 'routing' 
                ? 'bg-emerald-500 text-white border-emerald-500' 
                : 'bg-egypt-black/80 text-white border-white/10'
            }`}
          >
            <span className="relative z-10">{language === 'ar' ? 'المسارات' : 'Routing'}</span>
          </button>

          <button 
            onClick={() => setViewMode(viewMode === 'dashboard' ? 'map' : 'dashboard')}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border shadow-xl relative overflow-hidden ${
              viewMode === 'dashboard' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-egypt-black/80 text-white border-white/10'
            }`}
          >
            <span className="relative z-10">{language === 'ar' ? 'لوحة البيانات' : 'Dashboard'}</span>
          </button>

          <button 
            onClick={() => setIsSovereignView(!isSovereignView)}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border shadow-xl relative overflow-hidden ${
              isSovereignView 
                ? 'bg-egypt-gold text-black border-egypt-gold' 
                : 'bg-egypt-black/80 text-white border-white/10'
            }`}
          >
            <span className="relative z-10">{language === 'ar' ? 'الرؤية' : 'Sovereign'}</span>
          </button>
          
          <button 
            onClick={handleRefresh}
            className={`flex-shrink-0 p-3 sm:p-4 bg-egypt-black/80 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl text-white hover:bg-egypt-gold hover:text-black transition-all shadow-xl ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Floating Stats */}
      <div className="absolute bottom-10 left-10 z-[1001] space-y-4 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-egypt-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl w-full sm:w-auto sm:min-w-full sm:max-w-[200px]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Real-time Load</p>
              <p className="text-lg font-black text-white">{nationalMetrics?.energySavedMW ? (4.2 + nationalMetrics.energySavedMW / 1000).toFixed(1) : '4.2'} GW</p>
            </div>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${nationalMetrics?.greenEnergyKPI || 65}%` }}
              className="h-full bg-blue-500"
            />
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto no-scrollbar">
        {viewMode === 'map' || viewMode === 'routing' ? (
          <AdvancedMap 
            center={location}
            zoom={activeGovernorate ? 12 : 7}
            language={language}
            userId={user?.id}
            isRoutingMode={viewMode === 'routing'}
            onMapClick={(lat, lng) => {
              if (viewMode !== 'routing') return;
              if (!startPoint) {
                setStartPoint([lat, lng]);
              } else if (!endPoint) {
                setEndPoint([lat, lng]);
                // Simulate route calculation
                setRoute([startPoint, [lat, lng]]);
                // Approximate Euclidean distance routing
                const dist = Math.sqrt(Math.pow(lat - startPoint[0], 2) + Math.pow(lng - startPoint[1], 2)) * 111; 
                setRouteDistance(dist);
              } else {
                setStartPoint([lat, lng]);
                setEndPoint(null);
                setRoute([]);
                setRouteDistance(null);
              }
            }}
            route={route}
            startPoint={startPoint}
            endPoint={endPoint}
          />
        ) : (
          <div className="p-10">
            <MapDashboard language={language} />
          </div>
        )}
      </div>

      {/* Sovereign Dashboard Overlay */}
      <AnimatePresence>
        {isSovereignView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1002] pointer-events-none border-[20px] border-egypt-gold/10"
          >
            <div className="absolute top-32 left-10 w-64 space-y-4 pointer-events-auto">
              <div className="p-6 bg-black/90 backdrop-blur-3xl border border-egypt-gold/30 rounded-[2rem] shadow-[0_0_50px_rgba(196,160,82,0.2)]">
                <h3 className="text-egypt-gold text-[10px] font-black uppercase tracking-[0.3em] mb-4">Grid Authority</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Network Stability', value: '99.98%', color: 'text-emerald-500' },
                    { label: 'Reserve Margin', value: '15.4%', color: 'text-blue-500' },
                    { label: 'Carbon Intensity', value: '420g/kWh', color: 'text-amber-500' }
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">{stat.label}</span>
                      <span className={`text-xs font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scanning Effect */}
            <motion.div 
              className="absolute inset-x-0 h-1 bg-egypt-gold/20 shadow-[0_0_20px_rgba(196,160,82,0.5)]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div 
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            className={`absolute bottom-0 left-0 right-0 sm:top-8 sm:right-8 sm:bottom-8 sm:left-auto w-full sm:w-80 z-[1000] p-6 sm:p-8 rounded-t-[3rem] sm:rounded-[4rem] border shadow-2xl backdrop-blur-2xl flex flex-col max-h-[70vh] sm:max-h-none ${theme === 'dark' ? 'bg-egypt-black/80 border-white/10' : 'bg-white/80 border-stone-200'}`}
          >
            {/* Drag Handle for Mobile */}
            <div className="sm:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />

            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-egypt-gold/20 rounded-2xl">
                  {viewMode === 'routing' ? <Navigation className="w-6 h-6 text-emerald-500" /> : <Layers className="w-6 h-6 text-egypt-gold" />}
                </div>
                <h3 className="font-black text-xl font-arabic">
                  {viewMode === 'routing' ? (language === 'ar' ? 'المسارات' : 'Routing') : (language === 'ar' ? 'الخريطة' : 'Map')}
                </h3>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {viewMode === 'routing' ? (
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 no-scrollbar">
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Start Point</p>
                    <p className="text-sm font-bold text-white">{startPoint ? `${startPoint[0].toFixed(4)}, ${startPoint[1].toFixed(4)}` : 'Click on map'}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">End Point</p>
                    <p className="text-sm font-bold text-white">{endPoint ? `${endPoint[0].toFixed(4)}, ${endPoint[1].toFixed(4)}` : 'Click on map'}</p>
                  </div>
                  {routeDistance && (
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Distance</p>
                      <p className="text-2xl font-black text-white">{routeDistance.toFixed(2)} km</p>
                    </div>
                  )}
                  <button 
                    onClick={() => { setStartPoint(null); setEndPoint(null); setRoute([]); setRouteDistance(null); }}
                    className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Reset Route
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 no-scrollbar">
                {[
                  { id: 'transport', label: 'Transport Hub', icon: Train, color: 'text-blue-500' },
                  { id: 'ecoSpots', label: 'Eco Spots', icon: Leaf, color: 'text-emerald-500' },
                  { id: 'services', label: 'Nearby Services', icon: Building2, color: 'text-amber-500' },
                  { id: 'envAlerts', label: 'Safety Alerts', icon: ShieldAlert, color: 'text-red-500' },
                  { id: 'nearbyUsers', label: 'Nearby Citizens', icon: Globe, color: 'text-indigo-500' }
                ].map(layer => (
                  <button 
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id as any)}
                    className={`w-full p-5 rounded-[2rem] border text-right flex items-center justify-between transition-all ${activeLayers[layer.id as keyof typeof activeLayers] ? 'bg-egypt-gold/10 border-egypt-gold/30' : 'bg-transparent border-white/5 opacity-40'}`}
                  >
                    <div className="flex items-center gap-4">
                      <layer.icon className={`w-5 h-5 ${layer.color}`} />
                      <span className="text-xs font-black uppercase tracking-widest">{layer.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activeLayers[layer.id as keyof typeof activeLayers] ? 'bg-egypt-gold border-egypt-gold' : 'border-zinc-700'}`}>
                      {activeLayers[layer.id as keyof typeof activeLayers] && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Safety Index</p>
                <p className="text-xl font-black text-emerald-500">98.2%</p>
              </div>
              <button className="w-full py-5 bg-egypt-gold text-egypt-black rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">
                {language === 'ar' ? 'تحميل التقرير' : 'Download Report'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showPanel && (
        <button 
          onClick={() => setShowPanel(true)}
          className="absolute top-32 right-8 z-[1000] p-6 bg-egypt-black/80 backdrop-blur-2xl text-white rounded-[2rem] shadow-2xl border border-white/10"
        >
          <Layers className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};

export default SmartEcoMap;
