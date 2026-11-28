import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Live Cairo weather from Open-Meteo (free, no API key).
/// Cached for 30 minutes so the app stays offline-friendly.
class WeatherReading {
  final double temp;
  final int humidity;
  final double windKmh;
  final int code; // WMO weather code
  final DateTime fetchedAt;

  WeatherReading({
    required this.temp,
    required this.humidity,
    required this.windKmh,
    required this.code,
    required this.fetchedAt,
  });

  Map<String, dynamic> toJson() => {
        'temp': temp,
        'humidity': humidity,
        'windKmh': windKmh,
        'code': code,
        'fetchedAt': fetchedAt.toIso8601String(),
      };

  static WeatherReading fromJson(Map<String, dynamic> j) => WeatherReading(
        temp: (j['temp'] as num?)?.toDouble() ?? 0,
        humidity: (j['humidity'] as num?)?.toInt() ?? 0,
        windKmh: (j['windKmh'] as num?)?.toDouble() ?? 0,
        code: (j['code'] as num?)?.toInt() ?? 0,
        fetchedAt: DateTime.tryParse(j['fetchedAt'] ?? '') ?? DateTime.now(),
      );
}

class WeatherService {
  static const _cacheKey = 'weather_v1';
  // Cairo
  static const _lat = 30.0444;
  static const _lon = 31.2357;

  /// Fresh (< 30 min) cache, otherwise live; stale cache when offline.
  static Future<WeatherReading?> getCurrent() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null &&
        DateTime.now().difference(cached.fetchedAt) <
            const Duration(minutes: 30)) {
      return cached;
    }
    final fresh = await _fetch();
    if (fresh != null) {
      await prefs.setString(_cacheKey, jsonEncode(fresh.toJson()));
      return fresh;
    }
    return cached; // stale or null — never a fabricated value
  }

  static WeatherReading? _readCache(SharedPreferences prefs) {
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      return WeatherReading.fromJson(
          Map<String, dynamic>.from(jsonDecode(raw) as Map));
    } catch (_) {
      return null;
    }
  }

  static Future<WeatherReading?> _fetch() async {
    try {
      final uri = Uri.parse('https://api.open-meteo.com/v1/forecast'
          '?latitude=$_lat&longitude=$_lon'
          '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
          '&timezone=Africa%2FCairo');
      final res = await http.get(uri).timeout(const Duration(seconds: 10));
      if (res.statusCode != 200) return null;
      final current = jsonDecode(res.body)['current'];
      if (current == null) return null;
      return WeatherReading(
        temp: (current['temperature_2m'] as num?)?.toDouble() ?? 0,
        humidity: (current['relative_humidity_2m'] as num?)?.toInt() ?? 0,
        windKmh: (current['wind_speed_10m'] as num?)?.toDouble() ?? 0,
        code: (current['weather_code'] as num?)?.toInt() ?? 0,
        fetchedAt: DateTime.now(),
      );
    } catch (_) {
      return null;
    }
  }

  /// Short condition label from the WMO code.
  static String label(int code, bool ar) {
    if (code == 0) return ar ? 'صافي' : 'Clear';
    if (code <= 2) return ar ? 'غائم جزئيًا' : 'Partly cloudy';
    if (code == 3) return ar ? 'غائم' : 'Overcast';
    if (code == 45 || code == 48) return ar ? 'ضباب' : 'Fog';
    if (code >= 51 && code <= 55) return ar ? 'رذاذ' : 'Drizzle';
    if (code >= 61 && code <= 65) return ar ? 'مطر' : 'Rain';
    if (code >= 71 && code <= 77) return ar ? 'ثلج' : 'Snow';
    if (code >= 80 && code <= 82) return ar ? 'زخات مطر' : 'Rain showers';
    if (code >= 95) return ar ? 'عاصفة رعدية' : 'Thunderstorm';
    return ar ? 'غير معروف' : 'Unknown';
  }

  /// A practical eco tip tied to the current conditions (honest, generic).
  static String tip(WeatherReading w, bool ar) {
    if (w.temp >= 35) {
      return ar
          ? 'حرارة عالية: التكييف على ٢٤° بدل ١٨° يوفر كهرباء ملحوظة.'
          : 'Hot: setting A/C to 24C instead of 18C saves noticeable electricity.';
    }
    if (w.temp >= 30) {
      return ar
          ? 'الجو حار: استخدم المروحة مع التكييف وارفع الترموستات درجة.'
          : 'Warm: pair the fan with A/C and raise the thermostat a degree.';
    }
    if (w.temp <= 15) {
      return ar
          ? 'الجو برد: البس طبقة إضافية قبل ما تعلي التدفئة.'
          : 'Cold: add a layer before turning the heating up.';
    }
    return ar
        ? 'الجو معتدل: فرصة كويسة تطفي التكييف وتفتح الشبابيك.'
        : 'Mild weather: a good chance to switch off the A/C and open windows.';
  }
}
