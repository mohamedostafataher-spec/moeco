import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Search, ExternalLink, RefreshCcw, ShieldCheck, 
  ChevronRight, X, Loader2, Landmark, LayoutGrid, Scale, 
  Send, Footprints, Leaf, Zap, Smartphone, FileText, CheckCircle2, 
  Clock, MapPin, Download, Edit3, Navigation, PenTool, Sparkles, Files, 
  CreditCard, Heart, Baby, Car, ShoppingBag, Package, Activity, 
  Home, Briefcase, DollarSign, Star, Info, ChevronDown, CheckSquare,
  AlertTriangle, MousePointer2, Copy, Trash2, Award, Plus
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

// --- Types ---
interface OfficeLocation {
  lat: number;
  lng: number;
  name: string;
  address: string;
  accuracy: number; // 0-1 confidence
}

interface LiveUpdate {
  id: string;
  service_id: string;
  field: string;
  new_value: any;
  confidence_score: number;
  verified_by_count: number;
}

interface UsageLog {
  service_id: string;
  duration_minutes: number;
  created_at: string;
}

interface GovService {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category: string;
  subcategory?: string;
  provider?: string;
  url: string;
  icon: string;
  carbon_factor_type: 'paper' | 'transport' | 'energy' | 'digital' | 'paperless' | 'digital_transaction' | 'eco_action' | 'eco_conversion' | 'eco_recycling' | 'eco_calculation' | 'eco_education';
  estimated_saving_kg: number;
  steps?: { step: number; text_ar: string; text_en: string; duration: number }[];
  required_documents?: { name_ar: string; name_en: string; type: string }[];
  fees?: { name_ar: string; name_en: string; amount: number }[];
  office_locations?: OfficeLocation[];
  working_hours?: string;
  phone?: string;
  usage_count: number;
  request_template_ar?: string;
  request_template_en?: string;
  live_wait_status?: 'clear' | 'busy' | 'heavy';
  live_wait_avg?: number;
  is_verified?: boolean;
  is_featured?: boolean;
  popularity_score?: number;
}

