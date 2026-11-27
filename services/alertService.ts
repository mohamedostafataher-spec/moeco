import { supabase } from "./supabaseClient";
import { apiClient } from "./apiClient";
import { storageService } from "./storageService";
import { notificationService } from "./notificationService";
import { EcoAlert } from "../types";

// ==========================================
// 🧠 1. ADVANCED AI NLP ANALYZER ENGINE
// ==========================================
const AiAlertAnalyzer = {
  detectCategory(title: string, desc: string): string {
    const text = (title + " " + desc).toLowerCase();

    const categories = [
      {
        name: "Wars & Conflicts",
        regex:
          /(حرب|صاروخ|اشتباك|قصف|انفجار|هجوم|مسيرة|جيش|عسكري|war|missile|conflict|clash|bomb|attack|military)/i,
      },
      {
        name: "Weather",
        regex:
          /(طقس|عاصفة|رياح|حرارة|برد|صقيع|snow|weather|storm|heat|frost|wind)/i,
      },
      {
        name: "Energy",
        regex:
          /(كهرباء|انقطاع|طاقة|تيار|محطة طاقة|power|electricity|outage|grid)/i,
      },
      {
        name: "Water",
        regex: /(مياه|شرب|صرف|نهر|ترعة|water|drink|sewage|river)/i,
      },
      {
        name: "Environment",
        regex:
          /(بيئة|تلوث|انبعاثات|نفايات|pollution|environment|emissions|waste)/i,
      },
      { name: "Fires", regex: /(حريق|نار|دخان|إطفاء|fire|smoke|flame)/i },
      {
        name: "Transport",
        regex:
          /(مرور|طريق|حادث|مواصلات|مترو|قطار|traffic|road|accident|metro|train|transport)/i,
      },
      {
        name: "Health",
        regex:
          /(صحة|مستشفى|أوبئة|مرض|فيروس|إسعاف|health|hospital|epidemic|virus|ambulance)/i,
      },
      {
        name: "Earthquake",
        regex: /(زلزال|هزة|أرضية|earthquake|quake|tremor)/i,
      },
      { name: "Floods", regex: /(سيول|فيضان|غرق|flood|inundation)/i },
      {
        name: "Economy",
        regex:
          /(اقتصاد|أسعار|تضخم|عملة|سوق|economy|price|inflation|currency|market)/i,
      },
      { name: "Fuel", regex: /(وقود|بنزين|سولار|غاز|fuel|gas|petrol|diesel)/i },
      {
        name: "Tech",
        regex:
          /(إنترنت|اتصالات|تقنية|عطل|شبكة|internet|comms|tech|network|outage)/i,
      },
    ];

    for (const cat of categories) {
      if (cat.regex.test(text)) return cat.name;
    }
    return "Government";
  },

  detectPriority(
    text: string,
  ): "Low" | "Medium" | "Important" | "Danger" | "Extreme Emergency" {
    const txt = text.toLowerCase();
    if (
      /(extreme|كارثة|طوارئ قصوى|مدمر|زلزال مدمر|حرب شاملة|عاجل جدا)/i.test(txt)
    )
      return "Extreme Emergency";
    if (/(danger|خطر|حريق ضخم|اشتباكات عنيفة|تدمير|قتلى|وفيات)/i.test(txt))
      return "Danger";
    if (/(important|هام|عاجل|تحذير|انعقاد|أزمة)/i.test(txt)) return "Important";
    if (/(medium|متوسط|تأخير|عطل جزئي)/i.test(txt)) return "Medium";
    return "Low";
  },

  extractLocation(text: string): string {
    const txt = text.toLowerCase();
    const governorates = [
      "cairo",
      "giza",
      "alexandria",
      "sinai",
      "sharm",
      "luxor",
      "aswan",
      "qena",
      "sohag",
      "assiut",
      "minya",
      "beni suef",
      "fayoum",
      "red sea",
      "matrouh",
      "damietta",
      "port said",
      "ismailia",
      "suez",
      "القاهرة",
      "الجيزة",
      "الاسكندرية",
      "سيناء",
      "شرم",
      "الاقصر",
      "اسوان",
      "قنا",
      "سوهاج",
      "اسيوط",
      "المنيا",
      "بني سويف",
      "الفيوم",
      "البحر الاحمر",
      "مطروح",
      "دمياط",
      "بورسعيد",
      "الاسماعيلية",
      "السويس",
    ];

    for (const gov of governorates) {
      if (txt.includes(gov)) {
        if (gov === "القاهرة") return "Cairo";
        if (gov === "الجيزة") return "Giza";
        if (gov === "الاسكندرية") return "Alexandria";
        if (gov === "سيناء") return "Sinai";
        if (gov === "الاسماعيلية") return "Ismailia";
        if (gov === "السويس") return "Suez";
        if (gov === "بورسعيد") return "Port Said";
        if (gov === "البحر الاحمر") return "Red Sea";
        if (gov === "سوهاج") return "Sohag";
        if (gov === "اسوان") return "Aswan";
        return gov.charAt(0).toUpperCase() + gov.slice(1);
      }
    }
    return "National";
  },

  getSeverityScore(priority: string): number {
    switch (priority) {
      case "Extreme Emergency":
        return 100;
      case "Danger":
        return 85;
      case "Important":
        return 70;
      case "Medium":
        return 50;
      default:
        return 20;
    }
  },
};

