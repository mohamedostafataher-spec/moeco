import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { transportLines } from "./constants/transportData";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, '').trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(url, key);

// Route configuration mapping between frontend constant IDs and stable database UUIDs
const routeMapping = [
  {
    constId: 'metro-1',
    route_id: 'ef85ad1c-d06f-41ae-a854-3fc9bbb24612',
    name_ar: 'الخط الأول للمترو (حلوان - المرج الجديدة)',
    name_en: 'Metro Line 1 (Helwan - New El Marg)',
    mode_type: 'metro',
    operator_name: 'ECM (Egyptian Company for Metro)',
    line_color: '#0000FF',
    prices: [
      { units_min: 1, units_max: 9, price_egp: 10, egp_price_concession: 5 },
      { units_min: 10, units_max: 16, price_egp: 12, egp_price_concession: 6 },
      { units_min: 17, units_max: 23, price_egp: 15, egp_price_concession: 7.5 },
      { units_min: 24, units_max: null, price_egp: 20, egp_price_concession: 10 }
    ]
  },
  {
    constId: 'metro-2',
    route_id: 'a376b8b2-f64d-4639-8e8e-d03c3f09122b',
    name_ar: 'الخط الثاني للمترو (شبرا الخيمة - المنيب)',
    name_en: 'Metro Line 2 (Shobra El Kheima - El Mounib)',
    mode_type: 'metro',
    operator_name: 'ECM (Egyptian Company for Metro)',
    line_color: '#FF0000',
    prices: [
      { units_min: 1, units_max: 9, price_egp: 10, egp_price_concession: 5 },
      { units_min: 10, units_max: 16, price_egp: 12, egp_price_concession: 6 },
      { units_min: 17, units_max: 23, price_egp: 15, egp_price_concession: 7.5 },
      { units_min: 24, units_max: null, price_egp: 20, egp_price_concession: 10 }
    ]
  },
  {
    constId: 'metro-3',
    route_id: '9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1',
    name_ar: 'الخط الثالث للمترو (عدلي منصور - جامعة القاهرة)',
    name_en: 'Metro Line 3 (Adly Mansour - Cairo Univ)',
    mode_type: 'metro',
    operator_name: 'RATP Dev Cairo / NAT',
    line_color: '#00FF00',
    prices: [
      { units_min: 1, units_max: 9, price_egp: 10, egp_price_concession: 5 },
      { units_min: 10, units_max: 16, price_egp: 12, egp_price_concession: 6 },
      { units_min: 17, units_max: 23, price_egp: 15, egp_price_concession: 7.5 },
      { units_min: 24, units_max: null, price_egp: 20, egp_price_concession: 10 }
    ]
  },
  {
    constId: 'metro-4',
    route_id: '4ae3c7e5-2702-454c-8761-dca79243a0c8',
    name_ar: 'الخط الرابع للمترو (تحت الإنشاء)',
    name_en: 'Metro Line 4 (Under Construction)',
    mode_type: 'metro',
    operator_name: 'Ministry of Transport / NAT',
    line_color: '#FFFF00',
    prices: [
      { units_min: 1, units_max: 9, price_egp: 10, egp_price_concession: 5 },
      { units_min: 10, units_max: 16, price_egp: 12, egp_price_concession: 6 },
      { units_min: 17, units_max: 23, price_egp: 15, egp_price_concession: 7.5 },
      { units_min: 24, units_max: null, price_egp: 20, egp_price_concession: 10 }
    ]
  },
  {
    constId: 'monorail-east',
    route_id: 'cee44cfa-d5f4-4bf2-b8ff-650a132bfc19',
    name_ar: 'مونوريل شرق النيل',
    name_en: 'East Nile Monorail',
    mode_type: 'monorail',
    operator_name: 'Alstom Egypt / NAT',
    line_color: '#FFA500',
    prices: [
      { units_min: 1, units_max: null, price_egp: 20, egp_price_concession: 10 }
    ]
  },
  {
    constId: 'cairo-monorail-west',
    route_id: '897dd7b2-c0e4-46df-a8b2-b12e3f4da891',
    name_ar: 'مونوريل غرب النيل',
    name_en: 'West Nile Monorail',
    mode_type: 'monorail',
    operator_name: 'Alstom Egypt / NAT',
    line_color: '#800080',
    prices: [
      { units_min: 1, units_max: null, price_egp: 20, egp_price_concession: 10 }
    ]
  },
  {
    constId: 'lrt-egypt',
    route_id: '7892b1da-f155-4422-91f1-33124df8ac12',
    name_ar: 'القطار الكهربائي الخفيف (LRT)',
    name_en: 'Light Rail Transit (LRT)',
    mode_type: 'lrt',
    operator_name: 'RATP Dev Cairo / NAT',
    line_color: '#00FFFF',
    prices: [
      { units_min: 1, units_max: 3, price_egp: 10, egp_price_concession: 5 },
      { units_min: 4, units_max: 7, price_egp: 15, egp_price_concession: 7.5 },
      { units_min: 8, units_max: null, price_egp: 20, egp_price_concession: 10 }
    ]
  },
  {
    constId: 'brt-ring-road',
    route_id: '5b172a91-faab-467f-972a-9e12ff48123a',
    name_ar: 'الأوتوبيس الترددي السريع (BRT) - الطريق الدائري',
    name_en: 'Bus Rapid Transit (BRT) - Ring Road',
    mode_type: 'brt',
    operator_name: 'Ministry of Transport / Mova',
    line_color: '#FF6D00',
    prices: [
      { units_min: 1, units_max: 5, price_egp: 15, egp_price_concession: 10 },
      { units_min: 6, units_max: 12, price_egp: 20, egp_price_concession: 15 },
      { units_min: 13, units_max: 25, price_egp: 25, egp_price_concession: 20 },
      { units_min: 26, units_max: null, price_egp: 35, egp_price_concession: 25 }
    ]
  },
  {
    constId: 'alex-tram-blue',
    route_id: 'a87f1cb2-2e11-4775-812d-a1288cd916c2',
    name_ar: 'ترام الإسكندرية (الخط الأزرق)',
    name_en: 'Alexandria Tram (Blue Line)',
    mode_type: 'tram',
    operator_name: 'Alexandria Passenger Transport Authority',
    line_color: '#1E90FF',
    prices: [
      { units_min: 1, units_max: null, price_egp: 5, egp_price_concession: 2.5 }
    ]
  },
  {
    constId: 'rail-cairo-alex',
    route_id: 'b12c8dfd-e0cb-4671-88df-b1129cbda12a',
    name_ar: 'سكك حديد مصر (القاهرة - الإسكندرية)',
    name_en: 'Egypt Rail (Cairo - Alex)',
    mode_type: 'train',
    operator_name: 'Egyptian National Railways (ENR)',
    line_color: '#000000',
    prices: [
      { units_min: 1, units_max: null, price_egp: 50, egp_price_concession: 25 }
    ]
  },
  {
    constId: 'rail-cairo-aswan',
    route_id: 'c23d9efe-f1dc-4782-99ef-c2230dcfa23b',
    name_ar: 'سكك حديد مصر (القاهرة - أسوان)',
    name_en: 'Egypt Rail (Cairo - Aswan)',
    mode_type: 'train',
    operator_name: 'Egyptian National Railways (ENR)',
    line_color: '#000000',
    prices: [
      { units_min: 1, units_max: null, price_egp: 80, egp_price_concession: 40 }
    ]
  }
];

