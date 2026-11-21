import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { AppContext, AppContextType, useApp } from "./context/AppContext";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Home as HomeIcon,
  Car,
  Zap,
  Droplets,
  Utensils,
  Plane,
  ShoppingBag,
  Target,
  Trophy,
  MessageSquare,
  FileText,
  Info,
  Menu,
  LogOut,
  ShieldCheck,
  LayoutGrid,
  Flame,
  Trash2,
  ShoppingCart,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Briefcase,
  Lock,
  Key,
  Terminal,
  AlertTriangle,
  TrendingUp,
  Globe,
  Award,
  Landmark,
  DollarSign,
  Users,
  Building2,
  ShieldAlert,
  BarChart3,
  Download,
  Footprints,
  Sword,
  Newspaper,
  Heart,
  Sprout,
  Navigation as NavigationIcon,
  Calculator as CalcIcon,
  BookOpen,
  HandHelping,
  Train,
  User as UserIcon,
  Bell,
  Ticket,
  Leaf,
  Activity,
  Fingerprint,
  X,
  Palmtree,
} from "lucide-react";
import { translations } from "./i18n";
import { Language, User, CarbonActivity } from "./types";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import BottomNav from "./components/BottomNav";
import { FloatingAIAssistant } from "./components/FloatingAIAssistant";
import { Onboarding } from "./components/Onboarding";
import SplashScreen from "./components/SplashScreen";
import { storageService } from "./services/storageService";
import { notificationService } from "./services/notificationService";
import { syncService } from "./services/syncService";
import { supabase, getSafeSession } from "./services/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { PageSkeleton } from "./components/Skeleton";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { FloatingAccessibilityButton } from "./components/FloatingAccessibilityButton";
import SignLanguageAssistant from "./components/SignLanguageAssistant";

import { errorLogger } from "./services/errorLogger";

// Initialize global error handling
errorLogger.initGlobalHandler();

// Lazy load pages
const NearbyPulse = React.lazy(() => import("./pages/NearbyPulse"));
const SustainHub = React.lazy(() => import("./pages/SustainHub"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Home = React.lazy(() => import("./pages/Home"));
const MapCenter = React.lazy(() => import("./pages/MapCenter"));

const GreenCommunity = React.lazy(() => import("./pages/GreenCommunity"));
const EnvironmentalMaps = React.lazy(() => import("./pages/EnvironmentalMaps"));
const About = React.lazy(() => import("./pages/About"));
const Reports = React.lazy(() => import("./pages/Reports"));
const EdgeAIHub = React.lazy(() => import("./pages/EdgeAIHub"));
const EcoTree = React.lazy(() => import("./pages/EcoTree"));

const GreenInvestment = React.lazy(() => import("./pages/GreenInvestment"));
const Login = React.lazy(() => import("./pages/Login"));
const Settings = React.lazy(() => import("./pages/Settings"));
const InvestorHub = React.lazy(() => import("./pages/InvestorHub"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Presentation = React.lazy(() => import("./pages/Presentation"));
const ClimateTrends = React.lazy(() => import("./pages/ClimateTrends"));
const GeographicAnalysis = React.lazy(
  () => import("./pages/GeographicAnalysis"),
);
const GreenEconomy = React.lazy(() => import("./pages/GreenEconomy"));
const AlertsAndEmergencies = React.lazy(
  () => import("./pages/AlertsAndEmergencies"),
);
const Transparency = React.lazy(() => import("./pages/Transparency"));
const Register = React.lazy(() => import("./pages/Register"));
const FamilyHub = React.lazy(() => import("./pages/FamilyHub"));
const GovDashboard = React.lazy(() =>
  import("./pages/GovDashboard").then((m) => ({ default: m.GovDashboard })),
);
const EmergencyServices = React.lazy(() => import("./pages/EmergencyServices"));

const EcoHeritage = React.lazy(() => import("./pages/EcoHeritage"));

const DigitalGov = React.lazy(() => import("./pages/DigitalGov"));
const EcoNews = React.lazy(() => import("./pages/EcoNews"));
const CommunityGardens = React.lazy(() => import("./pages/CommunityGardens"));
const AchievementHub = React.lazy(() => import("./pages/AchievementHub"));
const GreenResources = React.lazy(() => import("./pages/GreenResources"));
const GreenJobs = React.lazy(() => import("./pages/GreenJobs"));
const Profile = React.lazy(() => import("./pages/Profile"));

const TransportHub = React.lazy(() => import("./pages/TransportHub"));
const EcoWatch = React.lazy(() => import("./pages/EcoWatch"));
const CarbonPulse = React.lazy(() => import("./pages/CarbonPulse"));
const EcoStories = React.lazy(() => import("./pages/EcoStories"));

const AccessibilitySettings = React.lazy(
  () => import("./pages/AccessibilitySettings"),
);
const DailyServices = React.lazy(() => import("./pages/DailyServices"));
const PrayerTimes = React.lazy(() => import("./pages/PrayerTimes"));
const EcoNavigator = React.lazy(() => import("./pages/EcoNavigator"));
const EcoWallet = React.lazy(() => import("./pages/EcoWallet"));

const HealthCenter = React.lazy(() => import("./pages/HealthCenter"));
const ParkingFinder = React.lazy(() => import("./pages/ParkingFinder"));
const CitizenProfile = React.lazy(() => import("./pages/CitizenProfile"));

const NationalRationalization = React.lazy(
  () => import("./pages/NationalRationalization"),
);
const Methodology = React.lazy(() => import("./pages/Methodology"));
const CalculationRecords = React.lazy(
  () => import("./pages/CalculationRecords"),
);
const SmartLifeHub = React.lazy(() =>
  import("./pages/SmartLifeHub").then((m) => ({ default: m.SmartLifeHub })),
);

import { liveIntelEngine } from "./services/liveIntelEngine";
import { newsService } from "./services/newsService";
import { calculationEngine } from "./services/calculationEngine";
import { alertService } from "./services/alertService";
import { carbonDataService } from "./services/carbonDataService";
import { EcoAlert } from "./types";
import AlertBanner from "./components/AlertBanner";
import { GlobalEmergencyReceiver } from "./components/GlobalEmergencyReceiver";
import { MoEcoSmartIsland } from './components/MoEcoSmartIsland';
import InAppWebView from "./components/InAppWebView";
import { HUDOverlay } from "./components/HUDOverlay";

const MaintenanceScreen: React.FC = () => (
  <div className="fixed inset-0 z-[1000] bg-eco-light flex flex-col items-center justify-center p-10 text-center text-eco-green overflow-hidden">
    <div className="egyptian-pattern absolute inset-0 opacity-10" />
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 20px rgba(46,125,50,0.1)",
          "0 0 40px rgba(46,125,50,0.2)",
          "0 0 20px rgba(46,125,50,0.1)",
        ],
      }}
      transition={{ duration: 4, repeat: Infinity }}
      className="p-16 bg-white rounded-[3rem] border border-eco-green/10 relative"
    >
      <Sprout className="w-32 h-32 text-eco-green" />
      <div className="absolute inset-0 bg-eco-green/5 blur-3xl rounded-full" />
    </motion.div>

    <div className="mt-12 space-y-6">
      <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
        مو <span className="text-eco-green">إيكو</span>
      </h1>
      <p className="text-slate-500 max-w-md font-bold text-sm uppercase tracking-wider leading-relaxed">
        تحسينات جارية للنظام <br />
        نعمل من أجل بيئة مصرية أفضل
      </p>
    </div>

    <div className="mt-16 flex gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1.5 h-8 bg-eco-green/10 rounded-full overflow-hidden"
        >
          <motion.div
            animate={{ y: [-32, 32] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-full h-1/2 bg-eco-green"
          />
        </div>
      ))}
    </div>
  </div>
);

