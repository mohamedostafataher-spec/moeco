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
  static const _cacheKey = 'air_quality_v1';
  static const _cities = <String, List<dynamic>>{
    // nameAr, nameEn, lat, lon
    'cairo': ['القاهرة', 'Cairo', 30.0444, 31.2357],
    'giza': ['الجيزة', 'Giza', 30.0131, 31.2089],
    'alex': ['الإسكندرية', 'Alexandria', 31.2001, 29.9187],
  };

  /// Returns cached readings when fresh (< 1 hour), otherwise fetches live.
  static Future<List<AirQualityReading>> getReadings() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null) return cached;
    final fresh = await _fetch();
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

  static Future<List<AirQualityReading>> _fetch() async {
    final out = <AirQualityReading>[];
    for (final entry in _cities.entries) {
      final names = entry.value;
      try {
        final uri = Uri.parse(
            'https://air-quality-api.open-meteo.com/v1/air-quality'
            '?latitude=${names[2]}&longitude=${names[3]}'
            '&current=us_aqi,pm2_5&timezone=Africa%2FCairo');
        final res = await http.get(uri).timeout(const Duration(seconds: 10));
        if (res.statusCode != 200) continue;
        final data = jsonDecode(res.body);
        final current = data['current'];
        if (current == null) continue;
        out.add(AirQualityReading(
          cityAr: names[0],
          cityEn: names[1],
          aqi: (current['us_aqi'] as num?)?.toInt() ?? 0,
          pm25: (current['pm2_5'] as num?)?.toDouble() ?? 0,
          fetchedAt: DateTime.now(),
        ));
      } catch (_) {
        // Skip a city that fails; never fake a value.
      }
    }
    return out;
  }

  /// Plain-language AQI label (US EPA bands).
  static String label(int aqi, bool ar) {
    if (aqi <= 50) return ar ? 'جيدة' : 'Good';
    if (aqi <= 100) return ar ? 'متوسطة' : 'Moderate';
    if (aqi <= 150) return ar ? 'غير صحية للحساسين' : 'Unhealthy for sensitive';
    if (aqi <= 200) return ar ? 'غير صحية' : 'Unhealthy';
    if (aqi <= 300) return ar ? 'غير صحية جدًا' : 'Very unhealthy';
    return ar ? 'خطيرة' : 'Hazardous';
  }
}