// ==========================================
// 📂 2. AUTO SUPABASE TABLE DISCOVERY
// ==========================================
async function discoverValidTable(): Promise<string> {
  const candidateTables = [
    "alerts",
    "rss_alerts",
    "notifications",
    "emergency_alerts",
    "warning_logs",
    "disaster_reports",
  ];
  for (const table of candidateTables) {
    try {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (!error) {
        console.log(`[MoEco Auto-Discovery] Connected to table: ${table}`);
        return table;
      }
    } catch (e) {
      // ignore and try next
    }
  }
  return "alerts"; // Fallback
}

export const alertService = {
  fetchAlerts: async (): Promise<EcoAlert[]> => {
    try {
      // 1. Fetch from best available table
      const tableName = await discoverValidTable();
      let supabaseAlerts: any[] = [];
      const { data, error } = await supabase
        .from(tableName)
        .select("*") // we might not have `news:news_id` in all fallback tables, so we do simple select
        .order("created_at", { ascending: false })
        .limit(30);

      const cleanText = (text: string) => {
        if (!text) return { clean: "", url: null };
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const url = text.match(urlRegex)?.[0] || null;
        const clean = text.replace(urlRegex, "").trim();
        return { clean, url };
      };

      if (!error && data) {
        supabaseAlerts = data.map((row: any) => {
          const parsedTitleAr = cleanText(
            row.title_ar || row.title_en || row.title || "",
          );
          const parsedTitleEn = cleanText(
            row.title_en || row.title_ar || row.title || "",
          );
          const parsedDescAr = cleanText(
            row.description_ar ||
              row.message_ar ||
              row.description ||
              row.message ||
              "",
          );
          const parsedDescEn = cleanText(
            row.description_en ||
              row.message_en ||
              row.description_ar ||
              row.message_ar ||
              "",
          );

          const combinedText = parsedTitleAr.clean + " " + parsedDescAr.clean;
          const detectedCategory = AiAlertAnalyzer.detectCategory(
            parsedTitleAr.clean,
            parsedDescAr.clean,
          );
          const detectedPriority = AiAlertAnalyzer.detectPriority(combinedText);
          const severityScore =
            AiAlertAnalyzer.getSeverityScore(detectedPriority);

          return {
            id: row.id,
            category: row.category || detectedCategory,
            severity: (row.severity
              ? row.severity.charAt(0).toUpperCase() + row.severity.slice(1)
              : detectedPriority) as any,
            severityScore: severityScore,
            co2Impact: 0,
            title: {
              ar:
                parsedTitleAr.clean.length > 3
                  ? parsedTitleAr.clean
                  : "إنذار جديد",
              en:
                parsedTitleEn.clean.length > 3
                  ? parsedTitleEn.clean
                  : "New Alert",
            },
            message: {
              ar:
                parsedDescAr.clean.length > 3
                  ? parsedDescAr.clean
                  : "تفاصيل الإنذار غير متوفرة نصياً، يرجى مراجعة الرابط.",
              en:
                parsedDescEn.clean.length > 3
                  ? parsedDescEn.clean
                  : "Details not available in text. Please see external link.",
            },
            instructions: {
              ar: "يرجى توخي الحذر ومتابعة التحديثات الرسمية.",
              en: "Please exercise caution and follow official updates.",
            },
            location: {
              country: "Egypt",
              city:
                row.governorate ||
                AiAlertAnalyzer.extractLocation(combinedText),
            },
            affectedPopulation: 0, // unknown: never invent numbers
            timestamp: new Date(row.created_at).getTime(),
            source: {
              name: "National Alert System",
              url: parsedDescAr.url || parsedTitleAr.url || "#",
            },
            isRealTime: true,
            created_at: row.created_at,
          };
        });
      }

      // 2. Fetch User Specific Notifications
      let userAlerts: any[] = [];
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (!userError && userData) {
            userAlerts = userData.map((row) => ({
              id: row.id,
              category: row.category,
              severity: row.severity,
              severityScore: row.severity === "critical" ? 95 : 50,
              co2Impact: 0,
              title: { ar: row.title_ar, en: row.title_en || row.title_ar },
              message: {
                ar: row.message_ar,
                en: row.message_en || row.message_ar,
              },
              instructions: {
                ar: "يرجى مراجعة ملفك الشخصي",
                en: "Please check your profile",
              },
              location: { country: "Egypt", city: "Personal" },
              affectedPopulation: 1,
              timestamp: new Date(row.created_at).getTime(),
              source: { name: "MoEco Engine", url: row.action_url || "#" },
              isRealTime: true,
              created_at: row.created_at,
              isPersonal: true,
              isRead: row.is_read,
            }));
          }
        }
      } catch (err) {
        console.warn("User notification error:", err);
      }

      // 3. ReliefWeb Emergency Alerts (Global/Egypt)
      let reliefAlerts: any[] = [];
      try {
        const reliefRes = await fetch(
          "https://api.reliefweb.int/v1/reports?appname=moeco&query[value]=country.name:Egypt&limit=5&sort[]=date:desc&profile=full",
        );
        if (reliefRes.ok) {
          const rData = await reliefRes.json();
          if (rData.data) {
            reliefAlerts = rData.data.map((f: any) => {
              const combined = f.fields.title + " " + (f.fields.body || "");
              const cat = AiAlertAnalyzer.detectCategory(
                f.fields.title,
                f.fields.body || "",
              );
              let prio = AiAlertAnalyzer.detectPriority(combined);
              if (prio === "Low") prio = "Important"; // ReliefWeb is usually at least important
              return {
                id: `rw-${f.id}`,
                category: cat,
                severity: prio,
                severityScore: AiAlertAnalyzer.getSeverityScore(prio),
                co2Impact: 0,
                title: { ar: f.fields.title, en: f.fields.title }, // Fallback since it's EN
                message: { ar: f.fields.title, en: f.fields.title },
                instructions: {
                  ar: "تابع تحديثات ReliefWeb",
                  en: "Follow ReliefWeb updates",
                },
                location: {
                  country: "Egypt",
                  city: AiAlertAnalyzer.extractLocation(combined),
                },
                affectedPopulation: 0,
                timestamp: new Date(f.fields.date.created).getTime(),
                source: { name: "ReliefWeb / UN", url: f.fields.url },
                isRealTime: true,
                created_at: f.fields.date.created,
              };
            });
          }
        }
      } catch (err) {
        console.warn("ReliefWeb fetch error", err);
      }

      // 4. Fetch from USGS Earthquakes (Free API, No Key)
      let earthquakeAlerts: any[] = [];
      try {
        const eqRes = await fetch(
          "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson",
        );
        if (eqRes.ok) {
          const eqData = await eqRes.json();
          // Only quakes near Egypt (lat 20-33, lon 24-38) from the last 72 hours; never global noise.
          earthquakeAlerts = (eqData.features || [])
            .filter((f: any) => {
              const [lon, lat] = f.geometry?.coordinates || [999, 999];
              return (
                lat >= 20 && lat <= 33 && lon >= 24 && lon <= 38 &&
                Date.now() - f.properties.time < 72 * 3600 * 1000
              );
            })
            .slice(0, 5)
            .map((f: any) => ({
              id: f.id,
              category: "environmental",
              severity:
                f.properties.mag >= 6.0
                  ? "Critical"
                  : f.properties.mag >= 5.0
                    ? "High"
                    : "Medium",
              severityScore:
                f.properties.mag >= 6.0
                  ? 95
                  : f.properties.mag >= 5.0
                    ? 80
                    : 60,
              co2Impact: 0,
              title: {
                ar: `هزة أرضية بقوة ${f.properties.mag}`,
                en: `Magnitude ${f.properties.mag} Earthquake`,
              },
              message: {
                ar: `تم رصد زلزال في منطقة: ${f.properties.place}`,
                en: `An earthquake was detected: ${f.properties.place}`,
              },
              instructions: {
                ar: "اتبع تعليمات السلامة المحلية.",
                en: "Follow local safety guidelines.",
              },
              location: { country: "Global", city: f.properties.place },
              affectedPopulation: 0,
              timestamp: f.properties.time,
              source: { name: "USGS API", url: f.properties.url },
              isRealTime: true,
              created_at: new Date(f.properties.time).toISOString(),
            }));
        }
      } catch (err) {
        console.warn("USGS API Error", err);
      }

      // Merge and sort
      return [
        ...userAlerts,
        ...supabaseAlerts,
        ...reliefAlerts,
        ...earthquakeAlerts,
      ].sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Critical failure in fetchAlerts:", e);
      return [];
    }
  },

  // Compatibility Aliases
  fetchAllAlerts: async () => ({ alerts: await alertService.fetchAlerts() }),
  getAlerts: async () => await alertService.fetchAlerts(),
  fetchRealTimeAlerts: async (_country?: string, _city?: string) =>
    await alertService.fetchAlerts(),
  subscribeToAlerts: (onUpdate: any) => {
    const unsub = alertService.subscribe(onUpdate);
    return { unsubscribe: unsub };
  },
  getSeverityColor: (severity: string) => {
    const styles = alertService.getSeverityStyles(severity);
    return `${styles.text} ${styles.bg} ${styles.border}`;
  },

  /**
   * Real-time subscription to alerts table or scientific_data
   */
  subscribe: (onUpdate: (alerts: EcoAlert[]) => void) => {
    const channel = supabase
      .channel("public_alerts_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        async () => {
          const freshAlerts = await alertService.fetchAlerts();
          onUpdate(freshAlerts);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scientific_data",
          filter: "category=eq.moeco_alert",
        },
        async () => {
          const freshAlerts = await alertService.fetchAlerts();
          onUpdate(freshAlerts);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Helper for UI colors based on severity
   */
  getSeverityStyles: (
    severity: string,
  ): { bg: string; text: string; border: string; icon: string } => {
    switch (severity.toLowerCase()) {
      case "critical":
        return {
          bg: "bg-rose-600/10 dark:bg-rose-600/20",
          text: "text-rose-600 dark:text-rose-500",
          border: "border-rose-500/30",
          icon: "bg-rose-600 text-white",
        };
      case "high":
        return {
          bg: "bg-orange-600/10 dark:bg-orange-600/20",
          text: "text-orange-600 dark:text-orange-500",
          border: "border-orange-500/30",
          icon: "bg-orange-600 text-white",
        };
      case "medium":
        return {
          bg: "bg-amber-600/10 dark:bg-amber-600/20",
          text: "text-amber-600 dark:text-amber-500",
          border: "border-amber-500/30",
          icon: "bg-amber-600 text-white",
        };
      default:
        return {
          bg: "bg-blue-600/10 dark:bg-blue-600/20",
          text: "text-blue-600 dark:text-blue-500",
          border: "border-blue-500/30",
          icon: "bg-blue-600 text-white",
        };
    }
  },

  triggerGlobalEmergency: (alert: EcoAlert) => {
    // Only trigger once per alert ID
    const triggeredStr = localStorage.getItem('moeco_triggered_global_alerts') || '[]';
    try {
        const triggered = JSON.parse(triggeredStr);
        if (triggered.includes(alert.id.toString())) return;
        triggered.push(alert.id.toString());
        // keep only last 50
        if (triggered.length > 50) triggered.shift();
        localStorage.setItem('moeco_triggered_global_alerts', JSON.stringify(triggered));
    } catch(e) {}

    notificationService.queueAlert({
        id: alert.id.toString(),
        title: { ar: alert.title.ar, en: alert.title.en },
        message: { ar: alert.message.ar, en: alert.message.en },
        severity: alert.severity as any,
        category: alert.category || 'emergency',
        instructions: alert.instructions
    });
  },

  playEmergencySound: (title: string, message: string, lang: string = "ar") => {
    try {
      if ("vibrate" in navigator) navigator.vibrate([700, 200, 700, 200, 700]);
      if ((window as any)._moecoSiren) {
        (window as any)._moecoSiren.pause();
      }
      const siren = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2862/2862-preview.mp3",
      );
      siren.volume = 1.0;
      siren.play().catch((e) => console.warn("Siren play failed", e));
      (window as any)._moecoSiren = siren;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const textToSpeech = `${lang === "ar" ? "تنبيه طارئ هام:" : "Important Emergency Alert:"} ${title}. ${message}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeech);
        utterance.lang = lang === "ar" ? "ar-SA" : "en-US";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Emergency audio failed", e);
    }
  },

  stopEmergencySound: () => {
    try {
      if ((window as any)._moecoSiren) {
        (window as any)._moecoSiren.pause();
        (window as any)._moecoSiren.currentTime = 0;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn("Stop audio failed", e);
    }
  },
};
