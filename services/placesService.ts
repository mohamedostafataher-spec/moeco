import { supabase } from './supabaseClient';
import axios from 'axios';

export interface Place {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'tourist' | 'park' | 'mall' | 'entertainment';
  lat: number;
  lng: number;
  rating?: number;
  description?: string;
  image?: string;
  distance?: number;
  phone?: string;
  source: string;
  is_official?: boolean;
  ticket_url?: string;
  city?: string;
}

export const placesService = {
  fetchLocalServicesFromOSM: async (lat: number, lng: number, radius: number = 3000): Promise<Place[]> => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["craft"~"plumber|electrician|carpenter|handicraft|mechanic"](around:${radius},${lat},${lng});
          node["shop"~"hardware|doityourself|electronics|laundry"](around:${radius},${lat},${lng});
          node["amenity"~"pharmacy|clinic|marketplace"](around:${radius},${lat},${lng});
        );
        out body;
        >;
        out skel qt;
      `;

      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await axios.get(url, { timeout: 15000 });
      
      if (!response.data || !response.data.elements) return [];

      return response.data.elements.map((el: any) => {
        const type = el.tags?.craft || el.tags?.shop || el.tags?.amenity || 'Service';
        let customCategory = 'Service';
        let recommendedValue = false;
        
        if (type.includes('plumber') || type.includes('electrician') || type.includes('carpenter') || type.includes('mechanic')) {
           customCategory = 'Maintenance';
           recommendedValue = true;
        } else if (type.includes('pharmacy') || type.includes('clinic')) {
           customCategory = 'Health';
           recommendedValue = true;
        }

        return {
          id: el.id.toString(),
          name: el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:ar'] || `${type.charAt(0).toUpperCase() + type.slice(1)} Service`,
          lat: el.lat,
          lng: el.lon,
          phone: el.tags?.phone || el.tags?.['contact:phone'] || el.tags?.['phone:ar'] || el.tags?.['phone:en'],
          type: 'entertainment', // Standardized fallback type
          source: 'OpenStreetMap-Services',
          description: el.tags?.description || `${type} service in your neighborhood`,
          rating: 4.5
        } as Place;
      }).filter((p: Place) => p.name);
    } catch (error: any) {
      if (error.code !== 'ECONNABORTED') console.error('OSM Local Services Fetch Error:', error.message || error);
      return [];
    }
  },

  /**
   * Fetches nearby places from Overpass API (OSM)
   */
  fetchNearbyFromOSM: async (lat: number, lng: number, radius: number = 2000): Promise<Place[]> => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"restaurant|cafe"](around:${radius},${lat},${lng});
          node["tourism"~"attraction|museum|viewpoint"](around:${radius},${lat},${lng});
          node["leisure"~"park|garden|playground|entertainment"](around:${radius},${lat},${lng});
          node["shop"~"mall"](around:${radius},${lat},${lng});
        );
        out body;
        >;
        out skel qt;
      `;

      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await axios.get(url, { timeout: 15000 });
      
      if (!response.data || !response.data.elements) return [];

      return response.data.elements.map((el: any) => {
        let type: Place['type'] = 'entertainment';
        if (el.tags.amenity === 'restaurant') type = 'restaurant';
        else if (el.tags.amenity === 'cafe') type = 'cafe';
        else if (el.tags.tourism) type = 'tourist';
        else if (el.tags.leisure === 'park' || el.tags.leisure === 'garden') type = 'park';
        else if (el.tags.shop === 'mall') type = 'mall';

        return {
          id: `osm-${el.id}`,
          name: el.tags['name:ar'] || el.tags['name:en'] || el.tags.name || 'مكان غير مسمى',
          type,
          lat: el.lat,
          lng: el.lon,
          rating: 4.0 + ((el.id % 10) / 10), // Deterministic rating estimate
          description: el.tags.description || el.tags.note || `مكان ${type} مميز في المنطقة`,
          source: 'OpenStreetMap',
          is_official: false
        };
      });
    } catch (error: any) {
      if (error.code !== 'ECONNABORTED') console.error('Error fetching OSM places:', error.message || error);
      return [];
    }
  },

  /**
   * Fetches official places from Supabase
   */
  fetchOfficialPlaces: async (city?: string): Promise<Place[]> => {
    try {
      let query = supabase.from('places').select('*');
      if (city) query = query.eq('city', city);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(p => ({
        ...p,
        source: p.source || 'Official Egyptian Sources',
        is_official: true
      }));
    } catch (error) {
      console.error('Error fetching official places:', error);
      return [];
    }
  },

  /**
   * Smart Recommendation Engine
   */
  getRecommendations: async (lat: number, lng: number, city: string = 'Cairo'): Promise<Place[]> => {
    try {
      // Fetch from both sources in parallel
      const [osmPlaces, officialPlaces] = await Promise.all([
        placesService.fetchNearbyFromOSM(lat, lng),
        placesService.fetchOfficialPlaces(city)
      ]);

      // Combine and deduplicate (prefer official)
      const combined = [...officialPlaces];
      
      osmPlaces.forEach(osm => {
        const exists = combined.find(off => 
          off.name.toLowerCase() === osm.name.toLowerCase() || 
          (Math.abs(off.lat - osm.lat) < 0.001 && Math.abs(off.lng - osm.lng) < 0.001)
        );
        if (!exists) {
          combined.push(osm);
        }
      });

      // Calculate distances if user location is provided
      return combined.map(p => ({
        ...p,
        distance: placesService.calculateDistance(lat, lng, p.lat, p.lng)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    } catch (error) {
      console.error('Recommendation Error:', error);
      // Fallback to estimated data
      return placesService.getEstimatedData(lat, lng);
    }
  },

  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(2));
  },

  getEstimatedData: (lat: number, lng: number): Place[] => {
    return [
      {
        id: 'off-1',
        name: 'الأهرامات وأبو الهول',
        type: 'tourist',
        lat: 29.9792,
        lng: 31.1342,
        rating: 5.0,
        description: 'أحد عجائب الدنيا السبع القديمة في الجيزة',
        source: 'Official Egyptian Tourism',
        is_official: true,
        city: 'Giza'
      },
      {
        id: 'off-2',
        name: 'المتحف المصري الكبير',
        type: 'tourist',
        lat: 29.9944,
        lng: 31.1189,
        rating: 4.9,
        description: 'أكبر متحف للآثار في العالم مخصص لحضارة واحدة',
        source: 'Official Egyptian Tourism',
        is_official: true,
        city: 'Giza'
      },
      {
        id: 'off-3',
        name: 'قلعة صلاح الدين الأيوبي',
        type: 'tourist',
        lat: 30.0299,
        lng: 31.2620,
        rating: 4.8,
        description: 'قلعة تاريخية تضم مسجد محمد علي وتطل على القاهرة',
        source: 'Official Egyptian Tourism',
        is_official: true,
        city: 'Cairo'
      },
      {
        id: 'off-4',
        name: 'خان الخليلي',
        type: 'tourist',
        lat: 30.0477,
        lng: 31.2623,
        rating: 4.7,
        description: 'سوق تاريخي عريق في قلب القاهرة الإسلامية',
        source: 'Official Egyptian Tourism',
        is_official: true,
        city: 'Cairo'
      },
      {
        id: 'off-5',
        name: 'متحف الأقصر',
        type: 'tourist',
        lat: 25.7067,
        lng: 32.6444,
        rating: 4.8,
        description: 'يضم مجموعة رائعة من القطع الأثرية من طيبة القديمة',
        source: 'Official Egyptian Tourism',
        is_official: true,
        city: 'Luxor'
      },
      {
        id: 'est-1',
        name: 'مطعم النيل السياحي',
        type: 'restaurant',
        lat: lat + 0.005,
        lng: lng + 0.005,
        rating: 4.5,
        description: 'مطعم يطل على النيل يقدم مأكولات مصرية أصيلة',
        source: 'Estimated Source',
        is_official: false
      },
      {
        id: 'est-2',
        name: 'كافيه المحروسة',
        type: 'cafe',
        lat: lat - 0.003,
        lng: lng + 0.002,
        rating: 4.2,
        description: 'كافيه هادئ ومناسب للعمل والدراسة',
        source: 'Estimated Source',
        is_official: false
      }
    ];
  },
  
  geocode: async (address: string): Promise<{ lat: number, lng: number } | null> => {
    // Offline pre-defined smart lookup for Cairo transit hubs & landmarks
    const lower = address.toLowerCase().trim();
    if (lower.includes("جامعة حلوان") || lower.includes("helwan university") || lower.includes("helwan univ")) {
      return { lat: 29.8667, lng: 31.3283 };
    }
    if (lower.includes("حلوان") || lower.includes("helwan")) {
      return { lat: 29.8488, lng: 31.3323 };
    }
    if (lower.includes("المعادي") || lower.includes("maadi")) {
      return { lat: 29.9602, lng: 31.2575 };
    }
    if (lower.includes("السادات") || lower.includes("sadat")) {
      return { lat: 30.0442, lng: 31.2335 };
    }
    if (lower.includes("جمال عبدالناصر") || lower.includes("عبد الناصر") || lower.includes("nasser")) {
      return { lat: 30.0528, lng: 31.2393 };
    }
    if (lower.includes("الشهداء") || lower.includes("shohadaa") || lower.includes("ramses") || lower.includes("رمسيس")) {
      return { lat: 30.0617, lng: 31.2464 };
    }
    if (lower.includes("غمرة") || lower.includes("ghamra")) {
      return { lat: 30.0764, lng: 31.2678 };
    }
    if (lower.includes("المرج") || lower.includes("marg")) {
      return { lat: 30.1500, lng: 31.3400 };
    }
    if (lower.includes("السيدة زينب") || lower.includes("sayeda zeinab") || lower.includes("sayyida")) {
      return { lat: 30.0264, lng: 31.2369 };
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MO-ECO-App/1.0'
        }
      });
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
};
