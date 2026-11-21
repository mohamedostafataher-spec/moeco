import React from 'react';
import { motion } from 'framer-motion';
import { 
  Type, 
  Contrast, 
  Activity, 
  Volume2, 
  Mic, 
  Vibrate, 
  BookOpen, 
  ChevronLeft,
  ChevronRight,
  Video,
  Zap,
  Target,
  Users
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const AccessibilitySettings: React.FC = () => {
  const { 
    fontSize, 
    highContrast, 
    reduceMotion, 
    autoRead, 
    vibration, 
    ttsEnabled, 
    sttEnabled,
    signLanguageEnabled,
    voiceSpeed,
    voiceType,
    focusMode,
    flashAlerts,
    simplifiedMode,
    updateSettings,
    speak,
    triggerFlash
  } = useAccessibility();
  const { language, theme } = useApp();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const sections = [
    {
      title: isRtl ? 'الرؤية' : 'Vision',
      items: [
        {
          id: 'fontSize',
          icon: Type,
          label: isRtl ? 'حجم الخط' : 'Font Size',
          description: isRtl ? 'تغيير حجم النصوص في التطبيق' : 'Change text size across the app',
          type: 'select',
          value: fontSize,
          options: [
            { value: 'small', label: isRtl ? 'صغير' : 'Small' },
            { value: 'medium', label: isRtl ? 'متوسط' : 'Medium' },
            { value: 'large', label: isRtl ? 'كبير' : 'Large' },
            { value: 'extra-large', label: isRtl ? 'كبير جداً' : 'Extra Large' },
          ],
          onChange: (val: string) => updateSettings({ fontSize: val as any })
        },
        {
          id: 'highContrast',
          icon: Contrast,
          label: isRtl ? 'التباين العالي' : 'High Contrast',
          description: isRtl ? 'ألوان أكثر وضوحاً لسهولة القراءة' : 'Sharper colors for easier reading',
          type: 'toggle',
          value: highContrast,
          onChange: (val: boolean) => updateSettings({ highContrast: val })
        },
        {
          id: 'simplifiedMode',
          icon: BookOpen,
          label: isRtl ? 'الوضع المبسط' : 'Simplified Mode',
          description: isRtl ? 'إخفاء الصور والعناصر غير الضرورية' : 'Hide images and non-essential elements',
          type: 'toggle',
          value: simplifiedMode,
          onChange: (val: boolean) => updateSettings({ simplifiedMode: val })
        }
      ]
    },
    {
      title: isRtl ? 'السمع والنطق' : 'Hearing & Speech',
      items: [
        {
          id: 'ttsEnabled',
          icon: Volume2,
          label: isRtl ? 'قارئ الشاشة (TTS)' : 'Screen Reader (TTS)',
          description: isRtl ? 'تحويل النصوص إلى كلام مسموع' : 'Convert text to audible speech',
          type: 'toggle',
          value: ttsEnabled,
          onChange: (val: boolean) => updateSettings({ ttsEnabled: val })
        },
        {
          id: 'voiceSpeed',
          icon: Activity,
          label: isRtl ? 'سرعة الصوت' : 'Voice Speed',
          description: isRtl ? 'التحكم في سرعة قراءة النصوص' : 'Control the speed of text reading',
          type: 'slider',
          value: voiceSpeed,
          min: 0.5,
          max: 2,
          step: 0.1,
          onChange: (val: number) => updateSettings({ voiceSpeed: val })
        },
        {
          id: 'voiceType',
          icon: Users,
          label: isRtl ? 'نوع الصوت' : 'Voice Type',
          description: isRtl ? 'اختيار صوت ذكر أو أنثى' : 'Choose between male or female voice',
          type: 'select',
          value: voiceType,
          options: [
            { value: 'female', label: isRtl ? 'أنثى' : 'Female' },
            { value: 'male', label: isRtl ? 'ذكر' : 'Male' },
          ],
          onChange: (val: string) => updateSettings({ voiceType: val as any })
        },
        {
          id: 'sttEnabled',
          icon: Mic,
          label: isRtl ? 'التعرف على الصوت (STT)' : 'Voice Recognition (STT)',
          description: isRtl ? 'إدخال النصوص باستخدام الصوت' : 'Input text using your voice',
          type: 'toggle',
          value: sttEnabled,
          onChange: (val: boolean) => updateSettings({ sttEnabled: val })
        },
        {
          id: 'signLanguageEnabled',
          icon: Users,
          label: isRtl ? 'مساعد لغة الإشارة' : 'Sign Language Assistant',
          description: isRtl ? 'تفعيل مترجم لغة الإشارة بالفيديو' : 'Enable video sign language interpreter',
          type: 'toggle',
          value: signLanguageEnabled,
          onChange: (val: boolean) => updateSettings({ signLanguageEnabled: val })
        }
      ]
    },
    {
      title: isRtl ? 'التنبيهات والتفاعل' : 'Alerts & Interaction',
      items: [
        {
          id: 'vibration',
          icon: Vibrate,
          label: isRtl ? 'الاهتزاز' : 'Vibration',
          description: isRtl ? 'تنبيهات بالاهتزاز عند التفاعل' : 'Vibration alerts on interaction',
          type: 'toggle',
          value: vibration,
          onChange: (val: boolean) => updateSettings({ vibration: val })
        },
        {
          id: 'flashAlerts',
          icon: Zap,
          label: isRtl ? 'تنبيهات الوميض' : 'Flash Alerts',
          description: isRtl ? 'وميض الشاشة عند وصول تنبيهات' : 'Flash screen when alerts arrive',
          type: 'toggle',
          value: flashAlerts,
          onChange: (val: boolean) => {
            updateSettings({ flashAlerts: val });
            if (val) triggerFlash();
          }
        },
        {
          id: 'focusMode',
          icon: Target,
          label: isRtl ? 'وضع التركيز' : 'Focus Mode',
          description: isRtl ? 'إخفاء العناصر المشتتة للتركيز' : 'Hide distracting elements',
          type: 'toggle',
          value: focusMode,
          onChange: (val: boolean) => updateSettings({ focusMode: val })
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen pb-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10"
        >
          {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
        </button>
        <div>
          <h1 className="text-2xl font-black">{isRtl ? 'إعدادات الوصول' : 'Accessibility Settings'}</h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {isRtl ? 'تخصيص تجربة الاستخدام لتناسب احتياجاتك' : 'Customize your experience to fit your needs'}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-4">
            <h2 className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.2em] px-2">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {section.items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-6 rounded-[2rem] border transition-all ${
                    theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-zinc-100'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-egypt-gold/10 rounded-2xl">
                        <item.icon className="w-6 h-6 text-egypt-gold" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm">{item.label}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.type === 'toggle' ? (
                        <button
                          onClick={() => {
                            const val = !(item.value as boolean);
                            (item.onChange as (v: boolean) => void)(val);
                            speak(`${item.label} ${val ? (isRtl ? 'مفعل' : 'Enabled') : (isRtl ? 'معطل' : 'Disabled')}`);
                          }}
                          className={`w-14 h-8 rounded-full relative transition-colors ${
                            item.value ? 'bg-egypt-gold' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        >
                          <motion.div
                            animate={{ x: item.value ? (isRtl ? -28 : 28) : 0 }}
                            className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      ) : item.type === 'slider' ? (
                        <div className="flex items-center gap-4 w-full sm:w-auto sm:min-w-full sm:max-w-[200px]">
                          <input
                            type="range"
                            min={item.min}
                            max={item.max}
                            step={item.step || 1}
                            value={item.value as number}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              (item.onChange as (v: number) => void)(val);
                            }}
                            className="flex-1 accent-egypt-gold"
                          />
                          <span className="text-xs font-black min-w-[40px] text-center">{item.value}x</span>
                        </div>
                      ) : (
                        <select
                          value={item.value as string}
                          onChange={(e) => (item.onChange as (v: string) => void)(e.target.value)}
                          className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-egypt-gold"
                        >
                          {item.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sign Language Video Support */}
      <div className="mt-12 p-8 bg-egypt-black rounded-[3rem] border border-egypt-gold/20 text-center">
        <div className="w-20 h-20 bg-egypt-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Video className="w-10 h-10 text-egypt-gold" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">
          {isRtl ? 'دعم لغة الإشارة' : 'Sign Language Support'}
        </h3>
        <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8">
          {isRtl 
            ? 'يقدم التطبيق نظام ترجمة مرئية بلغة الإشارة متطابق مع جميع الشاشات لتسهيل وصول المحتوى للجميع.' 
            : 'The application provides a visual sign language translation system compatible with all screens to make content accessible to everyone.'}
        </p>
        
        {signLanguageEnabled ? (
          <div className="aspect-video bg-zinc-900 overflow-hidden rounded-2xl border-4 border-egypt-gold/50 flex items-center justify-center relative group">
            <video 
              src="https://www.w3schools.com/html/mov_bbb.mp4" 
              autoPlay 
              loop 
              muted 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button onClick={() => updateSettings({ signLanguageEnabled: false })} className="px-6 py-3 bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                 {isRtl ? 'إيقاف الترجمة' : 'Disable Translation'}
               </button>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/80 px-4 py-2 rounded-lg border border-white/10">
               <span className="text-xs font-black text-white">{isRtl ? 'معاينة حية للمترجم' : 'Live Interpreter Preview'}</span>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-6 text-center">
             <Target className="w-12 h-12 text-zinc-700 mb-4" />
             <p className="text-sm font-bold text-zinc-500 mb-6">
               {isRtl ? 'مترجم الإشارة معطل حالياً.' : 'Sign Language Assistant is currently disabled.'}
             </p>
             <button 
               onClick={() => {
                 updateSettings({ signLanguageEnabled: true });
                 speak(isRtl ? 'تم تفعيل مترجم الإشارة' : 'Sign Language Assistant Enabled');
               }} 
               className="px-8 py-4 bg-egypt-gold text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.2)]"
             >
               {isRtl ? 'تفعيل مساعد لغة الإشارة' : 'Enable Sign Language Assistant'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilitySettings;
