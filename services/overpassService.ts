
import { Station, TransportLine } from '../constants/transportData';

export const overpassService = {
  /**
   * Fetches transport data (stations, lines) from OpenStreetMap using Overpass API.
   * Overpass API is a read-only API that serves up custom selected parts of the OSM data.
   */
  fetchTransportData: async (type: string, city: string = 'Cairo'): Promise<TransportLine[]> => {
    try {
      // Overpass QL query to find transport lines and stations
      // Example: find all metro stations in Cairo
      const queryType = overpassService.getOSMType(type);
      if (!queryType) return [];

      const query = `
        [out:json][timeout:25];
        area[name="${city}"]->.searchArea;
        (
          node["railway"="${queryType}"](area.searchArea);
          way["railway"="${queryType}"](area.searchArea);
          rel["railway"="${queryType}"](area.searchArea);
        );
        out body;
        >;
        out skel qt;
      `;

      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Overpass API failed');
      
      const data = await response.json();
      return overpassService.processOSMData(data, type, city);
    } catch (error) {
      console.error('Error fetching Overpass data:', error);
      return [];
    }
  },

  getOSMType: (type: string): string | null => {
    switch (type) {
      case 'metro': return 'subway';
      case 'train': return 'rail';
      case 'tram': return 'tram';
      case 'monorail': return 'monorail';
      case 'lrt': return 'light_rail';
      case 'brt': return 'bus';
      case 'bus': return 'bus';
      case 'ferry': return 'ferry';
      default: return null;
    }
  },

  processOSMData: (data: any, type: string, city: string): TransportLine[] => {
    if (!data.elements) return [];

    const stations: Station[] = data.elements
      .filter((el: any) => el.type === 'node' && el.tags && (el.tags.name || el.tags['name:en']))
      .map((el: any) => ({
        id: `osm-${el.id}`,
        name_ar: el.tags['name:ar'] || el.tags.name,
        name_en: el.tags['name:en'] || el.tags.name,
        lat: el.lat,
        lng: el.lon
      }));

    if (stations.length === 0) return [];

    // Grouping into a single "OSM Detected" line for simplicity
    // In a real app, you'd parse relations to get actual lines
    return [{
      id: `osm-line-${type}-${city}`,
      name_ar: `خط ${type} (OSM - ${city})`,
      name_en: `${type.charAt(0).toUpperCase() + type.slice(1)} Line (OSM - ${city})`,
      type: type as any,
      stations: stations.slice(0, 20), // Limit for performance
      color: '#4A90E2',
      basePrice: 10,
      pricePerStation: 1,
      avgSpeed: 40,
      governorate: city,
      country: 'EG'
    }];
  }
};