// Mapping for core stations to maintain fixed stable database UUIDs for spatial/analytical continuity
const stationNameToUUID: Record<string, string> = {
  "حلوان": "5c0f1ab1-789a-413d-815d-a123bc456e71",
  "السادات": "d7890a1c-324b-4b10-85f1-3d2f9bc24a12",
  "الشهداء": "f156bc8a-45d2-43fa-b12e-a12fbc45ea13",
  "جامعة القاهرة": "bc8fab1c-bcde-4211-85fd-e1bcdef24a14",
  "عدلي منصور": "ad12b34c-45ef-45fa-b12f-3bcdef123abc",
  "الاستاد": "d156ef12-42ef-45fa-b15a-4bcdef156bc2",
  "مدينة الفنون والثقافة": "a89dec12-3df4-411a-12eb-f12bcde45f12",
  "التجمع": "6eab9780-45df-4a11-85fa-a123cbfa3412",
  "المنيب": "100f8c53-45df-4a11-85fa-a123cbfa3412"
};

function getUuidForStation(nameEn: string, nameAr: string): string {
  const normAr = nameAr.trim();
  if (stationNameToUUID[normAr]) return stationNameToUUID[normAr];
  
  let hash = 0;
  const combined = nameEn.trim();
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padEnd(8, '0').substring(0, 8);
  return `${hex}-45df-4a11-85fa-a123cbfa3412`;
}

