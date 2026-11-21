
export interface MicrobusLine {
  id: string;
  governorate: string;
  start_station: string;
  end_station: string;
  fare: number;
  route_description: string;
  stations: string[];
  co2_per_km: number; // Average for microbus
}

export const microbusData: MicrobusLine[] = [
  // Cairo
  {
    id: 'cairo-1',
    governorate: 'Cairo',
    start_station: 'Ramses',
    end_station: 'Abbaseya',
    fare: 5.0,
    route_description: 'Ramses Square - Ghamra - Abbaseya',
    stations: ['Ramses', 'Ghamra', 'Abbaseya'],
    co2_per_km: 0.08
  },
  {
    id: 'cairo-2',
    governorate: 'Cairo',
    start_station: 'Abdel Moneim Riad',
    end_station: 'Maadi',
    fare: 7.0,
    route_description: 'Tahrir - Corniche - Maadi',
    stations: ['Abdel Moneim Riad', 'Garden City', 'Fom El Khalig', 'Old Cairo', 'Maadi'],
    co2_per_km: 0.08
  },
  {
    id: 'cairo-3',
    governorate: 'Cairo',
    start_station: 'Alf Maskan',
    end_station: 'Heliopolis',
    fare: 4.0,
    route_description: 'Alf Maskan - Gesr El Suez - Heliopolis',
    stations: ['Alf Maskan', 'Gesr El Suez', 'Heliopolis'],
    co2_per_km: 0.08
  },
  // Giza
  {
    id: 'giza-1',
    governorate: 'Giza',
    start_station: 'Giza Square',
    end_station: 'October 6th City',
    fare: 12.0,
    route_description: 'Giza Square - Mehwar - October 6th',
    stations: ['Giza Square', 'Mehwar', 'October 6th'],
    co2_per_km: 0.08
  },
  {
    id: 'giza-2',
    governorate: 'Giza',
    start_station: 'Dokki',
    end_station: 'Haram',
    fare: 6.0,
    route_description: 'Dokki - Faisal - Haram',
    stations: ['Dokki', 'Faisal', 'Haram'],
    co2_per_km: 0.08
  },
  // Alexandria
  {
    id: 'alex-1',
    governorate: 'Alexandria',
    start_station: 'Mahatet El Raml',
    end_station: 'Abu Qir',
    fare: 8.0,
    route_description: 'Corniche - Abu Qir',
    stations: ['Mahatet El Raml', 'Sidi Gaber', 'Victoria', 'Abu Qir'],
    co2_per_km: 0.08
  },
  {
    id: 'cairo-4',
    governorate: 'Cairo',
    start_station: 'Sayeda Zeinab',
    end_station: 'Mokattam',
    fare: 6.0,
    route_description: 'Sayeda Zeinab - Citadel - Mokattam',
    stations: ['Sayeda Zeinab', 'Citadel', 'Mokattam'],
    co2_per_km: 0.08
  },
  {
    id: 'cairo-5',
    governorate: 'Cairo',
    start_station: 'Shubra',
    end_station: 'Imbaba',
    fare: 5.0,
    route_description: 'Shubra - Rod El Farag - Imbaba',
    stations: ['Shubra', 'Rod El Farag', 'Imbaba'],
    co2_per_km: 0.08
  },
  {
    id: 'giza-3',
    governorate: 'Giza',
    start_station: 'Munib',
    end_station: 'Sheikh Zayed',
    fare: 10.0,
    route_description: 'Munib - Ring Road - Sheikh Zayed',
    stations: ['Munib', 'Ring Road', 'Sheikh Zayed'],
    co2_per_km: 0.08
  }
];

export const microbusService = {
  getLines: (governorate?: string) => {
    if (governorate && governorate !== 'all') {
      return microbusData.filter(l => l.governorate.toLowerCase() === governorate.toLowerCase());
    }
    return microbusData;
  },
  getGovernorates: () => {
    return Array.from(new Set(microbusData.map(l => l.governorate)));
  },
  searchLines: (query: string) => {
    const q = query.toLowerCase();
    return microbusData.filter(l => 
      l.start_station.toLowerCase().includes(q) || 
      l.end_station.toLowerCase().includes(q) || 
      l.route_description.toLowerCase().includes(q)
    );
  }
};
