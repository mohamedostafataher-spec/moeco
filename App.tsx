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
  Accessibility,
} from "lucide-react";
import { translations } from "./i18n";
import { Language, User, CarbonActivity } from "./types";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { RouteTransition } from "./components/ui";
import BottomNav from "./components/BottomNav";
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
import {
  PrivacyConsentProvider,
  usePrivacyConsent,
} from "./context/PrivacyConsentContext";
import { ConsentGateModal } from "./components/ConsentGateModal";
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
const LocalMonitor = React.lazy(() => import("./pages/LocalMonitor"));
const SurplusFood = React.lazy(() => import("./pages/SurplusFood"));
const WaterSaving = React.lazy(() => import("./pages/WaterSaving"));
const HeatShadeMap = React.lazy(() => import("./pages/HeatShadeMap"));
const WasteToIncome = React.lazy(() => import("./pages/WasteToIncome"));
const MyHomeProfile = React.lazy(() => import("./pages/MyHomeProfile"));
const ComplaintAssistant = React.lazy(() => import("./pages/ComplaintAssistant"));
const LocalProjects = React.lazy(() => import("./pages/LocalProjects"));
const MoreHub = React.lazy(() => import("./pages/MoreHub"));
const PrivacyData = React.lazy(() => import("./pages/PrivacyData"));
const MyData = React.lazy(() => import("./pages/MyData"));
const OwnerAnalytics = React.lazy(() => import("./pages/OwnerAnalytics"));

import { liveIntelEngine } from "./services/liveIntelEngine";
import { newsService } from "./services/newsService";
import { calculationEngine } from "./services/calculationEngine";
import { alertService } from "./services/alertService";
import { EcoAlert } from "./types";
import AlertBanner from "./components/AlertBanner";
import { GlobalEmergencyReceiver } from "./components/GlobalEmergencyReceiver";
import InAppWebView from "./components/InAppWebView";

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