import NotificationCenter from "./components/NotificationCenter";

const Navigation: React.FC = () => {
  const { t, language, setUser, user, theme, setIsAdmin, isAdmin, isRtl } =
    useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nationalRank, setNationalRank] = useState<number | null>(null);
  const [carbonPulseValue, setCarbonPulseValue] = useState<string>("424.50");

  const fetchPulse = useCallback(async () => {
    try {
      const val = await storageService.getCarbonPulse(user?.id);
      setCarbonPulseValue(val);
    } catch (e) {
      console.warn("Could not fetch pulse", e);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 60000);
    return () => clearInterval(interval);
  }, [fetchPulse]);

  useEffect(() => {
    if (!user?.id) return;

    const profileSub = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const updatedUser = payload.new as any;
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  ...updatedUser,
                  name:
                    updatedUser.display_name ||
                    updatedUser.full_name ||
                    prev.name,
                  avatar: updatedUser.avatar_url || prev.avatar,
                }
              : updatedUser,
          );
        },
      )
      .subscribe();

    const carbonSub = supabase
      .channel(`carbon:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "carbon_footprint_logs",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchPulse(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consumption_records",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchPulse(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transport_logs",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchPulse(),
      )
      .subscribe();

    return () => {
      profileSub.unsubscribe();
      carbonSub.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    const fetchRank = async () => {
      if (user?.id && user?.points !== undefined) {
        try {
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .gt("points", user.points);

          setNationalRank((count || 0) + 1);
        } catch (e) {
          console.warn("Could not fetch national rank");
        }
      }
    };
    fetchRank();
  }, [user?.points, user?.id]);

  useEffect(() => {
    if (user) {
      const loadUnread = async () => {
        const notificationsData = await storageService.getNotifications();
        const notifications = notificationsData || [];
        if (notifications.length === 0) {
          await storageService.createNotification(
            user.id,
            "مرحباً بك في مو إيكو!",
            "Welcome to MoEco!",
            "نحن سعداء بوجودك معنا. استكشف التطبيق وابدأ في تقليل بصمتك الكربونية اليوم.",
            "We are happy to have you with us. Explore the app and start reducing your carbon footprint today.",
            "info",
          );
          const updated = await storageService.getNotifications();
          setUnreadCount(updated.filter((n) => !n.is_read).length);
        } else {
          setUnreadCount(notifications.filter((n) => !n.is_read).length);
        }
      };
      loadUnread();
      const interval = setInterval(loadUnread, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const clickCountRef = useRef(0);
  const clickTimeout = useRef<any>(null);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimeout.current) clearTimeout(clickTimeout.current);

    if (clickCountRef.current >= 3) {
      // 1. Force Admin check based on email AND role
      const isOwner = user?.email === "mohamedostafataher@gmail.com";
      const isAdminRole = [
        "gov_admin",
        "sector_admin",
        "supervisor",
        "admin",
      ].includes(user?.role || "");

      if (isAdminRole || isOwner) {
        // If owner but role not set, update it locally for this session
        if (isOwner && !isAdminRole && user) {
          const updatedUser = { ...user, role: "admin" as any };
          setUser(updatedUser);
          storageService.saveUser(updatedUser);
        }

        setIsAdmin(true);
        localStorage.setItem("moeco_is_admin", "true");
        navigate("/admin");
        notificationService.success(
          language === "ar"
            ? "أهلاً بك يا مدير النظام - تم الدخول"
            : "Welcome Admin - Control Center access granted",
        );
      } else {
        notificationService.error(
          language === "ar"
            ? "عذراً، هذا الحساب ليس له صلاحيات إدارية"
            : "Access Denied: Admin role required",
        );
      }
      clickCountRef.current = 0;
      return;
    }

    clickTimeout.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1000);
  };

  const navItems = [
    { path: "/", label: t("home"), icon: HomeIcon },
    {
      path: "/dashboard",
      label: language === "ar" ? "لوحة المراقبة" : "Dashboard",
      icon: Activity,
    },
    {
      path: "/profile",
      label: language === "ar" ? "حسابي" : "My Account",
      icon: UserIcon,
    },
    {
      label: language === "ar" ? "التحول الرقمي" : "Digital Hub",
      icon: Terminal,
      items: [
        {
          path: "/digital-gov",
          label: language === "ar" ? "البوابة الرسمية" : "Citizen Hub",
          icon: Landmark,
        },
        {
          path: "/daily-missions",
          label: language === "ar" ? "المهمات اليومية" : "Daily Missions",
          icon: Zap,
        },
      ],
    },
    {
      label: language === "ar" ? "توفيرك وأثرك" : "Savings & Impact",
      icon: Zap,
      items: [
        {
          path: "/resources",
          label: language === "ar" ? "الموارد والغذاء" : "Green Resources",
          icon: Zap,
        },
        {
          path: "/calculator",
          label: language === "ar" ? "حاسبة الكربون" : "Carbon Calculator",
          icon: CalcIcon,
        },
        {
          path: "/sustain-hub",
          label: language === "ar" ? "مركز الاستدامة" : "Sustain Hub",
          icon: TrendingUp,
        },
        {
          path: "/reports",
          label:
            language === "ar" ? "التقارير والشهادات" : "Reports & Certificates",
          icon: FileText,
        },
      ],
    },
    {
      label: language === "ar" ? "المجتمعات المباشرة" : "Live Communities",
      icon: Users,
      items: [
        {
          path: "/nearby-pulse",
          label: language === "ar" ? "نبض الأماكن" : "Nearby Pulse",
          icon: Activity,
        },
        {
          path: "/community",
          label: language === "ar" ? "المجتمع الأخضر" : "Green Community",
          icon: Users,
        },
        {
          path: "/family",
          label: language === "ar" ? "بيت العائلة" : "Family Hub",
          icon: Heart,
        },
        {
          path: "/achievements",
          label: language === "ar" ? "منصة الإنجازات" : "Achievement Hub",
          icon: Sword,
        },
      ],
    },
    {
      label: language === "ar" ? "بيئة ذكية" : "Smart Eco",
      icon: Sprout,
      items: [
        {
          path: "/green-economy",
          label: language === "ar" ? "سوق المكافآت" : "Green Economy",
          icon: Ticket,
        },
        {
          path: "/eco-heritage",
          label: language === "ar" ? "السياحة والتراث" : "Eco-Heritage",
          icon: Palmtree,
        },
        {
          path: "/eco-news",
          label: language === "ar" ? "أخبار البيئة" : "Eco News",
          icon: Newspaper,
        },
        {
          path: "/transport-hub",
          label: language === "ar" ? "النقل المستدام" : "Eco Transport",
          icon: Train,
        },
        {
          path: "/community-gardens",
          label: language === "ar" ? "حدائق المجتمع" : "Gardens",
          icon: Sprout,
        },
        {
          path: "/green-jobs",
          label: language === "ar" ? "وظائف خضراء" : "Green Jobs",
          icon: Briefcase,
        },
        {
          path: "/eco-watch",
          label: language === "ar" ? "بلاغات الخبراء" : "Eco Watch",
          icon: ShieldAlert,
        },
        {
          path: "/emergency",
          label: language === "ar" ? "تنبيهات الطوارئ" : "Emergency Alerts",
          icon: ShieldAlert,
        },
      ],
    },
    {
      label: language === "ar" ? "أدوات حكومية" : "Gov Tools",
      icon: Landmark,
      items: [
        {
          path: "/sustain-hub?tab=city",
          label: language === "ar" ? "لوحة تحكم المدينة" : "City Dashboard",
          icon: Building2,
        },
        {
          path: "/digital-gov?tab=transparency",
          label: language === "ar" ? "الشفافية" : "Transparency",
          icon: ShieldCheck,
        },
        {
          path: "/trends",
          label: language === "ar" ? "حالة المدينة" : "City Status",
          icon: Activity,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 h-16 md:h-20 flex items-center px-4 md:px-10 justify-between bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 transition-all">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 md:gap-8 relative z-10">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 md:p-3 bg-white/5 hover:bg-emerald-500/20 rounded-xl md:rounded-2xl border border-white/10 transition-all group shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-95"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>

          <div
            onClick={handleLogoClick}
            className="cursor-pointer flex items-center gap-2 md:gap-3 select-none active:scale-95 transition-all group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity" />
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform relative z-10">
                <Leaf className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black tracking-tight text-white leading-none">
                MoEco
              </span>
              <span className="text-[8px] md:text-[10px] font-bold text-eco-green uppercase tracking-wider mt-0.5">
                Egypt 2026
              </span>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 backdrop-blur-3xl rounded-full border border-emerald-500/20 group hover:border-emerald-500/50 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">
                {language === "ar" ? "البصمة" : "FOOTPRINT"}
              </span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-xs font-black tabular-nums text-emerald-400">
              {carbonPulseValue}{" "}
              <span className="text-[9px] opacity-60">KG</span>
            </span>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 backdrop-blur-3xl rounded-full border border-amber-500/20 group hover:border-amber-500/50 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest">
                {language === "ar" ? "النقاط" : "POINTS"}
              </span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-xs font-black tabular-nums text-amber-400">
              {user?.points || 0}{" "}
              <span className="text-[9px] opacity-60">PTS</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-xl md:rounded-2xl border border-slate-100 transition-all relative group"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-eco-green transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            )}
          </button>

          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200]"
            />
            <motion.aside
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              className={`fixed top-0 bottom-0 z-[201] w-80 bg-white border-slate-100 border-r shadow-2xl overflow-y-auto ${isRtl ? "right-0" : "left-0"}`}
            >
              <div className="egyptian-pattern absolute inset-0 opacity-5" />
              <div className="p-10 border-b border-slate-50 space-y-10 relative">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-[1.8rem] overflow-hidden border-2 border-eco-green/20 group-hover:border-eco-green transition-colors bg-slate-50">
                      <img
                        src={
                          user?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
                        }
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-eco-green rounded-full border-4 border-white shadow-lg" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-eco-green uppercase tracking-wider leading-none mb-1">
                      المستوى {user?.level || 1}
                    </span>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight truncate max-w-[140px] leading-none">
                      {user?.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 bg-eco-green/5 rounded-[2rem] border border-eco-green/10 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>مستوى الإنجاز</span>
                    <span className="text-eco-green">نشط</span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (user?.points || 0) % 100)}%`,
                      }}
                      className="h-full bg-eco-green"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                    <span>{user?.points || 0} نقطة</span>
                    <span>الترتيب: #{nationalRank || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8 pb-32 relative">
                {navItems.map((group, idx) => (
                  <div key={idx} className="space-y-3">
                    {group.path ? (
                      <Link
                        to={group.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-5 px-6 py-4 rounded-[1.5rem] font-bold text-sm transition-all group ${
                          location.pathname === group.path
                            ? "bg-eco-green text-white shadow-lg shadow-eco-green/20"
                            : "text-slate-600 hover:text-eco-green hover:bg-eco-green/5"
                        }`}
                      >
                        <group.icon
                          className={`w-5 h-5 ${location.pathname === group.path ? "text-white" : "text-slate-400 group-hover:text-eco-green"}`}
                        />
                        <span className="relative z-10">{group.label}</span>
                      </Link>
                    ) : (
                      <div className="space-y-3">
                        <p className="px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {group.label}
                        </p>
                        <div className="space-y-1">
                          {group.items?.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-5 px-6 py-3 rounded-[1.2rem] font-medium text-xs transition-all group ${
                                location.pathname === item.path
                                  ? "text-eco-green bg-eco-green/5"
                                  : "text-slate-500 hover:text-eco-green hover:bg-eco-green/5"
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-8 border-t border-slate-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-5 px-8 py-4 rounded-[1.5rem] bg-rose-50 text-rose-500 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: any) {
    console.error("App Crash:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#000504] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 border border-red-500/50">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-zinc-500 text-sm max-w-md mb-8">
            The application encountered an unexpected error. We've been notified
            and are working on it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-egypt-gold text-black font-black rounded-2xl hover:scale-105 transition-transform"
          >
            Reload Application
          </button>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-8 p-4 bg-black/50 rounded-xl text-red-400 text-left text-[10px] overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const {
    user,
    setUser,
    language,
    theme,
    isAdmin,
    appConfig,
    refreshGlobalData,
  } = useApp();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [userCountry, setUserCountry] = useState<string>(
    localStorage.getItem("moeco_country") || "EG",
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState<EcoAlert | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const location = useLocation();
  const isRtl = language === "ar";

  const getScreenName = (path: string) => {
    const names: Record<string, string> = {
      "/": isRtl ? "الرئيسية" : "Home",
      "/transport-hub": isRtl ? "مركز النقل" : "Transport Hub",
      "/calculator": isRtl ? "حاسبة الكربون" : "Carbon Calculator",
      "/smart-gov": isRtl ? "الخدمات الذكية" : "Smart Gov",
      "/map-center": isRtl ? "مركز الخرائط" : "Map Center",
      "/profile": isRtl ? "الملف الشخصي" : "Profile",
      "/accessibility-settings": isRtl
        ? "إعدادات الوصول"
        : "Accessibility Settings",
    };
    return names[path] || (isRtl ? "التطبيق" : "App");
  };

  const refreshUserProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const profile = await storageService.getUserProfile(user.id);
      if (profile) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                ...profile,
                name: profile.full_name || profile.display_name || prev.name,
                avatar: profile.avatar_url || prev.avatar,
                points: profile.points || prev.points,
                level: profile.level || prev.level,
              }
            : null,
        );
      }
    } catch (e) {
      console.error("User profile refresh failed:", e);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleOnline = () => {
      notificationService.success(
        isRtl ? "تم استعادة الاتصال" : "Connection restored",
      );
      refreshUserProfile();
    };
    const handleOffline = () => {
      notificationService.warning(
        isRtl
          ? "انقطع الاتصال، جاري العمل في الوضع غير المتصل"
          : "Connection lost, working in offline mode",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isRtl, refreshGlobalData]);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initApp = async () => {
      const fetchSession = async () => {
        try {
          const sessionTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Session Timeout")), 4000),
          );
          const sessionResult = (await Promise.race([
            getSafeSession(),
            sessionTimeout,
          ])) as any;

          if (sessionResult?.user) {
            // Background fetch profile to not block splash screen
            storageService
              .getUserProfile(sessionResult.user.id)
              .then(async (profile) => {
                let finalProfile = profile;
                if (!profile) {
                  // Auto-create profile if missing
                  console.log("No profile found, creating initial record...");
                  finalProfile = await storageService.syncUserToSupabase(
                    sessionResult.user,
                  );
                }

                if (finalProfile) {
                  const refreshedUser: User = {
                    ...sessionResult.user,
                    name:
                      finalProfile.display_name ||
                      finalProfile.full_name ||
                      sessionResult.user.user_metadata?.full_name ||
                      "Eco User",
                    avatar:
                      finalProfile.avatar_url ||
                      sessionResult.user.user_metadata?.avatar_url,
                    points:
                      finalProfile.green_points || finalProfile.points || 0,
                    green_coins: finalProfile.green_coins || 0,
                    level: finalProfile.level || 1,
                    role: finalProfile.role || "user",
                    governorate: finalProfile.governorate,
                  } as any;
                  setUser(refreshedUser);
                  storageService.saveUser(refreshedUser);
                }
              })
              .catch((e) =>
                console.warn("Background profile fetch failed:", e),
              );

            // Set initial user if we have session metadata
            setUser(sessionResult.user);
          }
        } catch (e: any) {
          console.warn("Fast session check skipped profile sync:", e.message);
        }
      };

      await fetchSession();
      setIsAppReady(true);
      storageService.setLoadTime();
    };

    initApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Supabase Auth] Event: ${event}`);
      if (session?.user) {
        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION"
        ) {
          const profile = await storageService.getUserProfile(session.user.id);
          const isOwner = session.user.email === "mohamedostafataher@gmail.com";

          const enrichedUser: User = {
            ...session.user,
            name:
              profile?.display_name ||
              profile?.full_name ||
              session.user.user_metadata?.full_name ||
              "User",
            avatar:
              profile?.avatar_url || session.user.user_metadata?.avatar_url,
            points: profile?.points || 0,
            level: profile?.level || 1,
            role: isOwner ? "admin" : profile?.role || "user",
          } as any;
          setUser(enrichedUser);
          storageService.saveUser(enrichedUser);
          localStorage.setItem("moeco_user_id", session.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("moeco_user_id");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAppReady) return;

    // 1. GLOBAL EMERGENCY OVERRIDE SYSTEM
    // Listens for alerts globally and pushes to FIFO queue
    const alertSub = supabase
      .channel("global_emergency")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          liveIntelEngine.processNewAlert(payload.new);
        },
      )
      .subscribe();

    // 2. NEWS ENGINE BACKGROUND TICKER
    // Simulates an edge function running every 5 minutes (30s for demo)
    const newsTicker = setInterval(() => {
      newsService.processLiveEngine();
    }, 30000);

    return () => {
      supabase.removeChannel(alertSub);
      clearInterval(newsTicker);
    };
  }, [isAppReady]);

  useEffect(() => {
    const checkAlerts = async () => {
      if (user && isAppReady) {
        try {
          const alerts = await alertService.fetchAlerts();
          const critical = alerts.find(
            (a) =>
              a.severity === "Extreme Emergency" ||
              a.severity === "Danger" ||
              a.severity === "Critical",
          );
          if (critical) {
            setCriticalAlert(critical);
          } else {
            setCriticalAlert(null);
          }
        } catch (e) {
          console.error("Error checking alerts:", e);
        }
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);

    // Global Realtime Alert Subscription for Push/Notifications
    const subscription = alertService.subscribeToAlerts((payload) => {
      const newAlert = payload.new as any;
      // Handle both possible structures (DB direct vs normalized)
      const isCritical =
        newAlert.severity === "Critical" || newAlert.severity === "High";
      const isActive = newAlert.is_active !== false;

      if (isActive && isCritical) {
        const alertTitle =
          language === "ar"
            ? newAlert.title_ar || newAlert.title?.ar || newAlert.title
            : newAlert.title_en || newAlert.title?.en || newAlert.title;

        const alertMsg =
          language === "ar"
            ? newAlert.message_ar ||
              newAlert.description_ar ||
              newAlert.message?.ar ||
              newAlert.description
            : newAlert.message_en ||
              newAlert.description_en ||
              newAlert.message?.en ||
              newAlert.description;

        notificationService.sendMultiChannelAlert({
          title: alertTitle,
          message: alertMsg,
          severity: newAlert.severity,
        });

        if (newAlert.severity === "Critical") {
          // Wrap in structure if needed for setCriticalAlert(EcoAlert)
          const structuredAlert: any = {
            ...newAlert,
            title:
              typeof newAlert.title === "object"
                ? newAlert.title
                : {
                    ar: newAlert.title_ar || newAlert.title,
                    en: newAlert.title_en || newAlert.title,
                  },
            message:
              typeof newAlert.message === "object"
                ? newAlert.message
                : {
                    ar:
                      newAlert.message_ar ||
                      newAlert.description_ar ||
                      newAlert.message,
                    en:
                      newAlert.message_en ||
                      newAlert.description_en ||
                      newAlert.message,
                  },
          };
          setCriticalAlert(structuredAlert);
        }
      }
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [user, isAppReady, language]);

  useEffect(() => {
    const init = async () => {
      if (!isAppReady) return;

      try {
        if (Capacitor.isNativePlatform()) {
          await StatusBar.setStyle({
            style: theme === "dark" ? Style.Dark : Style.Light,
          });
        }
        notificationService.init();
        // Background sync
        setTimeout(() => syncService.startAutoSync(), 5000);
      } catch (e) {
        console.warn("Capacitor/Services init error:", e);
      }

      if (!storageService.isOnboardingCompleted()) {
        setShowOnboarding(true);
      }
    };

    init();
  }, [theme, isAppReady]);

  useEffect(() => {
    setIsMaintenance(false);
  }, [appConfig, isAdmin]);

  useEffect(() => {
    const initData = async () => {
      if (user && isAppReady) {
        try {
          // Seed data in background after startup
          setTimeout(() => storageService.seedInitialData(), 3000);

          // Initialize RSS background sync every 20 minutes across the app
          const syncRSS = async () => {
            try {
              const { rssFallbackService } =
                await import("./services/rssFallbackService");
              await rssFallbackService.syncFallback();
            } catch (e) {
              console.error("Background RSS Sync failed", e);
            }
          };

          // Initial sync 10s after app starts
          setTimeout(syncRSS, 10000);

          // Then every 20 minutes
          const rssInterval = setInterval(syncRSS, 20 * 60 * 1000);
          return () => clearInterval(rssInterval);
        } catch (error) {
          console.error("Error seeding data:", error);
        }
      }
    };
    const cleanup = initData();
    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, [user, isAppReady]);

  const handleOnboardingComplete = () => {
    storageService.setOnboardingCompleted();
    setShowOnboarding(false);
  };

  const handleSkip = React.useCallback(() => {
    setIsAppReady(true);
  }, []);

  if (!isAppReady) return <SplashScreen onSkip={handleSkip} />;

  const renderAppContent = () => {
    if (isMaintenance) return <MaintenanceScreen />;
    if (showOnboarding)
      return <Onboarding onComplete={handleOnboardingComplete} />;

    return (
      <div
        className={`min-h-screen flex flex-col bg-slate-950 transition-colors duration-500 overflow-x-hidden ${isRtl ? "rtl" : "ltr"}`}
      >
        <div className="scanline" />
        <div className="flex-grow flex flex-col w-full max-w-[1440px] mx-auto relative bg-slate-900 shadow-2xl min-h-screen border-x border-white/5">
          <HUDOverlay />
          <AlertBanner />
          <GlobalEmergencyReceiver />
          <Navigation />
          <MoEcoSmartIsland />

          <AnimatePresence></AnimatePresence>

          <main className="flex-grow pt-24 md:pt-32 pb-24 md:pb-32 px-3 md:px-6 safe-area-inset">
            <div className="w-full h-full">
              <React.Suspense fallback={<PageSkeleton />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={window.location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route
                        path="/home"
                        element={<Navigate to="/" replace />}
                      />
                      <Route
                        path="/smart-life/:tab"
                        element={<SmartLifeHub />}
                      />
                      <Route
                        path="/smart-life"
                        element={<Navigate to="/smart-life/economy" replace />}
                      />
                      <Route path="/nearby-pulse" element={<NearbyPulse />} />
                      <Route path="/transport-hub" element={<TransportHub />} />
                      <Route path="/calculator" element={<CarbonPulse />} />
                      <Route path="/profile" element={<CitizenProfile />} />
                      {/* ... other routes ... */}
                      <Route path="/map-center" element={<MapCenter />} />
                      <Route
                        path="/neighborhood-wars"
                        element={
                          <Navigate
                            to="/achievements?tab=territories"
                            replace
                          />
                        }
                      />
                      <Route
                        path="/daily-missions"
                        element={
                          <Navigate to="/achievements?tab=missions" replace />
                        }
                      />
                      <Route
                        path="/achievements"
                        element={<AchievementHub />}
                      />
                      <Route path="/resources" element={<GreenResources />} />
                      <Route
                        path="/citizen-hub"
                        element={<Navigate to="/digital-gov" replace />}
                      />
                      <Route path="/digital-gov" element={<DigitalGov />} />
                      <Route path="/stories" element={<EcoStories />} />
                      <Route
                        path="/smart-gov"
                        element={
                          <Navigate to="/digital-gov?tab=services" replace />
                        }
                      />
                      <Route
                        path="/gov-simulator"
                        element={
                          <Navigate to="/digital-gov?tab=civic" replace />
                        }
                      />
                      <Route
                        path="/eco-food"
                        element={<Navigate to="/resources?tab=food" replace />}
                      />
                      <Route path="/eco-heritage" element={<EcoHeritage />} />
                      <Route
                        path="/digital-id"
                        element={
                          <Navigate to="/digital-gov?tab=services" replace />
                        }
                      />
                      <Route
                        path="/digital-neighbor"
                        element={
                          <Navigate to="/digital-gov?tab=audit" replace />
                        }
                      />
                      <Route
                        path="/civic-pulse"
                        element={
                          <Navigate to="/digital-gov?tab=civic" replace />
                        }
                      />
                      <Route path="/eco-news" element={<EcoNews />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route
                        path="/gov-services"
                        element={
                          <Navigate to="/digital-gov?tab=services" replace />
                        }
                      />
                      <Route
                        path="/community-gardens"
                        element={<CommunityGardens />}
                      />
                      <Route path="/green-jobs" element={<GreenJobs />} />
                      <Route
                        path="/meters"
                        element={
                          <Navigate to="/resources?tab=utility" replace />
                        }
                      />
                      <Route
                        path="/environmental-reporting"
                        element={<Navigate to="/eco-watch" replace />}
                      />
                      <Route path="/eco-watch" element={<EcoWatch />} />
                      <Route
                        path="/calculation-records"
                        element={<CalculationRecords />}
                      />
                      <Route path="/methodology" element={<Methodology />} />
                      <Route
                        path="/impact"
                        element={<Navigate to="/sustain-hub" replace />}
                      />
                      <Route path="/sustain-hub" element={<SustainHub />} />
                      <Route
                        path="/daily-services"
                        element={<DailyServices />}
                      />
                      <Route path="/prayer-times" element={<PrayerTimes />} />
                      <Route path="/eco-navigator" element={<EcoNavigator />} />
                      <Route path="/wallet" element={<EcoWallet />} />
                      <Route
                        path="/waste"
                        element={<Navigate to="/resources?tab=waste" replace />}
                      />
                      <Route path="/health" element={<HealthCenter />} />
                      <Route path="/parking" element={<ParkingFinder />} />
                      <Route
                        path="/city-dashboard"
                        element={
                          <Navigate to="/sustain-hub?tab=city" replace />
                        }
                      />
                      <Route
                        path="/eco-market"
                        element={<Navigate to="/green-economy" replace />}
                      />
                      <Route path="/green-economy" element={<GreenEconomy />} />
                      <Route
                        path="/coupons"
                        element={
                          <Navigate to="/green-economy?tab=coupons" replace />
                        }
                      />
                      <Route path="/trends" element={<ClimateTrends />} />
                      <Route
                        path="/analysis"
                        element={<GeographicAnalysis />}
                      />
                      <Route
                        path="/family"
                        element={<FamilyHub language={language} />}
                      />
                      <Route
                        path="/emergency"
                        element={<AlertsAndEmergencies language={language} />}
                      />
                      <Route
                        path="/transparency"
                        element={
                          <Navigate
                            to="/digital-gov?tab=transparency"
                            replace
                          />
                        }
                      />
                      <Route
                        path="/rewards"
                        element={
                          <Navigate to="/green-economy?tab=rewards" replace />
                        }
                      />
                      <Route
                        path="/challenges"
                        element={
                          <Navigate to="/achievements?tab=challenges" replace />
                        }
                      />
                      <Route
                        path="/leaderboard"
                        element={
                          <Navigate
                            to="/achievements?tab=leaderboard"
                            replace
                          />
                        }
                      />
                      <Route path="/community" element={<GreenCommunity />} />
                      <Route path="/maps" element={<EnvironmentalMaps />} />
                      <Route
                        path="/audit"
                        element={
                          <Navigate
                            to="/digital-gov?tab=transparency"
                            replace
                          />
                        }
                      />
                      <Route path="/investment" element={<GreenInvestment />} />
                      <Route path="/edge-ai" element={<EdgeAIHub />} />
                      <Route path="/eco-tree" element={<EcoTree />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/investors" element={<InvestorHub />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route
                        path="/green-agriculture"
                        element={<Navigate to="/resources?tab=agri" replace />}
                      />
                      <Route
                        path="/performance"
                        element={
                          <Navigate to="/sustain-hub?tab=system" replace />
                        }
                      />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/presentation" element={<Presentation />} />
                      <Route
                        path="/accessibility-settings"
                        element={<AccessibilitySettings />}
                      />
                      <Route
                        path="/rationalization"
                        element={<NationalRationalization />}
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </motion.div>
                </AnimatePresence>
              </React.Suspense>
            </div>
          </main>

          <BottomNav />
          <FloatingAIAssistant />
        </div>
      </div>
    );
  };

  return (
    <AccessibilityProvider>
      <div
        className="flex-grow flex flex-col w-full h-full relative"
        id="moeco-app-root"
      >
        {renderAppContent()}
        <FloatingAccessibilityButton />
        <SignLanguageAssistant />
      </div>
    </AccessibilityProvider>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const userSession = storageService.getUser();
    return (
      (userSession?.language as Language) ||
      (localStorage.getItem("moeco_lang") as Language) ||
      "ar"
    );
  });
  const isRtl = language === "ar";
  const [user, setUser] = useState<User | null>(storageService.getUser());
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const userSession = storageService.getUser();
    return (
      (userSession?.theme as "light" | "dark") ||
      (localStorage.getItem("moeco_theme") as "light" | "dark") ||
      "light"
    );
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("moeco_is_admin") === "true";
  });
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    if (
      user &&
      ["admin", "gov_admin", "sector_admin", "supervisor"].includes(
        user.role || "",
      )
    ) {
      setIsAdmin(true);
      localStorage.setItem("moeco_is_admin", "true");
    } else if (user) {
      setIsAdmin(false);
      localStorage.setItem("moeco_is_admin", "false");
    }
  }, [user?.role]);
  const [fontSize, setFontSize] = useState(() => {
    const userSession = storageService.getUser();
    return (
      userSession?.font_size ||
      Number(localStorage.getItem("moeco_font_size")) ||
      16
    );
  });
  const [highContrast, setHighContrast] = useState(() => {
    const userSession = storageService.getUser();
    if (userSession?.high_contrast !== undefined)
      return userSession.high_contrast;
    return localStorage.getItem("moeco_high_contrast") === "true";
  });

  const logout = async () => {
    try {
      await storageService.logout();
      setUser(null);
      window.location.href = "/";
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "ar" ? "ar-SA" : "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Attach a global click listener for Accessibility text-to-speech
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Only speak if accessibility mode TTS is toggled on
      const settingsStr = localStorage.getItem("accessibility_settings");
      let isTtsEnabled = false;
      if (settingsStr) {
        try {
          isTtsEnabled = JSON.parse(settingsStr).ttsEnabled !== false;
        } catch (e) {}
      } else {
        isTtsEnabled = true;
      }

      if (isTtsEnabled) {
        const target = e.target as HTMLElement;
        // Search for relevant text in target or its parent buttons
        const button = target.closest("button");
        const link = target.closest("a");
        const interactive = button || link;

        const textToSpeak =
          target.innerText ||
          target.getAttribute("aria-label") ||
          target.getAttribute("alt") ||
          (interactive
            ? interactive.innerText || interactive.getAttribute("aria-label")
            : "");

        if (textToSpeak) {
          speak(textToSpeak.trim());
        }

        // Vibration feedback on interactive elements
        if (interactive && "vibrate" in navigator) {
          navigator.vibrate(10);
        }
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [language]);

  // 5. PROACTIVE CONTEXT ASSISTANT (BEHAVIORAL INTELLIGENCE)
  useEffect(() => {
    if (!user) return;

    const runContextAudit = async () => {
      const hour = new Date().getHours();
      const lastAuditKey = "moeco_last_proactive_audit";
      const lastAudit = localStorage.getItem(lastAuditKey);
      const now = Date.now();

      // Only run once every 12 hours to avoid annoyance
      if (lastAudit && now - parseInt(lastAudit) < 12 * 60 * 60 * 1000) return;

      let msgAr = "";
      let msgEn = "";

      if (hour >= 0 && hour < 5) {
        msgAr =
          "الليل هادئ، هل أطفأت شواحن الهواتف؟ استهلاكها بسيط لكنه يتراكم.";
        msgEn = "Quiet night, did you unplug the chargers? idle power adds up.";
      } else if (hour >= 18 && hour < 22) {
        msgAr =
          "وقت الذروة بدأ! حاول تأجيل غسيل الملابس لما بعد العاشرة لتوفير المال.";
        msgEn =
          "Peak hours started! Try delaying laundry until after 10 PM to save money.";
      }

      if (msgAr) {
        setTimeout(() => {
          notificationService.info(language === "ar" ? msgAr : msgEn);
          speak(language === "ar" ? msgAr : msgEn);
          localStorage.setItem(lastAuditKey, now.toString());
        }, 5000);
      }
    };

    runContextAudit();
  }, [user, language]);

  const trackCarbon = async (
    activityType: string,
    sector: string,
    value: number,
    metadata?: any,
  ) => {
    if (!user) return;
    try {
      const engineCarbon = await calculationEngine.calculateCarbon(
        sector,
        value,
      );
      const carbonImpact =
        metadata?.co2_impact !== undefined && !isNaN(metadata.co2_impact)
          ? metadata.co2_impact
          : engineCarbon;

      const payload: CarbonActivity = {
        user_id: user.id,
        activity_type: activityType,
        sector,
        value: isNaN(value) ? 0 : value,
        carbon_impact: isNaN(carbonImpact) ? 0 : carbonImpact,
        metadata,
      };

      await storageService.logCarbonActivity(payload);

      // Refresh user state to reflect new points/level
      const updatedUser = storageService.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }

      console.log(
        `Carbon Tracked: ${activityType} | ${payload.carbon_impact}kg CO2`,
      );
    } catch (error) {
      console.error("Error tracking carbon:", error);
      throw error;
    }
  };

  useEffect(() => {
    localStorage.setItem("moeco_font_size", fontSize.toString());
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("moeco_high_contrast", highContrast.toString());
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  const [userCountry, setUserCountry] = useState<string>(() => {
    return localStorage.getItem("moeco_country") || "EG";
  });
  const [appConfig, setAppConfig] = useState<Record<string, any>>({});
  const [ads, setAds] = useState<any[]>([]);
  const [appStrings, setAppStrings] = useState<any[]>([]);

  // WebView state
  const [webView, setWebView] = useState<{ url: string; title: string } | null>(
    null,
  );

  const openWebView = (url: string, title: string) => {
    setWebView({ url, title });
  };

  const refreshGlobalData = useCallback(async () => {
    try {
      const [config, adsData, stringsData] = await Promise.all([
        storageService.getAppConfig(),
        storageService.getAds(),
        storageService.getAppStrings(),
        calculationEngine.init().catch(() => null),
      ]);
      setAppConfig(config || {});
      setAds(adsData || []);
      setAppStrings(stringsData || []);
    } catch (err) {
      console.error("Error refreshing global data:", err);
    }
  }, []);

  useEffect(() => {
    // Initial data load
    refreshGlobalData();
  }, [refreshGlobalData]);

  useEffect(() => {
    localStorage.setItem("moeco_is_admin", isAdmin.toString());
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem("moeco_lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("moeco_theme", theme);
    const root = document.documentElement;
    const body = document.body;
    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("moeco_country", userCountry);
  }, [userCountry]);

  useEffect(() => {
    // onAuthStateChange already handles INITIAL_SESSION by default in many versions,
    // but the app also uses isAppReady and initApp for the splash screen flow.
    // We keep the listener here but remove the redundant getSession call.

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await storageService.getUserProfile(session.user.id);
        const u = {
          ...session.user,
          ...profile,
          id: session.user.id,
          email: session.user.email,
          name:
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            "User",
          avatar:
            profile?.avatar_url ||
            session.user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
        };
        storageService.setCurrentUser(u);
        setUser(u as any);
      } else {
        storageService.setCurrentUser(null);
        setUser(null);
      }
    });

    const subscription = data?.subscription;

    const syncHandler = () => storageService.syncOfflineData();
    window.addEventListener("online", syncHandler);

    return () => {
      if (subscription) subscription.unsubscribe();
      window.removeEventListener("online", syncHandler);
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Check badges every few minutes or on load
      storageService.checkBadges(user.id);
    }
  }, [user?.id]);

  const t = (key: string) => {
    const remoteString = appStrings.find((s) => s.string_key === key);
    if (remoteString) {
      return remoteString[language] || remoteString.en || key;
    }
    return (translations[language] as any)[key] || key;
  };

  useEffect(() => {
    if (appConfig.global_theme) {
      const theme = appConfig.global_theme;
      if (theme.primary_color) {
        document.documentElement.style.setProperty(
          "--color-aeon-cyan",
          theme.primary_color,
        );
        document.documentElement.style.setProperty(
          "--color-egypt-gold",
          theme.primary_color,
        );
      }
      if (theme.font_family) {
        document.documentElement.style.setProperty(
          "--font-sans",
          `"${theme.font_family}", sans-serif`,
        );
      }
    }
  }, [appConfig]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  if (false && appConfig.global_theme?.maintenance_mode && !isAdmin) {
    return (
      <div className="min-h-screen bg-aeon-obsidian flex flex-center p-10 text-center">
        <div className="aeon-card p-12 max-w-md w-full space-y-8">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            {language === "ar" ? "النظام في وضع الصيانة" : "System Maintenance"}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {language === "ar"
              ? "نحن نقوم بتحديث النظام حالياً لتقديم تجربة أفضل. يرجى العودة لاحقاً."
              : "We are currently updating the system to provide a better experience. Please check back later."}
          </p>
          <div className="pt-6 border-t border-white/5">
            <p className="text-[10px] font-mono text-aeon-cyan uppercase tracking-widest">
              MO ECO Intelligence System
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        user,
        setUser,
        logout,
        t,
        theme,
        toggleTheme,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        speak,
        trackCarbon,
        isAdmin,
        setIsAdmin,
        userCountry,
        setUserCountry,
        appConfig,
        ads,
        isRtl,
        refreshGlobalData,
        appStrings,
        openWebView,
        isFocusMode,
        setIsFocusMode,
      }}
    >
      <ErrorBoundary>
        <AnimatePresence>
          {webView && (
            <InAppWebView
              url={webView.url}
              title={webView.title}
              onClose={() => setWebView(null)}
              language={language}
            />
          )}
        </AnimatePresence>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </ErrorBoundary>
    </AppContext.Provider>
  );
};

export default App;
