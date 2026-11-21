import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, AlertTriangle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { alertService } from "../services/alertService";
import { notificationService } from "../services/notificationService";

const AlertBanner: React.FC = () => {
  const { language, isFocusMode } = useApp();
  const location = useLocation();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await alertService.fetchAlerts();
      // Only keep TRULY critical alerts for the floating banner to avoid user annoyance
      const criticalData = data.filter(
        (a) =>
          ["Extreme Emergency", "Danger", "Critical", "High"].includes(a.severity) &&
          !dismissedAlerts.has(a.id)
      );

      // Only show the top 1 most important alert to avoid spam
      if (criticalData.length > 0) {
        setActiveAlerts([criticalData[0]]);
      } else {
        setActiveAlerts([]);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [dismissedAlerts]);

  // Disable popups above transport hub while tracking or searching, or if focus mode is on
  if (location.pathname.includes('/transport-hub') || isFocusMode) return null;

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];

  const handleDismiss = () => {
    alertService.stopEmergencySound();
    setDismissedAlerts((prev) => new Set(prev).add(currentAlert.id));
  };

  return (
    <AnimatePresence>
      <motion.div
        key={currentAlert.id}
        initial={{ y: -30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -30, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed top-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[1000] p-3 shadow-2xl rounded-2xl bg-slate-950/30 backdrop-blur-md border border-rose-500/30 text-white"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <ShieldAlert size={16} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-400">
                {currentAlert.category || (language === "ar" ? "تنبيه طارئ" : "Emergency Alert")}
              </h4>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                title={language === "ar" ? "إخفاء" : "Dismiss"}
              >
                <X size={14} />
              </button>
            </div>
            <p className="font-bold text-xs mt-1 mb-0.5 font-arabic line-clamp-2 text-slate-100">
              {language === "ar" ? currentAlert.title?.ar || currentAlert.title_ar : currentAlert.title?.en || currentAlert.title_en}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertBanner;
