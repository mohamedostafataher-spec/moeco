
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palmtree, MapPin, Star, Navigation, 
  Search, Filter, ChevronRight, Bookmark, 
  Map as MapIcon, Compass, Sparkles, Footprints,
  Wind, Sun, Camera, Share2, Globe, History,
  Trash2, MessageSquare, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

interface Destination {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category: string;
  location_coords: { lat: number; lng: number };
  image_url: string;
  green_points_reward: number;
  source?: string;
  sustainability_score?: number;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
}

const EcoHeritage: React.FC = () => {
  const { language, isRtl, user } = useApp();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [governorateFilter, setGovernorateFilter] = useState('all');
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('eco_destinations')
        .select('*');
      
      if (error) throw error;
      setDestinations(data || []);
    } catch (err) {
      console.error("Error fetching destinations:", err);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGovernorates = async () => {
    const { data } = await supabase.from('governorates').select('id, name_en, name_ar');
    setGovernorates(data || []);
  };

  const [livePlaces, setLivePlaces] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  const fetchLivePlaces = async (lat: number, lng: number) => {
    try {
      setLoadingLive(true);
      const wikiLang = language === 'ar' ? 'ar' : 'en';
      
      // Wikipedia Geosearch
      const wikiRes = await fetch(`https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=10000&gscoord=${lat}|${lng}&gslimit=12&format=json&origin=*`);
      const wikiData = await wikiRes.json();
      
      let wikiPlaces: any[] = [];
      if (wikiData?.query?.geosearch) {
        wikiPlaces = await Promise.all(wikiData.query.geosearch.map(async (p: any) => {
          const imgRes = await fetch(`https://${wikiLang}.wikipedia.org/w/api.php?action=query&pageids=${p.pageid}&prop=pageimages|extracts&exintro=&exsentences=2&format=json&origin=*&pithumbsize=600`);
          const imgData = await imgRes.json();
          const pageFields = imgData?.query?.pages?.[p.pageid];
          const desc = pageFields?.extract?.replace(/<[^>]+>/g, '') || (language === 'ar' ? 'معلم تاريخي موثق في موسوعة ويكيبيديا.' : 'A documented historical landmark on Wikipedia.');
          
          return {
             id: `wiki-${p.pageid}`,
             name_en: p.title,
             name_ar: p.title,
             description_en: desc,
             description_ar: desc,
             category: 'Heritage',
             location_coords: { lat: p.lat, lng: p.lon },
             image_url: pageFields?.thumbnail?.source || 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?q=80&w=800&auto=format&fit=crop',
             green_points_reward: 25,
             source: 'Wikipedia',
             sustainability_score: 85
          };
        }));
      }

      // Overpass API Discovery - Enhanced Categories
      const overpassQuery = `[out:json];node(around:20000,${lat},${lng})["tourism"~"museum|attraction|monument|viewpoint|gallery|artwork|historical_site"];out 20;`;
      try {
        const osmRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery
        });
        const osmData = await osmRes.json();
        
        if (osmData?.elements) {
          const osmPlaces = osmData.elements.map((el: any) => ({
            id: `osm-${el.id}`,
            name_en: el.tags?.name || el.tags?.["name:en"] || 'Ancient Site',
            name_ar: el.tags?.["name:ar"] || el.tags?.name || 'موقع أثري مباشر',
            description_en: `Real-time discovery from OpenStreetMap. Categorized as ${el.tags?.tourism || 'archaeological attraction'}.`,
            description_ar: `اكتشاف فوري عبر خرائط الشارع المفتوحة. مصنف كـ ${el.tags?.tourism || 'معلم أثري'}.`,
            category: 'Live Explorer',
            location_coords: { lat: el.lat, lng: el.lon },
            image_url: `https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=800&auto=format&fit=crop`,
            green_points_reward: 15,
            source: 'OpenStreetMap',
            sustainability_score: 90
          }));
          wikiPlaces = [...wikiPlaces, ...osmPlaces];
        }
      } catch(e) {}

      setLivePlaces(wikiPlaces);
    } catch (e) {
      console.error("Live Discovery Error", e);
    } finally {
      setLoadingLive(false);
    }
  };

  const fetchReviews = async (destId: string) => {
    try {
      const { data, error } = await supabase
        .from('destination_reviews')
        .select('*, profiles:user_id(full_name)')
        .eq('destination_id', destId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews(data?.map(r => ({
        ...r,
        user_name: r.profiles?.full_name || 'User'
      })) || []);
    } catch (err) {
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchDestinations();
    fetchGovernorates();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchLivePlaces(pos.coords.latitude, pos.coords.longitude);
      }, () => fetchLivePlaces(30.0444, 31.2357));
    } else {
      fetchLivePlaces(30.0444, 31.2357);
    }
  }, []);

  useEffect(() => {
    if (selectedDest) fetchReviews(selectedDest.id);
  }, [selectedDest]);

  const handleSubmitReview = async () => {
    if (!user || !selectedDest) return;
    try {
      setSubmittingReview(true);
      const { error } = await supabase.from('destination_reviews').insert({
        user_id: user.id,
        destination_id: selectedDest.id,
        rating: newReview.rating,
        comment: newReview.comment
      });
      if (error) throw error;
      notificationService.success(isRtl ? 'تم إرسال مراجعتك للموافقة' : 'Review submitted for approval');
      setNewReview({ rating: 5, comment: '' });
      fetchReviews(selectedDest.id);
    } catch (e) {
      notificationService.error(isRtl ? 'فشل إرسال المراجعة' : 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCheckIn = async (dest: Destination) => {
    if (!user) {
      notificationService.warning(isRtl ? 'يجب تسجيل الدخول للحصول على النقاط' : 'Login required to earn points');
      return;
    }

    try {
      notificationService.info(isRtl ? 'جاري التحقق من الموقع...' : 'Verifying location...');
      
      const checkAction = async () => {
        let isNear = true;
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, dest.location_coords?.lat || 30.0, dest.location_coords?.lng || 31.0);
            if (dist > 2) isNear = false; 
          } catch(e) {}
        }

        if (!isNear) {
          notificationService.error(isRtl ? 'أنت بعيد جداً عن الموقع' : 'You are too far from location');
          return;
        }

        const { error } = await supabase.from('user_checkins').insert({
          user_id: user.id,
          destination_id: dest.id
        });

        if (error) {
          notificationService.info(isRtl ? 'قمت بزيارة هذا المكان من قبل' : 'Already checked in here');
          return;
        }

        await storageService.awardPoints(user.id, dest.green_points_reward, `Heritage Visit: ${dest.name_en}`, 'eco_tourism');
        notificationService.success(isRtl ? `رائع! حصلت على ${dest.green_points_reward} نقطة.` : `Great! Earned ${dest.green_points_reward} pts.`);
      };

      checkAction();
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  const allFiltered = [...destinations, ...livePlaces].filter(d => {
    const matchesFilter = activeFilter === 'all' || d.category === activeFilter;
    const matchesSearch = (isRtl ? d.name_ar : d.name_en).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-12 pb-32">
      {/* Dynamic Header */}
      <section className="relative h-[50vh] rounded-[4rem] overflow-hidden group">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          src="https://images.unsplash.com/photo-1544971587-b842c27f8e14?q=80&w=2071&auto=format&fit=crop" 
          className="w-full h-full object-cover" 
          alt="Eco Heritage"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="absolute bottom-16 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-10">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-3xl rounded-3xl flex items-center justify-center border border-white/20">
                    <History className="w-8 h-8 text-emerald-400" />
                 </div>
                 <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20">
                   Active Explorer
                 </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-tight">
                {isRtl ? 'تراُث الحياة' : 'Heritage of Life'}
              </h1>
              <p className="text-white/60 text-lg font-bold max-w-2xl leading-relaxed">
                {isRtl 
                  ? 'اكتشف المواقع التاريخية والمحميات الطبيعية في مصر. نظام اكتشاف حي يعتمد على البيانات المفتوحة والمجانية عالمياً.'
                  : 'Discover historical sites and natural reserves in Egypt. A live discovery system powered by free global open data.'}
              </p>
           </div>
           
           <div className="flex gap-4 p-4 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10">
              <div className="text-center px-6 border-r border-white/10">
                 <div className="text-2xl font-black text-white">2.5k</div>
                 <div className="text-[8px] font-black text-white/50 uppercase tracking-widest">{isRtl ? 'زائر' : 'Visitors'}</div>
              </div>
              <div className="text-center px-6">
                 <div className="text-2xl font-black text-emerald-400">12</div>
                 <div className="text-[8px] font-black text-white/50 uppercase tracking-widest">{isRtl ? 'محمية' : 'Reserves'}</div>
              </div>
           </div>
        </div>
      </section>

      {/* Control Station */}
      <section className="sticky top-4 z-30 flex flex-col lg:flex-row gap-6 p-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-2xl">
         <div className="flex bg-zinc-100 dark:bg-white/5 p-2 rounded-3xl w-full lg:w-auto overflow-x-auto hide-scrollbar">
            {['all', 'Protected Area', 'Heritage', 'Green Park', 'Live Explorer'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeFilter === cat ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5'
                }`}
              >
                {cat === 'all' ? (isRtl ? 'الكل' : 'All') : cat}
              </button>
            ))}
         </div>

         <div className="flex-1 relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder={isRtl ? 'ابحث عن اسم المكان أو التاريخ...' : 'Search place name or history...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-16 bg-zinc-100 dark:bg-white/5 border border-transparent rounded-[2rem] pl-16 pr-8 font-bold text-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
         </div>

         <div className="flex gap-4">
             <div className="relative group">
                <select 
                  onChange={(e) => setGovernorateFilter(e.target.value)}
                  className="h-16 px-10 bg-zinc-100 dark:bg-white/5 rounded-3xl font-black text-[10px] uppercase tracking-widest outline-none appearance-none cursor-pointer pr-14"
                >
                   <option value="all">{isRtl ? 'كل المحافظات' : 'All Governorates'}</option>
                   {governorates.map(g => (
                      <option key={g.id} value={g.name_en}>{isRtl ? g.name_ar : g.name_en}</option>
                   ))}
                </select>
                <Filter className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
             </div>
         </div>
      </section>

      {/* Discovery Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
         {loading || loadingLive ? (
           [1,2,3,4,5,6].map(i => <div key={i} className="h-[500px] bg-white/5 rounded-[4rem] animate-pulse border border-white/5" />)
         ) : allFiltered.map((dest, idx) => (
           <motion.div
             key={dest.id}
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: idx * 0.05 }}
             className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-[4rem] overflow-hidden group hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.15)] dark:hover:shadow-emerald-500/5 transition-all duration-700"
           >
              <div className="h-72 relative overflow-hidden">
                 <img src={dest.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-[2s] ease-out" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="absolute top-8 left-8 flex flex-col gap-2">
                    <div className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl text-[8px] font-black text-white uppercase tracking-[0.3em]">
                       {dest.category}
                    </div>
                    {dest.source && (
                      <div className="px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-xl text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                         <Globe className="w-3 h-3" />
                         {dest.source}
                      </div>
                    )}
                 </div>

                 {dest.sustainability_score && (
                   <div className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                 )}
              </div>

              <div className="p-12 space-y-8">
                 <div className="flex justify-between items-start gap-4">
                    <h3 className="text-3xl font-black dark:text-white leading-[1.1] italic">
                       {isRtl ? dest.name_ar : dest.name_en}
                    </h3>
                    <div className="px-5 py-3 bg-emerald-500/10 rounded-2xl text-emerald-500 flex flex-col items-center justify-center border border-emerald-500/5">
                       <span className="text-lg font-black tracking-tighter">+{dest.green_points_reward}</span>
                       <span className="text-[6px] font-bold uppercase tracking-widest">Rewards</span>
                    </div>
                 </div>

                 <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-[1.8] line-clamp-4">
                   {isRtl ? dest.description_ar : dest.description_en}
                 </p>

                 <div className="pt-8 border-t border-zinc-100 dark:border-white/5 flex flex-col gap-8">
                    <div className="flex items-center justify-between text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                       <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          <span className="dark:text-zinc-500">{isRtl ? 'مصر المستدامة' : 'Sustained Egypt'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <Footprints className="w-4 h-4 text-emerald-500" />
                          <span className="dark:text-zinc-500">{1000 + idx * 42} Visits</span>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button 
                         onClick={() => setSelectedDest(dest)}
                         className="flex-1 h-16 bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-emerald-500 hover:text-white rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all duration-500"
                       >
                          {isRtl ? 'استكشاف الأيقونة' : 'EXPLORE ICON'}
                       </button>
                       <button 
                         onClick={() => handleCheckIn(dest)}
                         className="px-10 h-16 bg-emerald-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-500 flex items-center gap-3"
                       >
                          <Navigation className="w-4 h-4" />
                          {isRtl ? 'تسجيل' : 'CHECK IN'}
                       </button>
                    </div>
                 </div>
              </div>
           </motion.div>
         ))}
      </section>

      {/* Detail Theater */}
      <AnimatePresence>
        {selectedDest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDest(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-white/10 rounded-[5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] hide-scrollbar"
            >
               <div className="relative h-[450px]">
                  <img src={selectedDest.image_url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  <button 
                    onClick={() => setSelectedDest(null)}
                    className="absolute top-12 right-12 p-5 bg-black/40 backdrop-blur-xl rounded-[2rem] text-white border border-white/20 hover:bg-rose-500 transition-all z-10"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                  
                  <div className="absolute bottom-16 left-16 right-16">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-2 bg-emerald-500/20 backdrop-blur-md text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                          {selectedDest.category}
                        </span>
                        {selectedDest.source && (
                          <span className="px-4 py-2 bg-blue-500/20 backdrop-blur-md text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                            {selectedDest.source}
                          </span>
                        )}
                     </div>
                     <h2 className="text-6xl font-black text-white italic tracking-tighter">
                        {isRtl ? selectedDest.name_ar : selectedDest.name_en}
                     </h2>
                  </div>
               </div>

               <div className="p-16 space-y-16">
                  {/* Info Blocks */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                     <div className="lg:col-span-2 space-y-8">
                        <h4 className="text-xl font-black dark:text-white uppercase tracking-widest border-b border-white/5 pb-4">
                           {isRtl ? 'عن الوجهة' : 'About Destination'}
                        </h4>
                        <p className="text-xl text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
                           {isRtl ? selectedDest.description_ar : selectedDest.description_en}
                        </p>
                     </div>
                     <div className="space-y-8">
                        <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] space-y-6">
                           <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Eco Rewards</div>
                           <div className="text-5xl font-black text-emerald-500 tracking-tighter">+{selectedDest.green_points_reward}</div>
                           <p className="text-xs text-zinc-500 font-bold">
                              {isRtl ? 'قم بزيارة هذا المعلم واحصل على العملات الخضراء فوراً.' : 'Visit this landmark and earn green coins instantly.'}
                           </p>
                           <button 
                            onClick={() => { handleCheckIn(selectedDest); setSelectedDest(null); }}
                            className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                           >
                             {isRtl ? 'تأكيد الحضور' : 'CONFIRM VISIT'}
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="space-y-10">
                    <div className="flex justify-between items-end">
                       <h4 className="text-xl font-black dark:text-white uppercase tracking-widest">{isRtl ? 'آراء المستكشفين' : 'Explorer Reviews'}</h4>
                       <div className="flex items-center gap-2 text-amber-500">
                          <Star className="w-5 h-5 fill-current" />
                          <span className="text-2xl font-black">4.8</span>
                       </div>
                    </div>

                    <div className="space-y-6">
                       {reviews.map(review => (
                         <div key={review.id} className="p-8 bg-zinc-100 dark:bg-white/5 rounded-[2.5rem] border border-white/5 flex gap-8">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center">
                               <span className="text-xl font-black text-white">{review.user_name?.[0].toUpperCase()}</span>
                            </div>
                            <div className="space-y-3">
                               <div className="flex items-center gap-4">
                                  <span className="font-black dark:text-white">{review.user_name}</span>
                                  <div className="flex text-amber-500">
                                     {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                  </div>
                               </div>
                               <p className="text-zinc-500 dark:text-zinc-400 font-bold opacity-80">{review.comment}</p>
                            </div>
                         </div>
                       ))}
                    </div>

                    {/* Submit Review */}
                    {user && (
                      <div className="p-12 bg-zinc-100 dark:bg-white/5 rounded-[3.5rem] border border-white/5 space-y-8">
                         <h5 className="text-lg font-black dark:text-white">{isRtl ? 'أضف تجربتك' : 'Share Your Experience'}</h5>
                         <div className="flex gap-4">
                            {[1,2,3,4,5].map(star => (
                               <button 
                                 key={star} 
                                 onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                 className={`p-4 rounded-2xl transition-all ${newReview.rating >= star ? 'bg-amber-500 text-white' : 'bg-white/5 text-zinc-500'}`}
                               >
                                  <Star className="w-6 h-6 fill-current" />
                               </button>
                            ))}
                         </div>
                         <textarea 
                           placeholder={isRtl ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
                           value={newReview.comment}
                           onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                           className="w-full h-32 bg-white/5 border border-white/10 rounded-[2rem] p-8 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                         />
                         <button 
                           onClick={handleSubmitReview}
                           disabled={submittingReview}
                           className="px-12 py-5 bg-white dark:bg-emerald-500 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                         >
                           {submittingReview ? '...' : (isRtl ? 'إرسال المراجعة' : 'POST REVIEW')}
                         </button>
                      </div>
                    )}
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const XIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

export default EcoHeritage;
