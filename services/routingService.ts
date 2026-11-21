
import { ConfigService } from './ConfigService';

export const routingService = {
  /**
   * Calculates distance and duration between two points.
   * Primary: OSRM Public Server
   * Fallback: Haversine Formula
   */
  calculateRoute: async (start: [number, number], end: [number, number], profile: 'driving' | 'walking' | 'cycling' = 'driving'): Promise<{ distance: number, duration: number, geometry?: any }> => {
    try {
      // Primary: OSRM
      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            return {
              distance: data.routes[0].distance / 1000,
              duration: data.routes[0].duration / 60,
              geometry: data.routes[0].geometry
            };
          }
        }
      } catch (e) {
        console.warn('OSRM failed, trying GraphHopper...');
      }

      // Secondary: GraphHopper (Public API or demo instance)
      try {
        const ghProfile = profile === 'driving' ? 'car' : profile === 'walking' ? 'foot' : 'bike';
        const response = await fetch(`https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=${ghProfile}&debug=true&key=L782803c-8e6d-498c-8430-000000000000&type=json&points_encoded=false`);
        // Attempting to fetch primary routing path...
        // For production, the user would provide their own key.
        if (response.ok) {
          const data = await response.json();
          if (data.paths && data.paths[0]) {
            return {
              distance: data.paths[0].distance / 1000,
              duration: data.paths[0].time / 60000, // ms to minutes
              geometry: data.paths[0].points
            };
          }
        }
      } catch (e) {
        console.warn('GraphHopper failed, using Haversine fallback');
      }
      
      throw new Error('All routing services failed');
    } catch (error) {
      console.warn('Routing Primary Failed, using Haversine fallback:', error);
      const distance = routingService.haversineDistance(start, end);
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

  calculateDistance: async (start: [number, number], end: [number, number]): Promise<number> => {
    const route = await routingService.calculateRoute(start, end);
    return route.distance;
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
  },

  stepsToKm: (steps: number): number => {
    const factor = ConfigService.config.walkingFactor || 1300;
    return steps / factor;
  },

  kmToSteps: (km: number): number => {
    const factor = ConfigService.config.walkingFactor || 1300;
    return km * factor;
  }
};
