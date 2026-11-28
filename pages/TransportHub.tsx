import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  Train,
  Bus,
  TrainFront,
  Compass,
  MapPin,
  Search,
  Clock,
  CreditCard,
  Leaf,
  Target,
  X,
  Ship,
  Bike,
  Info,
  Route,
  Map as MapIcon,
  ShieldAlert,
  ArrowRight,
  Activity,
  Loader2,
  Volume2,
  VolumeX,
  Car,
  Footprints,
  Star,
  History,
  ArrowLeftRight,
  CheckCircle,
  Eye,
  AlertCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../services/supabaseClient";
import { notificationService } from "../services/notificationService";
import { useAccessibility } from "../context/AccessibilityContext";
import { routingEngine } from "../services/routingEngine";
import {
  transportService,
  TransportRoute,
  TransportStation,
} from "../services/transportService";
import { storageService } from "../services/storageService";

// Fix Leaflet Icon default assets
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const transportModesDetails: Record<string, any> = {
  metro: {
    titleAr: "مترو القاهرة الكبرى",
    titleEn: "Great Cairo Metro System",
    linesAr: "الخط الأول (حلوان - المرج)، الخط الثاني (شبرا - المنيب)، الخط الثالث (الهايكستب - جامعة القاهرة)",
    linesEn: "Line 1 (Helwan - Marg), Line 2 (Shubra - Mounib), Line 3 (Adly Mansour - Cairo University)",
    frequencyAr: "كل ٣ دقائق",
    frequencyEn: "Every 3 minutes",
    costAr: "٨ - ٢٠ جنيه حسب عدد المحطات",
    costEn: "8 - 20 EGP based on stop tier",
    carbonAr: "٠.٠٢ كجم CO₂ لكل كم (وفر كربوني بنسبة ٨٨٪)",
    carbonEn: "0.02 kg CO₂/km (88% carbon savings vs. car)",
    startsAr: "حلوان / شبرا الخيمة / عدلي منصور",
    startsEn: "Helwan / Shubra / Adly Mansour",
    endsAr: "المرج الجديدة / المنيب / جامعة القاهرة",
    endsEn: "New Marg / El Mounib / Cairo Univ",
  },
  monorail: {
    titleAr: "مونوريل العاصمة الإدارية و٦ أكتوبر",
    titleEn: "Cairo Monorail Network",
    linesAr: "خط شرق النيل (الاستاد - العاصمة الإدارية)، خط غرب النيل (المهندسين - ٦ أكتوبر)",
    linesEn: "East Nile (Stadium - Adm. Capital), West Nile (Mohandessin - 6 Oct)",
    frequencyAr: "كل ٥ دقائق",
    frequencyEn: "Every 5 minutes",
    costAr: "٢٠ - ٤٠ جنيه",
    costEn: "20 - 40 EGP",
    carbonAr: "٠.٠١ كجم CO₂ لكل كم (وفر كربوني بنسبة ٩٤٪)",
    carbonEn: "0.01 kg CO₂/km (94% carbon savings vs. car)",
    startsAr: "محطة الاستاد / المهندسين",
    startsEn: "Al-Stadium / Mohandessin",
    endsAr: "العاصمة الإدارية الجديدة / مدينة ٦ أكتوبر",
    endsEn: "New Administrative Capital / 6 Oct City",
  },
  lrt: {
    titleAr: "القطار الكهربائي الخفيف (LRT)",
    titleEn: "Cairo Light Rail Transit (LRT)",
    linesAr: "عدلي منصور - بدر - العاصمة الإدارية - العبور - الشروق - هليوبوليس الجديدة",
    linesEn: "Adly Mansour - Badr - Adm. Capital - El Obour - Al Shorouk - New Heliopolis",
    frequencyAr: "كل ١٠ دقائق",
    frequencyEn: "Every 10 minutes",
    costAr: "١٠ - ٣٠ جنيه",
    costEn: "10 - 30 EGP",
    carbonAr: "٠.٠١ كجم CO₂ لكل كم (صديق جداً للبيئة)",
    carbonEn: "0.01 kg CO₂/km (94% eco-efficiency ratio)",
    startsAr: "محطة عدلي منصور التبادلية",
    startsEn: "Adly Mansour Interchange station",
    endsAr: "مدينة الفنون والثقافة بالعاصمة / مدينة المعرفة",
    endsEn: "Arts & Culture City / Knowledge City",
  },
  brt: {
    titleAr: "الأتوبيس الترددي السريع (BRT)",
    titleEn: "Ring Road BRT Express",
    linesAr: "الخط الحصري للطريق الدائري لمصر الكبرى لتفادي التكدس",
    linesEn: "Exclusive Ring Road mass-transit corridor bypassing jams",
    frequencyAr: "كل ٥ دقائق بمنتهى الدقة",
    frequencyEn: "Every 5 minutes, dedicated alignment lane",
    costAr: "١٥ جنيه تذكرة موحدة",
    costEn: "15 EGP flat rate ticket",
    carbonAr: "٠.٠٣ كجم CO₂ لكل كم (محركات كهربائية هجينة)",
    carbonEn: "0.03 kg CO₂/km (hybrid clean power engines)",
    startsAr: "محطة رمسيس / المنيب / السلام التبادلية",
    startsEn: "Ramses / Mounib / Adly Mansour Hub",
    endsAr: "محطات الطريق الدائري الـ ٥٧ بالكامل",
    endsEn: "Complete loop representing 57 stations",
  },
};

const MapUpdater = ({
  center,
  zoom,
  bounds,
}: {
  center?: [number, number];
  zoom?: number;
  bounds?: L.LatLngBounds;
}) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, bounds, map]);
  return null;
};

const getModelIcon = (modeType: string = "car", styleClasses: string = "") => {
  const t = modeType.toLowerCase();
  if (t.includes("metro")) return <TrainFront className={styleClasses} />;
  if (t.includes("monorail") || t.includes("lrt") || t.includes("hst"))
    return <Train className={styleClasses} />;
  if (t.includes("tram")) return <TrainFront className={styleClasses} />;
  if (t.includes("bus") || t.includes("brt") || t.includes("microbus"))
    return <Bus className={styleClasses} />;
  if (t.includes("ship") || t.includes("river") || t.includes("ferry"))
    return <Ship className={styleClasses} />;
  if (t.includes("bike")) return <Bike className={styleClasses} />;
  if (t.includes("car") || t.includes("taxi") || t.includes("ride"))
    return <Car className={styleClasses} />;
  if (t.includes("walk")) return <Footprints className={styleClasses} />;
  return <Navigation className={styleClasses} />;
};

