
import { storageService } from './storageService';

export const pulseService = {
  getDailyPulse: async (language: 'ar' | 'en') => {
    try {
      // Fetch real prayer times for Cairo
      const prayerResponse = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5');
      const prayerData = await prayerResponse.json();
      const timings = prayerData.data.timings;

      const prayerTimes = {
        Fajr: timings.Fajr,
        Sunrise: timings.Sunrise,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha
      };

      // Fetch real exchange rates
      const exchangeResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const exchangeData = await exchangeResponse.json();
      const egpRate = exchangeData.rates.EGP;
      const eurRate = exchangeData.rates.EUR;
      
      const exchangeRates = {
        USD: egpRate.toFixed(2),
        EUR: (egpRate / eurRate).toFixed(2),
        change: -0.02 // Still a bit hard to get dynamic change without history
      };

      // Gold prices are harder to get for free without key, using a more realistic estimate or a simple calculation based on USD
      // 24K Gold is roughly 75-80 USD per gram globally
      const goldPriceUSD = 78; 
      const goldPrices = {
        '24K': Math.round(goldPriceUSD * egpRate),
        '21K': Math.round(goldPriceUSD * egpRate * 0.875),
        '18K': Math.round(goldPriceUSD * egpRate * 0.75),
        change: +10
      };

      // Fetch news from Supabase
      let news = [];
      try {
        const data = await storageService.getEcoNews();
        if (data && data.length > 0) {
          news = data.slice(0, 2);
        }
      } catch (e) {
        console.warn('Failed to fetch news, using fallback');
        news = [
          {
            id: 1,
            title_ar: 'مصر تطلق أول سيارة كهربائية محلية الصنع قريباً',
            title_en: 'Egypt to launch first locally-made electric car soon',
            category: 'Transport'
          },
          {
            id: 2,
            title_ar: 'توسعات جديدة في الخط الثالث للمترو لتغطية مناطق أكثر',
            title_en: 'New expansions in Metro Line 3 to cover more areas',
            category: 'Transport'
          }
        ];
      }

      const dailyTip = {
        ar: 'هل تعلم؟ استخدام المترو بدلاً من السيارة يوفر حوالي 75% من انبعاثات الكربون لكل كيلومتر.',
        en: 'Did you know? Using the metro instead of a car saves about 75% of carbon emissions per kilometer.'
      };

      // Fetch real weather from Open-Meteo
      let weather = { temperature: 25, condition: 1, windSpeed: 10 };
      try {
        const weatherResponse = await fetch('https://api.open-meteo.com/v1/forecast?latitude=30.0444&longitude=31.2357&current=temperature_2m,wind_speed_10m,weather_code');
        const weatherData = await weatherResponse.json();
        weather = {
          temperature: Math.round(weatherData.current.temperature_2m),
          condition: weatherData.current.weather_code,
          windSpeed: Math.round(weatherData.current.wind_speed_10m)
        };
      } catch (e) {
        console.warn('Failed to fetch weather', e);
      }

      return {
        prayerTimes,
        goldPrices,
        exchangeRates,
        weather,
        news,
        dailyTip: language === 'ar' ? dailyTip.ar : dailyTip.en
      };
    } catch (error) {
      console.error("Error fetching daily pulse:", error);
      // Fallback to static but realistic data if APIs fail
      return {
        prayerTimes: { Fajr: '04:30', Sunrise: '06:00', Dhuhr: '12:00', Asr: '15:30', Maghrib: '18:05', Isha: '19:20' },
        goldPrices: { '24K': 3800, '21K': 3325, '18K': 2850, change: 0 },
        exchangeRates: { USD: 48.50, EUR: 52.50, change: 0 },
        weather: { temperature: 25, condition: 1, windSpeed: 10 },
        news: [],
        dailyTip: language === 'ar' ? 'حافظ على البيئة.' : 'Save the environment.'
      };
    }
  },

  getNeighborhoodHelpRequests: async () => {
    try {
      return await storageService.getNeighborhoodHelpRequests();
    } catch (e) {
      console.error("Error fetching neighborhood requests:", e);
      return [];
    }
  }
};
