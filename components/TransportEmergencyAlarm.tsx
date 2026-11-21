
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Volume2, VolumeX, X, Smartphone, MessageSquare } from 'lucide-react';

interface Emergency {
  id: string;
  message: string;
  severity: 'high' | 'critical';
}

const SIREN_URL = 'https://assets.mixkit.co/active_storage/sfx/1004/1004-preview.mp3';

export const TransportEmergencyAlarm: React.FC<{ alarms: Emergency[], onDismiss: (id: string) => void, language: 'ar' | 'en' }> = ({ alarms, onDismiss, language }) => {
  const [currentAlarm, setCurrentAlarm] = useState<Emergency | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (alarms.length > 0 && !currentAlarm) {
      setCurrentAlarm(alarms[0]);
    }
  }, [alarms, currentAlarm]);

  useEffect(() => {
    if (currentAlarm) {
      // Start Alarm sequence
      if (!isMuted) {
        if (!audioRef.current) {
          audioRef.current = new Audio(SIREN_URL);
          audioRef.current.loop = true;
        }
        audioRef.current.play().catch(e => console.warn("Audio playback failed:", e));
      }

      // Vibration
      if ("vibrate" in navigator) {
        navigator.vibrate([500, 300, 500, 300, 500]);
      }

      // TTS
      const speak = () => {
        const text = currentAlarm.message;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
        window.speechSynthesis.speak(utterance);
      };
      speak();
      
      const ttsInterval = setInterval(speak, 10000); // Repeat every 10s
      return () => clearInterval(ttsInterval);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [currentAlarm, isMuted, language]);

  const handleDismiss = () => {
    if (currentAlarm) {
      onDismiss(currentAlarm.id);
      setCurrentAlarm(null);
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
    }
  };

  if (!currentAlarm) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-lg bg-black border-4 border-red-500 rounded-[3rem] p-8 shadow-[0_0_100px_rgba(239,68,68,0.5)] overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
        
        <div className="flex flex-col items-center text-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-bounce">
            <ShieldAlert size={48} />
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-red-500 uppercase tracking-tighter">
              {language === 'ar' ? 'تنبيه طوارئ' : 'EMERGENCY ALERT'}
            </h2>
            <p className="text-xl font-bold text-white leading-relaxed">
              {currentAlarm.message}
            </p>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors"
            >
              {isMuted ? <VolumeX className="text-white" /> : <Volume2 className="text-red-500" />}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-[3] py-4 bg-red-500 hover:bg-red-600 text-white font-black text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)]"
            >
              {language === 'ar' ? 'تأكيد الاستلام' : 'CONFIRM RECEIPT'}
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-8 text-zinc-500 font-bold text-xs uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <Smartphone size={14} className="animate-ping" />
                <span>Vibration Active</span>
            </div>
            <div className="flex items-center gap-2">
                <MessageSquare size={14} />
                <span>TTS Reading</span>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