const ServiceChat: React.FC<{ service: GovService }> = ({ service }) => {
  const { user, language } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const roomId = `${user?.id}_${service.id}`;
  const isRtl = language === 'ar';

  useEffect(() => {
    if (!user) return;
    
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, user_id, content')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMessages(data.reverse());
      setLoading(false);
    };

    fetchMessages();

    const sub = supabase
      .channel(`chat_${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user, roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const msg = {
      room_id: roomId,
      service_id: service.id,
      user_id: user.id,
      content: newMessage,
      is_ai: false
    };
    await supabase.from('messages').insert(msg);
    setNewMessage('');
  };

  if (!user) return <div className="p-8 text-center text-zinc-500 font-bold">{isRtl ? 'سجل دخول للمحادثة' : 'Login to chat'}</div>;

  return (
    <div className="flex flex-col h-[300px] sm:h-[500px] bg-black/20 rounded-[2rem] border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
          {isRtl ? 'المساعدة المباشرة' : 'Live Assistance'}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-zinc-500 font-bold">Online</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
              m.user_id === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/10 text-zinc-300 rounded-bl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={isRtl ? 'اكتب رسالتك...' : 'Type a message...'}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
        />
        <button onClick={sendMessage} className="p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// --- Utils ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
};

// --- Page Component ---
const GovServices: React.FC = () => {
  const { language, user, trackCarbon } = useApp();
  const isRtl = language === 'ar';
  
  // States
  const [loading, setLoading] = useState(true);
  const [baseServices, setBaseServices] = useState<GovService[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');
  const [activeTab, setActiveTab ] = useState<'directory' | 'favorites' | 'requests'>('directory');
  
  // Selection States
  const [viewingSteps, setViewingSteps] = useState<GovService | null>(null);
  const [reportingService, setReportingService] = useState<GovService | null>(null);
  const [viewingGenerator, setViewingGenerator] = useState<GovService | null>(null); 
  const [viewingChat, setViewingChat] = useState<GovService | null>(null);
  
  // Generator State
  const [generatorData, setGeneratorData] = useState<any>({});
  const [generatedText, setGeneratedText] = useState('');

  // User Coords (Priority: Geolocation > User Context > Default)
  const [userCoords, setUserCoords] = useState({ lat: 30.0444, lng: 31.2357 });

  useEffect(() => {
    if (user?.location?.lat && user?.location?.lng) {
      setUserCoords({ lat: user.location.lat, lng: user.location.lng });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, [user]);

  const iconMap: any = {
    'Baby': Baby,
    'IdCard': Smartphone,
    'Users': Landmark,
    'Heart': Heart,
    'Car': Car,
    'AlertTriangle': AlertTriangle,
    'Truck': Car,
    'PenTool': PenTool,
    'Edit': Edit3,
    'ShoppingBag': ShoppingBag,
    'Package': Package,
    'Calendar': Clock,
    'Activity': Activity,
    'Home': Home,
    'FileText': FileText,
    'DollarSign': DollarSign,
    'Briefcase': Briefcase
  };

  const [userBadges, setUserBadges] = useState<any[]>([]);

  const fetchBadges = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id);
      
      if (data) {
        setUserBadges(data.map((ub: any) => ({
          ...ub.badges,
          obtainment_date: ub.created_at
        })));
      }
    } catch (e) {
      console.error("Error fetching badges", e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBadges();

    // Listen to everything that fuels intelligence
    const govSub = supabase
      .channel('gov_intel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'government_services' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_live_updates' }, () => fetchLiveIntel())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_usage_logs' }, () => fetchLiveIntel())
      .subscribe();

    return () => {
      supabase.removeChannel(govSub);
    };
  }, [user]);

  const fetchLiveIntel = async () => {
    try {
      const { data: updates } = await supabase.from('service_live_updates').select('*');
      const { data: logs } = await supabase.from('service_usage_logs').select('service_id, duration_minutes, created_at').order('created_at', { ascending: false }).limit(200);
      
      if (updates) setLiveUpdates(updates);
      if (logs) setUsageLogs(logs);
    } catch (err) {
      console.warn('Intel fetch error:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Services
      const { data: servicesData, error: servicesError } = await supabase
        .from('government_services')
        .select('*')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false });
      
      if (servicesError) throw servicesError;
      
      const mappedServices = (servicesData || []).map(s => {
        const id = s.id || s.service_id;
        const name_ar = s.name_ar || s.service_name_ar || '';
        const name_en = s.name_en || s.service_name_en || '';
        const description_ar = s.description_ar || s.description || '';
        const description_en = s.description_en || s.description || '';
        const url = s.url || s.official_portal_url || '';
        
        return {
          ...s,
          id,
          name_ar,
          name_en,
          description_ar,
          description_en,
          url,
          carbon_factor_type: s.carbon_factor_type || 'paperless',
          estimated_saving_kg: Number(s.estimated_saving_kg) || 0,
          usage_count: Number(s.usage_count) || 0,
          popularity_score: Number(s.popularity_score) || 0,
          is_featured: !!s.is_featured,
          provider: s.provider || (isRtl ? 'جهة حكومية' : 'Government Entity')
        };
      });

      setBaseServices(mappedServices);
      await fetchLiveIntel();

      // Fetch Favorites
      if (user) {
        const { data: favs } = await supabase
          .from('user_favorites')
          .select('service_id')
          .eq('user_id', user.id);
        setFavorites(favs?.map(f => f.service_id) || []);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      notificationService.error(isRtl ? 'حدث خطأ في تحميل البيانات' : 'Error loading services');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (serviceId: string) => {
    if (!user) {
      notificationService.warning(isRtl ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    const isFav = favorites.includes(serviceId);
    try {
      if (isFav) {
        await supabase.from('user_favorites').delete().match({ user_id: user.id, service_id: serviceId });
        setFavorites(prev => prev.filter(id => id !== serviceId));
        notificationService.success(isRtl ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, service_id: serviceId });
        setFavorites(prev => [...prev, serviceId]);
        notificationService.success(isRtl ? 'تمت الإضافة للمفضلة' : 'Added to favorites');
      }
    } catch (err) {
      notificationService.error(isRtl ? 'فشلت العملية' : 'Action failed');
    }
  };

  const services = useMemo(() => {
    return baseServices.map(service => {
      let merged = { ...service };
      
      // 1. Merge High-Confidence Live Updates
      const serviceUpdates = liveUpdates.filter(u => u.service_id === service.id);
      serviceUpdates.forEach(update => {
        if (update.confidence_score >= 0.8) {
          (merged as any)[update.field] = update.new_value;
          merged.is_verified = true;
        }
      });

      // 2. Calculate Real Wait Time Status
      const recentLogs = usageLogs.filter(l => l.service_id === service.id);
      if (recentLogs.length > 0) {
        const avg = recentLogs.reduce((acc, curr) => acc + curr.duration_minutes, 0) / recentLogs.length;
        merged.live_wait_avg = Math.round(avg);
        
        // Dynamic status based on hours and log density
        const hour = new Date().getHours();
        const isBusyTime = hour >= 10 && hour <= 14;
        
        if (recentLogs.length > 5 && isBusyTime) merged.live_wait_status = 'heavy';
        else if (recentLogs.length > 2) merged.live_wait_status = 'busy';
        else merged.live_wait_status = 'clear';
      }

      return merged;
    });
  }, [baseServices, liveUpdates, usageLogs]);

  const incrementUsage = async (service: GovService) => {
    if (!user) return;

    try {
      // 1. Update global usage count
      await supabase
        .from('government_services')
        .update({ 
          usage_count: (service.usage_count || 0) + 1,
          popularity_score: (service.popularity_score || 0) + 5
        })
        .eq('id', service.id);
      
      // 2. Log for wait-time analytics and user history
      await supabase.from('service_usage_logs').insert({ 
        service_id: service.id, 
        user_id: user.id,
        duration_minutes: typeof service.live_wait_avg === 'number' ? service.live_wait_avg : 15, 
        carbon_saved: service.estimated_saving_kg
      });

      // 3. Award points for going digital
      const rewardPoints = Math.max(10, Math.round(service.estimated_saving_kg * 2));
      await supabase.rpc('increment_user_points', { 
        user_id: user.id, 
        amount: rewardPoints 
      });

      // 4. Log reward
      await supabase.from('rewards_logs').insert({
        user_id: user.id,
        points: rewardPoints,
        source: 'gov_service',
        description: `Used digital service: ${service.name_ar}`
      });

      // 5. Track carbon
      await trackCarbon('gov_service', 'digital_usage', -(service.estimated_saving_kg || 0), { 
        service: service.name_en || service.name_ar 
      });

      notificationService.success(isRtl 
        ? `حصلت على ${rewardPoints} نقطة لتوفيرك ${service.estimated_saving_kg} كجم كربون!` 
        : `Earned ${rewardPoints} points for saving ${service.estimated_saving_kg}kg CO2!`);

    } catch (err) {
      console.error('Usage increment error:', err);
    }
  };

  // --- Dynamic Request Generator ---
  const generateDocument = () => {
    if (!viewingGenerator) return;
    let template = (isRtl ? viewingGenerator.request_template_ar : viewingGenerator.request_template_en) || '';
    
    // Auto-replace common variables
    const variables = {
      user_full_name: user?.name || '',
      user_email: user?.email || '',
      date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US'),
      ...generatorData
    };

    Object.entries(variables).forEach(([key, val]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      template = template.replace(regex, (val as string) || `[${key}]`);
    });
    
    setGeneratedText(template);
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map(s => s.category)));
    return ['الكل', ...cats];
  }, [services]);

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name_ar.includes(search) || s.name_en.toLowerCase().includes(search.toLowerCase()) || (s.description_ar || '').includes(search);
    const matchesCategory = category === 'الكل' || s.category === category;
    const matchesTab = activeTab === 'directory' || (activeTab === 'favorites' && favorites.includes(s.id));
    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 pb-32 pt-8 space-y-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* --- HERO / SEARCH --- */}
      <section className="relative p-10 md:p-16 rounded-[4rem] bg-gradient-to-br from-zinc-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-grid-white/[0.03]" />
        <div className="absolute -top-32 -right-32 w-full sm:w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-full sm:w-96 h-96 bg-emerald-500/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 space-y-10 max-w-4xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              {isRtl ? 'الجيل القادم من الخدمات الحكومية' : 'Next-Gen Gov Services'}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
              {isRtl ? 'المساعد الحكومي الذكي' : 'Smart Gov Assistant'}
            </h1>
            <p className="text-zinc-400 text-lg font-bold">
              {isRtl 
                ? 'دليلك الشامل لجميع الخدمات الرسمية، والمستندات الذكية، وقياس الأثر البيئي بلمسة واحدة.' 
                : 'Comprehensive guide for all official services, smart documents, and eco-impact tracking.'}
            </p>
          </div>

          <div className="relative group/input">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors" size={24} />
            <input
              type="text"
              placeholder={isRtl ? 'ابحث عن خدمة (مثلاً: رخصة قيادة، شهادة ميلاد)...' : 'Search services (e.g., license, birth certificate)...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-7 bg-white/5 border-2 border-white/10 rounded-[2.5rem] text-white text-xl font-bold outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all border-2 ${
                  category === cat 
                    ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                }`}
              >
                {cat === 'الكل' ? (isRtl ? 'الكل' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURED SECTION --- */}
      {activeTab === 'directory' && category === 'الكل' && !search && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Star className="text-amber-400 fill-amber-400" />
              {isRtl ? 'خدمات مميزة' : 'Featured Services'}
            </h2>
            <div className="h-px flex-1 mx-6 bg-white/10" />
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar scroll-smooth">
            {services.filter(s => s.is_featured).map(service => {
              const IconComp = iconMap[service.icon] || Landmark;
              return (
                <button
                  key={service.id}
                  onClick={() => setViewingSteps(service)}
                  className="flex-shrink-0 w-80 p-8 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-right group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                      <IconComp size={24} />
                    </div>
                    <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-zinc-400">
                      {service.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {isRtl ? service.name_ar : service.name_en}
                  </h3>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Leaf size={14} />
                    {isRtl ? 'توفير' : 'Saving'} {service.estimated_saving_kg} كجم
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* --- TABS --- */}
      <div className="flex p-2 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 w-fit mx-auto sticky top-4 z-40 shadow-2xl">
        {[
          { id: 'directory', label: isRtl ? 'الخدمات' : 'Services', icon: LayoutGrid },
          { id: 'favorites', label: isRtl ? 'المفضلة' : 'Favorites', icon: Star },
          { id: 'requests', label: isRtl ? 'طلباتي' : 'My Requests', icon: Files }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-10 py-4 rounded-[2.5rem] font-black text-sm flex items-center gap-3 transition-all ${
              activeTab === t.id ? 'bg-white text-zinc-950 shadow-xl' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {/* --- SERVICES GRID --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-32 text-zinc-500 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="font-black uppercase tracking-widest">{isRtl ? 'جاري الاتصال بالنظام الحكومي...' : 'Connecting to Gov API...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredServices.map(service => {
              const IconComp = iconMap[service.icon] || Info;
              const isFav = favorites.includes(service.id);
              
              // Handle multiple locations
              const locations = Array.isArray(service.office_location) 
                ? service.office_location 
                : (service.office_location ? [service.office_location] : []);
              
              const nearestLocation = locations[0];
              const distance = nearestLocation ? calculateDistance(userCoords.lat, userCoords.lng, nearestLocation.lat, nearestLocation.lng) : null;

              return (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-white/5 border border-white/10 rounded-[3.5rem] p-10 hover:bg-white/[0.08] transition-all flex flex-col h-full overflow-hidden"
                >
                  {/* Top Stats */}
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex gap-3">
                      <div className={`p-4 rounded-3xl ${isFav ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white'}`}>
                        <IconComp size={32} />
                      </div>
                      {service.is_verified && (
                        <div className="mt-auto mb-1 p-1 bg-indigo-500 rounded-full text-white shadow-lg" title={isRtl ? 'بيانات موثقة' : 'Verified Data'}>
                          <ShieldCheck size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="px-5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Leaf size={14} />
                          {isRtl ? 'توفير' : 'Saving'} {(service.estimated_saving_kg || 0).toFixed(1)} {isRtl ? 'كجم' : 'kg'}
                        </div>
                        {service.provider && (
                          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                            <Landmark size={10} /> {service.provider}
                          </div>
                        )}
                        {distance && (
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={10} /> {distance} km
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div className="flex-grow space-y-4 relative z-10 mb-8">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-2xl font-black text-white leading-tight group-hover:text-indigo-400 transition-colors">
                        {isRtl ? service.name_ar : service.name_en}
                      </h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}
                        className={`p-3 rounded-2xl transition-all ${isFav ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                      >
                        <Star size={18} fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                    
                    {/* Live Wait Time Indicator */}
                    {service.live_wait_status && (
                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         service.live_wait_status === 'clear' ? 'bg-emerald-500/20 text-emerald-400' :
                         service.live_wait_status === 'busy' ? 'bg-amber-500/20 text-amber-400' :
                         'bg-rose-500/20 text-rose-400'
                       }`}>
                         <span className={`w-2 h-2 rounded-full animate-pulse ${
                           service.live_wait_status === 'clear' ? 'bg-emerald-500' :
                           service.live_wait_status === 'busy' ? 'bg-amber-500' :
                           'bg-rose-500'
                         }`} />
                         {service.live_wait_status === 'clear' ? (isRtl ? 'متاح الآن' : 'Clear Now') :
                          service.live_wait_status === 'busy' ? (isRtl ? 'زحمة متوسطة' : 'Busy') :
                          (isRtl ? 'زحمة شديدة' : 'Heavy Load')}
                       </div>
                    )}

                    <p className="text-zinc-400 font-bold leading-relaxed line-clamp-3">
                      {isRtl ? service.description_ar : service.description_en}
                    </p>
                  </div>

                  {/* Office Info */}
                  {nearestLocation && (
                    <div className="mb-8 p-5 bg-white/5 rounded-3xl border border-white/5 space-y-2 relative z-10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${nearestLocation.lat},${nearestLocation.lng}`, '_blank')}>
                        <div className="flex items-center gap-3 text-zinc-300">
                          <MapPin size={16} className="text-indigo-400" />
                          <span className="text-xs font-black truncate">{nearestLocation.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-zinc-500">
                             <Clock size={16} />
                             <span className="text-[10px] font-bold">{service.working_hours}</span>
                          </div>
                          {locations.length > 1 && (
                            <span className="text-[9px] font-black text-indigo-400">+{locations.length - 1} {isRtl ? 'فروع أخرى' : 'more'}</span>
                          )}
                        </div>
                    </div>
                  )}

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      <button 
                        onClick={() => { incrementUsage(service); window.open(service.url, '_blank'); }}
                        className="py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Zap size={16} /> {isRtl ? 'ابدأ' : 'Start'}
                      </button>
                      <button 
                        onClick={() => setViewingChat(service)}
                        className="py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                      >
                        <Send size={16} /> {isRtl ? 'تواصل' : 'Chat'}
                      </button>
                      <button 
                         onClick={() => setViewingGenerator(service)}
                         className="py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                      >
                        <FileText size={16} /> {isRtl ? 'طلب ذكي' : 'Request'}
                      </button>
                      <button 
                        onClick={() => setViewingSteps(service)}
                        className="py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:border-white/20 transition-all font-arabic"
                      >
                        <Info size={16} /> {isRtl ? 'دليل' : 'Info'}
                      </button>
                    </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- REQUESTS / BADGES TAB --- */}
      {activeTab === 'requests' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 rounded-[3rem] text-center">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 font-arabic">{isRtl ? 'إجمالي توفير الكربون' : 'Total CO2 Saved'}</p>
                 <div className="text-4xl font-black text-white flex items-center justify-center gap-2">
                    <Footprints size={32} className="text-emerald-500" />
                    24.5 <span className="text-xs text-zinc-500">KG</span>
                 </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/20 rounded-[3rem] text-center">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 font-arabic">{isRtl ? 'الخدمات المكتملة' : 'Services Completed'}</p>
                 <div className="text-4xl font-black text-white flex items-center justify-center gap-2">
                    <CheckCircle2 size={32} className="text-indigo-400" />
                    12
                 </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/20 rounded-[3rem] text-center">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 font-arabic">{isRtl ? 'نقاط التميز' : 'Honor Points'}</p>
                 <div className="text-4xl font-black text-white flex items-center justify-center gap-2">
                    <Star size={32} className="text-amber-500" />
                    850
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-3 font-arabic">
                <Award className="text-amber-500" />
                {isRtl ? 'الأوسمة التي حصلت عليها' : 'My Badges'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {userBadges.map((badge, i) => {
                  const IconComp = iconMap[badge.icon] || Award;
                  return (
                    <div key={badge.id || i} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                       <div className={`p-4 rounded-2xl bg-white/5 text-amber-400 group-hover:scale-110 transition-transform`}>
                          <IconComp size={32} />
                       </div>
                       <p className="font-black text-[10px] text-center uppercase tracking-widest text-zinc-500 group-hover:text-white font-arabic">
                         {isRtl ? badge.name_ar : badge.name_en}
                       </p>
                    </div>
                  );
                })}
                <div className="p-6 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 opacity-30">
                   <Plus size={24} className="text-zinc-500" />
                   <p className="font-black text-[8px] uppercase tracking-widest font-arabic">{isRtl ? 'المزيد قريباً' : 'Coming Soon'}</p>
                </div>
              </div>
           </div>

           <div className="space-y-6">
             <h3 className="text-xl font-black text-white flex items-center gap-3 font-arabic">
               <Files className="text-indigo-500" />
               {isRtl ? 'سجل الطلبات والمنجزات' : 'Request History'}
             </h3>
             <div className="flex flex-col gap-4 font-arabic">
                {usageLogs.length > 0 ? usageLogs.filter(l => l.user_id === user?.id).map((log: any, i: number) => {
                   const service = baseServices.find(s => s.id === log.service_id);
                   return (
                    <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group hover:border-white/20 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center font-black">
                             {i + 1}
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-white">{isRtl ? service?.name_ar : (service?.name_en || 'Service')}</h4>
                             <p className="text-xs font-bold text-zinc-500">{new Date(log.created_at).toLocaleDateString()} • {service?.provider || 'MoEco'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="hidden sm:flex px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                             {isRtl ? 'مكتمل' : 'Completed'}
                          </div>
                          <button className="p-3 bg-white/5 text-zinc-400 rounded-xl hover:text-white transition-colors">
                             <ExternalLink size={18} />
                          </button>
                       </div>
                    </div>
                )}) : (
                  <div className="p-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 text-zinc-500 font-bold uppercase tracking-widest text-xs">
                    {isRtl ? 'لا يوجد طلبات سابقة' : 'No previous requests'}
                  </div>
                )}
             </div>
           </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Service Guide Modal */}
      <AnimatePresence>
        {viewingSteps && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 bg-zinc-950/90 backdrop-blur-2xl">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="w-full max-w-4xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[4rem] p-12 lg:p-16 relative shadow-[0_0_100px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setViewingSteps(null)}
                className="absolute top-10 right-10 p-4 bg-white/5 rounded-full text-zinc-400 hover:text-white hover:bg-rose-600 transition-all z-20"
              >
                <X size={24} />
              </button>

              <div className="grid lg:grid-cols-2 gap-16">
                <div className="space-y-10">
                   <div className="space-y-4">
                     <span className="px-5 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest rounded-full">
                       {viewingSteps.category}
                     </span>
                     <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                       {isRtl ? viewingSteps.name_ar : viewingSteps.name_en}
                     </h2>
                   </div>

                   <div className="flex flex-col gap-4">
                       <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl"><Clock size={24}/></div>
                            <span className="font-black text-zinc-500 uppercase text-xs tracking-widest">{isRtl ? 'الوقت المتوقع' : 'Est. Time'}</span>
                          </div>
                          <span className="text-white font-black">{viewingSteps.estimated_time}</span>
                       </div>
                       <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl"><DollarSign size={24}/></div>
                            <span className="font-black text-zinc-500 uppercase text-xs tracking-widest">{isRtl ? 'التكلفة التقريبية' : 'Est. Fees'}</span>
                          </div>
                          <span className="text-white font-black">{viewingSteps.fee_estimate ? `${viewingSteps.fee_estimate} EGP` : (isRtl ? 'مجاناً' : 'Free')}</span>
                       </div>
                   </div>

                   <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] space-y-4">
                      <div className="flex items-center gap-3 text-indigo-400 font-black uppercase tracking-[0.2em] text-xs">
                        <Sparkles size={16} /> {isRtl ? 'نصائح ذكية حية' : 'Live Smart Tips'}
                      </div>
                      <ul className="space-y-4">
                        {[
                          new Date().getHours() >= 10 && new Date().getHours() <= 13 
                            ? (isRtl ? 'الوقت الحالي يشهد ذروة زحمة، انتظر حتى س ٢ ظهراً إذا أمكن.' : 'Current time is peak rush. Wait until 2 PM if possible.')
                            : (isRtl ? 'الآن وقت مثالي لزيارة المكتب، الزحمة منخفضة.' : 'Perfect time to visit, crowd is low.'),
                          isRtl ? 'تأكد من إحضار أصل البطاقة الشخصية لضمان قبول الطلب.' : 'Ensure you bring your original ID to guarantee acceptance.',
                          viewingSteps.fee_estimate > 100 
                            ? (isRtl ? 'يمكنك الدفع عبر البطاقة البنكية لتوفير الوقت.' : 'Pay via bank card to save time at cashier.')
                            : (isRtl ? 'تأكد من وجود فكة بسيطة لرسوم التمغات.' : 'Ensure you have small bills for stamp fees.')
                        ].map((tip, i) => (
                          <li key={i} className="flex gap-4 items-start text-indigo-200/70 font-bold text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                   </div>
                </div>

                <div className="space-y-12">
                   <div className="space-y-6">
                      <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <MousePointer2 className="text-indigo-500" />
                        {isRtl ? 'خطوات التنفيذ' : 'Execution Steps'}
                      </h3>
                      <div className="space-y-4">
                        {(viewingSteps.steps || []).map((step, idx) => (
                           <div key={idx} className="flex gap-6 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                              <div className="w-10 h-10 shrink-0 bg-white text-zinc-950 rounded-xl flex items-center justify-center font-black shadow-lg">
                                {step.step}
                              </div>
                              <div className="space-y-1">
                                <p className="text-white font-bold leading-relaxed">{isRtl ? (step as any).text_ar : (step as any).text_en}</p>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{step.duration} mins</span>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-xl font-black text-white flex items-center justify-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="text-emerald-500" />
                          {isRtl ? 'المستندات المطلوبة' : 'Required Documents'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <ShieldCheck size={12} /> {isRtl ? 'دقة عالية' : 'Verified'}
                        </div>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(viewingSteps.required_documents || []).map((doc: any, idx: number) => (
                           <div key={idx} className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-400/80 font-bold text-sm">
                              <CheckCircle2 size={16} />
                              {isRtl ? doc.name_ar : doc.name_en}
                           </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                       <h3 className="text-xl font-black text-white flex items-center gap-3">
                          <MapPin className="text-indigo-500" />
                          {isRtl ? 'أقرب المكاتب إليك' : 'Nearest Offices'}
                       </h3>
                       <div className="space-y-3">
                          {(Array.isArray(viewingSteps.office_location) ? viewingSteps.office_location : [viewingSteps.office_location]).map((loc, i) => loc && (
                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                               <div>
                                  <p className="text-white font-bold text-sm">{loc.name}</p>
                                  <p className="text-[10px] text-zinc-500 font-bold">{loc.address}</p>
                               </div>
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-indigo-400">{calculateDistance(userCoords.lat, userCoords.lng, loc.lat, loc.lng)} km</span>
                                  <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank')} className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all">
                                     <ExternalLink size={14} />
                                  </button>
                               </div>
                            </div>
                          ))}
                       </div>
                   </div>

                   <div className="pt-8">
                     <button 
                        onClick={() => { incrementUsage(viewingSteps); window.open(viewingSteps.url, '_blank'); }}
                        className="w-full py-6 bg-white text-zinc-950 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
                     >
                       <ExternalLink size={24} />
                       {isRtl ? 'ابدأ الخدمة الآن أونلاين' : 'Start Service Online'}
                     </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Community Update Modal */}
      <AnimatePresence>
        {reportingService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 bg-zinc-950/90 backdrop-blur-2xl">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[3rem] p-10 relative"
            >
              <button 
                onClick={() => setReportingService(null)}
                className="absolute top-8 right-8 p-3 bg-white/5 rounded-full text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="space-y-8 font-arabic">
                 <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-400 font-black text-xs uppercase tracking-widest">
                       <ShieldCheck size={16} /> {isRtl ? 'تحسين البيانات' : 'Improve Data'}
                    </div>
                    <h2 className="text-2xl font-black text-white">{isRtl ? `تحديث بيانات: ${reportingService.name_ar}` : `Update: ${reportingService.name_en}`}</h2>
                    <p className="text-zinc-500 font-bold">{isRtl ? 'مساهمتك تساعد آلاف المستخدمين على توفير وقتهم ومجهودهم.' : 'Your contribution helps thousands save time and effort.'}</p>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <button className="p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold flex flex-col items-center gap-3 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group">
                          <FileText size={24} className="text-indigo-400" />
                          <span>{isRtl ? 'المستندات' : 'Documents'}</span>
                       </button>
                       <button className="p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold flex flex-col items-center gap-3 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                          <MapPin size={24} className="text-emerald-400" />
                          <span>{isRtl ? 'المكان' : 'Location'}</span>
                       </button>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'أدخل التفاصيل الجديدة' : 'Enter Details'}</label>
                       <textarea 
                          placeholder={isRtl ? 'مثال: مطلوب صورتين شخصية بدل واحدة، السجل المدني نقل لعنوان جديد...' : 'Ex: 2 photos required instead of 1, office moved to new address...'}
                          className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:border-indigo-500/50 resize-none font-bold placeholder:text-zinc-700"
                       />
                    </div>

                    <button 
                       onClick={async () => {
                          if (!user) return notificationService.warning(isRtl ? 'سجل دخول أولاً' : 'Login first');
                          
                          const { error } = await supabase.from('service_live_updates').insert({
                             service_id: reportingService.id,
                             field: 'notes',
                             new_value: { text: 'User suggestion received' }
                          });

                          if (error) notificationService.error(isRtl ? 'فشل الإرسال' : 'Submit failed');
                          else {
                            notificationService.success(isRtl ? 'شكرًا لمساهمتك! سيتم مراجعة البيانات.' : 'Thanks! Data will be reviewed.');
                            setReportingService(null);
                          }
                       }}
                       className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
                    >
                       <Send size={18} />
                       {isRtl ? 'إرسال التحديث' : 'Submit Update'}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewingGenerator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 bg-zinc-950/90 backdrop-blur-2xl">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[4rem] p-12 lg:p-16 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setViewingGenerator(null); setGeneratedText(''); setGeneratorData({}); }}
                className="absolute top-10 right-10 p-4 bg-white/5 rounded-full text-zinc-400 hover:text-white hover:bg-rose-600 transition-all font-arabic"
              >
                <X size={24} />
              </button>

              <div className="grid lg:grid-cols-2 gap-16 font-arabic">
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-white">{isRtl ? 'منشئ الطلبات الذكي' : 'Smart Request Builder'}</h2>
                       <p className="text-zinc-500 font-bold">{isRtl ? 'أدخل البيانات وسيتم إنشاء المستند تلقائياً.' : 'Fill the data to auto-generate the official doc.'}</p>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                          <input 
                            type="text" 
                            className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-indigo-500/50"
                            placeholder={isRtl ? 'اسمك الرباعي' : 'John Doe'}
                            value={generatorData.user_full_name || ''}
                            onChange={e => setGeneratorData({...generatorData, user_full_name: e.target.value})}
                          />
                       </div>

                       {viewingGenerator === 'power_of_attorney' ? (
                         <>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'الرقم القومي للموكل' : 'Your National ID'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.user_national_id || ''} onChange={e => setGeneratorData({...generatorData, user_national_id: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'اسم الوكيل' : 'Representative Name'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.representative_name || ''} onChange={e => setGeneratorData({...generatorData, representative_name: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'رقم بطاقة الوكيل' : 'Representative ID'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.representative_id || ''} onChange={e => setGeneratorData({...generatorData, representative_id: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'مهام التوكيل' : 'Task Description'}</label>
                              <textarea className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none resize-none h-32" value={generatorData.task_description || ''} onChange={e => setGeneratorData({...generatorData, task_description: e.target.value})} />
                           </div>
                         </>
                       ) : viewingGenerator === 'birth_certificate' ? (
                          <>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'اسم الطفل' : 'Child Full Name'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.child_full_name || ''} onChange={e => setGeneratorData({...generatorData, child_full_name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'رقم القيد' : 'Birth Record Number'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.birth_record_number || ''} onChange={e => setGeneratorData({...generatorData, birth_record_number: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'تاريخ الميلاد' : 'Birth Date'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.birth_date || ''} onChange={e => setGeneratorData({...generatorData, birth_date: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'المدينة' : 'City'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.city_name || ''} onChange={e => setGeneratorData({...generatorData, city_name: e.target.value})} />
                            </div>
                          </>
                       ) : (
                          <>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'قطاع الشكوى' : 'Sector'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.sector_name || ''} onChange={e => setGeneratorData({...generatorData, sector_name: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'موضوع الشكوى' : 'Complaint Topic'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.complaint_topic || ''} onChange={e => setGeneratorData({...generatorData, complaint_topic: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'السبب' : 'Reason'}</label>
                              <textarea className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none resize-none h-32" value={generatorData.complaint_reason || ''} onChange={e => setGeneratorData({...generatorData, complaint_reason: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">{isRtl ? 'الإجراء المطلوب' : 'Requested Action'}</label>
                              <input type="text" className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" value={generatorData.requested_action || ''} onChange={e => setGeneratorData({...generatorData, requested_action: e.target.value})} />
                           </div>
                          </>
                       )}

                       <button 
                         onClick={generateDocument}
                         className="w-full py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all hover:bg-indigo-600 active:scale-95"
                       >
                         <PenTool size={20} />
                         {isRtl ? 'إنشاء نص المستند' : 'Generate Text'}
                       </button>
                    </div>
                 </div>

                 <div className="space-y-8 flex flex-col">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-zinc-400 uppercase tracking-widest">{isRtl ? 'المعاينة والتحميل' : 'Preview & Save'}</h3>
                    </div>

                    <div className="flex-grow p-8 bg-white text-zinc-950 font-serif rounded-[2.5rem] shadow-inner border border-zinc-200 min-h-[300px] sm:h-[400px] overflow-y-auto whitespace-pre-wrap leading-loose text-sm">
                       {generatedText || (isRtl ? 'سيظهر نص المستند هنا بعد تعبئة البيانات...' : 'Formatted text will appear here...')}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button 
                        disabled={!generatedText}
                        onClick={() => { navigator.clipboard.writeText(generatedText); notificationService.success(isRtl ? 'تم النسخ!' : 'Copied!'); }}
                        className="py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-white/10 disabled:opacity-20 transition-all font-arabic"
                       >
                         <Copy size={20} /> {isRtl ? 'نسخ النص' : 'Copy'}
                       </button>
                       <button 
                        disabled={!generatedText}
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.setFontSize(22);
                          doc.text("Official Request - MoEco", 20, 30);
                          doc.setFontSize(12);
                          doc.text(doc.splitTextToSize(generatedText, 170), 20, 50);
                          doc.save('official_request.pdf');
                        }}
                        className="py-5 bg-emerald-500 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 disabled:opacity-20 transition-all font-arabic"
                       >
                         <Download size={20} /> {isRtl ? 'تحميل PDF' : 'Download'}
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 4. Chat Modal */}
      <AnimatePresence>
        {viewingChat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-2xl">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[4rem] p-12 relative"
            >
              <button 
                onClick={() => setViewingChat(null)}
                className="absolute top-10 right-10 p-4 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-all font-arabic"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black text-white mb-8">{isRtl ? `طلب مساعدة: ${viewingChat.name_ar}` : `Assistance: ${viewingChat.name_en}`}</h2>
              <ServiceChat service={viewingChat} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GovServices;
