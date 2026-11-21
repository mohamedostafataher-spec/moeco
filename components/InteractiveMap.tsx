import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Activity, ShieldAlert, Zap, Droplets, Wind, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom icon for Leaflet
const createCustomIcon = (isHighStress: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isHighStress ? 'bg-red-600' : 'bg-egypt-gold'}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M4 14.71 13.18 3h1.39L10 9.29h9.47L10.33 21H8.94L14 14.71H4z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface InteractiveMapProps {
  governorates: any[];
  language: 'ar' | 'en';
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ governorates, language }) => {
  const position: [number, number] = [26.8206, 30.8025];
  const [selectedGovAnalysis, setSelectedGovAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<string | null>(null);

  const handleFetchAnalysis = async (govName: string) => {
    setLoadingAnalysis(govName);
    try {
      // Local analysis logic
      await new Promise(resolve => setTimeout(resolve, 800));
      const gov = governorates.find(g => g.governorate === govName);
      
      const analysis = {
        govName,
        water: language === 'ar' ? 'مستقر' : 'Stable',
        air: language === 'ar' ? 'جيد' : 'Good',
        waste: language === 'ar' ? 'متوسط' : 'Medium',
        insight: language === 'ar' 
          ? `بناءً على استهلاك ${gov?.avgKwh || 0} كيلوواط ساعة، ننصح بتحسين كفاءة الطاقة في هذا القطاع لتقليل الضغط بنسبة 15%.`
          : `Based on ${gov?.avgKwh || 0} kWh consumption, we recommend improving energy efficiency to reduce stress by 15%.`,
        recommendation: language === 'ar' ? 'تركيب ألواح شمسية' : 'Install Solar Panels',
        impact: language === 'ar' ? 'توفير 20%' : '20% Savings'
      };
      
      setSelectedGovAnalysis(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAnalysis(null);
    }
  };

  return (
    <div className="h-[300px] sm:h-[600px] w-full rounded-[2.5rem] overflow-hidden border-4 border-egypt-gold/20 shadow-2xl">
      <MapContainer 
        center={position} 
        zoom={6} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {governorates.map((gov, idx) => {
          const lat = gov.lat || (26 + (idx % 10) * 0.4);
          const lng = gov.lng || (30 + ((idx * 3) % 10) * 0.4);
          const isHighStress = gov.stressLevel > 80;
          
          return (
            <Marker
              key={idx}
              position={[lat, lng]}
              icon={createCustomIcon(isHighStress)}
              eventHandlers={{
                click: () => {
                  if (selectedGovAnalysis?.govName !== gov.governorate) {
                    setSelectedGovAnalysis(null);
                  }
                }
              }}
            >
              <Popup>
                <div className="p-4 w-full sm:w-auto sm:min-w-full sm:max-w-[250px] text-egypt-black font-arabic text-right">
                  <h3 className="font-black text-xl mb-3 border-b pb-2 flex items-center justify-between">
                    <Sparkles className="w-5 h-5 text-egypt-gold" />
                    {gov.governorate}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] text-stone-400">{language === 'ar' ? 'الكهرباء' : 'Energy'}</span>
                        </div>
                        <p className="text-xs font-black">{gov.avgKwh} kWh</p>
                      </div>
                      <div className="p-2 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-3 h-3 text-red-500" />
                          <span className="text-[10px] text-stone-400">{language === 'ar' ? 'الضغط' : 'Stress'}</span>
                        </div>
                        <p className="text-xs font-black">{gov.stressLevel.toFixed(1)}%</p>
                      </div>
                    </div>

                    {selectedGovAnalysis?.govName === gov.governorate ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 pt-2 border-t border-stone-100"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-blue-600">{selectedGovAnalysis.water}</span>
                          <div className="flex items-center gap-1 text-stone-400">
                            <Droplets className="w-3 h-3" />
                            <span>{language === 'ar' ? 'المياه:' : 'Water:'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-emerald-600">{selectedGovAnalysis.air}</span>
                          <div className="flex items-center gap-1 text-stone-400">
                            <Wind className="w-3 h-3" />
                            <span>{language === 'ar' ? 'الهواء:' : 'Air:'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-orange-600">{selectedGovAnalysis.waste}</span>
                          <div className="flex items-center gap-1 text-stone-400">
                            <Trash2 className="w-3 h-3" />
                            <span>{language === 'ar' ? 'النفايات:' : 'Waste:'}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-500 italic mt-2 bg-egypt-gold/5 p-2 rounded-lg">
                          {selectedGovAnalysis.insight}
                        </p>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => handleFetchAnalysis(gov.governorate)}
                        disabled={loadingAnalysis === gov.governorate}
                        className="w-full py-2 bg-egypt-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-egypt-gold hover:text-egypt-black transition-all"
                      >
                        {loadingAnalysis === gov.governorate ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {language === 'ar' ? 'تحليل القطاع الذكي' : 'Smart Sector Analysis'}
                      </button>
                    )}

                    <div className="pt-2 flex justify-center">
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${gov.stressLevel > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {gov.stressLevel > 80 ? (language === 'ar' ? 'منطقة عالية المخاطر' : 'High Risk Area') : (language === 'ar' ? 'منطقة مستقرة' : 'Stable Area')}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
