
/**
 * OSM Overpass API Service
 * Fetches geographic data from OpenStreetMap.
 */

export const osmService = {
  /**
   * Fetches transport data (stations, lines) from OSM.
   */
  getTransportData: async (bbox: [number, number, number, number], type: string): Promise<any[]> => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["public_transport"="${type}"](${bbox.join(',')});
          way["public_transport"="${type}"](${bbox.join(',')});
          relation["public_transport"="${type}"](${bbox.join(',')});
        );
        out body;
        >;
        out skel qt;
      `;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Overpass API Unavailable');
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Error fetching transport data from OSM:', error);
      return [];
    }
  },

  /**
   * Fetches government services from OSM.
   */
  getGovernmentServices: async (bbox: [number, number, number, number], category: string): Promise<any[]> => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="${category}"](${bbox.join(',')});
          node["office"="${category}"](${bbox.join(',')});
          node["government"="${category}"](${bbox.join(',')});
        );
        out body;
        >;
        out skel qt;
      `;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Overpass API Unavailable');
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Error fetching gov services from OSM:', error);
      return [];
    }
  }
};
