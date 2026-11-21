import { supabase } from "./supabaseClient";

export interface TransportRoute {
  route_id: string;
  route_name_ar: string;
  route_name_en: string;
  mode_type: string;
  operator_name: string;
  line_color: string;
  is_active: boolean;
  stations?: TransportRouteStation[];
  prices?: TransportPrice[];
}

export interface TransportStation {
  station_id: string;
  station_name_ar: string;
  station_name_en: string;
  geom: { type: string; coordinates: [number, number] };
  station_type: string;
  governorate: string;
  station_status?: string;
  interchange_with?: string[];
}

export interface TransportRouteStation {
  station_order: number;
  station_id: string;
  transport_stations: TransportStation;
}

export interface TransportPrice {
  price_id: string;
  route_id: string;
  units_min: number;
  units_max: number | null;
  price_egp: number;
  egp_price_concession: number;
  is_subscription_only?: boolean;
}

const CAIRO_METRO_SEED: TransportRoute[] = [
  {
    route_id: "m_l1",
    route_name_ar: "مترو القاهرة الخط الأول",
    route_name_en: "Cairo Metro Line 1",
    mode_type: "metro",
    operator_name: "ECM",
    line_color: "#ef4444",
    is_active: true,
    stations: [
      {
        station_order: 1,
        station_id: "helwan",
        transport_stations: {
          station_id: "helwan",
          station_name_ar: "حلوان",
          station_name_en: "Helwan",
          geom: { type: "Point", coordinates: [31.3323, 29.8488] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 2,
        station_id: "helwan_univ",
        transport_stations: {
          station_id: "helwan_univ",
          station_name_ar: "جامعة حلوان",
          station_name_en: "Helwan University",
          geom: { type: "Point", coordinates: [31.3283, 29.8667] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 3,
        station_id: "maadi",
        transport_stations: {
          station_id: "maadi",
          station_name_ar: "المعادي",
          station_name_en: "Maadi",
          geom: { type: "Point", coordinates: [31.2575, 29.9602] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 4,
        station_id: "sayeda_zeinab",
        transport_stations: {
          station_id: "sayeda_zeinab",
          station_name_ar: "السيدة زينب",
          station_name_en: "Sayeda Zeinab",
          geom: { type: "Point", coordinates: [31.2369, 30.0264] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 5,
        station_id: "sadat",
        transport_stations: {
          station_id: "sadat",
          station_name_ar: "السادات",
          station_name_en: "Sadat",
          geom: { type: "Point", coordinates: [31.2335, 30.0442] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l2", "m_l3"],
        },
      },
      {
        station_order: 6,
        station_id: "nasser",
        transport_stations: {
          station_id: "nasser",
          station_name_ar: "جمال عبدالناصر",
          station_name_en: "Gamal Abdel Nasser",
          geom: { type: "Point", coordinates: [31.2393, 30.0528] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l3"],
        },
      },
      {
        station_order: 7,
        station_id: "al_shohadaa",
        transport_stations: {
          station_id: "al_shohadaa",
          station_name_ar: "الشهداء",
          station_name_en: "Al Shohadaa",
          geom: { type: "Point", coordinates: [31.2464, 30.0617] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l2"],
        },
      },
      {
        station_order: 8,
        station_id: "ghamra",
        transport_stations: {
          station_id: "ghamra",
          station_name_ar: "غمرة",
          station_name_en: "Ghamra",
          geom: { type: "Point", coordinates: [31.2678, 30.0764] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 9,
        station_id: "elmarg_new",
        transport_stations: {
          station_id: "elmarg_new",
          station_name_ar: "المرج الجديدة",
          station_name_en: "New El Marg",
          geom: { type: "Point", coordinates: [31.3400, 30.1500] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
    ],
    prices: [
      {
        price_id: "p1",
        route_id: "m_l1",
        units_min: 1,
        units_max: 9,
        price_egp: 8,
        egp_price_concession: 4,
      },
      {
        price_id: "p2",
        route_id: "m_l1",
        units_min: 10,
        units_max: 16,
        price_egp: 10,
        egp_price_concession: 5,
      },
      {
        price_id: "p3",
        route_id: "m_l1",
        units_min: 17,
        units_max: 23,
        price_egp: 15,
        egp_price_concession: 7,
      },
      {
        price_id: "p4",
        route_id: "m_l1",
        units_min: 24,
        units_max: null,
        price_egp: 20,
        egp_price_concession: 10,
      },
    ],
  },
  {
    route_id: "m_l2",
    route_name_ar: "مترو القاهرة الخط الثاني",
    route_name_en: "Cairo Metro Line 2",
    mode_type: "metro",
    operator_name: "ECM",
    line_color: "#f59e0b",
    is_active: true,
    stations: [
      {
        station_order: 1,
        station_id: "shobra",
        transport_stations: {
          station_id: "shobra",
          station_name_ar: "شبرا الخيمة",
          station_name_en: "Shobra El Kheima",
          geom: { type: "Point", coordinates: [31.25, 30.119] },
          station_type: "metro",
          governorate: "qalubia",
        },
      },
      {
        station_order: 2,
        station_id: "al_shohadaa",
        transport_stations: {
          station_id: "al_shohadaa",
          station_name_ar: "الشهداء",
          station_name_en: "Al Shohadaa",
          geom: { type: "Point", coordinates: [31.2464, 30.0617] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l1"],
        },
      },
      {
        station_order: 3,
        station_id: "attaba",
        transport_stations: {
          station_id: "attaba",
          station_name_ar: "العتبة",
          station_name_en: "Attaba",
          geom: { type: "Point", coordinates: [31.2471, 30.0522] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l3"],
        },
      },
      {
        station_order: 4,
        station_id: "sadat",
        transport_stations: {
          station_id: "sadat",
          station_name_ar: "السادات",
          station_name_en: "Sadat",
          geom: { type: "Point", coordinates: [31.2335, 30.0442] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l1"],
        },
      },
      {
        station_order: 5,
        station_id: "dokki",
        transport_stations: {
          station_id: "dokki",
          station_name_ar: "الدقي",
          station_name_en: "Dokki",
          geom: { type: "Point", coordinates: [31.2132, 30.0384] },
          station_type: "metro",
          governorate: "giza",
        },
      },
      {
        station_order: 6,
        station_id: "cairo_univ",
        transport_stations: {
          station_id: "cairo_univ",
          station_name_ar: "جامعة القاهرة",
          station_name_en: "Cairo University",
          geom: { type: "Point", coordinates: [31.2001, 30.0264] },
          station_type: "metro",
          governorate: "giza",
          interchange_with: ["m_l3"],
        },
      },
      {
        station_order: 7,
        station_id: "giza_station",
        transport_stations: {
          station_id: "giza_station",
          station_name_ar: "الجيزة",
          station_name_en: "Giza",
          geom: { type: "Point", coordinates: [31.2004, 30.0101] },
          station_type: "metro",
          governorate: "giza",
        },
      },
      {
        station_order: 8,
        station_id: "elmounib",
        transport_stations: {
          station_id: "elmounib",
          station_name_ar: "المنيب",
          station_name_en: "El Mounib",
          geom: { type: "Point", coordinates: [31.2135, 29.9818] },
          station_type: "metro",
          governorate: "giza",
        },
      },
    ],
    prices: [
      {
        price_id: "p1",
        route_id: "m_l2",
        units_min: 1,
        units_max: 9,
        price_egp: 8,
        egp_price_concession: 4,
      },
      {
        price_id: "p2",
        route_id: "m_l2",
        units_min: 10,
        units_max: 16,
        price_egp: 10,
        egp_price_concession: 5,
      },
      {
        price_id: "p3",
        route_id: "m_l2",
        units_min: 17,
        units_max: null,
        price_egp: 15,
        egp_price_concession: 7,
      },
    ],
  },
  {
    route_id: "m_l3",
    route_name_ar: "مترو القاهرة الخط الثالث",
    route_name_en: "Cairo Metro Line 3",
    mode_type: "metro",
    operator_name: "RATP Dev",
    line_color: "#22c55e",
    is_active: true,
    stations: [
      {
        station_order: 1,
        station_id: "adly_mansour",
        transport_stations: {
          station_id: "adly_mansour",
          station_name_ar: "عدلي منصور",
          station_name_en: "Adly Mansour",
          geom: { type: "Point", coordinates: [31.3965, 30.1557] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["lrt"],
        },
      },
      {
        station_order: 2,
        station_id: "heliopolis",
        transport_stations: {
          station_id: "heliopolis",
          station_name_ar: "مصر الجديدة",
          station_name_en: "Heliopolis",
          geom: { type: "Point", coordinates: [31.3267, 30.0911] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 3,
        station_id: "abbassia",
        transport_stations: {
          station_id: "abbassia",
          station_name_ar: "العباسية",
          station_name_en: "Abbassia",
          geom: { type: "Point", coordinates: [31.2825, 30.0661] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 4,
        station_id: "attaba",
        transport_stations: {
          station_id: "attaba",
          station_name_ar: "العتبة",
          station_name_en: "Attaba",
          geom: { type: "Point", coordinates: [31.2471, 30.0522] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l2"],
        },
      },
      {
        station_order: 5,
        station_id: "nasser",
        transport_stations: {
          station_id: "nasser",
          station_name_ar: "جمال عبدالناصر",
          station_name_en: "Gamal Abdel Nasser",
          geom: { type: "Point", coordinates: [31.2393, 30.0528] },
          station_type: "metro",
          governorate: "cairo",
          interchange_with: ["m_l1"],
        },
      },
      {
        station_order: 6,
        station_id: "maspero",
        transport_stations: {
          station_id: "maspero",
          station_name_ar: "ماسبيرو",
          station_name_en: "Maspero",
          geom: { type: "Point", coordinates: [31.2312, 30.0532] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 7,
        station_id: "safaa_hegazy",
        transport_stations: {
          station_id: "safaa_hegazy",
          station_name_ar: "صفاء حجازي / الزمالك",
          station_name_en: "Safaa Hegazy (Zamalek)",
          geom: { type: "Point", coordinates: [31.2198, 30.0621] },
          station_type: "metro",
          governorate: "cairo",
        },
      },
      {
        station_order: 8,
        station_id: "kit_kat",
        transport_stations: {
          station_id: "kit_kat",
          station_name_ar: "الكيت كات",
          station_name_en: "Kit Kat",
          geom: { type: "Point", coordinates: [31.2120, 30.0630] },
          station_type: "metro",
          governorate: "giza",
        },
      },
      {
        station_order: 9,
        station_id: "cairo_univ",
        transport_stations: {
          station_id: "cairo_univ",
          station_name_ar: "جامعة القاهرة",
          station_name_en: "Cairo University",
          geom: { type: "Point", coordinates: [31.2001, 30.0264] },
          station_type: "metro",
          governorate: "giza",
          interchange_with: ["m_l2"],
        },
      },
      {
        station_order: 10,
        station_id: "rodfarag",
        transport_stations: {
          station_id: "rodfarag",
          station_name_ar: "روض الفرج",
          station_name_en: "Rod El Farag",
          geom: { type: "Point", coordinates: [31.1855, 30.0655] },
          station_type: "metro",
          governorate: "giza",
        },
      },
    ],
    prices: [
      {
        price_id: "p1",
        route_id: "m_l3",
        units_min: 1,
        units_max: 9,
        price_egp: 8,
        egp_price_concession: 4,
      },
      {
        price_id: "p2",
        route_id: "m_l3",
        units_min: 10,
        units_max: 16,
        price_egp: 10,
        egp_price_concession: 5,
      },
      {
        price_id: "p3",
        route_id: "m_l3",
        units_min: 17,
        units_max: 23,
        price_egp: 15,
        egp_price_concession: 7,
      },
      {
        price_id: "p4",
        route_id: "m_l3",
        units_min: 24,
        units_max: null,
        price_egp: 20,
        egp_price_concession: 10,
      },
    ],
  },
  {
    route_id: "monorail_e",
    route_name_ar: "مونوريل شرق النيل",
    route_name_en: "East Nile Monorail",
    mode_type: "monorail",
    operator_name: "NAT",
    line_color: "#1e3a8a",
    is_active: true,
    stations: [
      {
        station_order: 1,
        station_id: "stadium",
        transport_stations: {
          station_id: "stadium",
          station_name_ar: "الاستاد",
          station_name_en: "Stadium",
          geom: { type: "Point", coordinates: [31.3146, 30.0694] },
          station_type: "monorail",
          governorate: "cairo",
          interchange_with: ["m_l3"],
        },
      },
      {
        station_order: 2,
        station_id: "new_admin_city",
        transport_stations: {
          station_id: "new_admin_city",
          station_name_ar: "العاصمة الإدارية",
          station_name_en: "New Admin City",
          geom: { type: "Point", coordinates: [31.7583, 29.9877] },
          station_type: "monorail",
          governorate: "cairo",
        },
      },
    ],
    prices: [
      {
        price_id: "p1",
        route_id: "monorail_e",
        units_min: 1,
        units_max: null,
        price_egp: 30,
        egp_price_concession: 15,
      },
    ],
  },
  {
    route_id: "lrt",
    route_name_ar: "القطار الكهربائي الخفيف LRT",
    route_name_en: "LRT",
    mode_type: "lrt",
    operator_name: "RATP Dev",
    line_color: "#eab308",
    is_active: true,
    stations: [
      {
        station_order: 1,
        station_id: "adly_mansour",
        transport_stations: {
          station_id: "adly_mansour",
          station_name_ar: "عدلي منصور",
          station_name_en: "Adly Mansour",
          geom: { type: "Point", coordinates: [31.3965, 30.1557] },
          station_type: "lrt",
          governorate: "cairo",
          interchange_with: ["m_l3"],
        },
      },
      {
        station_order: 2,
        station_id: "cc_arts",
        transport_stations: {
          station_id: "cc_arts",
          station_name_ar: "مدينة الفنون والثقافة",
          station_name_en: "Arts and Culture City",
          geom: { type: "Point", coordinates: [31.7145, 30.0243] },
          station_type: "lrt",
          governorate: "cairo",
        },
      },
    ],
    prices: [
      {
        price_id: "p1",
        route_id: "lrt",
        units_min: 1,
        units_max: 3,
        price_egp: 15,
        egp_price_concession: 7.5,
      },
      {
        price_id: "p2",
        route_id: "lrt",
        units_min: 4,
        units_max: 7,
        price_egp: 20,
        egp_price_concession: 10,
      },
      {
        price_id: "p3",
        route_id: "lrt",
        units_min: 8,
        units_max: null,
        price_egp: 25,
        egp_price_concession: 12.5,
      },
    ],
  },
  {
    route_id: "brt_ring",
    route_name_ar: "الأتوبيس الترددي BRT الدائري",
    route_name_en: "BRT Ring Road",
    mode_type: "brt",
    operator_name: "Mova",
    line_color: "#ec4899",
    is_active: true,
    stations: [
      {
        station_order: 1,
        station_id: "adly_mansour",
        transport_stations: {
          station_id: "adly_mansour",
          station_name_ar: "عدلي منصور",
          station_name_en: "Adly Mansour",
          geom: { type: "Point", coordinates: [31.3965, 30.1557] },
          station_type: "brt",
          governorate: "cairo",
          interchange_with: ["m_l3", "lrt"],
        },
      },
      {
        station_order: 2,
        station_id: "tagamoa",
        transport_stations: {
          station_id: "tagamoa",
          station_name_ar: "التجمع",
          station_name_en: "Tagamoa",
          geom: { type: "Point", coordinates: [31.4284, 30.0163] },
          station_type: "brt",
          governorate: "cairo",
        },
      },
      {
        station_order: 3,
        station_id: "moneeb",
        transport_stations: {
          station_id: "moneeb",
          station_name_ar: "المنيب",
          station_name_en: "El Mounib",
          geom: { type: "Point", coordinates: [31.2135, 29.9818] },
          station_type: "brt",
          governorate: "giza",
          interchange_with: ["m_l2"],
        },
      },
    ],
    prices: [
      {
        price_id: "p1",
        route_id: "brt_ring",
        units_min: 1,
        units_max: null,
        price_egp: 20,
        egp_price_concession: 10,
      },
    ],
  },
];

export const transportService = {
  async getDbRoutes(includeStations = true): Promise<TransportRoute[]> {
    try {
      let query = supabase
        .from("transport_routes")
        .select(
          includeStations
            ? "*, stations:transport_route_stations(station_id, station_order, transport_stations(*)), prices:transport_prices(*)"
            : "*, prices:transport_prices(*)",
        )
        .eq("is_active", true);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        console.warn("Empty or errored transport_routes in DB, using active GIS network.");
        return CAIRO_METRO_SEED;
      }

      // Sort stations by order and dynamically enrich station_type based on route's mode_type
      return data.map((route) => {
        if (route.stations) {
          route.stations.sort(
            (a: any, b: any) => a.station_order - b.station_order,
          );
          route.stations.forEach((st: any) => {
            if (st.transport_stations) {
              st.transport_stations.station_type = route.mode_type;
            }
          });
        }
        return route;
      });
    } catch (e) {
      console.warn("Exception in getDbRoutes, using active GIS network");
      return CAIRO_METRO_SEED;
    }
  },

  async getDbStations(): Promise<TransportStation[]> {
    try {
      const { data, error } = await supabase
        .from("transport_stations")
        .select("*")
        .eq("station_status", "active");
      if (error || !data || data.length === 0) {
        const seedStats: TransportStation[] = [];
        CAIRO_METRO_SEED.forEach((r) =>
          r.stations?.forEach((s) => {
            if (!seedStats.find((x) => x.station_id === s.station_id))
              seedStats.push(s.transport_stations);
          }),
        );
        return seedStats;
      }

      // Fetch route_stations links to map database construction status to transit mode types
      let routeStations: any[] | null = null;
      try {
        const { data: rsData } = await supabase
          .from("transport_route_stations")
          .select("station_id, transport_routes(mode_type)");
        routeStations = rsData;
      } catch (e) {}

      const stationModesMap: Record<string, string> = {};
      if (routeStations) {
        routeStations.forEach((rs: any) => {
          if (rs.station_id && rs.transport_routes?.mode_type) {
            stationModesMap[rs.station_id] = rs.transport_routes.mode_type;
          }
        });
      }

      return data.map((st: any) => {
        const mode = stationModesMap[st.station_id] || "metro"; // Fallback to metro
        const enrichedSt = { ...st };
        enrichedSt.station_type = mode;
        return enrichedSt;
      });
    } catch (e) {
      const seedStats: TransportStation[] = [];
      CAIRO_METRO_SEED.forEach((r) =>
        r.stations?.forEach((s) => {
          if (!seedStats.find((x) => x.station_id === s.station_id))
            seedStats.push(s.transport_stations);
        }),
      );
      return seedStats;
    }
  },

  async getLiveVehicles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("live_transport")
        .select("*")
        .limit(500); // Updated to correct live table
      if (error || !data || data.length === 0) {
        return [];
      }
      return data.filter(
        (v) => v.current_location && typeof v.current_location.lat === "number",
      );
    } catch {
      return [];
    }
  },

  calculateTripCost(
    routeId: string,
    stationsCount: number,
    prices: TransportPrice[],
    isConcession = false,
  ): number {
    const validPrices = prices.filter(
      (p) => !p.is_subscription_only && p.route_id === routeId,
    );
    // Find matching tier
    for (const p of validPrices) {
      if (
        stationsCount >= p.units_min &&
        (p.units_max === null || stationsCount <= p.units_max)
      ) {
        return isConcession
          ? Number(p.egp_price_concession)
          : Number(p.price_egp);
      }
    }
    // Fallback if no matching tier
    return validPrices.length > 0
      ? isConcession
        ? Number(validPrices[0].egp_price_concession)
        : Number(validPrices[0].price_egp)
      : 10;
  },
};
