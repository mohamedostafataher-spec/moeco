
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, MapPin, Users, Info, Plus, Search, Filter, ArrowRight, Leaf, Droplets, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

const CommunityGardens: React.FC = () => {
  const { language, theme, user } = useApp();
  const [gardens, setGardens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [newGarden, setNewGarden] = useState({
    name: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchGardens();
  }, []);

  const handleSuggestGarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      notificationService.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      return;
    }
    
    try {
      const garden = {
        name_ar: newGarden.name,
        name_en: newGarden.name,
        location_ar: newGarden.location,
        location_en: newGarden.location,
        description_ar: newGarden.description,
        description_en: newGarden.description,
      };
      await storageService.saveCommunityGarden(garden);
      fetchGardens();
      setShowSuggestModal(false);
      notificationService.success(language === 'ar' ? 'تم تقديم اقتراحك بنجاح' : 'Garden suggestion submitted successfully');
      setNewGarden({ name: '', location: '', description: '' });
    } catch (err) {
      notificationService.error(language === 'ar' ? 'فشل في تقديم الاقتراح' : 'Failed to submit suggestion');
    }
  };

  const handleJoinVolunteer = async (gardenId: string) => {
    try {
      await storageService.joinGarden(gardenId);
      notificationService.success(language === 'ar' ? 'تم انضمامك لمتطوعي الحديقة' : 'Joined garden volunteers successfully');
      fetchGardens();
    } catch (error) {
      notificationService.error(language === 'ar' ? 'فشل الانضمام' : 'Failed to join');
    }
  };

  const fetchGardens = async () => {
    setLoading(true);
    try {
      const data = await storageService.getCommunityGardens();
      setGardens(data || []);
    } catch (error) {
      console.error("Error fetching gardens:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-32" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-emerald-500 rounded-[2rem] shadow-2xl shadow-emerald-500/20">
            <Sprout className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-egypt-black font-arabic flex items-center gap-4">
              {language === 'ar' ? 'الحدائق المجتمعية' : 'Community Gardens'}
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black">FREE</span>
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              {language === 'ar' ? 'شارك في زراعة مدينتك' : 'Participate in greening your city'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowSuggestModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-egypt-black text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-egypt-gold hover:text-black transition-all shadow-2xl"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'اقترح حديقة' : 'Suggest a Garden'}
        </button>
      </div>

      {/* Suggest Garden Modal */}
      <AnimatePresence>
        {showSuggestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-lg p-8 rounded-[3rem] border ${theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black font-arabic">
                  {language === 'ar' ? 'اقتراح حديقة جديدة' : 'Suggest New Garden'}
                </h3>
                <button onClick={() => setShowSuggestModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSuggestGarden} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'اسم الحديقة' : 'Garden Name'}</label>
                  <input 
                    required
                    value={newGarden.name}
                    onChange={e => setNewGarden({...newGarden, name: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الموقع' : 'Location'}</label>
                  <input 
                    required
                    value={newGarden.location}
                    onChange={e => setNewGarden({...newGarden, location: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                  <textarea 
                    required
                    value={newGarden.description}
                    onChange={e => setNewGarden({...newGarden, description: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold h-32" 
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                  {language === 'ar' ? 'إرسال الاقتراح' : 'Submit Suggestion'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-96 bg-zinc-100 dark:bg-white/5 rounded-[3rem] animate-pulse" />
          ))
        ) : gardens.length > 0 ? (
          gardens.map((garden, i) => (
            <motion.div
              key={garden.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-10 rounded-[4rem] border shadow-2xl flex flex-col md:flex-row gap-10 ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'}`}
            >
              <div className="w-full md:w-64 h-64 bg-zinc-100 dark:bg-white/5 rounded-[3rem] overflow-hidden shrink-0 relative">
                <img 
                  src={`https://picsum.photos/seed/${garden.id}/600/600`} 
                  alt={garden.name_en} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md rounded-2xl text-emerald-500">
                  <Leaf className="w-6 h-6" />
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black font-arabic leading-tight">
                    {language === 'ar' ? garden.name_ar : garden.name_en}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                    <MapPin className="w-4 h-4 text-egypt-red" />
                    {language === 'ar' ? garden.location_ar : garden.location_en}
                  </div>
                </div>

                <p className="text-sm text-zinc-500 leading-relaxed">
                  {language === 'ar' ? garden.description_ar : garden.description_en}
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl text-center">
                    <Users className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Members</span>
                    <div className="text-sm font-black">{garden.members_count || 0}+</div>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl text-center">
                    <Droplets className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</span>
                    <div className="text-sm font-black">{garden.status || 'Active'}</div>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl text-center">
                    <Sun className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Light</span>
                    <div className="text-sm font-black">{garden.sunlight || 'Full'}</div>
                  </div>
                </div>

                <button 
                  onClick={() => handleJoinVolunteer(garden.id)}
                  className="w-full py-5 bg-egypt-gold text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-egypt-gold/10"
                >
                  {language === 'ar' ? 'انضم للمتطوعين' : 'Join Volunteers'}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-zinc-500 font-black uppercase tracking-widest">No gardens found</div>
        )}
      </div>

      {/* Why Join Section */}
      <div className={`p-12 rounded-[4rem] border shadow-2xl ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'}`}>
        <h2 className="text-3xl font-black mb-10 font-arabic text-center">{language === 'ar' ? 'لماذا تنضم للحدائق المجتمعية؟' : 'Why Join Community Gardens?'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
              <Sprout className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black font-arabic">{language === 'ar' ? 'غذاء طازج' : 'Fresh Food'}</h4>
            <p className="text-sm text-zinc-500 font-bold">{language === 'ar' ? 'ازرع خضرواتك بنفسك وتأكد من جودتها.' : 'Grow your own vegetables and ensure their quality.'}</p>
          </div>
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black font-arabic">{language === 'ar' ? 'تواصل اجتماعي' : 'Social Connection'}</h4>
            <p className="text-sm text-zinc-500 font-bold">{language === 'ar' ? 'تعرف على جيرانك وشاركهم الخبرات.' : 'Meet your neighbors and share experiences.'}</p>
          </div>
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <Sun className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black font-arabic">{language === 'ar' ? 'صحة نفسية' : 'Mental Health'}</h4>
            <p className="text-sm text-zinc-500 font-bold">{language === 'ar' ? 'الزراعة تقلل التوتر وتزيد من السعادة.' : 'Gardening reduces stress and increases happiness.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGardens;
