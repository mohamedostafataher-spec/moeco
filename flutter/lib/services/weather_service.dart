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

/// One city's current + today's forecast, for national alerts.
class CityForecast {
  final String cityAr;
  final String cityEn;
  final double temp;
  final double maxTemp;
  final double minTemp;
  final double windKmh;
  final int code;
  const CityForecast({
    required this.cityAr,
    required this.cityEn,
    required this.temp,
    required this.maxTemp,
    required this.minTemp,
    required this.windKmh,
    required this.code,
  });

  Map<String, dynamic> toJson() => {
        'cityAr': cityAr,
        'cityEn': cityEn,
        'temp': temp,
        'maxTemp': maxTemp,
        'minTemp': minTemp,
        'windKmh': windKmh,
        'code': code,
      };

  static CityForecast fromJson(Map<String, dynamic> j) => CityForecast(
        cityAr: j['cityAr'] ?? '',
        cityEn: j['cityEn'] ?? '',
        temp: (j['temp'] as num?)?.toDouble() ?? 0,
        maxTemp: (j['maxTemp'] as num?)?.toDouble() ?? 0,
        minTemp: (j['minTemp'] as num?)?.toDouble() ?? 0,
        windKmh: (j['windKmh'] as num?)?.toDouble() ?? 0,
        code: (j['code'] as num?)?.toInt() ?? 0,
      );
}

enum WeatherAlertKind { extremeHeat, heat, storm, wind, rain, cold }

class WeatherAlert {
  final String cityAr;
  final String cityEn;
  final WeatherAlertKind kind;
  final double value; // temperature C or wind km/h, 0 when not applicable
  const WeatherAlert(this.cityAr, this.cityEn, this.kind, this.value);

  Map<String, dynamic> toJson() => {
        'cityAr': cityAr,
        'cityEn': cityEn,
        'kind': kind.name,
        'value': value,
      };

  static WeatherAlert fromJson(Map<String, dynamic> j) => WeatherAlert(
        j['cityAr'] ?? '',
        j['cityEn'] ?? '',
        WeatherAlertKind.values.firstWhere(
          (k) => k.name == j['kind'],
          orElse: () => WeatherAlertKind.heat,
        ),
        (j['value'] as num?)?.toDouble() ?? 0,
      );
}

/// National weather alerts derived from Open-Meteo forecast data.
/// These are NOT official Egypt Meteorological Authority warnings.
class NationalWeatherAlerts {
  /// 11 major cities covering all regions.
  static const cities = <(String, String, double, double)>[
    ('القاهرة', 'Cairo', 30.0444, 31.2357),
    ('الجيزة', 'Giza', 30.0131, 31.2089),
    ('الإسكندرية', 'Alexandria', 31.2001, 29.9187),
    ('بورسعيد', 'Port Said', 31.2653, 32.3019),
    ('السويس', 'Suez', 29.9668, 32.5498),
    ('طنطا', 'Tanta', 30.7865, 31.0004),
    ('المنصورة', 'Mansoura', 31.0364, 31.3807),
    ('الأقصر', 'Luxor', 25.6872, 32.6396),
    ('أسوان', 'Aswan', 24.0889, 32.8998),
    ('الغردقة', 'Hurghada', 27.2579, 33.8116),
    ('شرم الشيخ', 'Sharm El Sheikh', 27.9158, 34.3300),
  ];

  static const _stormCodes = {95, 96, 99};
  static const _rainCodes = {61, 63, 65, 66, 67, 80, 81, 82};

