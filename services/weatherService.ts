
export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  aqi: number;
  pm10: number;
  isFallback: boolean;
  description: string;
  icon: string;
}

export const weatherService = {
  getWeather: async (lat: number, lon: number, lang: 'ar' | 'en' = 'ar'): Promise<WeatherData> => {
    try {
      const [weatherRes, aqiRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`),
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10`)
      ]).catch(err => {
        console.warn("Fetch failed, using fallback weather", err);
        return [null, null];
      });
      
      if (!weatherRes || !aqiRes) throw new Error("Fetch failed");

      const weatherData = await weatherRes.json();
      const aqiData = await aqiRes.json();
      if (aqiData.current?.us_aqi == null || aqiData.current?.pm10 == null) throw new Error("Air quality unavailable");
      
      const code = weatherData.current.weather_code;
      const condition = weatherService.getConditionFromCode(code, lang);
      
      return {
        temp: Math.round(weatherData.current.temperature_2m),
        humidity: Math.round(weatherData.current.relative_humidity_2m),
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        condition: condition.label,
        aqi: Math.round(aqiData.current.us_aqi),
        pm10: Math.round(aqiData.current.pm10),
        isFallback: false,
        description: condition.description,
        icon: condition.icon
      };
    } catch (error) {
      console.warn("Weather fetch error: Using fallback data", error);
      // Fallback data for Egypt
      return {
        temp: 28,
        humidity: 45,
        windSpeed: 12,
        condition: lang === 'ar' ? 'صافي' : 'Clear',
        aqi: 45,
        pm10: 20,
        isFallback: true,
        description: lang === 'ar' ? 'سماء صافية (بيانات افتراضية)' : 'Clear sky (fallback data)',
        icon: 'Sun'
      };
    }
  },

  getConditionFromCode: (code: number, lang: 'ar' | 'en') => {
    const conditions: Record<number, any> = {
      0: { label: lang === 'ar' ? 'صافي' : 'Clear', description: lang === 'ar' ? 'سماء صافية تماماً' : 'Perfectly clear sky', icon: 'Sun' },
      1: { label: lang === 'ar' ? 'صافي غالباً' : 'Mainly Clear', description: lang === 'ar' ? 'سماء صافية مع بعض السحب' : 'Mainly clear sky', icon: 'CloudSun' },
      2: { label: lang === 'ar' ? 'غائم جزئياً' : 'Partly Cloudy', description: lang === 'ar' ? 'سحب متفرقة' : 'Scattered clouds', icon: 'Cloud' },
      3: { label: lang === 'ar' ? 'غائم' : 'Overcast', description: lang === 'ar' ? 'سماء مغطاة بالسحب' : 'Overcast sky', icon: 'Cloudy' },
      45: { label: lang === 'ar' ? 'ضباب' : 'Fog', description: lang === 'ar' ? 'رؤية منخفضة بسبب الضباب' : 'Low visibility due to fog', icon: 'CloudFog' },
      48: { label: lang === 'ar' ? 'ضباب جليدي' : 'Depositing Rime Fog', description: lang === 'ar' ? 'ضباب كثيف بارد' : 'Dense cold fog', icon: 'CloudFog' },
      51: { label: lang === 'ar' ? 'رذاذ خفيف' : 'Light Drizzle', description: lang === 'ar' ? 'رذاذ خفيف متقطع' : 'Intermittent light drizzle', icon: 'CloudDrizzle' },
      61: { label: lang === 'ar' ? 'مطر خفيف' : 'Slight Rain', description: lang === 'ar' ? 'أمطار خفيفة' : 'Slight rain', icon: 'CloudRain' },
      80: { label: lang === 'ar' ? 'زخات مطر' : 'Rain Showers', description: lang === 'ar' ? 'زخات مطر متقطعة' : 'Intermittent rain showers', icon: 'CloudRain' },
      95: { label: lang === 'ar' ? 'عاصفة رعدية' : 'Thunderstorm', description: lang === 'ar' ? 'عواصف رعدية محتملة' : 'Potential thunderstorms', icon: 'CloudLightning' },
    };
    return conditions[code] || { label: lang === 'ar' ? 'غير معروف' : 'Unknown', description: '', icon: 'Cloud' };
  },

  getCarbonImpact: (weather: WeatherData) => {
    // Logic to calculate how weather affects carbon footprint
    // High temp -> more AC -> more electricity
    // Low temp -> more heating -> more gas
    // High humidity -> more AC load
    let impactFactor = 1.0;
    if (weather.temp > 30) impactFactor += (weather.temp - 30) * 0.05;
    if (weather.temp < 15) impactFactor += (15 - weather.temp) * 0.03;
    if (weather.humidity > 70) impactFactor += 0.1;
    
    return impactFactor;
  }
};