const NavigationShell: React.FC = () => {
  const { language, user, isRtl } = useApp();
  const { isOwnerAdmin } = usePrivacyConsent();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadUnread = async () => {
      try {
        const notifications = (await storageService.getNotifications()) || [];
        if (active) {
          setUnreadCount(notifications.filter((n) => !n.is_read).length);
        }
      } catch {
        // Ignore silent fetch errors
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  const clickCountRef = useRef(0);
  const clickTimeout = useRef<any>(null);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimeout.current) clearTimeout(clickTimeout.current);

    if (clickCountRef.current >= 3) {
      if (isOwnerAdmin) {
        navigate("/owner-stats");
        notificationService.success(
          language === "ar"
            ? "مرحبًا بالمالك - تم التحقق من الصلاحية عبر الخادم"
            : "Server-verified Owner Analytics access granted",
        );
      } else {
        notificationService.error(
          language === "ar"
            ? "عذرًا، الوصول لإحصاءات المالك يتطلب التحقق عبر جدول app_admins في الخادم"
            : "Access Denied: Server-side app_admins role required",
        );
      }
      clickCountRef.current = 0;
      return;
    }

    clickTimeout.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1000);
  };

  const primaryLinks = [
    { path: "/", label: isRtl ? "الرئيسية" : "Home", icon: HomeIcon },
    { path: "/my-home", label: isRtl ? "ملف بيتي" : "My Home", icon: Zap },
    {
      path: "/my-complaints",
      label: isRtl ? "شكواي ما تضيعش" : "Complaints",
      icon: FileText,
    },
    {
      path: "/local-projects",
      label: isRtl ? "مشروعي في منطقتي" : "Local Projects",
      icon: Building2,
    },
    {
      path: "/calculator",
      label: isRtl ? "حاسبة الأثر" : "Calculator",
      icon: CalcIcon,
    },
    { path: "/more", label: isRtl ? "المزيد" : "More", icon: Menu },
  ];

  return (
    <>
      {/* Desktop Sticky Sidebar (lg+) */}
      <aside
        aria-label={isRtl ? "القائمة الجانبية الرئيسية" : "Primary sidebar"}
        className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-e border-slate-200 sticky top-0 h-screen justify-between p-4 z-30"
      >
        <div className="space-y-6">
          <button
            type="button"
            onClick={handleLogoClick}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-start hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-lg font-extrabold text-slate-900 leading-none">
                MoEco
              </span>
              <span className="block text-[11px] font-semibold text-slate-500 mt-1">
                {isRtl ? "منصة الأثر البيئي" : "Environmental Hub"}
              </span>
            </div>
          </button>

          <nav className="space-y-1">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                      : "text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-emerald-700" : "text-slate-500"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <Link
            to="/profile"
            className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              location.pathname === "/profile"
                ? "bg-emerald-50 text-emerald-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <UserIcon className="w-4 h-4 shrink-0" />
            <span>{isRtl ? "حسابي" : "Profile"}</span>
          </Link>

          <Link
            to="/accessibility-settings"
            className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              location.pathname === "/accessibility-settings"
                ? "bg-emerald-50 text-emerald-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Accessibility className="w-4 h-4 shrink-0" />
            <span>{isRtl ? "سهولة الوصول" : "Accessibility"}</span>
          </Link>

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label={isRtl ? "الإشعارات" : "Notifications"}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center relative text-slate-700"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-600 rounded-full" />
              )}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </aside>

      {/* Mobile Compact Header (< lg) */}
      <header className="app-header lg:hidden sticky top-0 z-40"><div className="h-14 px-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 min-h-[44px]"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="text-start leading-tight">
            <span className="block text-base font-extrabold">MoEco</span>
            <span className="block text-[10px] opacity-80 font-semibold">{isRtl ? "بيئة مصر" : "Egypt Eco"}</span>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <Link
            to="/accessibility-settings"
            aria-label={isRtl ? "إعدادات سهولة الوصول" : "Accessibility"}
            className="hdr-btn"
          >
            <Accessibility className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            aria-label={isRtl ? "الإشعارات" : "Notifications"}
            className="hdr-btn relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-600 rounded-full" />
            )}
          </button>
          <LanguageSwitcher />
        </div>
      </div></header>

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
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
    setIsAdmin,
    appConfig,
    refreshGlobalData,
  } = useApp();
  const { isOwnerAdmin } = usePrivacyConsent();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [userCountry, setUserCountry] = useState<string>(
    localStorage.getItem("moeco_country") || "EG",
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState<EcoAlert | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const location = useLocation();
  const isRtl = language === "ar";

  useEffect(() => {
    setIsAdmin(isOwnerAdmin);
  }, [isOwnerAdmin, setIsAdmin]);

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
            role: profile?.role || "user",
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
        className={`min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden ${isRtl ? "rtl" : "ltr"}`}
      >
        <AlertBanner />
        <GlobalEmergencyReceiver />

        <div className="lg:flex min-h-screen max-w-[1440px] mx-auto">
          <NavigationShell />

          <div className="flex-1 min-w-0 flex flex-col">
            <main className="flex-grow px-4 py-5 md:px-8 md:py-7 pb-24 lg:pb-10">
              <div className="w-full h-full"><RouteTransition>
                <React.Suspense fallback={<PageSkeleton />}>
                  <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
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
                      <Route path="/local-monitor" element={<LocalMonitor />} />
                      <Route path="/surplus-food" element={<SurplusFood />} />
                      <Route path="/water-saving" element={<WaterSaving />} />
                      <Route path="/heat-shade-map" element={<HeatShadeMap />} />
                      <Route path="/waste-to-income" element={<WasteToIncome />} />
                      <Route path="/my-home" element={<MyHomeProfile />} />
                      <Route path="/my-complaints" element={<ComplaintAssistant />} />
                      <Route path="/local-projects" element={<LocalProjects />} />
                      <Route path="/more" element={<MoreHub />} />
                      <Route path="/privacy" element={<PrivacyData />} />
                      <Route path="/my-data" element={<MyData />} />
                      <Route path="/owner-stats" element={<OwnerAnalytics />} />
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
                        element={<AlertsAndEmergencies />}
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
                </React.Suspense>
              </RouteTransition></div>
            </main>

            <BottomNav />
          </div>
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
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
    // Admin privilege is strictly verified from server (app_admins table) inside PrivacyConsentProvider.
    localStorage.removeItem("moeco_is_admin");
  }, []);

  useEffect(() => {
    localStorage.setItem("moeco_lang", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
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

  if (appConfig.global_theme?.maintenance_mode && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {language === "ar" ? "النظام في وضع الصيانة" : "System Maintenance"}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            {language === "ar"
              ? "نحن نقوم بتحديث النظام حاليًا لتقديم تجربة أفضل. يرجى العودة لاحقًا."
              : "We are currently updating the system to provide a better experience. Please check back later."}
          </p>
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
          <PrivacyConsentProvider>
            <AppContent />
            <ConsentGateModal />
          </PrivacyConsentProvider>
        </HashRouter>
      </ErrorBoundary>
    </AppContext.Provider>
  );
};

export default App;
