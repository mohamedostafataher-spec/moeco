import { TransportRoute } from "./transportService";

export interface RouteGeometry {
  lat: number;
  lon: number;
}

export interface RouteLeg {
  route_id: string;
  route_name_ar: string;
  route_name_en: string;
  mode_type: string;
  color: string;
  startStationId: string;
  endStationId: string;
  startStationNameAr: string;
  endStationNameAr: string;
  startStationNameEn: string;
  endStationNameEn: string;
  stationsCount: number;
  geometry: RouteGeometry[];
}

export interface TransitPath {
  legs: RouteLeg[];
  totalDistanceKm: number;
  totalDurationMin: number;
  totalCostEgp: number;
  carbonKg: number;
  totalStationsCount: number;
}

const distanceInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
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

export const routingEngine = {
  findTransitPath(
    startLoc: { lat: number; lon: number },
    endLoc: { lat: number; lon: number },
    routes: TransportRoute[],
    calculateCost: Function,
  ): TransitPath | null {
    // 1. Build Graph
    const nodes: Record<
      string,
      {
        id: string;
        lat: number;
        lon: number;
        routeId: string;
        nameAr: string;
        nameEn: string;
        order: number;
      }
    > = {};
    const adj: Record<
      string,
      {
        to: string;
        weight: number;
        type: "transit" | "transfer" | "walk";
        distance: number;
      }[]
    > = {};

    // Helper to add edges
    const addEdge = (
      u: string,
      v: string,
      weight: number,
      type: "transit" | "transfer" | "walk",
      distance: number,
    ) => {
      if (!adj[u]) adj[u] = [];
      adj[u].push({ to: v, weight, type, distance });
    };

    // Add all stations as nodes
    routes.forEach((r) => {
      if (!r.stations) return;
      r.stations.forEach((st) => {
        const sid = `${r.route_id}_${st.station_id}`;
        nodes[sid] = {
          id: st.station_id,
          lat: st.transport_stations.geom.coordinates[1],
          lon: st.transport_stations.geom.coordinates[0],
          routeId: r.route_id,
          nameAr: st.transport_stations.station_name_ar,
          nameEn: st.transport_stations.station_name_en,
          order: st.station_order,
        };
      });

      // Add edges between consecutive stations on same line
      for (let i = 0; i < r.stations.length - 1; i++) {
        const u = `${r.route_id}_${r.stations[i].station_id}`;
        const v = `${r.route_id}_${r.stations[i + 1].station_id}`;

        const dist = distanceInKm(
          nodes[u].lat,
          nodes[u].lon,
          nodes[v].lat,
          nodes[v].lon,
        );
        // Cost: 2 minutes per km + 1 minute stop time
        const timeCost = (dist / 40) * 60 + 1;

        addEdge(u, v, timeCost, "transit", dist);
        addEdge(v, u, timeCost, "transit", dist);
      }
    });

    // Add transfer edges between different lines (walking < 500m)
    const nodeKeys = Object.keys(nodes);
    for (let i = 0; i < nodeKeys.length; i++) {
      for (let j = i + 1; j < nodeKeys.length; j++) {
        const u = nodes[nodeKeys[i]];
        const v = nodes[nodeKeys[j]];
        if (u.routeId !== v.routeId) {
          const dist = distanceInKm(u.lat, u.lon, v.lat, v.lon);
          if (dist < 0.5) {
            // 500 meters max transfer
            const walkTime = (dist / 4) * 60 + 5; // 4 km/h walk speed + 5 min transfer penalty
            addEdge(nodeKeys[i], nodeKeys[j], walkTime, "transfer", dist);
            addEdge(nodeKeys[j], nodeKeys[i], walkTime, "transfer", dist);
          }
        }
      }
    }

    // Add Start and End nodes
    nodes["START"] = {
      id: "START",
      lat: startLoc.lat,
      lon: startLoc.lon,
      routeId: "NONE",
      nameAr: "Start",
      nameEn: "Start",
      order: -1,
    };
    nodes["END"] = {
      id: "END",
      lat: endLoc.lat,
      lon: endLoc.lon,
      routeId: "NONE",
      nameAr: "End",
      nameEn: "End",
      order: -1,
    };

    // Connect Start and End to nearby stations
    let sortedNodesByStart = nodeKeys.map(k => ({
      k,
      dist: distanceInKm(startLoc.lat, startLoc.lon, nodes[k].lat, nodes[k].lon)
    })).sort((a, b) => a.dist - b.dist);

    let sortedNodesByEnd = nodeKeys.map(k => ({
      k,
      dist: distanceInKm(endLoc.lat, endLoc.lon, nodes[k].lat, nodes[k].lon)
    })).sort((a, b) => a.dist - b.dist);

    // Only allow entering the network at the top 3 nearest stations to avoid huge taxi bypasses
    for (let i = 0; i < Math.min(3, sortedNodesByStart.length); i++) {
        const u = sortedNodesByStart[i];
        if (u.dist < 50.0) {
            addEdge("START", u.k, (u.dist / 30) * 60, "walk", u.dist);
        }
    }
    
    // Only allow exiting the network at the top 3 nearest stations
    for (let i = 0; i < Math.min(3, sortedNodesByEnd.length); i++) {
        const u = sortedNodesByEnd[i];
        if (u.dist < 50.0) {
            addEdge(u.k, "END", (u.dist / 30) * 60, "walk", u.dist);
        }
    }

    // 2. Run Dijkstra
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    Object.keys(nodes).forEach((n) => {
      dist[n] = Infinity;
      prev[n] = null;
      unvisited.add(n);
    });
    dist["START"] = 0;

    while (unvisited.size > 0) {
      let u: string | null = null;
      let minD = Infinity;

      // Unoptimized priority queue (fine for small graphs < 1000 nodes)
      for (const node of unvisited) {
        if (dist[node] < minD) {
          minD = dist[node];
          u = node;
        }
      }

      if (u === null || u === "END") break; // Found shortest path to END or nowhere to go

      unvisited.delete(u);

      if (adj[u]) {
        for (const neighbor of adj[u]) {
          if (unvisited.has(neighbor.to)) {
            const alt = dist[u] + neighbor.weight;
            if (alt < dist[neighbor.to]) {
              dist[neighbor.to] = alt;
              prev[neighbor.to] = u;
            }
          }
        }
      }
    }

    if (dist["END"] === Infinity) return null; // No path found

    // 3. Reconstruct Path
    const path: string[] = [];
    let curr: string | null = "END";
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }

    if (path.length <= 2) return null; // Only walked START -> END

    // 4. Build Legs
    const legs: RouteLeg[] = [];
    let currentLeg: Partial<RouteLeg> | null = null;
    let totalDist = 0;

    for (let i = 1; i < path.length - 1; i++) {
      const uStr = path[i];
      const u = nodes[uStr];
      const nextStr = path[i + 1];

      if (nextStr === "END") {
        if (currentLeg && currentLeg.geometry) {
          currentLeg.endStationId = u.id;
          currentLeg.endStationNameAr = u.nameAr;
          currentLeg.endStationNameEn = u.nameEn;
          currentLeg.geometry.push({ lat: u.lat, lon: u.lon });
          currentLeg.stationsCount = Math.abs(
            u.order - (currentLeg as any).startOrder,
          );
          legs.push(currentLeg as RouteLeg);
        }
        break;
      }

      const next = nodes[nextStr];

      if (!currentLeg) {
        const route = routes.find((r) => r.route_id === u.routeId);
        if (!route) continue;
        currentLeg = {
          route_id: route.route_id,
          route_name_ar: route.route_name_ar,
          route_name_en: route.route_name_en,
          mode_type: route.mode_type,
          color: route.line_color || "#3b82f6",
          startStationId: u.id,
          startStationNameAr: u.nameAr,
          startStationNameEn: u.nameEn,
          geometry: [{ lat: u.lat, lon: u.lon }],
        };
        (currentLeg as any).startOrder = u.order;
      } else {
        currentLeg.geometry?.push({ lat: u.lat, lon: u.lon });
      }

      // If next node is on a different route, end the current leg here
      if (u.routeId !== next.routeId) {
        currentLeg.endStationId = u.id;
        currentLeg.endStationNameAr = u.nameAr;
        currentLeg.endStationNameEn = u.nameEn;
        currentLeg.stationsCount = Math.abs(
          u.order - (currentLeg as any).startOrder,
        );
        legs.push(currentLeg as RouteLeg);
        currentLeg = null; // Next iteration will start a new leg
      }
    }

    // 5. Calculate Cost and Emissions
    let totalCost = 0;
    let totalCarbon = 0;
    let totalStations = 0;

    legs.forEach((leg) => {
      const route = routes.find((r) => r.route_id === leg.route_id);
      if (route) {
        totalCost += calculateCost(
          route.route_id,
          leg.stationsCount || 1,
          route.prices || [],
        );
        let dist = 0;
        for (let i = 1; i < leg.geometry.length; i++) {
          dist += distanceInKm(
            leg.geometry[i - 1].lat,
            leg.geometry[i - 1].lon,
            leg.geometry[i].lat,
            leg.geometry[i].lon,
          );
        }
        totalDist += dist;
        const factor = route.mode_type === "bus" ? 0.06 : 0.02;
        totalCarbon += dist * factor;
      }
      totalStations += leg.stationsCount;
    });

    return {
      legs,
      totalDistanceKm: totalDist,
      totalDurationMin: Math.ceil(dist["END"]), // Dist contains minutes + transfer penalty
      totalCostEgp: totalCost,
      carbonKg: totalCarbon,
      totalStationsCount: totalStations,
    };
  },
};
