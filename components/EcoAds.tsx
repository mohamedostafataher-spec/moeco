
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Play, CheckCircle, X, Sparkles, Coins, Gift, Info, DollarSign } from 'lucide-react';
import { storageService } from '../services/storageService';

/* 
  ملاحظة لمحمد (آلية دعم الصندوق الأخضر):
  لتحقيق مساهمة حقيقية لك عند مشاهدة المستخدمين للإعلانات:
  1. إذا كان التطبيق موقع ويب: يجب التسجيل في Google AdSense ووضع "Ad Slot ID" في كود الـ IFrame هنا.
  2. إذا كان التطبيق APK: يجب استخدام مكتبة "Capacitor AdMob"؛ هي تقوم بفتح إعلانات الفيديو الحقيقية (Rewarded Ads) 
     وعندما ينتهي الفيديو، ترسل المكتبة إشارة (Event) تخبرنا بنجاح المشاهدة، عندها نعطي المستخدم عملات وأنت تستلم المساهمة في حسابك لدعم المشروع.
*/

export const EcoAds: React.FC = () => {
  const { t, language, theme, isAdmin } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [adConfig, setAdConfig] = useState({ showBannerAds: false, adUnitId: "" });

  useEffect(() => {
    const loadConfig = async () => {
      const config = await storageService.getGlobalConfig();
      setAdConfig({
        showBannerAds: config.showBannerAds || false,
        adUnitId: config.adUnitId || ""
      });
    };
    loadConfig();
  }, []);

  const startAd = async () => {
    // 1. التحقق من وجود معرف إعلاني حقيقي
    if (adConfig.adUnitId && adConfig.adUnitId.startsWith('ca-app-pub')) {
      console.log("Attempting to load real ad for ID:", adConfig.adUnitId);
      
      /* 
         ملاحظة برمجية للمستقبل (عند تحويل التطبيق لـ APK):
         يجب استدعاء مكتبة AdMob هنا كالتالي:
         
         await AdMob.showRewardedVideoAd({ adId: adConfig.adUnitId });
         
         وبعد نجاح العرض، يتم استدعاء الكود أدناه لإضافة العملات.
      */
    }

    setIsPlaying(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        storageService.addGreenCoins(10);
        setCompleted(true);
        setTimeout(() => {
          setIsPlaying(false);
          setCompleted(false);
          setProgress(0);
        }, 3000);
      }
    }, 40); 
  };

  if (isPlaying) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 backdrop-blur-3xl">
         <div className="max-w-xl w-full text-center space-y-10">
            <div className="relative aspect-video bg-emerald-950 rounded-[3rem] overflow-hidden flex items-center justify-center border border-white/10 shadow-[0_0_100px_rgba(52,211,153,0.2)]">
               {completed ? (
                 <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                    <div className="w-24 h-24 bg-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(52,211,153,0.5)]">
                      <CheckCircle className="w-12 h-12 text-black" />
                    </div>
                    <h2 className="text-4xl font-black text-white">{t('adSuccess')}</h2>
                    <p className="text-emerald-400 font-bold mt-2">Revenue Generated for Hub Development</p>
                 </div>
               ) : (
                 <div className="space-y-6 text-white w-full px-10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 mb-4">
                       <DollarSign className="w-10 h-10 text-emerald-400 animate-bounce" />
                    </div>
                    <p className="text-xl font-black uppercase tracking-widest">{language === 'ar' ? 'جاري تحميل العرض البيئي...' : 'Loading Eco-Sponsor Content...'}</p>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-400 transition-all duration-100" style={{ width: `${progress}%` }} />
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden group transition-all ${
        theme === 'dark' ? 'bg-[#001a14] border-emerald-400/20' : 'bg-emerald-950 text-white'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
             <div className="p-5 bg-emerald-400 text-black rounded-[1.5rem] shadow-xl">
               <Coins className="w-10 h-10" />
             </div>
             <div>
               <h3 className="text-2xl font-black font-arabic mb-1">{t('watchAd')}</h3>
               <p className="text-emerald-100/60 font-bold text-sm">{language === 'ar' ? 'شاهد الإعلان وادعم تطوير مو إيكو' : 'Support MoEco evolution & earn coins'}</p>
             </div>
          </div>
          <button 
            onClick={startAd}
            className="bg-white text-emerald-950 px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            <Play className="w-6 h-6 fill-emerald-950" />
            {t('earnCoins')}
          </button>
        </div>
        <Sparkles className="absolute top-[-20px] right-[-20px] w-48 h-48 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
      </div>

      {adConfig.showBannerAds && (
        <div className={`w-full p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 group transition-all min-h-[200px] ${
          theme === 'dark' ? 'border-emerald-900/30 bg-black/40' : 'border-stone-100 bg-stone-50'
        }`}>
           {isAdmin && (
             <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest border border-stone-200 px-4 py-1 rounded-full mb-2">Google AdSense Slot (Admin Only View)</div>
           )}
           
           {/* Real Ad Container */}
           <div id="google-ads-container" className="w-full flex justify-center">
              {/* AdSense/AdMob code would be injected here */}
              <div className="w-full h-[100px] bg-white/5 rounded-xl flex items-center justify-center text-stone-500/20 font-black uppercase tracking-widest">
                Banner Ad Area
              </div>
           </div>

           <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                 <Info className="w-4 h-4 text-stone-300" />
                 <span className="text-[10px] font-black text-stone-300 uppercase">Sponsor Space</span>
              </div>
              <X className="w-4 h-4 text-stone-300 cursor-pointer hover:text-red-400" />
           </div>
        </div>
      )}
    </div>
  );
};