const TransportHub: React.FC = () => {
  const {
    language,
    user,
    isRtl,
    theme = "dark",
    isFocusMode,
    setIsFocusMode,
  } = useApp();
  const { speak } = useAccessibility();

  // App DB State
  const [dbRoutes, setDbRoutes] = useState<TransportRoute[]>([]);
  const [dbStations, setDbStations] = useState<TransportStation[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<any[]>([]);
  const [alarms, setAlarms] = useState<any[]>([]);

  // Layout View States
  const [sidebarTab, setSidebarTab] = useState<"planner" | "directory" | "analytics">("planner");
  const [viewState, setViewState] = useState<"map" | "planner" | "navigating">("map");
  const [is3D, setIs3D] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Map & Path Tracking
  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([30.0444, 31.2357]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | undefined>(undefined);

  // Trip Configuration Form
  const [fromStationId, setFromStationId] = useState("");
  const [toStationId, setToStationId] = useState("");
  const [plannerSearchMode, setPlannerSearchMode] = useState<"text" | "route">("text");
  const [selectedQuickRouteId, setSelectedQuickRouteId] = useState<string>("");
  const [routeResult, setRouteResult] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [tripProgress, setTripProgress] = useState(0);
  const [selectedResultModeId, setSelectedResultModeId] = useState<string>("advanced-transit");
  const [nextStationCountdown, setNextStationCountdown] = useState<number | null>(null);

  // Directory Interactive State
  const [activeDirectoryRoute, setActiveDirectoryRoute] = useState<any | null>(null);

  // Recents & Favorites
  const [recentLocations, setRecentLocations] = useState<any[]>([
    {
      id: "r1",
      name_ar: "ميدان التحرير",
      name_en: "Tahrir Square",
      type: "area",
      geom: { coordinates: [31.2357, 30.0444] },
    },
    {
      id: "r2",
      name_ar: "محطة رمسيس",
      name_en: "Ramses Station",
      type: "station",
      geom: { coordinates: [31.2464, 30.0617] },
    },
    {
      id: "r3",
      name_ar: "مطار القاهرة الكبرى",
      name_en: "Cairo Airport Terminal",
      type: "area",
      geom: { coordinates: [31.3996, 30.1219] },
    },
  ]);

  const [favoriteLocations, setFavoriteLocations] = useState<any[]>([
    {
      id: "f1",
      name_ar: "المنزل (المعادي)",
      name_en: "Home (Maadi)",
      type: "favorite",
      geom: { coordinates: [31.2502, 29.9542] },
    },
    {
      id: "f2",
      name_ar: "الجامعة (الجيزة)",
      name_en: "University (Giza)",
      type: "favorite",
      geom: { coordinates: [31.2001, 30.0264] },
    },
  ]);

  const [showRecents, setShowRecents] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  // Input states & refs
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedModeInfo, setSelectedModeInfo] = useState<any | null>(null);
  const [highlightedStations, setHighlightedStations] = useState<string[]>([]);

  // Navigation telemetry states
  const [gpsMode, setGpsMode] = useState<"simulated" | "real">("simulated");
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [approachingStation, setApproachingStation] = useState<any | null>(null);
  const [announcedStations, setAnnouncedStations] = useState<string[]>([]);
  const [tripCarbonSaved, setTripCarbonSaved] = useState(0);
  const [telemetryAlert, setTelemetryAlert] = useState<any | null>(null);
  const [tripHistory, setTripHistory] = useState<any[]>([]);

  // Native refs
  const mapRef = useRef<L.Map | null>(null);
  const gpsWatcher = useRef<number | null>(null);
  const vehicleMoveInterval = useRef<any>(null);

  // Fix Map Rendering sizing issues across viewStates
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [viewState, sidebarTab]);

  // Load Saved History from storage
  useEffect(() => {
    let saved: any[] = [];
    try {
      const savedStr = localStorage.getItem("moeco_trips_history");
      if (savedStr) saved = JSON.parse(savedStr);
    } catch (e) {
      console.warn("localStorage loading failed", e);
    }
    setTripHistory(saved);
  }, []);

  // Sync / Subscribe Core Transport Updates
  useEffect(() => {
    const initData = async () => {
      try {
        const [routesData, stationsData, liveData] = await Promise.all([
          transportService.getDbRoutes(true),
          transportService.getDbStations(),
          transportService.getLiveVehicles(),
        ]);
        setDbRoutes(routesData);
        setDbStations(stationsData);
        setLiveVehicles(liveData);
      } catch (err) {
        console.error("Failed to fetch core transport networking from Supabase DB, starting fallback routing", err);
      }
    };
    initData();

    const channel = supabase
      .channel("public:live_transport_ops")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_transport" }, () => {
        transportService.getLiveVehicles().then(setLiveVehicles);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transport_updates" }, (payload) => {
        if (payload.new && payload.new.message) {
          setAlarms((prev) => [
            ...prev,
            {
              id: payload.new.id,
              message: language === "ar" ? payload.new.message_ar || payload.new.message : payload.new.message,
              severity: payload.new.severity || "info",
            },
          ]);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergency_reports" }, (payload) => {
        const newAlarm = {
          id: payload.new.id,
          message: language === "ar" ? payload.new.message_ar || payload.new.message : payload.new.message,
          severity: payload.new.severity || "high",
        };
        setAlarms((prev) => [...prev, newAlarm]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [language]);

  const distanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getRouteGeometryAndDist = async (
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
  ) => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return {
          distanceKm: data.routes[0].distance / 1000,
          durationMin: Math.ceil(data.routes[0].duration / 60),
          geometry: data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]),
        };
      }
    } catch (err) {
      console.warn("OSRM routing service offline, falling back to direct geometric vector Line");
    }
    return {
      distanceKm: distanceInKm(start.lat, start.lon, end.lat, end.lon),
      durationMin: Math.ceil(distanceInKm(start.lat, start.lon, end.lat, end.lon) * 2),
      geometry: [
        [start.lat, start.lon],
        [end.lat, end.lon],
      ] as [number, number][],
    };
  };

  const geocodeLocation = async (query: string) => {
    if (!query) return null;
    const cleanQuery = query.trim().toLowerCase();

    if ((cleanQuery.includes("موقعي") || cleanQuery.includes("current location") || cleanQuery.includes("my location")) && userLocation) {
      return { lat: userLocation[0], lon: userLocation[1] };
    }

    // Try finding exact or partial match in loaded dbStations
    if (dbStations && dbStations.length > 0) {
      const matchedSt = dbStations.find(s => 
        s.station_name_ar.toLowerCase().includes(cleanQuery) || 
        s.station_name_en.toLowerCase().includes(cleanQuery) ||
        cleanQuery.includes(s.station_name_ar.toLowerCase()) ||
        cleanQuery.includes(s.station_name_en.toLowerCase())
      );
      if (matchedSt && matchedSt.geom?.coordinates) {
        return { lat: matchedSt.geom.coordinates[1], lon: matchedSt.geom.coordinates[0] };
      }
    }

    // Try presets
    const allPresets = [...recentLocations, ...favoriteLocations];
    const matchedPr = allPresets.find(p => 
      (p.name_ar && p.name_ar.toLowerCase().includes(cleanQuery)) ||
      (p.name_en && p.name_en.toLowerCase().includes(cleanQuery)) ||
      (p.name_ar && cleanQuery.includes(p.name_ar.toLowerCase())) ||
      (p.name_en && cleanQuery.includes(p.name_en.toLowerCase()))
    );
    if (matchedPr && matchedPr.geom?.coordinates) {
      return { lat: matchedPr.geom.coordinates[1], lon: matchedPr.geom.coordinates[0] };
    }

    // External Nominatim request (may fail in sandbox, caught safely)
    const q = query.toLowerCase().includes("egypt") ? query : `${query}, Cairo, Egypt`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }
    } catch (e) {
      console.warn("Geocoding external lookup failed, using fallback coordinates", e);
    }

    // Pre-calculated popular locations mapping to bypass external service
    if (cleanQuery.includes("تحرير") || cleanQuery.includes("tahrir") || cleanQuery.includes("وسط البلد") || cleanQuery.includes("downtown")) {
      return { lat: 30.0444, lon: 31.2357 };
    }
    if (cleanQuery.includes("رمسيس") || cleanQuery.includes("ramses") || cleanQuery.includes("محطة مصر") || cleanQuery.includes("railway")) {
      return { lat: 30.0617, lon: 31.2464 };
    }
    if (cleanQuery.includes("معادي") || cleanQuery.includes("maadi")) {
      return { lat: 29.9542, lon: 31.2502 };
    }
    if (cleanQuery.includes("جيزة") || cleanQuery.includes("giza") || cleanQuery.includes("جامعة") || cleanQuery.includes("university")) {
      return { lat: 30.0264, lon: 31.2001 };
    }
    if (cleanQuery.includes("عاصمة") || cleanQuery.includes("capital") || cleanQuery.includes("lrt") || cleanQuery.includes("monorail")) {
      return { lat: 30.0210, lon: 31.6914 };
    }
    if (cleanQuery.includes("مطار") || cleanQuery.includes("airport")) {
      return { lat: 30.1219, lon: 31.3996 };
    }
    if (cleanQuery.includes("المرج") || cleanQuery.includes("marg")) {
      return { lat: 30.1517, lon: 31.3250 };
    }
    if (cleanQuery.includes("حلوان") || cleanQuery.includes("helwan")) {
      return { lat: 29.8411, lon: 31.3328 };
    }

    // Default to Center Cairo coordinates instead of failing
    return { lat: 30.0444, lon: 31.2357 };
  };

  const getNearestStation = (lat: number, lon: number): TransportStation | null => {
    if (dbStations.length === 0) return null;
    let nearest = dbStations[0];
    let minDist = distanceInKm(lat, lon, nearest.geom.coordinates[1], nearest.geom.coordinates[0]);
    dbStations.forEach((s) => {
      const d = distanceInKm(lat, lon, s.geom.coordinates[1], s.geom.coordinates[0]);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    });
    return nearest;
  };

  const mapGeometryToStations = (geomList: [number, number][]) => {
    if (!geomList || geomList.length === 0) return [];
    const matched: any[] = [];
    const addedIds = new Set<string>();

    geomList.forEach((pt) => {
      const lat = pt[0];
      const lon = pt[1];
      dbStations.forEach((st) => {
        const d = distanceInKm(lat, lon, st.geom.coordinates[1], st.geom.coordinates[0]);
        if (d < 0.35 && !addedIds.has(st.station_id)) {
          addedIds.add(st.station_id);
          matched.push({
            id: st.station_id,
            name_ar: st.station_name_ar,
            name_en: st.station_name_en,
            geom: st.geom,
            interchange_with: st.interchange_with || [],
          });
        }
      });
    });
    return matched;
  };

  const handleAutocompleteQuery = (term: string, isFrom: boolean) => {
    if (isFrom) {
      setFromQuery(term);
      if (term.length < 2) {
        setFromSuggestions([]);
        return;
      }
      // Search matching local and seed stations
      const filtered = dbStations.filter(
        (s) =>
          s.station_name_ar.includes(term) ||
          s.station_name_en.toLowerCase().includes(term.toLowerCase())
      );
      setFromSuggestions(
        filtered.map((s) => ({
          id: s.station_id,
          name_ar: s.station_name_ar,
          name_en: s.station_name_en,
          type: "station",
          station: s,
        }))
      );
    } else {
      setToQuery(term);
      if (term.length < 2) {
        setToSuggestions([]);
        return;
      }
      const filtered = dbStations.filter(
        (s) =>
          s.station_name_ar.includes(term) ||
          s.station_name_en.toLowerCase().includes(term.toLowerCase())
      );
      setToSuggestions(
        filtered.map((s) => ({
          id: s.station_id,
          name_ar: s.station_name_ar,
          name_en: s.station_name_en,
          type: "station",
          station: s,
        }))
      );
    }
  };

  const handleSelectFrom = (sug: any) => {
    let lat = sug.lat;
    let lon = sug.lon;
    if (lat === undefined && sug.geom?.coordinates) {
      lat = sug.geom.coordinates[1];
      lon = sug.geom.coordinates[0];
    }

    if (sug.type === "station") {
      setFromStationId(sug.id);
      setFromQuery(language === "ar" ? sug.name_ar : sug.name_en);
      const geom = sug.station?.geom || sug.geom;
      if (geom) {
        setFromCoords({
          lat: geom.coordinates[1],
          lon: geom.coordinates[0],
        });
      } else {
        setFromCoords({ lat, lon });
      }
    } else {
      const nearest = getNearestStation(lat, lon);
      if (nearest) {
        setFromStationId(nearest.station_id);
        const nameAr = sug.name_ar || "موقع محدد";
        const nameEn = sug.name_en || "Selected Location";
        setFromQuery(
          language === "ar"
            ? `${nameAr.split(",")[0]} (أقرب: ${nearest.station_name_ar})`
            : `${nameEn.split(",")[0]} (Near: ${nearest.station_name_en})`
        );
        setFromCoords({ lat, lon });
      } else {
        setFromQuery(language === "ar" ? sug.name_ar || "" : sug.name_en || "");
        setFromCoords({ lat, lon });
      }
    }
    setFromSuggestions([]);
  };

  const handleSelectTo = (sug: any) => {
    let lat = sug.lat;
    let lon = sug.lon;
    if (lat === undefined && sug.geom?.coordinates) {
      lat = sug.geom.coordinates[1];
      lon = sug.geom.coordinates[0];
    }

    if (sug.type === "station") {
      setToStationId(sug.id);
      setToQuery(language === "ar" ? sug.name_ar : sug.name_en);
      const geom = sug.station?.geom || sug.geom;
      if (geom) {
        setToCoords({
          lat: geom.coordinates[1],
          lon: geom.coordinates[0],
        });
      } else {
        setToCoords({ lat, lon });
      }
    } else {
      const nearest = getNearestStation(lat, lon);
      if (nearest) {
        setToStationId(nearest.station_id);
        const nameAr = sug.name_ar || "موقع محدد";
        const nameEn = sug.name_en || "Selected Location";
        setToQuery(
          language === "ar"
            ? `${nameAr.split(",")[0]} (أقرب: ${nearest.station_name_ar})`
            : `${nameEn.split(",")[0]} (Near: ${nearest.station_name_en})`
        );
        setToCoords({ lat, lon });
      } else {
        setToQuery(language === "ar" ? sug.name_ar || "" : sug.name_en || "");
        setToCoords({ lat, lon });
      }
    }
    setToSuggestions([]);
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      const nearest = getNearestStation(userLocation[0], userLocation[1]);
      if (nearest) {
        setFromStationId(nearest.station_id);
        setFromQuery(
          language === "ar"
            ? `موقعي الحالي (أقرب: ${nearest.station_name_ar})`
            : `My Location (Near: ${nearest.station_name_en})`
        );
        setFromCoords({ lat: userLocation[0], lon: userLocation[1] });
        speak(
          language === "ar"
            ? `تم تبني موقعك الحالي. محطتك الأقرب هي ${nearest.station_name_ar}`
            : `Active GPS matching complete. Nearest station is ${nearest.station_name_en}`
        );
      } else {
        notificationService.error(
          language === "ar" ? "تعذر العثور على محطات قريبة" : "Could not find nearby stations"
        );
      }
    } else {
      // Simulate/Match central Tahrir position if device GPS is empty
      const tahrirCoords = [30.0444, 31.2357] as [number, number];
      setUserLocation(tahrirCoords);
      const nearest = getNearestStation(tahrirCoords[0], tahrirCoords[1]);
      if (nearest) {
        setFromStationId(nearest.station_id);
        setFromQuery(
          language === "ar"
            ? `موقعي الحالي (أقرب: ${nearest.station_name_ar})`
            : `My Location (Near: ${nearest.station_name_en})`
        );
        setFromCoords({ lat: tahrirCoords[0], lon: tahrirCoords[1] });
      }
    }
  };

  const handleQuickModeSelect = (modeType: string) => {
    setSelectedModeInfo(modeType);
    setFromQuery("");
    setFromStationId("");
    setFromCoords(null);
    setToQuery("");
    setToStationId("");
    setToCoords(null);

    const matched = dbStations.filter(
      (s) => s.station_type?.toLowerCase() === modeType.toLowerCase()
    );
    setHighlightedStations(matched.map((s) => s.station_id));
    setTimeout(() => setHighlightedStations([]), 4000);

    notificationService.info(
      language === "ar"
        ? `تم مطابقة محطات خطوط الـ ${modeType}. يرجى إدخال الانطلاق`
        : `Showing all points of ${modeType}. Please enter origin and destination`
    );

    setTimeout(() => {
      fromInputRef.current?.focus();
    }, 100);
  };

  const handlePlanTrip = async () => {
    setIsLoading(true);
    try {
      let finalFromCoords = fromCoords;
      if (!finalFromCoords && fromQuery) {
        finalFromCoords = await geocodeLocation(fromQuery);
        if (finalFromCoords) setFromCoords(finalFromCoords);
      }

      let finalToCoords = toCoords;
      if (!finalToCoords && toQuery) {
        finalToCoords = await geocodeLocation(toQuery);
        if (finalToCoords) setToCoords(finalToCoords);
      }

      if (!finalFromCoords || !finalToCoords) {
        notificationService.error(
          language === "ar"
            ? "يرجى تحديد نقطة الانطلاق والوصول بشكل دقيق"
            : "Please define origin and destination locations accurately"
        );
        setIsLoading(false);
        return;
      }

      const distVal = distanceInKm(
        finalFromCoords.lat,
        finalFromCoords.lon,
        finalToCoords.lat,
        finalToCoords.lon
      );

      if (distVal < 0.1) {
        notificationService.error(
          language === "ar"
            ? "نقطة الانطلاق ونقطة الوصول متطابقتان جداً"
            : "Origin and destination are too close"
        );
        setIsLoading(false);
        return;
      }

      setMapBounds(
        L.latLngBounds(
          [finalFromCoords.lat, finalFromCoords.lon],
          [finalToCoords.lat, finalToCoords.lon]
        )
      );

      const recommendedModes: any[] = [];

      // Calculate path with Routing Graph Engine
      const transitPath = routingEngine.findTransitPath(
        finalFromCoords,
        finalToCoords,
        dbRoutes,
        transportService.calculateTripCost
      );

      if (transitPath && transitPath.legs.length > 0) {
        // Run OSRM street-conformation matching over sequential legs asynchronously
        try {
          for (let i = 0; i < transitPath.legs.length; i++) {
            const leg = transitPath.legs[i];
            const firstStat = leg.geometry[0];
            const lastStat = leg.geometry[leg.geometry.length - 1];
            if (firstStat && lastStat) {
              const legStartVal = { lat: firstStat.lat, lon: firstStat.lon };
              const legEndVal = { lat: lastStat.lat, lon: lastStat.lon };
              const osrmLeg = await getRouteGeometryAndDist(legStartVal, legEndVal);
              if (osrmLeg && osrmLeg.geometry && osrmLeg.geometry.length > 0) {
                leg.geometry = osrmLeg.geometry.map(([lat, lon]: any) => ({ lat, lon }));
              }
            }
          }
        } catch (geomErr) {
          console.warn("Snapping legs to street coordinates failed, using transit line node representation", geomErr);
        }

        const exactPathGeo: [number, number][] = [];
        exactPathGeo.push([finalFromCoords.lat, finalFromCoords.lon]);
        transitPath.legs.forEach((leg) => {
          if (leg.geometry) {
            leg.geometry.forEach((g) => exactPathGeo.push([g.lat, g.lon]));
          }
        });
        exactPathGeo.push([finalToCoords.lat, finalToCoords.lon]);

        const labelAr = transitPath.legs.map((l) => l.route_name_ar).join(" ➔ ");
        const labelEn = transitPath.legs.map((l) => l.route_name_en).join(" ➔ ");
        const advancedStations = mapGeometryToStations(exactPathGeo as [number, number][]);

        recommendedModes.push({
          id: "advanced-transit",
          label: language === "ar" ? labelAr : labelEn,
          mode_type: transitPath.legs.length > 1 ? "metro" : transitPath.legs[0].mode_type,
          durationMin: transitPath.totalDurationMin,
          costEgp: transitPath.totalCostEgp,
          carbonKg: transitPath.carbonKg,
          color: transitPath.legs[0].color,
          stationsCount: transitPath.totalStationsCount,
          startStationName:
            language === "ar" ? transitPath.legs[0].startStationNameAr : transitPath.legs[0].startStationNameEn,
          endStationName:
            language === "ar"
              ? transitPath.legs[transitPath.legs.length - 1].endStationNameAr
              : transitPath.legs[transitPath.legs.length - 1].endStationNameEn,
          geometry: exactPathGeo as [number, number][],
          distanceKm: transitPath.totalDistanceKm,
          isMultiLeg: transitPath.legs.length > 1,
          legs: transitPath.legs,
          stationsList: advancedStations,
        });
      }

      // Driving (Uber / Private Car) via real OSRM street router
      const osrm = await getRouteGeometryAndDist(finalFromCoords, finalToCoords);
      recommendedModes.push({
        id: "generic-car",
        label: language === "ar" ? "سيارة / أوبر ميتو" : "Car / Uber Taxi",
        mode_type: "car",
        durationMin: osrm.durationMin,
        costEgp: Math.max(30, Math.ceil(osrm.distanceKm * 7)),
        carbonKg: osrm.distanceKm * 0.16,
        color: "#1e293b",
        geometry: osrm.geometry,
        distanceKm: osrm.distanceKm,
        stationsCount: 0,
        startStationName: fromQuery || (language === "ar" ? "موقعي الحالي" : "My Location"),
        endStationName: toQuery || (language === "ar" ? "الوجهة" : "Destination"),
      });

      // Bus (Transit CTA) fallback driving geometry
      recommendedModes.push({
        id: "generic-bus",
        label: language === "ar" ? "أتوبيس هيئة النقل" : "CTA City Bus",
        mode_type: "bus",
        durationMin: osrm.durationMin + 12,
        costEgp: 10,
        carbonKg: osrm.distanceKm * 0.04,
        color: "#f59e0b",
        geometry: osrm.geometry,
        distanceKm: osrm.distanceKm,
        stationsCount: Math.ceil(osrm.distanceKm * 0.8),
        startStationName: fromQuery || (language === "ar" ? "موقعي" : "My Location"),
        endStationName: toQuery || (language === "ar" ? "الوجهة" : "Destination"),
      });

      // Walking option if realistic
      if (osrm.distanceKm < 15) {
        recommendedModes.push({
          id: "walking",
          label: language === "ar" ? "مشي صحي ممتد" : "Healthy Walking Path",
          mode_type: "walk",
          durationMin: Math.ceil(osrm.distanceKm * 12),
          costEgp: 0,
          carbonKg: 0.0,
          color: "#10b981",
          geometry: osrm.geometry,
          distanceKm: osrm.distanceKm,
          stationsCount: 0,
          startStationName: fromQuery || (language === "ar" ? "موقعي" : "My Location"),
          endStationName: toQuery || (language === "ar" ? "الوجهة" : "Destination"),
        });
      }

      // Bike option
      if (osrm.distanceKm < 20) {
        recommendedModes.push({
          id: "bike-share",
          label: language === "ar" ? "دراجات القاهرة" : "Cairo Bike Scheme",
          mode_type: "bike",
          durationMin: Math.ceil(osrm.distanceKm * 4),
          costEgp: Math.ceil(osrm.distanceKm * 0.5),
          carbonKg: 0.0,
          color: "#06b6d4",
          geometry: osrm.geometry,
          distanceKm: osrm.distanceKm,
          stationsCount: 0,
          startStationName: fromQuery || (language === "ar" ? "محطة دراجات" : "Bike Hub"),
          endStationName: toQuery || (language === "ar" ? "الوجهة" : "Destination"),
        });
      }

      setRouteResult({
        startPt: finalFromCoords,
        endPt: finalToCoords,
        distanceKm: osrm.distanceKm,
        geometry: osrm.geometry,
        modes: recommendedModes.sort((a, b) => a.durationMin - b.durationMin),
      });

      // Default selection
      const hasTransit = recommendedModes.some((m) => m.id === "advanced-transit");
      setSelectedResultModeId(hasTransit ? "advanced-transit" : recommendedModes[0].id);

      setViewState("planner");
      setSidebarTab("planner");
    } catch (err) {
      console.error(err);
      notificationService.error(
        language === "ar" ? "فشل حساب مخطط الرحلات" : "Route planning failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNavigation = async (mode: any) => {
    setActiveTrip({ ...mode, startTime: new Date() });
    setViewState("navigating");
    setSidebarTab("planner");
    setTripProgress(0);
    setIsOffRoute(false);
    setApproachingStation(null);
    setAnnouncedStations([]);
    setTripCarbonSaved(0);
    setTelemetryAlert(null);
    setCurrentSpeed(
      mode.mode_type === "metro" ? 65 : mode.mode_type === "car" ? 48 : 32
    );

    let step = 0;
    const geometry = mode.geometry || routeResult?.geometry || [];
    const totalSteps = geometry.length;

    if (vehicleMoveInterval.current) clearInterval(vehicleMoveInterval.current);

    vehicleMoveInterval.current = setInterval(() => {
      if (step >= totalSteps - 1) {
        clearInterval(vehicleMoveInterval.current);
        setTripProgress(100);

        // Save Trip locally
        const carbonCoeff = mode.carbonKg ? parseFloat(mode.carbonKg) : 2.5;
        const newRecord = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US"),
          mode: mode.mode_type || "transit",
          label: mode.label,
          carbonSaved: carbonCoeff.toFixed(2),
          cost: mode.costEgp || 10,
        };
        let hist: any[] = [];
        try {
          const histStr = localStorage.getItem("moeco_trips_history");
          if (histStr) hist = JSON.parse(histStr);
        } catch (e) {
          console.warn(e);
        }
        const updated = [newRecord, ...hist];
        localStorage.setItem("moeco_trips_history", JSON.stringify(updated));
        setTripHistory(updated);

        notificationService.success(
          language === "ar" ? "رائع! وصلت بسلام للوجهة المطلوبة" : "Safely reached your destination"
        );

        if (!isMuted) {
          speak(
            language === "ar"
              ? `لقد وصلت إلى وجهتك بسلام. تم توفير ما يعادل ${carbonCoeff} كجم كربون!`
              : `Arrived safely at destination. Carbon footprint saved: ${carbonCoeff} kilograms`
          );
        }
        return;
      }

      const nextCoord = geometry[step + 1];
      if (nextCoord) {
        setCurrentMapCenter([nextCoord[0], nextCoord[1]]);
      }

      const prg = ((step + 1) / totalSteps) * 100;
      setTripProgress(prg);

      if (nextCoord) {
        const off = checkOffRoute(nextCoord[0], nextCoord[1], geometry);
        setIsOffRoute(off);
        processNavigationStep(nextCoord[0], nextCoord[1], prg, mode, step);
      }

      step += 1;
    }, 1500);
  };

  const checkOffRoute = (lat: number, lng: number, geometry: [number, number][]) => {
    if (!geometry || geometry.length === 0) return false;
    let minD = Infinity;
    geometry.forEach((pt) => {
      const d = distanceInKm(lat, lng, pt[0], pt[1]);
      if (d < minD) minD = d;
    });
    return minD > 1.2;
  };

  const processNavigationStep = (
    lat: number,
    lng: number,
    prg: number,
    mode: any,
    stepIndex: number,
  ) => {
    const totalDist = mode.distanceKm || 5;
    const covers = (prg / 100) * totalDist;
    const saved = covers * (0.16 - (mode.carbonKg / totalDist || 0.02));
    setTripCarbonSaved(Math.max(0, saved));

    const baseSpeed = mode.mode_type === "metro" ? 65 : 45;
    const jitter = Math.random() * 8 - 4;
    setCurrentSpeed(Math.round(baseSpeed + jitter));

    const stations = mode.stationsList || [];
    if (stations.length > 0) {
      const currentStationIdx = Math.floor((prg / 100) * stations.length);
      const nextStationIdx = currentStationIdx + 1;

      if (nextStationIdx < stations.length) {
        const nextSt = stations[nextStationIdx];
        setApproachingStation(nextSt);

        const dNext = distanceInKm(lat, lng, nextSt.geom.coordinates[1], nextSt.geom.coordinates[0]);
        const timeToNextSecs = Math.max(15, Math.ceil((dNext / 45) * 3600));
        setNextStationCountdown(timeToNextSecs);
      } else {
        setApproachingStation(null);
        setNextStationCountdown(null);
      }

      const closestSt = stations[currentStationIdx] || stations[0];
      const dClosest = distanceInKm(lat, lng, closestSt.geom.coordinates[1], closestSt.geom.coordinates[0]);

      if (dClosest < 0.25) {
        if (!announcedStations.includes(closestSt.id)) {
          setAnnouncedStations((prev) => [...prev, closestSt.id]);
          const isLast = currentStationIdx === stations.length - 1;
          let voiceText = "";
          if (isLast) {
            voiceText =
              language === "ar"
                ? `يرجى الاستعداد للنزول في محطتكم الأخيرة: ${closestSt.name_ar}.`
                : `Prepare to alight at your final stop: ${closestSt.name_en}.`;
          } else {
            const nextSt = nextStationIdx < stations.length ? stations[nextStationIdx] : null;
            if (nextSt) {
              voiceText =
                language === "ar"
                  ? `المحطة الحالية: ${closestSt.name_ar}. المحطة القادمة: ${nextSt.name_ar}.`
                  : `Now arriving at: ${closestSt.name_en}. Next stop is: ${nextSt.name_en}.`;
            }
          }
          if (!isMuted) speak(voiceText);
        }
      }
    }
  };

  const handleStopNavigation = () => {
    if (vehicleMoveInterval.current) clearInterval(vehicleMoveInterval.current);
    setViewState("map");
    setActiveTrip(null);
    setTripProgress(0);
    setIsOffRoute(false);
    setApproachingStation(null);
    setAnnouncedStations([]);
    setTripCarbonSaved(0);
    setTelemetryAlert(null);
    setCurrentSpeed(0);
  };

  const handleReverseLocations = () => {
    const fQuery = fromQuery;
    const fStationId = fromStationId;
    const fCoords = fromCoords;

    setFromQuery(toQuery);
    setFromStationId(toStationId);
    setFromCoords(toCoords);

    setToQuery(fQuery);
    setToStationId(fStationId);
    setToCoords(fCoords);
    notificationService.info(language === "ar" ? "تم عكس محوري الرحلة" : "Swapped origin & destination");
  };

  const handleSelectDirectoryRoute = (route: any) => {
    setActiveDirectoryRoute(route);
    if (route.stations && route.stations.length > 0) {
      const first = route.stations[0].transport_stations.geom.coordinates;
      const last = route.stations[route.stations.length - 1].transport_stations.geom.coordinates;
      setMapBounds(
        L.latLngBounds(
          [first[1], first[0]],
          [last[1], last[0]]
        )
      );
    }
    notificationService.success(
      language === "ar"
        ? `عرض مسار: ${route.route_name_ar}`
        : `Showing route: ${route.route_name_en}`
    );
  };

  const currentActiveRouteModel = useMemo(() => {
    if (viewState === "navigating" && activeTrip) return activeTrip;
    if (viewState === "planner" && routeResult?.modes) {
      return routeResult.modes.find((m: any) => m.id === selectedResultModeId) || routeResult.modes[0];
    }
    return null;
  }, [viewState, activeTrip, routeResult, selectedResultModeId]);

  // 3D Canvas helper
  const Map3DController = () => {
    const map = useMap();
    useEffect(() => {
      const container = map.getContainer();
      if (is3D) {
        container.classList.add("map-3d-effect");
      } else {
        container.classList.remove("map-3d-effect");
      }
    }, [map, is3D]);
    return null;
  };

  return (
    <div
      className="relative w-full h-[calc(100dvh-8rem)] min-h-[500px] bg-slate-950 rounded-3xl font-sans text-slate-100 flex flex-col md:flex-row overflow-hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* LEFT COLUMN: HIGH-POLISH DUAL PANEL SIDEBAR */}
      <div className="w-full md:w-[445px] h-[55vh] md:h-full bg-slate-950/95 md:bg-slate-900/90 backdrop-blur-3xl border-t md:border-t-0 md:border-r border-white/10 z-[80] shrink-0 flex flex-col overflow-hidden relative pointer-events-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-none order-2 md:order-1">
        {/* TABS SELECTOR */}
        <div className="flex border-b border-white/10 shrink-0 bg-slate-900/40">
          <button
            onClick={() => {
              setSidebarTab("planner");
              if (activeTrip) setViewState("navigating");
              else if (routeResult) setViewState("planner");
              else setViewState("map");
            }}
            className={`flex-1 py-4 text-center text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === "planner" ? "text-emerald-400 bg-white/5" : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass size={14} />
            <span>{language === "ar" ? "مخطط الرحلة" : "Planner"}</span>
            {sidebarTab === "planner" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_#10b981]"
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab("directory")}
            className={`flex-1 py-4 text-center text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === "directory" ? "text-emerald-400 bg-white/5" : "text-slate-400 hover:text-white"
            }`}
          >
            <Route size={14} />
            <span>{language === "ar" ? "دليل الخطوط" : "Network Directory"}</span>
            {sidebarTab === "directory" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_#10b981]"
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab("analytics")}
            className={`flex-1 py-4 text-center text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === "analytics" ? "text-emerald-400 bg-white/5" : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity size={14} />
            <span>{language === "ar" ? "سجل التوفير" : "Carbon Saved"}</span>
            {sidebarTab === "analytics" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_#10b981]"
              />
            )}
          </button>
        </div>

        {/* INNER SCROLL CONTENT OF SIDEBAR */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col min-h-0 bg-gradient-to-b from-transparent to-slate-950/20">
          <AnimatePresence mode="wait">
            {sidebarTab === "planner" && (
              <motion.div
                key="plannerTab"
                initial={{ opacity: 0, x: isRtl ? 15 : -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? -15 : 15 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* SUB-VIEW 1.A: TRIP SEARCH FORM */}
                {viewState === "map" && (
                  <div className="space-y-4 flex flex-col">
                    <div className="flex justify-between items-center px-1">
                      <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                          {language === "ar" ? "مِلاَح القاهرة الذكي" : "Cairo Smart Transit"}
                        </h2>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mt-0.5">
                          {language === "ar" ? "الخطوط والمسارات المعتمدة" : "Licensed official GTFS feeds"}
                        </span>
                      </div>
                      <button
                        onClick={handleUseCurrentLocation}
                        className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400 transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                        title={language === "ar" ? "موقعي الحالي" : "My Location"}
                      >
                        <MapPin size={16} className="animate-pulse" />
                      </button>
                    </div>

                    {/* PLANNER MODE TABS */}
                    <div className="grid grid-cols-2 p-1 bg-slate-950 border border-white/5 rounded-xl text-xs">
                      <button
                        onClick={() => setPlannerSearchMode("text")}
                        className={`py-2 px-3 rounded-lg text-center font-bold transition-all cursor-pointer ${
                          plannerSearchMode === "text"
                            ? "bg-emerald-500 text-slate-950 font-extrabold shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {language === "ar" ? "🔍 بحث حر العنونة" : "🔍 Search Names"}
                      </button>
                      <button
                        onClick={() => setPlannerSearchMode("route")}
                        className={`py-2 px-3 rounded-lg text-center font-bold transition-all cursor-pointer ${
                          plannerSearchMode === "route"
                            ? "bg-emerald-500 text-slate-950 font-extrabold shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {language === "ar" ? "🚇 اختيار من خطوط النقل" : "🚇 Select via Line"}
                      </button>
                    </div>

                    {plannerSearchMode === "text" ? (
                      <div className="space-y-3 relative bg-slate-900/50 p-4 border border-white/5 rounded-2xl">
                        {/* ORIGIN */}
                        <div className="relative">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                            {language === "ar" ? "نقطة الانطلاق" : "Departure Stop"}
                          </label>
                          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-emerald-500/55 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <input
                              ref={fromInputRef}
                              type="text"
                              placeholder={language === "ar" ? "ابحث عن محطة انطلاق..." : "Search starting stop..."}
                              value={fromQuery}
                              onChange={(e) => handleAutocompleteQuery(e.target.value, true)}
                              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1 min-w-0"
                            />
                            {fromQuery && (
                              <button
                                onClick={() => {
                                  setFromQuery("");
                                  setFromCoords(null);
                                  setFromStationId("");
                                }}
                                className="text-slate-500 hover:text-white"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {/* Autocomplete suggestions dropdown */}
                          {fromSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-[110] bg-slate-950 border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto custom-scrollbar shadow-2xl">
                              {fromSuggestions.map((sug) => (
                                <button
                                  key={sug.id}
                                  onClick={() => handleSelectFrom(sug)}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-slate-200 border-b border-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                  dir="auto"
                                >
                                  {getModelIcon(sug.station?.station_type || "walk", "w-3 h-3 text-slate-400")}
                                  <span className="line-clamp-1">{language === "ar" ? sug.name_ar : sug.name_en}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* SWAP BUTTON */}
                        <div className="flex justify-center -my-1">
                          <button
                            type="button"
                            onClick={handleReverseLocations}
                            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer"
                          >
                            <ArrowLeftRight size={14} className="rotate-90" />
                          </button>
                        </div>

                        {/* DESTINATION */}
                        <div className="relative">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                            {language === "ar" ? "نقطة الوصول" : "Destination Stop"}
                          </label>
                          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-emerald-500/55 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <input
                              ref={toInputRef}
                              type="text"
                              placeholder={language === "ar" ? "ابحث عن محطة وصول..." : "Search destination..."}
                              value={toQuery}
                              onChange={(e) => handleAutocompleteQuery(e.target.value, false)}
                              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1 min-w-0"
                            />
                            {toQuery && (
                              <button
                                onClick={() => {
                                  setToQuery("");
                                  setToCoords(null);
                                  setToStationId("");
                                }}
                                className="text-slate-500 hover:text-white"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {/* Autocomplete suggestions dropdown */}
                          {toSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-[110] bg-slate-950 border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto custom-scrollbar shadow-2xl">
                              {toSuggestions.map((sug) => (
                                <button
                                  key={sug.id}
                                  onClick={() => handleSelectTo(sug)}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-slate-200 border-b border-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                  dir="auto"
                                >
                                  {getModelIcon(sug.station?.station_type || "walk", "w-3 h-3 text-slate-400")}
                                  <span className="line-clamp-1">{language === "ar" ? sug.name_ar : sug.name_en}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 bg-slate-900/50 p-4 border border-white/5 rounded-2xl">
                        {/* LINE SELECTION */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                            {language === "ar" ? "اختر خط / وسيلة المواصلات" : "Select Transport Line"}
                          </label>
                          <select
                            value={selectedQuickRouteId}
                            onChange={(e) => {
                              const routeId = e.target.value;
                              setSelectedQuickRouteId(routeId);
                              // Clear active stations so user must explicitly pick
                              setFromStationId("");
                              setToStationId("");
                              setFromQuery("");
                              setToQuery("");
                              setFromCoords(null);
                              setToCoords(null);
                            }}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-bold focus:border-emerald-500/55 outline-none transition-colors"
                          >
                            <option value="">
                              {language === "ar" ? "-- اختر خط المواصلات --" : "-- Choose a line --"}
                            </option>
                            {dbRoutes.map((r) => (
                              <option key={r.route_id} value={r.route_id}>
                                {language === "ar" ? r.route_name_ar : r.route_name_en}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* DEPARTURE STATION */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                            {language === "ar" ? "محطة الانطلاق (مِن)" : "Departure Station (From)"}
                          </label>
                          <select
                            disabled={!selectedQuickRouteId}
                            value={fromStationId}
                            onChange={(e) => {
                              const stId = e.target.value;
                              const route = dbRoutes.find(r => r.route_id === selectedQuickRouteId);
                              const st = route?.stations?.find(s => s.station_id === stId);
                              if (st && st.transport_stations) {
                                setFromStationId(stId);
                                const name = language === "ar" ? st.transport_stations.station_name_ar : st.transport_stations.station_name_en;
                                setFromQuery(name);
                                setFromCoords({
                                  lat: st.transport_stations.geom.coordinates[1],
                                  lon: st.transport_stations.geom.coordinates[0]
                                });
                              }
                            }}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-bold focus:border-emerald-500/55 outline-none transition-colors disabled:opacity-40"
                          >
                            <option value="">
                              {language === "ar" ? "-- اختر محطة الانطلاق --" : "-- Choose Departure --"}
                            </option>
                            {dbRoutes.find(r => r.route_id === selectedQuickRouteId)?.stations?.map((st) => (
                              <option key={st.station_id} value={st.station_id}>
                                {language === "ar" ? st.transport_stations?.station_name_ar : st.transport_stations?.station_name_en}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* ARRIVAL STATION */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                            {language === "ar" ? "محطة الوصول (إلى)" : "Arrival Station (To)"}
                          </label>
                          <select
                            disabled={!selectedQuickRouteId}
                            value={toStationId}
                            onChange={(e) => {
                              const stId = e.target.value;
                              const route = dbRoutes.find(r => r.route_id === selectedQuickRouteId);
                              const st = route?.stations?.find(s => s.station_id === stId);
                              if (st && st.transport_stations) {
                                setToStationId(stId);
                                const name = language === "ar" ? st.transport_stations.station_name_ar : st.transport_stations.station_name_en;
                                setToQuery(name);
                                setToCoords({
                                  lat: st.transport_stations.geom.coordinates[1],
                                  lon: st.transport_stations.geom.coordinates[0]
                                });
                              }
                            }}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 font-bold focus:border-emerald-500/55 outline-none transition-colors disabled:opacity-40"
                          >
                            <option value="">
                              {language === "ar" ? "-- اختر محطة الوصول --" : "-- Choose Destination --"}
                            </option>
                            {dbRoutes.find(r => r.route_id === selectedQuickRouteId)?.stations?.map((st) => (
                              <option key={st.station_id} value={st.station_id}>
                                {language === "ar" ? st.transport_stations?.station_name_ar : st.transport_stations?.station_name_en}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* SELECT PREFERRED MODE TAGS */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 px-1">
                        {language === "ar" ? "دليل التذكرة السريع" : "Quick operational references"}
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar scroll-smooth">
                        {["metro", "monorail", "lrt", "brt"].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => handleQuickModeSelect(mode)}
                            className="px-3 py-1.5 bg-slate-900 border border-white/5 hover:border-emerald-500/30 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 cursor-pointer"
                          >
                            {getModelIcon(mode, "w-3.5 h-3.5 text-slate-400")}
                            <span className="capitalize">{mode}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FAVORITES AND RECENT LOCATIONS list */}
                    <div className="space-y-4">
                      {/* FAVORITES */}
                      <div>
                        <div className="flex justify-between items-center mb-1 px-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            {language === "ar" ? "المواقع المفضلة" : "My Favorite Stops"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {favoriteLocations.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => {
                                setFromQuery(language === "ar" ? f.name_ar : f.name_en);
                                setFromCoords({ lat: f.geom.coordinates[1], lon: f.geom.coordinates[0] });
                                notificationService.success(
                                  language === "ar"
                                    ? `محدد من: ${f.name_ar}`
                                    : `Departure set to: ${f.name_en}`
                                );
                              }}
                              className="text-left p-2 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-white/15 rounded-xl transition-all cursor-pointer truncate text-[11px] font-semibold text-slate-300 flex items-center gap-1.5"
                            >
                              <MapPin size={11} className="text-amber-500 shrink-0" />
                              <span className="truncate">{language === "ar" ? f.name_ar : f.name_en}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* RECENTS */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5 px-1">
                          <History size={11} className="text-slate-400" />
                          {language === "ar" ? "المواقع الأخيرة" : "Recent Searches"}
                        </span>
                        <div className="space-y-1.5">
                          {recentLocations.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setToQuery(language === "ar" ? r.name_ar : r.name_en);
                                setToCoords({ lat: r.geom.coordinates[1], lon: r.geom.coordinates[0] });
                                notificationService.success(
                                  language === "ar"
                                    ? `محدد للوصول: ${r.name_ar}`
                                    : `Arrival set to: ${r.name_en}`
                                );
                              }}
                              className="w-full text-left px-3 py-2 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-xs font-semibold text-slate-300 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Clock size={11} className="text-slate-500" />
                                <span>{language === "ar" ? r.name_ar : r.name_en}</span>
                              </div>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500">{r.type}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* DISPATCH ACTION */}
                    <button
                      onClick={handlePlanTrip}
                      disabled={isLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 font-extrabold py-3.5 rounded-2xl shadow-xl hover:shadow-emerald-500/10 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-sm mt-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>{language === "ar" ? "جارٍ التوجيه وحساب التعرفة..." : "Routing coordinates..."}</span>
                        </>
                      ) : (
                        <>
                          <Compass size={16} />
                          <span>{language === "ar" ? "تخطيط خط السير" : "Plan Route"}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* SUB-VIEW 1.B: SUGGESTED ROUTE CARDS LIST */}
                {viewState === "planner" && routeResult && (
                  <div className="space-y-4 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between px-1">
                      <button
                        onClick={() => {
                          setViewState("map");
                          setRouteResult(null);
                        }}
                        className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                      >
                        <VolumeX size={14} className="hidden" /> {/* just keep lucide imports robust */}
                        <span>{language === "ar" ? "◀ تعديل البحث" : "◀ Modify Search"}</span>
                      </button>
                      <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
                        {routeResult.modes.length}{" "}
                        {language === "ar" ? "مسارات صحيحة" : "VALID PATHS FOUND"}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={12} className="text-emerald-400" />
                        <span className="text-xs text-slate-300 font-bold truncate">
                          {language === "ar" ? "من: " : "From: "}{language === "ar" ? fromQuery.split("(")[0] : fromQuery.split("(")[0]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-amber-500" />
                        <span className="text-xs text-slate-300 font-bold truncate">
                          {language === "ar" ? "إلى: " : "To: "}{language === "ar" ? toQuery.split("(")[0] : toQuery.split("(")[0]}
                        </span>
                      </div>
                    </div>

                    {/* MODES LIST CARDS */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
                      {routeResult.modes.map((mode: any) => {
                        const isSelected = selectedResultModeId === mode.id;
                        return (
                          <div
                            key={mode.id}
                            onClick={() => setSelectedResultModeId(mode.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col relative overflow-hidden group ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500/40 shadow-xl"
                                : "bg-slate-900 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="absolute top-0 right-0 left-0 h-1 bg-white/5 group-hover:bg-white/10 transition-colors" />
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg relative"
                                  style={{ backgroundColor: mode.color + "20", color: mode.color }}
                                >
                                  {getModelIcon(mode.mode_type, "w-4 h-4")}
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-white">{mode.label}</h4>
                                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">
                                    {mode.mode_type}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-white text-sm tabular-nums">
                                  {mode.durationMin} {language === "ar" ? "دقيقة" : "min"}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {(mode.distanceKm || 5).toFixed(1)} km
                                </span>
                              </div>
                            </div>

                            {/* Stats metrics under card */}
                            <div className="grid grid-cols-3 gap-2 py-2 bg-slate-950/40 rounded-xl px-3 border border-white/5">
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                                  {language === "ar" ? "التذكرة" : "Ticket EGP"}
                                </span>
                                <span className="text-xs font-black text-emerald-400 font-mono tracking-tight">
                                  {mode.costEgp} EGP
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                                  {language === "ar" ? "الوفر الكربوني" : "Eco Save"}
                                </span>
                                <span className="text-xs font-black text-cyan-400 font-mono tracking-tight">
                                  {(mode.carbonKg || 0).toFixed(2)} CO₂
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                                  {language === "ar" ? "المحطات" : "Stops"}
                                </span>
                                <span className="text-xs font-black text-slate-300 font-mono">
                                  {mode.stationsCount} {language === "ar" ? "محطة" : "stops"}
                                </span>
                              </div>
                            </div>

                            {/* Stations info */}
                            {mode.stationsList && mode.stationsList.length > 0 && isSelected && (
                              <div className="mt-3 pt-2 border-t border-white/5">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                                  {language === "ar" ? "المسار الممتد" : "Leg Station Pathway"}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {mode.stationsList.slice(0, 4).map((st: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-white/5 border border-white/5 text-[9px] text-slate-300 rounded-md truncate max-w-[90px]"
                                      title={language === "ar" ? st.name_ar : st.name_en}
                                    >
                                      {language === "ar" ? st.name_ar : st.name_en}
                                    </span>
                                  ))}
                                  {mode.stationsList.length > 4 && (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded-md font-bold">
                                      +{mode.stationsList.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartNavigation(mode);
                                }}
                                className="w-full mt-3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-center text-xs tracking-wider transition-all shadow-lg shadow-emerald-500/5 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Compass size={13} />
                                <span>{language === "ar" ? "تأكيد وبدء رحلة الملاحة" : "Start Live Guidance"}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 1.C: ACTIVE LIVE NAVIGATION HUD PANEL */}
                {viewState === "navigating" && activeTrip && (
                  <div className="flex-1 flex flex-col min-h-0 space-y-4">
                    {/* TOP SUMMARY PIN AT NAV */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                          <CheckCircle size={10} />
                          {language === "ar" ? "الملاحة المباشرة نشطة" : "LIVE SATELLITE HUD ON"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {activeTrip.label.split("➔")[0]}
                        </span>
                      </div>
                      <h3 className="text-md font-black text-white truncate">{activeTrip.label}</h3>
                    </div>

                    {/* SENSOR TILES HUD GRID */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-center flex flex-col justify-between h-20">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                          {language === "ar" ? "السرعة" : "LIVE SPEED"}
                        </span>
                        <p className="text-xl font-black text-white font-mono tracking-tighter">
                          {currentSpeed}
                        </p>
                        <span className="text-[8px] text-slate-500 block">KM/H</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-center flex flex-col justify-between h-20">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                          {language === "ar" ? "المتبقي" : "ETA TIMER"}
                        </span>
                        <p className="text-xl font-black text-white font-mono tracking-tighter">
                          {Math.max(1, Math.ceil(activeTrip.durationMin * (1 - tripProgress / 100)))}
                        </p>
                        <span className="text-[8px] text-slate-500 block">MIN</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-center flex flex-col justify-between h-20">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                          {language === "ar" ? "التوفير" : "ECO SAVED"}
                        </span>
                        <p className="text-xl font-black text-emerald-400 font-mono tracking-tighter">
                          {tripCarbonSaved > 0
                            ? tripCarbonSaved.toFixed(2)
                            : ((activeTrip.distanceKm || 4) * (tripProgress / 100) * 0.12).toFixed(2)}
                        </p>
                        <span className="text-[8px] text-emerald-500 font-bold block">KG CO₂</span>
                      </div>
                    </div>

                    {/* OFF ROUTE ALERT BANNER */}
                    {isOffRoute && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-rose-400 animate-bounce" />
                          <p className="text-[11px] text-rose-400 font-bold">
                            {language === "ar" ? "تنبيه: لقد حِدت عن مسار التوجيه!" : "Warning: Off-route deviation detected!"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (userLocation) {
                              setFromCoords({ lat: userLocation[0], lon: userLocation[1] });
                              handlePlanTrip();
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-500 text-white rounded-md text-[9px] font-black uppercase cursor-pointer"
                        >
                          {language === "ar" ? "إعادة توجيه" : "Recalculate"}
                        </button>
                      </motion.div>
                    )}

                    {/* PROGRESS BAR TRACK */}
                    <div className="relative h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full"
                        animate={{ width: `${tripProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {/* STOP-BY-STOP GUIDANCE TIMELINE VIEW */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0 bg-slate-950/40 p-4 border border-white/5 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">
                        {language === "ar" ? "متابعة النقاط الخطية" : "Transit Stop Sequence Tracker"}
                      </p>

                      {activeTrip.stationsList && activeTrip.stationsList.length > 0 ? (
                        <div className="relative pl-5 border-l border-white/10 space-y-4 ml-2 py-1 rtl:pl-0 rtl:pr-5 rtl:border-l-0 rtl:border-r">
                          {activeTrip.stationsList.map((st: any, idx: number) => {
                            const isApproaching = approachingStation?.id === st.id;
                            const isPassed = announcedStations.includes(st.id) && !isApproaching;

                            return (
                              <div key={st.id} className="relative flex flex-col gap-1">
                                <div className="absolute -left-[27px] rtl:-right-[27px] rtl:-left-auto top-1 z-10 flex items-center justify-center">
                                  {isApproaching ? (
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                  ) : isPassed ? (
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                  ) : (
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-white/10" />
                                  )}
                                </div>
                                <div className="flex justify-between items-center pr-1">
                                  <span
                                    className={`text-xs font-bold ${
                                      isApproaching
                                        ? "text-emerald-400 text-sm font-black"
                                        : isPassed
                                          ? "text-slate-500 line-through"
                                          : "text-slate-300"
                                    }`}
                                  >
                                    {language === "ar" ? st.name_ar : st.name_en}
                                  </span>
                                  {isApproaching && (
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[8px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse">
                                      {language === "ar" ? "قريباً" : "APPROACHING"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-500 text-xs">
                          <p className="font-semibold mb-1">📍 {language === "ar" ? "تتبع المسار جاري حالياً" : "Direct Tracking Active"}</p>
                          <p className="text-[10px] text-slate-500">{language === "ar" ? "رصد الإحداثيات عبر مستشعرات OSRM" : "Live OSRM dynamic updates"}</p>
                        </div>
                      )}
                    </div>

                    {/* FINISH DRIVE ACTION */}
                    <button
                      onClick={handleStopNavigation}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-2xl text-xs tracking-wider transition-all border border-white/5 cursor-pointer mt-2"
                    >
                      {language === "ar" ? "إنهاء الملاحة المباشرة" : "Terminate Live Navigation"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: NETWORK DIRECTORY */}
            {sidebarTab === "directory" && (
              <motion.div
                key="directoryTab"
                initial={{ opacity: 0, x: isRtl ? 15 : -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? -15 : 15 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0 space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-200">
                    {language === "ar" ? "شبكة وخطوط مواصلات عاصمتنا" : "Cairo Mass Transit Networks"}
                  </h2>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    {language === "ar" ? "المسارات والتعرفات المعتمدة ٢٠٢٦" : "Official transit corridors & tariff indices"}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
                  {dbRoutes.map((route) => (
                    <div
                      key={route.route_id}
                      onClick={() => handleSelectDirectoryRoute(route)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-3 group ${
                        activeDirectoryRoute?.route_id === route.route_id
                          ? "bg-slate-900 border-emerald-500/40"
                          : "bg-slate-900/40 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div
                        className="absolute top-0 right-0 left-0 h-1"
                        style={{ backgroundColor: route.line_color || "#38bdf8" }}
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-white">
                            {language === "ar" ? route.route_name_ar : route.route_name_en}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-bold block">
                            {route.operator_name}
                          </span>
                        </div>
                        <div
                          className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"
                          style={{ color: route.line_color || "#fff" }}
                        >
                          {getModelIcon(route.mode_type, "w-4 h-4")}
                        </div>
                      </div>

                      <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                          {language === "ar" ? "المحطات الرئيسية" : "Key Stations Nodes"}
                        </p>
                        <div className="space-y-1">
                          {route.stations?.slice(0, 3).map((st: any, i: number) => (
                            <p key={i} className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 truncate">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: route.line_color || "#94a3b8" }}
                              />
                              <span className="truncate">{language === "ar" ? st.transport_stations.station_name_ar : st.transport_stations.station_name_en}</span>
                            </p>
                          ))}
                          {(route.stations?.length || 0) > 3 && (
                            <p className="text-[10px] text-slate-500 font-bold italic ml-3.5 mt-1">
                              {language === "ar" ? `+ ${route.stations.length - 3} محطات أخرى` : `+ ${route.stations.length - 3} more stations`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">
                            {language === "ar" ? "تعريفة الخط" : "Tariff Tier"}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-400">
                            {route.prices && route.prices.length > 0
                              ? Math.min(...route.prices.map((p) => p.price_egp))
                              : 10}{" "}
                            EGP
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                          <Eye size={12} />
                          <span>{language === "ar" ? "تحديد المسلك" : "Map Route"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 3: HIGH FIDELITY SUSTAINABILITY LOGS & METRICS */}
            {sidebarTab === "analytics" && (
              <motion.div
                key="analyticsTab"
                initial={{ opacity: 0, x: isRtl ? 15 : -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? -15 : 15 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0 space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-200">
                    {language === "ar" ? "سجل الأثر البيئي للكربون" : "Carbon Saving & Eco Footprint"}
                  </h2>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    {language === "ar" ? "مكاسبك والتوفير التركمي لبيئتنا" : "Incremental ecosystem metrics representing your commutes"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      {language === "ar" ? "الأكثر استخداماً" : "Peak Mode"}
                    </span>
                    <h4 className="font-extrabold text-white text-md">Metro L3</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">32% of total transfers</p>
                  </div>
                  <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      {language === "ar" ? "الوفر التراكمي" : "Est. CO₂ Saved"}
                    </span>
                    <h4 className="font-extrabold text-emerald-400 text-md">14.2 kg</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Compared to private driving</p>
                  </div>
                </div>

                {/* TRIP HISTORY STREAM */}
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 px-1">
                    <History size={11} className="text-slate-400" />
                    {language === "ar" ? " سجل رحلات مو-إيكو المكتملة" : "Completed Carbon-Safe Commutes"}
                  </span>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-0">
                    {tripHistory.length > 0 ? (
                      tripHistory.map((trip) => (
                        <div key={trip.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl flex justify-between items-center">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                              {getModelIcon(trip.mode, "w-4 h-4")}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-[11px] font-bold text-white truncate max-w-[170px]">{trip.label}</h5>
                              <span className="text-[9px] text-slate-500 font-medium block mt-0.5">{trip.date}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-400 font-mono">
                              +{trip.carbonSaved} kg
                            </span>
                            <span className="text-[9px] text-slate-500 block font-bold uppercase mt-0.5">
                              {trip.cost} EGP
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center bg-slate-900/30 rounded-2xl border border-white/5">
                        <Clock size={20} className="text-slate-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">{language === "ar" ? "لا توجد رحلات مسجلة بعد" : "No completed commutes cataloged"}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{language === "ar" ? "ابدأ رحلة ملاحية لتلقي الإحصائيات" : "Initialize a commute navigation to secure Eco stamps"}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                    <Leaf size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-emerald-400">{language === "ar" ? "رؤية النقل الذكي النبيلة" : "Smart Transport Vision"}</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{language === "ar" ? "تأصيل كفاءة النقل العام الكهربائي والذكي لربوع الجمهورية المصرية." : "Advancing electric rails and sustainable shared mobility to transform city life."}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT COLUMN: FULL-SCREEN NATIVE LEAFLET MAP */}
      <div className="absolute inset-0 md:relative md:flex-1 h-full z-0 order-1 md:order-2">
        <MapContainer
          ref={mapRef}
          center={currentMapCenter}
          zoom={14}
          zoomControl={false}
          className="w-full h-full transition-all duration-[1000ms]"
        >
          <TileLayer
            url={
              theme === "dark"
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ &copy; OpenStreetMap contributors"
          />
          <MapUpdater center={currentMapCenter} bounds={mapBounds} />
          <Map3DController />

          {/* User Marker / Simulation location */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={L.divIcon({
                className: "user-gps-tracking-pin",
                html: `<div class="relative w-10 h-10 flex items-center justify-center">
                         <div class="absolute inset-0 bg-blue-500/40 rounded-full animate-ping"></div>
                         <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-xl"></div>
                       </div>`,
              })}
            />
          )}

          {/* Highlighted planner route lines */}
          {routeResult?.modes && viewState === "planner" && (
            (() => {
              const selMode = routeResult.modes.find((m: any) => m.id === selectedResultModeId) || routeResult.modes[0];
              if (!selMode) return null;
              if (selMode.legs) {
                return selMode.legs.map((leg: any, idx: number) => (
                  <Polyline
                    key={idx}
                    positions={leg.geometry.map((pt: any) => [pt.lat, pt.lon])}
                    color={leg.color || "#10b981"}
                    weight={6}
                    opacity={0.8}
                    lineCap="round"
                  />
                ));
              } else if (selMode.geometry) {
                return (
                  <Polyline
                    positions={selMode.geometry}
                    color={selMode.color || "#10b981"}
                    weight={6}
                    opacity={0.8}
                    lineCap="round"
                  />
                );
              }
              return null;
            })()
          )}

          {/* Actively Navigating line highlights */}
          {viewState === "navigating" && activeTrip?.geometry && (
            <Polyline
              positions={activeTrip.geometry}
              color={activeTrip.color || "#10b981"}
              weight={8}
              opacity={0.9}
              lineCap="round"
            />
          )}

          {/* Directory selected route line highlights */}
          {sidebarTab === "directory" && activeDirectoryRoute && activeDirectoryRoute.stations && (
            <Polyline
              positions={activeDirectoryRoute.stations.map((st: any) => [
                st.transport_stations.geom.coordinates[1],
                st.transport_stations.geom.coordinates[0],
              ])}
              color={activeDirectoryRoute.line_color || "#38bdf8"}
              weight={8}
              opacity={0.85}
              lineCap="round"
            />
          )}

          {/* Station Markers overlay */}
          {viewState !== "navigating" &&
            dbStations.map((station) => {
              const pos = [station.geom.coordinates[1], station.geom.coordinates[0]] as [number, number];
              const isHighlighted = highlightedStations.includes(station.station_id);

              return (
                <Marker
                  key={station.station_id}
                  position={pos}
                  icon={L.divIcon({
                    className: `station-node-dot-pin ${isHighlighted ? "z-[250]" : ""}`,
                    html: `<div class="relative group cursor-pointer">
                             ${isHighlighted ? `<div class="absolute -inset-2 bg-emerald-500 rounded-full animate-ping opacity-60"></div>` : ""}
                             <div class="w-3 h-3 bg-white border border-slate-950 rounded-full shadow-lg hover:scale-125 transition-transform"></div>
                           </div>`,
                  })}
                >
                  <Popup className="custom-popup-clean-native">
                    <div className="bg-slate-950 border border-white/10 p-3.5 rounded-2xl text-white shadow-2xl text-center min-w-[180px]" dir="auto">
                      <h5 className="font-extrabold text-sm border-b border-white/5 pb-2 mb-2">
                        {language === "ar" ? station.station_name_ar : station.station_name_en}
                      </h5>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                        <span>{language === "ar" ? "النوع" : "Type"}</span>
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase font-mono">{station.station_type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setFromStationId(station.station_id);
                            setFromQuery(language === "ar" ? station.station_name_ar : station.station_name_en);
                            setFromCoords({ lat: pos[0], lon: pos[1] });
                            notificationService.success(
                              language === "ar"
                                ? `تم تعيين ${station.station_name_ar} كنقطة انطلاق`
                                : `Departure set to ${station.station_name_en}`
                            );
                          }}
                          className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                        >
                          {language === "ar" ? "كانطلاق" : "From Here"}
                        </button>
                        <button
                          onClick={() => {
                            setToStationId(station.station_id);
                            setToQuery(language === "ar" ? station.station_name_ar : station.station_name_en);
                            setToCoords({ lat: pos[0], lon: pos[1] });
                            notificationService.success(
                              language === "ar"
                                ? `تم تعيين ${station.station_name_ar} كنقطة وصول`
                                : `Destination set to ${station.station_name_en}`
                            );
                          }}
                          className="px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                        >
                          {language === "ar" ? "كوصول" : "To Here"}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Active Trip Live Vehicle Icon */}
          {viewState === "navigating" && activeTrip && currentMapCenter && (
            <Marker
              position={currentMapCenter}
              icon={L.divIcon({
                className: "nav-active-avatar",
                html: `<div class="relative flex items-center justify-center">
                         <div class="absolute w-12 h-12 bg-emerald-400/20 rounded-full animate-ping"></div>
                         <div class="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border-2 shadow-2xl relative z-10 text-md" style="border-color: ${activeTrip.color || "#10b981"}">
                           <span>${activeTrip.mode_type === "metro" ? "🚇" : activeTrip.mode_type === "bus" ? "🚌" : "🚗"}</span>
                         </div>
                       </div>`,
              })}
            />
          )}

          {/* Live tracking simulated vehicles */}
          {viewState !== "navigating" &&
            liveVehicles.map((v) => {
              const lat = v.current_location?.lat ?? v.current_location?.coordinates?.[1];
              const lng = v.current_location?.lng ?? v.current_location?.lon ?? v.current_location?.coordinates?.[0];
              if (lat === undefined || lng === undefined) return null;

              return (
                <Marker
                  key={v.id}
                  position={[lat, lng]}
                  icon={L.divIcon({
                    className: "live-vehicle-marker",
                    html: `<div class="relative group cursor-pointer">
                             <div class="w-8 h-8 bg-slate-950 border border-cyan-500/50 rounded-lg flex items-center justify-center text-sm shadow-xl hover:scale-110 transition-transform">
                               ${v.type?.includes("metro") ? "🚇" : v.type?.includes("bus") ? "🚌" : "🚗"}
                             </div>
                           </div>`,
                  })}
                >
                  <Popup>
                    <div className="bg-slate-900 border border-white/10 p-3 rounded-xl text-white min-w-[180px]" dir="auto">
                      <div className="flex items-center gap-1.5 mb-1 bg-white/5 px-2 py-0.5 rounded-md w-fit">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[8px] font-extrabold uppercase text-emerald-400 tracking-wider">LIVE DATA</span>
                      </div>
                      <h5 className="font-bold text-xs">{language === "ar" ? v.name_ar || v.name : v.name}</h5>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block mt-1">{v.type}</span>
                      <div className="mt-2.5 bg-slate-950 p-2 rounded-lg border border-white/5">
                        <span className="text-[8px] text-slate-500 font-bold block uppercase">{language === "ar" ? "المحطة الحالية" : "Current Stop"}</span>
                        <span className="text-xs font-bold truncate block">{language === "ar" ? v.current_station_ar || v.current_station : v.current_station}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* FLOATING ZOOM AND SATELLITE CONTROLS */}
        <div className="absolute top-4 right-4 z-[70] flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setIs3D(!is3D)}
            className={`w-11 h-11 rounded-xl shadow-2xl flex items-center justify-center text-white border transition-colors cursor-pointer ${
              is3D ? "bg-emerald-600 border-emerald-400" : "bg-slate-950/90 border-white/10 hover:bg-slate-900"
            }`}
            title="3D Tilt View"
          >
            <MapIcon size={18} />
          </button>
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`w-11 h-11 rounded-xl shadow-2xl flex items-center justify-center text-white border transition-colors cursor-pointer ${
              isFocusMode ? "bg-purple-600 border-purple-400" : "bg-slate-950/90 border-white/10 hover:bg-slate-900"
            }`}
            title="Focus Mode"
          >
            <ShieldAlert size={18} />
          </button>
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomIn();
              }
            }}
            className="w-11 h-11 bg-slate-950/90 hover:bg-slate-900 border border-white/10 rounded-xl shadow-2xl flex items-center justify-center text-white cursor-pointer"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomOut();
              }
            }}
            className="w-11 h-11 bg-slate-950/90 hover:bg-slate-900 border border-white/10 rounded-xl shadow-2xl flex items-center justify-center text-white cursor-pointer"
          >
            <span className="text-lg font-bold">−</span>
          </button>
        </div>

        {/* FLOATING TOP STATUS BADGE */}
        <div className="absolute top-4 left-4 z-[70] bg-slate-950/90 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2.5 shadow-2xl pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
            {language === "ar" ? "إشارة GPS نشطة ومؤمنة" : "GPS Satellite secured"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransportHub;
