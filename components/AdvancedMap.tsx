
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon, LayersControl, useMap, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GISFeature, UserPath, GeofenceZone, SpatialAnalysis } from '../types';
import { gisService } from '../services/gisService';
import { routingService } from '../services/routingService';
import { notificationService } from '../services/notificationService';
import { 
  MapPin, Navigation, Info, AlertTriangle, Leaf, 
  Hospital, Landmark, Zap, Droplets, Trash2, 
  Bus, Train, Layers, Activity, TrendingUp,
  Maximize2, Minimize2, Crosshair
} from 'lucide-react';
import 'leaflet.heat';

// Custom Map Events Component
const MapEvents = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AdvancedMapProps {
  center?: [number, number];
  zoom?: number;
  language: 'ar' | 'en';
  onFeatureClick?: (feature: GISFeature) => void;
  showControls?: boolean;
  activeLayers?: string[];
  userId?: string;
  isRoutingMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  route?: [number, number][];
  startPoint?: [number, number] | null;
  endPoint?: [number, number] | null;
}

// Custom Heatmap Component
const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!points || points.length === 0) return;
    
    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    }).addTo(map);
    
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);
  
  return null;
};

// Custom Geofencing Component
const GeofencingManager = ({ zones, userLocation, language }: { zones: GeofenceZone[], userLocation: [number, number] | null, language: 'ar' | 'en' }) => {
  const [insideZones, setInsideZones] = useState<string[]>([]);
  
  useEffect(() => {
    if (!userLocation || zones.length === 0) return;
    
    const currentInside: string[] = [];
    zones.forEach(zone => {
      // Simple circle check for now, or use leaflet-pip for polygons
      const zoneCenter = zone.geometry.coordinates; // Assuming [lng, lat]
      const distance = L.latLng(userLocation).distanceTo(L.latLng(zoneCenter[1], zoneCenter[0]));
      
      const radius = zone.geometry.radius || 500; // 500m default
      
        if (distance <= radius) {
        currentInside.push(zone.id);
        if (!insideZones.includes(zone.id)) {
          // Entered zone
          notificationService.info(
            language === 'ar' ? zone.name_ar : zone.name_en
          );
        }
      }
    });
    
    setInsideZones(currentInside);
  }, [userLocation, zones, language]);
  
  return null;
};