function getStationType(modeType: string, stationNameAr: string): string {
  const normAr = stationNameAr.trim();
  if (['السادات', 'الشهداء', 'العتبة', 'جمال عبدالناصر', 'جامعة القاهرة', 'عدلي منصور', 'الاستاد', 'سيدي جابر', 'وادي النيل'].includes(normAr)) {
    return 'interchange';
  }
  if (modeType === 'monorail' || modeType === 'lrt') {
    return 'elevated';
  }
  if (modeType === 'metro') {
    if (['عدلي منصور', 'الهايكستب', 'عمر بن الخطاب', 'قباء', 'هشام بركات', 'النزهة', 'الطريق الدائري'].includes(normAr)) {
      return 'elevated';
    }
    if (['جامعة القاهرة', 'بولاق الدكرور', 'محور روض الفرج'].includes(normAr)) {
      return 'at-grade';
    }
    return 'underground';
  }
  return 'at-grade';
}

function getGovernorate(lineId: string, stationNameAr: string, defaultGov?: string): string {
  const normAr = stationNameAr.trim();
  if (['الجيزة', 'الدقي', 'البحوث', 'فيصل', 'ساقية مكي', 'المنيب', 'أم المصريين', 'الكيت كات', 'التوفيقية', 'وادي النيل', 'جامعة الدول', 'بولاق الدكرور', 'السودان', 'إمبابة', 'البوهي', 'القومية العربية', 'الطريق الدائري', 'محور روض الفرج'].includes(normAr)) {
    return 'Giza';
  }
  if (lineId.startsWith('alex-') || defaultGov === 'Alexandria') {
    return 'Alexandria';
  }
  return defaultGov || 'Cairo';
}

