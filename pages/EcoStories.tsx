
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Star, ArrowRight, CheckCircle2, Lock, Play, Award, Info, Zap, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { smartAiService } from '../services/smartAiService';
import { supabase } from '../services/supabaseClient';

const EcoStories: React.FC = () => {
  const { language, theme, user } = useApp();
  const [stories, setStories] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    category: 'nature',
    points_reward: 50
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [dailyAiStory, setDailyAiStory] = useState<any>(null);

  const categories = [
    { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
    { id: 'nature', label: language === 'ar' ? 'الطبيعة' : 'Nature' },
    { id: 'energy', label: language === 'ar' ? 'الطاقة' : 'Energy' },
    { id: 'waste', label: language === 'ar' ? 'النفايات' : 'Waste' },
    { id: 'climate', label: language === 'ar' ? 'المناخ' : 'Climate' },
  ];

  const filteredStories = stories.filter(s => activeCategory === 'all' || s.category === activeCategory);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const allStories = await storageService.getInteractiveStories();
        setStories(allStories);
        // Estimated progress for now if not implemented
        setUserProgress([]);

        // Fetch AI Story Snippet
        const aiStory = await smartAiService.generateDailyContent('story', language as any);
        setDailyAiStory(aiStory);
      } catch (error) {
        console.error("Error loading stories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [language]);

  const handleStartStory = async (story: any) => {
    try {
      const chapters = await storageService.getStoryChapters(story.id);
      setSelectedStory({ ...story, chapters });
      setCurrentChapter(0);
    } catch (error) {
      console.error("Error loading chapters:", error);
      notificationService.error(language === 'ar' ? 'فشل في تحميل فصول القصة' : 'Failed to load story chapters');
    }
  };

  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      notificationService.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('interactive_stories')
        .insert({
          title_ar: newStory.title,
          title_en: newStory.title,
          description_ar: newStory.description,
          description_en: newStory.description,
          category: newStory.category,
          author_id: user.id,
          points_reward: newStory.points_reward,
          difficulty: 'Easy',
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setStories([data, ...stories]);
      setShowSubmitModal(false);
      notificationService.success(language === 'ar' ? 'تم تقديم القصة للمراجعة' : 'Story submitted for review');
      setNewStory({ title: '', description: '', category: 'nature', points_reward: 50 });
    } catch (err: any) {
      console.error("Story submission error:", err);
      notificationService.error(language === 'ar' ? `فشل في تقديم القصة: ${err.message}` : `Failed to submit story: ${err.message}`);
    }
  };

  const handleNextChapter = async () => {
    if (!selectedStory) return;
    
    const isLast = currentChapter === selectedStory.chapters.length - 1;
    
    try {
      await storageService.updateStoryProgress(selectedStory.id, currentChapter + 1, isLast);
      if (isLast) {
        notificationService.success(
          language === 'ar' 
            ? 'مبروك! لقد أتممت القصة وحصلت على مكافأة.' 
            : 'Congratulations! You completed the story and earned a reward.'
        );
        setSelectedStory(null);
      } else {
        setCurrentChapter(prev => prev + 1);
      }
    } catch (error: any) {
      notificationService.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-egypt-gold"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-egypt-black p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-egypt-gold/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left space-y-6">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="bg-egypt-gold p-3 rounded-2xl shadow-lg shadow-egypt-gold/20">
                <BookOpen className="w-8 h-8 text-egypt-black" />
              </div>
              <span className="text-egypt-gold text-xs font-black uppercase tracking-[0.3em]">Eco Education</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black font-arabic tracking-tighter leading-tight flex items-center gap-4">
              {language === 'ar' ? 'قصص بيئية تفاعلية' : 'Interactive Eco Stories'}
              <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg shadow-emerald-500/20">
                {language === 'ar' ? 'مجاناً بالكامل' : 'COMPLETELY FREE'}
              </span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl font-medium">
              {language === 'ar' ? 'تعلم عن البيئة من خلال مغامرات تفاعلية وقصص ملهمة.' : 'Learn about the environment through interactive adventures and inspiring stories.'}
            </p>
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="px-8 py-4 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-egypt-gold/20"
            >
              {language === 'ar' ? 'شارك قصتك الخاصة' : 'Share Your Own Story'}
            </button>
          </div>
          <div className="w-48 h-48 bg-egypt-gold/10 rounded-full flex items-center justify-center border border-egypt-gold/20 backdrop-blur-xl">
             <Award className="w-24 h-24 text-egypt-gold opacity-50" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full sm:w-96 h-96 bg-egypt-gold/5 blur-[120px] rounded-full" />
      </div>

      {/* AI Daily Story Snippet */}
      {dailyAiStory && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-10 rounded-[4rem] border-2 border-dashed relative overflow-hidden ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-500/30'}`}
        >
          <div className="absolute top-0 right-0 p-8">
            <Sparkles className="w-16 h-16 text-emerald-500 opacity-10 animate-pulse" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                {language === 'ar' ? 'قصة الذكاء الاصطناعي اليومية' : 'Daily AI Story Snippet'}
              </span>
            </div>
            <h2 className="text-3xl font-black mb-4">{dailyAiStory.title}</h2>
            <p className="text-xl font-bold leading-relaxed opacity-80 mb-6">{dailyAiStory.content}</p>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 inline-block">
              <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">
                {language === 'ar' ? 'الحكمة:' : 'Lesson:'} {dailyAiStory.lesson}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Categories */}
      <div className="flex flex-wrap gap-4 justify-center">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              activeCategory === cat.id 
                ? 'bg-egypt-gold text-egypt-black shadow-xl shadow-egypt-gold/20' 
                : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {!selectedStory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStories.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ y: -10 }}
              className={`p-8 rounded-[3rem] border shadow-2xl flex flex-col justify-between space-y-6 transition-all ${
                theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-zinc-100'
              }`}
            >
              <div className="space-y-4">
                <div className="aspect-video rounded-[2rem] bg-egypt-black/20 overflow-hidden relative">
                  <img 
                    src={story.image_url || `https://picsum.photos/seed/${story.id}/800/600`} 
                    alt={story.title} 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-egypt-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <span className="px-3 py-1 bg-egypt-gold text-egypt-black text-[10px] font-black rounded-lg uppercase">
                      {story.difficulty || 'Easy'}
                    </span>
                    <div className="flex items-center gap-1 text-egypt-gold">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-black">{story.points_reward} XP</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-black font-arabic">{language === 'ar' ? story.title_ar : story.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {language === 'ar' ? story.description_ar : story.description}
                </p>
              </div>
              <button
                onClick={() => handleStartStory(story)}
                className="w-full py-4 bg-egypt-gold text-egypt-black font-black rounded-2xl shadow-xl shadow-egypt-gold/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                {language === 'ar' ? 'ابدأ القصة' : 'Start Story'}
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-12 rounded-[4rem] border shadow-2xl space-y-12 relative overflow-hidden ${
            theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-zinc-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedStory(null)}
              className="text-zinc-500 text-sm font-black uppercase tracking-widest hover:text-egypt-gold transition-colors"
            >
              {language === 'ar' ? '← العودة للمكتبة' : '← Back to Library'}
            </button>
            <div className="flex gap-2">
              {selectedStory.chapters?.map((_: any, idx: number) => (
                <div 
                  key={idx}
                  className={`h-2 w-8 rounded-full transition-all ${
                    idx <= currentChapter ? 'bg-egypt-gold' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-8 text-center">
            <h2 className="text-4xl font-black font-arabic">
              {language === 'ar' ? selectedStory.chapters[currentChapter]?.title_ar : selectedStory.chapters[currentChapter]?.title}
            </h2>
            <div className="aspect-video rounded-[3rem] overflow-hidden bg-egypt-black/20 shadow-2xl border border-white/5">
               <img 
                src={selectedStory.chapters[currentChapter]?.image_url || `https://picsum.photos/seed/chapter-${currentChapter}/1200/800`} 
                alt="Chapter" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-zinc-400 text-xl leading-relaxed font-medium">
              {language === 'ar' ? selectedStory.chapters[currentChapter]?.content_ar : selectedStory.chapters[currentChapter]?.content}
            </p>
            
            <div className="pt-8">
              <button
                onClick={handleNextChapter}
                className="px-12 py-6 bg-egypt-gold text-egypt-black font-black rounded-2xl shadow-2xl shadow-egypt-gold/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto text-lg"
              >
                {currentChapter === selectedStory.chapters.length - 1 
                  ? (language === 'ar' ? 'إنهاء القصة' : 'Finish Story')
                  : (language === 'ar' ? 'الفصل التالي' : 'Next Chapter')
                }
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Story Modal */}
      <AnimatePresence>
        {showSubmitModal && (
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
                  {language === 'ar' ? 'تقديم قصة جديدة' : 'Submit New Story'}
                </h3>
                <button onClick={() => setShowSubmitModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full">
                  <Info className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmitStory} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'عنوان القصة' : 'Story Title'}</label>
                  <input 
                    required
                    value={newStory.title}
                    onChange={e => setNewStory({...newStory, title: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'وصف مختصر' : 'Short Description'}</label>
                  <textarea 
                    required
                    value={newStory.description}
                    onChange={e => setNewStory({...newStory, description: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold h-32" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الفئة' : 'Category'}</label>
                  <select 
                    value={newStory.category}
                    onChange={e => setNewStory({...newStory, category: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold"
                  >
                    <option value="nature">Nature</option>
                    <option value="energy">Energy</option>
                    <option value="waste">Waste</option>
                    <option value="climate">Climate</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-5 bg-egypt-gold text-egypt-black rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-egypt-gold/20">
                  {language === 'ar' ? 'تقديم للمراجعة' : 'Submit for Review'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EcoStories;