export const AdvancedMap: React.FC<AdvancedMapProps> = ({
  center = [30.0444, 31.2357], // Cairo
  zoom = 13,
  language,
  onFeatureClick,
  showControls = true,
  activeLayers = ['all'],
  userId,
  isRoutingMode,
  onMapClick,
  route,
  startPoint,
  endPoint
}) => {
  const [features, setFeatures] = useState<GISFeature[]>([]);
  const [userPaths, setUserPaths] = useState<UserPath[]>([]);
  const [geofences, setGeofences] = useState<GeofenceZone[]>([]);
  const [spatialData, setSpatialData] = useState<SpatialAnalysis[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [trackingPath, setTrackingPath] = useState<[number, number][]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    loadData();
    
    // Real-time subscription
    const subscription = gisService.subscribeToFeatures((payload) => {
      loadData(); // Refresh on change
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    const [f, p, g, s] = await Promise.all([
      gisService.getFeatures(),
      userId ? gisService.getUserPaths(userId) : Promise.resolve([]),
      gisService.getGeofenceZones(),
      gisService.getSpatialAnalysis()
    ]);
    setFeatures(f);
    setUserPaths(p);
    setGeofences(g);
    setSpatialData(s);
  };

  // Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(newLoc);
          if (isTracking) {
            setTrackingPath(prev => [...prev, newLoc]);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isTracking]);

  const startTracking = () => {
    setIsTracking(true);
    setTrackingPath(userLocation ? [userLocation] : []);
  };

  const stopTracking = async () => {
    setIsTracking(false);
    if (trackingPath.length < 2) return;
    
    // Calculate distance and carbon
    const start = trackingPath[0];
    const end = trackingPath[trackingPath.length - 1];
    const route = await routingService.calculateRoute(start, end, 'walking');
    
    if (userId) {
      await gisService.saveUserPath({
        user_id: userId,
        path_geometry: {
          type: 'LineString',
          coordinates: trackingPath.map(p => [p[1], p[0]])
        },
        distance_km: route.distance,
        duration_minutes: Math.round(route.duration),
        carbon_impact_kg: -(route.distance * 0.2), // 0.2kg saved per km walking
        transport_mode: 'Walking'
      });
      loadData();
    }
    setTrackingPath([]);
  };

  const getFeatureIcon = (category: string, sub: string) => {
    switch (category) {
      case 'Transport': return <Bus className="text-blue-500" />;
      case 'GovService': return <Landmark className="text-egypt-gold" />;
      case 'EcoPoint': return <Leaf className="text-green-500" />;
      case 'Utility': return <Zap className="text-yellow-500" />;
      case 'EmissionZone': return <AlertTriangle className="text-red-500" />;
      default: return <MapPin className="text-gray-500" />;
    }
  };

  const heatmapPoints = useMemo(() => {
    return features
      .filter(f => f.category === 'EmissionZone' || f.category === 'Transport')
      .map(f => {
        const coords = f.geometry.coordinates;
        return [coords[1], coords[0], f.properties?.intensity || 0.5] as [number, number, number];
      });
  }, [features]);

  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-egypt-gold/20">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <LayersControl position="topright">
          <LayersControl.Overlay checked name={language === 'ar' ? 'وسائل النقل' : 'Transport'}>
            <LayerGroup features={features.filter(f => f.category === 'Transport')} language={language} onFeatureClick={onFeatureClick} />
          </LayersControl.Overlay>
          
          <LayersControl.Overlay checked name={language === 'ar' ? 'الخدمات الحكومية' : 'Gov Services'}>
            <LayerGroup features={features.filter(f => f.category === 'GovService')} language={language} onFeatureClick={onFeatureClick} />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name={language === 'ar' ? 'النقاط البيئية' : 'Eco Points'}>
            <LayerGroup features={features.filter(f => f.category === 'EcoPoint')} language={language} onFeatureClick={onFeatureClick} />
          </LayersControl.Overlay>

          <LayersControl.Overlay name={language === 'ar' ? 'المرافق' : 'Utilities'}>
            <LayerGroup features={features.filter(f => f.category === 'Utility')} language={language} onFeatureClick={onFeatureClick} />
          </LayersControl.Overlay>

          <LayersControl.Overlay name={language === 'ar' ? 'خريطة الحرارة' : 'Heatmap'}>
            <HeatmapLayer points={heatmapPoints} />
          </LayersControl.Overlay>

          <LayersControl.Overlay name={language === 'ar' ? 'التحليل المكاني' : 'Spatial Analysis'}>
            <SpatialLayer data={spatialData} language={language} />
          </LayersControl.Overlay>
        </LayersControl>

        {isRoutingMode && <MapEvents onMapClick={onMapClick} />}

        {/* Routing Mode Elements */}
        {isRoutingMode && startPoint && (
          <Marker position={startPoint}>
            <Popup>{language === 'ar' ? 'نقطة البداية' : 'Start Point'}</Popup>
          </Marker>
        )}
        {isRoutingMode && endPoint && (
          <Marker position={endPoint}>
            <Popup>{language === 'ar' ? 'نقطة النهاية' : 'End Point'}</Popup>
          </Marker>
        )}
        {isRoutingMode && route && route.length > 0 && (
          <Polyline positions={route} color="#10b981" weight={5} />
        )}

        {/* User Location */}
        {userLocation && (
          <Marker position={userLocation} icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-6 h-6 bg-blue-500 border-4 border-white rounded-full shadow-lg animate-pulse"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold">{language === 'ar' ? 'موقعك الحالي' : 'Your Location'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Tracking Path */}
        {trackingPath.length > 1 && (
          <Polyline positions={trackingPath} color="#3b82f6" weight={5} dashArray="10, 10" />
        )}

        {/* Past User Paths */}
        {userPaths.map(path => (
          <Polyline 
            key={path.id} 
            positions={path.path_geometry.coordinates.map((c: any) => [c[1], c[0]])} 
            color="#10b981" 
            weight={3} 
            opacity={0.6}
          >
            <Popup>
              <div className="p-2">
                <p className="font-bold">{path.transport_mode}</p>
                <p>{path.distance_km.toFixed(2)} km | {path.duration_minutes} min</p>
                <p className="text-green-500 font-bold">{path.carbon_impact_kg.toFixed(2)} kg CO2 saved</p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Geofencing Zones */}
        {geofences.map(zone => (
          <Circle 
            key={zone.id} 
            center={[zone.geometry.coordinates[1], zone.geometry.coordinates[0]]} 
            radius={zone.geometry.radius || 500}
            pathOptions={{ 
              color: zone.zone_type === 'Danger' ? 'red' : zone.zone_type === 'Eco' ? 'green' : 'blue',
              fillOpacity: 0.1 
            }}
          />
        ))}

        <GeofencingManager zones={geofences} userLocation={userLocation} language={language} />
      </MapContainer>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-8 left-8 right-8 z-[1000] flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => mapRef.current?.locate()}
                className="p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-egypt-gold/20 text-egypt-gold hover:bg-egypt-gold hover:text-white transition-all"
              >
                <Crosshair size={24} />
              </button>
              <button 
                onClick={isTracking ? stopTracking : startTracking}
                className={`p-4 rounded-2xl shadow-xl border border-white/20 text-white transition-all flex items-center gap-2 ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-egypt-gold hover:bg-egypt-gold/80'}`}
              >
                <Activity size={24} />
                <span className="font-bold">
                  {isTracking 
                    ? (language === 'ar' ? 'إيقاف التتبع' : 'Stop Tracking') 
                    : (language === 'ar' ? 'بدء التتبع' : 'Start Tracking')}
                </span>
              </button>
            </div>

            <div className="p-6 bg-egypt-black/90 backdrop-blur-xl rounded-[2rem] border border-egypt-gold/30 shadow-2xl text-white w-full sm:w-auto sm:min-w-full sm:max-w-[200px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-egypt-gold/20 rounded-lg">
                  <TrendingUp className="text-egypt-gold" size={20} />
                </div>
                <h3 className="font-bold text-lg">{language === 'ar' ? 'إحصائيات المنطقة' : 'Area Stats'}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">{language === 'ar' ? 'كثافة الانبعاثات' : 'Emission Density'}</span>
                  <span className="font-mono text-red-400">High</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">{language === 'ar' ? 'تغطية الخدمات' : 'Service Coverage'}</span>
                  <span className="font-mono text-green-400">85%</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-egypt-gold w-[85%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LayerGroup = ({ features, language, onFeatureClick }: { features: GISFeature[], language: 'ar' | 'en', onFeatureClick?: (f: GISFeature) => void }) => {
  return (
    <>
      {features.map(f => (
        <Marker 
          key={f.id} 
          position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
          eventHandlers={{
            click: () => onFeatureClick?.(f)
          }}
        >
          <Popup>
            <div className="p-2 w-full sm:w-auto sm:min-w-full sm:max-w-[150px]">
              <h3 className="font-bold text-lg mb-1">{language === 'ar' ? f.name_ar : f.name_en}</h3>
              <p className="text-sm text-white/70 mb-2">{f.sub_category}</p>
              <div className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded-lg">
                <Info size={14} className="text-egypt-gold" />
                <span>{language === 'ar' ? 'اضغط لمزيد من التفاصيل' : 'Click for more details'}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const SpatialLayer = ({ data, language }: { data: SpatialAnalysis[], language: 'ar' | 'en' }) => {
  return (
    <>
      {data.map(s => (
        <GeoJSON 
          key={s.id} 
          data={s.geometry} 
          style={() => ({
            fillColor: s.analysis_type === 'EmissionDensity' ? 'red' : 'green',
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.3
          })}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{s.region_name}</h3>
              <p>{s.analysis_type}: {s.value}</p>
            </div>
          </Popup>
        </GeoJSON>
      ))}
    </>
  );
};