  /// Pure derivation so tests can pin the thresholds.
  static List<WeatherAlert> deriveAlerts(List<CityForecast> forecasts) {
    final alerts = <WeatherAlert>[];
    for (final f in forecasts) {
      final worst = f.temp > f.maxTemp ? f.temp : f.maxTemp;
      if (worst >= 42) {
        alerts.add(WeatherAlert(f.cityAr, f.cityEn, WeatherAlertKind.extremeHeat, worst));
      } else if (worst >= 38) {
        alerts.add(WeatherAlert(f.cityAr, f.cityEn, WeatherAlertKind.heat, worst));
      }
      if (_stormCodes.contains(f.code)) {
        alerts.add(WeatherAlert(f.cityAr, f.cityEn, WeatherAlertKind.storm, 0));
      } else if (_rainCodes.contains(f.code)) {
        alerts.add(WeatherAlert(f.cityAr, f.cityEn, WeatherAlertKind.rain, 0));
      }
      if (f.windKmh >= 50) {
        alerts.add(WeatherAlert(f.cityAr, f.cityEn, WeatherAlertKind.wind, f.windKmh));
      }
      if (f.minTemp <= 5) {
        alerts.add(WeatherAlert(f.cityAr, f.cityEn, WeatherAlertKind.cold, f.minTemp));
      }
    }
    const order = {
      WeatherAlertKind.storm: 0,
      WeatherAlertKind.extremeHeat: 1,
      WeatherAlertKind.heat: 2,
      WeatherAlertKind.wind: 3,
      WeatherAlertKind.rain: 4,
      WeatherAlertKind.cold: 5,
    };
    alerts.sort((a, b) => order[a.kind]!.compareTo(order[b.kind]!));
    return alerts;
  }

  static const _cacheKey = 'weather_alerts_v1';

  /// Fresh (< 30 min) cached alerts, otherwise one multi-city Open-Meteo
  /// call; stale cache when offline; null when nothing is available.
  static Future<List<WeatherAlert>?> getAlerts() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null &&
        DateTime.now().difference(cached.$2) < const Duration(minutes: 30)) {
      return cached.$1;
    }
    final fresh = await _fetchAlerts();
    if (fresh != null) {
      await prefs.setString(
        _cacheKey,
        jsonEncode({
          'at': DateTime.now().toIso8601String(),
          'alerts': fresh.map((a) => a.toJson()).toList(),
        }),
      );
      return fresh;
    }
    return cached?.$1;
  }

  static (List<WeatherAlert>, DateTime)? _readCache(SharedPreferences prefs) {
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      final j = jsonDecode(raw) as Map<String, dynamic>;
      final at = DateTime.tryParse(j['at'] ?? '') ?? DateTime.now();
      final list = (j['alerts'] as List? ?? [])
          .map((e) => WeatherAlert.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return (list, at);
    } catch (_) {
      return null;
    }
  }

  static Future<List<WeatherAlert>?> _fetchAlerts() async {
    try {
      final lats = cities.map((c) => c.$3).join(',');
      final lons = cities.map((c) => c.$4).join(',');
      final uri = Uri.parse(
        'https://api.open-meteo.com/v1/forecast'
        '?latitude=$lats&longitude=$lons'
        '&current=temperature_2m,weather_code,wind_speed_10m'
        '&daily=temperature_2m_max,temperature_2m_min'
        '&forecast_days=1&timezone=Africa%2FCairo',
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 12));
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body);
      final List<dynamic> items = body is List ? body : [body];
      final forecasts = <CityForecast>[];
      for (var i = 0; i < items.length && i < cities.length; i++) {
        final item = items[i] as Map<String, dynamic>;
        final cur = item['current'] as Map<String, dynamic>? ?? {};
        final daily = item['daily'] as Map<String, dynamic>? ?? {};
        double firstOf(dynamic v) =>
            v is List && v.isNotEmpty ? (v.first as num).toDouble() : 0;
        forecasts.add(CityForecast(
          cityAr: cities[i].$1,
          cityEn: cities[i].$2,
          temp: (cur['temperature_2m'] as num?)?.toDouble() ?? 0,
          maxTemp: firstOf(daily['temperature_2m_max']),
          minTemp: firstOf(daily['temperature_2m_min']),
          windKmh: (cur['wind_speed_10m'] as num?)?.toDouble() ?? 0,
          code: (cur['weather_code'] as num?)?.toInt() ?? 0,
        ));
      }
      if (forecasts.isEmpty) return null;
      return deriveAlerts(forecasts);
    } catch (_) {
      return null;
    }
  }
}

