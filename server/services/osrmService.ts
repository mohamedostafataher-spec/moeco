
/**
 * OSRM Routing Service
 * Provides distance and duration calculations between two points.
 */

export const osrmService = {
  /**
   * Calculates distance and duration between two points.
   * Primary: OSRM Public Server
   * Fallback: Haversine Formula
   */
  calculateRoute: async (start: [number, number], end: [number, number], profile: 'driving' | 'walking' | 'cycling' = 'driving'): Promise<{ distance: number, duration: number, geometry?: any }> => {
    try {
      // Primary: OSRM
      const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      if (!response.ok) throw new Error('OSRM Unavailable');
      
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        return {
          distance: data.routes[0].distance / 1000, // Convert to km
          duration: data.routes[0].duration / 60, // Convert to minutes
          geometry: data.routes[0].geometry
        };
      }
      throw new Error('No route found');
    } catch (error) {
      console.warn('Routing Primary Failed, using Haversine fallback:', error);
      const distance = osrmService.haversineDistance(start, end);
      // Rough duration estimate: 40km/h for driving, 5km/h for walking, 15km/h for cycling
      const speed = profile === 'driving' ? 40 : profile === 'walking' ? 5 : 15;
      return {
        distance,
        duration: (distance / speed) * 60,
        geometry: {
          type: 'LineString',
          coordinates: [[start[1], start[0]], [end[1], end[0]]]
        }
      };
    }
  },

  haversineDistance: (coords1: [number, number], coords2: [number, number]): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(coords2[0] - coords1[0]);
    const dLon = toRad(coords2[1] - coords1[1]);
    const lat1 = toRad(coords1[0]);
    const lat2 = toRad(coords2[0]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
};
