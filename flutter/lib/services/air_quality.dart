import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Live air quality for Egyptian cities from Open-Meteo (free, no API key).
/// Cached locally for one hour so the app stays offline-friendly.
class AirQualityReading {
  final String cityAr;
  final String cityEn;
  final int aqi; // US AQI
  final double pm25;
  final DateTime fetchedAt;

  AirQualityReading({
    required this.cityAr,
    required this.cityEn,
    required this.aqi,
    required this.pm25,
    required this.fetchedAt,
  });

  Map<String, dynamic> toJson() => {
        'cityAr': cityAr,
        'cityEn': cityEn,
        'aqi': aqi,
        'pm25': pm25,
        'fetchedAt': fetchedAt.toIso8601String(),
      };

  static AirQualityReading fromJson(Map<String, dynamic> j) => AirQualityReading(
        cityAr: j['cityAr'] ?? '',
        cityEn: j['cityEn'] ?? '',
        aqi: (j['aqi'] as num?)?.toInt() ?? 0,
        pm25: (j['pm25'] as num?)?.toDouble() ?? 0,
        fetchedAt: DateTime.tryParse(j['fetchedAt'] ?? '') ?? DateTime.now(),
      );
}

class AirQualityService {
  static const _cacheKey = 'air_quality_v2';
  // nameAr, nameEn, lat, lon - matching the web app's city list.
  static const _cities = <List<dynamic>>[
    ['القاهرة', 'Cairo', 30.0444, 31.2357],
    ['الجيزة', 'Giza', 30.0131, 31.2089],
    ['الإسكندرية', 'Alexandria', 31.2001, 29.9187],
    ['المنصورة', 'Mansoura', 31.0409, 31.3785],
    ['طنطا', 'Tanta', 30.7865, 31.0004],
    ['بورسعيد', 'Port Said', 31.2653, 32.3019],
    ['السويس', 'Suez', 29.9668, 32.5498],
    ['أسيوط', 'Asyut', 27.1809, 31.1837],
    ['الأقصر', 'Luxor', 25.6872, 32.6396],
    ['أسوان', 'Aswan', 24.0889, 32.8998],
    ['الغردقة', 'Hurghada', 27.2579, 33.8116],
  ];

  /// Returns cached readings when fresh (< 1 hour), otherwise fetches live.
  static Future<List<AirQualityReading>> getReadings() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null) return cached;
    final fresh = await _fetchBatched();
    if (fresh.isNotEmpty) {
      await prefs.setString(
          _cacheKey, jsonEncode(fresh.map((r) => r.toJson()).toList()));
      return fresh;
    }
    // Offline or API down: fall back to stale cache if we have any.
    return _readCache(prefs, allowStale: true) ?? [];
  }

  static List<AirQualityReading>? _readCache(SharedPreferences prefs,
      {bool allowStale = false}) {
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      final list = (jsonDecode(raw) as List)
          .whereType<Map>()
          .map((e) => AirQualityReading.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      if (list.isEmpty) return null;
      final age = DateTime.now().difference(list.first.fetchedAt);
      if (!allowStale && age > const Duration(hours: 1)) return null;
      return list;
    } catch (_) {
      return null;
    }
  }

  /// One request for all cities: Open-Meteo accepts comma-separated
  /// coordinates and returns a JSON array in the same order.
  static Future<List<AirQualityReading>> _fetchBatched() async {
    try {
      final lats = _cities.map((c) => c[2]).join(',');
      final lons = _cities.map((c) => c[3]).join(',');
      final uri = Uri.parse(
          'https://air-quality-api.open-meteo.com/v1/air-quality'
          '?latitude=$lats&longitude=$lons'
          '&current=us_aqi,pm2_5&timezone=Africa%2FCairo');
      final res = await http.get(uri).timeout(const Duration(seconds: 12));
      if (res.statusCode != 200) return [];
      final data = jsonDecode(res.body);
      if (data is! List) return [];
      final out = <AirQualityReading>[];
      for (var i = 0; i < data.length && i < _cities.length; i++) {
        final current = data[i]['current'];
        if (current == null) continue;
        out.add(AirQualityReading(
          cityAr: _cities[i][0],
          cityEn: _cities[i][1],
          aqi: (current['us_aqi'] as num?)?.toInt() ?? 0,
          pm25: (current['pm2_5'] as num?)?.toDouble() ?? 0,
          fetchedAt: DateTime.now(),
        ));
      }
      return out;
    } catch (_) {
      // Never fake a value; the caller falls back to cache or shows unavailable.
      return [];
    }
  }

  /// Plain-language AQI label (US EPA bands).
  static String label(int aqi, bool ar) {
    if (aqi <= 50) return ar ? 'جيدة' : 'Good';
    if (aqi <= 100) return ar ? 'مقبولة' : 'Moderate';
    if (aqi <= 150) return ar ? 'غير صحية للحساسين' : 'Unhealthy for sensitive';
    if (aqi <= 200) return ar ? 'غير صحية' : 'Unhealthy';
    if (aqi <= 300) return ar ? 'غير صحية جدًا' : 'Very unhealthy';
    return ar ? 'خطيرة' : 'Hazardous';
  }
}