async function sync() {
  console.log("Starting Egyptian Transit Network Master Seeder (2026)...");

  // 1. Filter constants representing our targeted routes
  const routesToSync = routeMapping.map(mapConfig => {
    const matchedLine = transportLines.find(line => line.id === mapConfig.constId);
    if (!matchedLine) {
      throw new Error(`Critical Error: Frontend line with constant ID '${mapConfig.constId}' not found in constants/transportData.ts`);
    }
    return {
      ...mapConfig,
      stations: matchedLine.stations
    };
  });

  console.log(`Matched ${routesToSync.length} routes from constants to write to database.`);

  // 2. Clear old database records for target routes
  const targetRouteIds = routesToSync.map(r => r.route_id);
  console.log("Cleaning up target routes' old linkages and prices in DB...");
  await supabase.from('transport_route_stations').delete().in('route_id', targetRouteIds);
  await supabase.from('transport_prices').delete().in('route_id', targetRouteIds);

  // 3. Upsert routes themselves into 'transport_routes' table
  console.log("Upserting routes into transport_routes...");
  const routesToUpsert = routesToSync.map(r => ({
    route_id: r.route_id,
    route_name_ar: r.name_ar,
    route_name_en: r.name_en,
    mode_type: r.mode_type,
    operator_name: r.operator_name,
    line_color: r.line_color,
    is_active: true
  }));

  const { error: routeUpsertErr } = await supabase
    .from('transport_routes')
    .upsert(routesToUpsert, { onConflict: 'route_id' });

  if (routeUpsertErr) {
    console.error("Error upserting routes:", routeUpsertErr);
    return;
  }
  console.log("Routes metadata successfully upserted!");

  // 4. Collect and prepare station list across all routes
  const allStationsToUpsert: any[] = [];
  const uniqueStationIds = new Set<string>();

  routesToSync.forEach(route => {
    route.stations.forEach(st => {
      const uuid = getUuidForStation(st.name_en, st.name_ar);
      if (!uniqueStationIds.has(uuid)) {
        uniqueStationIds.add(uuid);
        allStationsToUpsert.push({
          station_id: uuid,
          station_name_ar: st.name_ar.trim(),
          station_name_en: st.name_en.trim(),
          geom: `POINT(${st.lng} ${st.lat})`, // Point in GIS: 'POINT(lon lat)'
          station_type: getStationType(route.mode_type, st.name_ar),
          governorate: getGovernorate(route.constId, st.name_ar, route.stations[0]?.id === 'Victoria' ? 'Alexandria' : 'Cairo'),
          operating_hours_start: '05:00:00',
          operating_hours_end: '01:00:00',
          station_density_level: 'moderate',
          station_status: 'active'
        });
      }
    });
  });

  console.log(`Upserting ${allStationsToUpsert.length} physical station nodes in transport_stations...`);
  const { error: stationUpsertError } = await supabase
    .from('transport_stations')
    .upsert(allStationsToUpsert, { onConflict: 'station_id' });

  if (stationUpsertError) {
    console.error("Error upserting stations:", stationUpsertError);
    return;
  }
  console.log("Stations successfully upserted into PostGIS!");

  // 5. Build station sequence linkages and price entries
  const linkInserts: any[] = [];
  const priceInserts: any[] = [];

  for (const syncedRoute of routesToSync) {
    const routeUuid = syncedRoute.route_id;
    console.log(`Compiling sequence for ${syncedRoute.name_en} -> [DB Route: ${routeUuid}] with ${syncedRoute.stations.length} stations`);

    syncedRoute.stations.forEach((st, idx) => {
      const stationUuid = getUuidForStation(st.name_en, st.name_ar);
      linkInserts.push({
        route_id: routeUuid,
        station_id: stationUuid,
        station_order: idx + 1 // 1-indexed order mapping
      });
    });

    syncedRoute.prices.forEach(pr => {
      priceInserts.push({
        route_id: routeUuid,
        units_min: pr.units_min,
        units_max: pr.units_max,
        price_egp: pr.price_egp,
        egp_price_concession: pr.egp_price_concession,
        is_subscription_only: false
      });
    });
  }

  // 6. Bulk Insert database linkages
  console.log(`Inserting ${linkInserts.length} records into transport_route_stations (junction)...`);
  const { error: linkErr } = await supabase.from('transport_route_stations').insert(linkInserts);
  if (linkErr) {
    console.error("Linkage insertion failure:", linkErr);
  } else {
    console.log("Dynamic transit network linkage built successfully!");
  }

  // 7. Bulk Insert price tiers
  console.log(`Inserting ${priceInserts.length} records into transport_prices...`);
  const { error: priceErr } = await supabase.from('transport_prices').insert(priceInserts);
  if (priceErr) {
    console.error("Pricing insertion failure:", priceErr);
  } else {
    console.log("Dynamic 2026 pricing index compiled successfully!");
  }

  console.log("\nEgypt Mass Transit Database Synchronization Complete!");
}

sync();
