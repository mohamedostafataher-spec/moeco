import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Bell,
  Info,
  ShieldAlert,
  Users,
  Globe,
  Download,
  Zap,
  Droplets,
  Car,
  Trash2,
  Leaf,
  Heart,
  Shield,
  Search,
  Flame,
  Ambulance,
  Activity,
  Waves,
  MapPin,
} from "lucide-react";
import { alertService } from "../services/alertService";
import { excelSystemService } from "../services/excelSystemService";
import { useApp } from "../context/AppContext";
import { EcoAlert } from "../types";

export const AlertCenter: React.FC = () => {
  const { language, theme, user } = useApp();
  const [alerts, setAlerts] = useState<EcoAlert[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const isRtl = language === "ar";

  const sectors = [
    "all",
    "Weather",
    "Environment",
    "Energy",
    "Water",
    "Transport",
    "Fires",
    "Health",
    "Earthquake",
    "Floods",
    "Security",
    "Economy",
    "Fuel",
    "Tech",
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await alertService.fetchAlerts();

        // Do not auto-trigger global emergency sounds when simply viewing the Alert Center.
        // It causes spammy loud alarms for generic high-severity API data.
        
        setAlerts(res);
      } catch (err) {
        console.error("Alerts fetch error:", err);
      }
    };
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user, alerts]); // Add alerts to dependency array to compare

  const filteredAlerts = alerts.filter((a) => {
    const matchesFilter = filter === "all" || a.severity === filter;
    const alertCategory = a.category ? a.category.toLowerCase() : "";
    const matchesSector =
      sectorFilter === "all" ||
      alertCategory.includes(sectorFilter.toLowerCase());
    const matchesSearch =
      a.title[language].toLowerCase().includes(search.toLowerCase()) ||
      a.message[language].toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSector && matchesSearch;
  });

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("weather") || cat.includes("storm"))
      return <Globe className="w-5 h-5" />;
    if (cat.includes("energy") || cat.includes("power"))
      return <Zap className="w-5 h-5" />;
    if (cat.includes("water")) return <Droplets className="w-5 h-5" />;
    if (cat.includes("transport") || cat.includes("traffic"))
      return <Car className="w-5 h-5" />;
    if (cat.includes("health") || cat.includes("epidemic"))
      return <Heart className="w-5 h-5" />;
    if (cat.includes("fire")) return <Flame className="w-5 h-5" />;
    if (cat.includes("ambulance") || cat.includes("emergency"))
      return <Ambulance className="w-5 h-5" />;
    if (cat.includes("earthquake")) return <Activity className="w-5 h-5" />;
    if (cat.includes("flood") || cat.includes("sea"))
      return <Waves className="w-5 h-5" />;
    if (cat.includes("security") || cat.includes("war"))
      return <Shield className="w-5 h-5" />;
    if (cat.includes("pollution") || cat.includes("environment"))
      return <Trash2 className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  return (
    <div
      className={`p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border shadow-xl transition-all duration-500 flex flex-col h-full ${
        theme === "dark"
          ? "bg-egypt-black border-egypt-gold/20 text-white"
          : "bg-white border-egypt-gold/10"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-egypt-red text-white rounded-2xl shadow-lg flex-shrink-0 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black font-arabic">
              {isRtl ? "مركز التنبيهات المتقدم" : "Advanced Alert Center"}
            </h3>
            <p className="text-[10px] font-black text-egypt-red uppercase tracking-widest break-words">
              {isRtl
                ? "نظام إنذار مبكر شامل وذكي"
                : "Comprehensive Smart Early Warning System"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() =>
              excelSystemService.generateAdvancedAlertExcel(
                user?.countryId || "Egypt",
              )
            }
            className="flex items-center justify-center w-full md:w-auto gap-2 px-4 py-3 md:py-2 bg-egypt-gold/10 text-egypt-gold border border-egypt-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-egypt-gold hover:text-egypt-black transition-all"
          >
            <Download className="w-4 h-4" />
            {isRtl ? "تصدير التقرير" : "Export Report"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-4 shrink-0">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder={isRtl ? "بحث في التنبيهات..." : "Search alerts..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-zinc-100 dark:bg-white/5 border border-transparent focus:border-egypt-gold rounded-2xl outline-none transition-all font-bold"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide custom-scrollbar w-full">
          {[
            "all",
            "Extreme Emergency",
            "Danger",
            "Important",
            "Critical",
            "High",
            "Medium",
            "Low",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 shrink-0 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filter === s
                  ? "bg-egypt-gold text-egypt-black"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-egypt-gold/20"
              }`}
            >
              {s === "all"
                ? isRtl
                  ? "الكل"
                  : "All"
                : s === "Extreme Emergency"
                  ? isRtl
                    ? "طوارئ قصوى"
                    : s
                  : s === "Danger"
                    ? isRtl
                      ? "خطر"
                      : s
                    : s === "Important"
                      ? isRtl
                        ? "هام"
                        : s
                      : s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide custom-scrollbar w-full">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className={`px-4 py-2 shrink-0 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                sectorFilter === s
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-emerald-600/20"
              }`}
            >
              {s === "all" ? (isRtl ? "جميع القطاعات" : "All Sectors") : s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 flex-1 h-[400px] md:h-auto min-h-[300px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar border-t border-white/5 pt-4">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 opacity-50"
            >
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">
                {isRtl ? "لا توجد تنبيهات حالية" : "No active alerts"}
              </p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-3xl border transition-all ${
                  alert.severity === "Extreme Emergency" ||
                  alert.severity === "Critical"
                    ? "bg-red-500/10 border-red-500/30"
                    : alert.severity === "Danger" || alert.severity === "High"
                      ? "bg-orange-500/10 border-orange-500/30"
                      : alert.severity === "Important" ||
                          alert.severity === "Medium"
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-zinc-500/5 border-zinc-500/10"
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        alert.severity === "Extreme Emergency" ||
                        alert.severity === "Critical"
                          ? "bg-red-500 text-white animate-pulse"
                          : alert.severity === "Danger" ||
                              alert.severity === "High"
                            ? "bg-orange-500 text-white"
                            : alert.severity === "Important" ||
                                alert.severity === "Medium"
                              ? "bg-amber-500 text-white"
                              : "bg-zinc-500 text-white"
                      }`}
                    >
                      {getIcon(alert.category)}
                    </div>
                    <div>
                      <h4 className="font-black text-lg leading-tight">
                        {typeof alert.title === "object"
                          ? typeof alert.title[language] === "object"
                            ? (alert.title[language] as any)[language] ||
                              (alert.title[language] as any).ar
                            : alert.title[language] || alert.title.ar
                          : alert.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            alert.severity === "Extreme Emergency" ||
                            alert.severity === "Critical"
                              ? "bg-red-500/20 text-red-500"
                              : alert.severity === "Danger" ||
                                  alert.severity === "High"
                                ? "bg-orange-500/20 text-orange-500"
                                : alert.severity === "Important" ||
                                    alert.severity === "Medium"
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-zinc-500/20 text-zinc-500"
                          }`}
                        >
                          {alert.severity} • {alert.severityScore}% Severity
                        </span>
                        <span className="text-[8px] text-zinc-500 font-bold">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-right ${alert.affectedPopulation > 0 ? "" : "hidden"}`}>
                    <div className="flex items-center gap-1 text-egypt-gold">
                      <Users className="w-3 h-3" />
                      <span className="text-[10px] font-black">
                        ~{(alert.affectedPopulation / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase">
                      {isRtl ? "متأثرين" : "Affected"}
                    </p>
                  </div>
                </div>

                <p className="text-sm opacity-80 mb-4 leading-relaxed">
                  {typeof alert.message === "object"
                    ? typeof alert.message[language] === "object"
                      ? (alert.message[language] as any)[language] ||
                        (alert.message[language] as any).ar
                      : alert.message[language] || alert.message.ar
                    : alert.message}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-3 h-3 text-egypt-gold" />
                      <span className="text-[8px] font-black uppercase text-zinc-500">
                        {isRtl ? "تعليمات" : "Instructions"}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold">
                      {typeof alert.instructions === "object"
                        ? typeof alert.instructions[language] === "object"
                          ? (alert.instructions[language] as any)[language] ||
                            (alert.instructions[language] as any).ar
                          : alert.instructions[language] ||
                            alert.instructions.ar
                        : alert.instructions}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Leaf className="w-3 h-3 text-emerald-500" />
                      <span className="text-[8px] font-black uppercase text-zinc-500">
                        {isRtl ? "تأثير الكربون" : "CO2 Impact"}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] font-black ${alert.co2Impact! > 0 ? "text-red-500" : "text-emerald-500"}`}
                    >
                      {alert.co2Impact! > 0 ? "+" : ""}
                      {alert.co2Impact} kg CO2
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-[8px] font-bold text-zinc-500 flex items-center gap-1">
                    Source:{" "}
                    <a
                      href={alert.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-egypt-gold hover:underline"
                    >
                      {alert.source.name}
                    </a>
                  </span>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {alert.location?.city &&
                      alert.location.city !== "National" &&
                      alert.location.city !== "All Egypt" && (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-egypt-gold/10 text-egypt-gold rounded-lg hover:bg-egypt-gold/20 transition-all">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase">
                            {alert.location.city}
                          </span>
                        </button>
                      )}
                    <button className="text-[8px] font-black uppercase text-egypt-gold hover:opacity-70 transition-all ml-auto sm:ml-0">
                      {isRtl ? "مشاركة التنبيه" : "Share Alert"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
