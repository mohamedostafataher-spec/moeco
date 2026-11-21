import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, Phone, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  notificationService,
  EmergencyAlert,
  AlertSeverity,
} from "../services/notificationService";
import { useAccessibility } from "../context/AccessibilityContext";

export const GlobalEmergencyReceiver: React.FC = () => {
  const { language, isFocusMode } = useApp();
  const { speak, stopSpeaking } = useAccessibility();

  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const alertResolveRef = useRef<
    ((value: void | PromiseLike<void>) => void) | null
  >(null);
  const repeatIntervalRef = useRef<any>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    // Override the alert handler globally with this one
    notificationService.setAlertHandler(async (alert: EmergencyAlert) => {
      // IF Focus Mode is on, we skip showing popup unless it's "Critical"
      if (isFocusMode && alert.severity !== AlertSeverity.Critical) {
        console.log("Suppressing non-critical alert due to Focus Mode");
        return;
      }

      return new Promise<void>((resolve) => {
        alertResolveRef.current = resolve;
        setActiveAlert(alert);

        const lang = language === "ar" || language === "en" ? language : "en";

        // Trigger initial sensory feedback
        const isMuted = localStorage.getItem("moeco_alerts_muted") === "true";
        if (!isMuted) {
          notificationService.triggerSensoryFeedback(alert, lang);
        }

        // Repeating Alert System (Max 5 retries, every 30s)
        retryCountRef.current = 0;
        if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);

        repeatIntervalRef.current = setInterval(() => {
          retryCountRef.current++;
          if (retryCountRef.current >= 5) {
            clearInterval(repeatIntervalRef.current);
            // Optionally auto-silence or just stop repeating sound:
            return;
          }
          if (!isMuted) {
            notificationService.triggerSensoryFeedback(alert, lang);
          }
        }, 30000); // 30 seconds
      });
    });

    return () => {
      if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
    };
  }, [language]);

  const silenceAlert = () => {
    notificationService.stopFeedback();

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }

    if (activeAlert) {
      setActiveAlert(null);
      if (alertResolveRef.current) {
        alertResolveRef.current();
        alertResolveRef.current = null;
      }
    }
  };

  if (!activeAlert) return null;

  const isCritical =
    activeAlert.severity === AlertSeverity.Critical ||
    activeAlert.severity === "critical" ||
    activeAlert.severity === AlertSeverity.High ||
    activeAlert.severity === "high" ||
    activeAlert.severity === "Extreme Emergency" ||
    activeAlert.severity === "Danger" ||
    activeAlert.severity === "Important";

  return (
    <AnimatePresence>
      <motion.div
        key="emergency-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-rose-950/95 backdrop-blur-3xl flex items-center justify-center p-6"
      >
        {/* Pulsing Visual Hazard Background for all alerts */}
        <motion.div
          animate={{
            backgroundColor: isCritical
              ? [
                  "rgba(225, 29, 72, 0.5)",
                  "rgba(225, 29, 72, 0.2)",
                  "rgba(225, 29, 72, 0.5)",
                ]
              : [
                  "rgba(225, 29, 72, 0.3)",
                  "rgba(225, 29, 72, 0.1)",
                  "rgba(225, 29, 72, 0.3)",
                ],
          }}
          transition={{ repeat: Infinity, duration: isCritical ? 0.8 : 1.5 }}
          className="absolute inset-0 pointer-events-none"
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className={`w-full max-w-2xl bg-black border-[4px] ${isCritical ? "border-rose-500 shadow-[0_0_150px_rgba(225,29,72,0.6)]" : "border-rose-400 shadow-[0_0_80px_rgba(225,29,72,0.4)]"} rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden`}
        >
          <div className="absolute top-[-20%] right-[-10%] p-12 opacity-10 pointer-events-none">
            <ShieldAlert size={400} />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              animate={isCritical ? { y: [0, -10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-24 h-24 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-rose-600/50"
            >
              <AlertTriangle size={48} />
            </motion.div>

            <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-rose-300 mb-4 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">
              {language === "ar" ? "إنذار طوارئ" : "EMERGENCY ALERT"}
            </h2>
            <h3 className="text-3xl md:text-5xl font-black leading-tight mb-6 font-display">
              {language === "ar"
                ? activeAlert.title?.ar
                : activeAlert.title?.en}
            </h3>
            <p className="text-lg md:text-xl font-medium text-rose-50/90 text-balance mb-12">
              {language === "ar"
                ? activeAlert.message?.ar
                : activeAlert.message?.en}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <button
                onClick={silenceAlert}
                className="py-5 bg-white text-rose-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-2"
              >
                <X size={20} />
                {language === "ar" ? "إيقاف الإنذار" : "STOP ALARM"}
              </button>
              <a
                href="tel:122"
                className="py-5 bg-rose-900 border border-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-800 hover:border-rose-400 transition-all"
              >
                <Phone size={20} />
                {language === "ar" ? "اتصال الطوارئ ١٢٢" : "EMERGENCY: 122"}
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
