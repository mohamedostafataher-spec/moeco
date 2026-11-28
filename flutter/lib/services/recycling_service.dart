import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Recycling collection points from OpenStreetMap's Overpass API
/// (free, no API key, community-maintained data).
/// Cached per governorate for 6 hours.
class RecyclingPoint {
  final String name;
  final double lat;
  final double lon;
  final List<String> materials;

  RecyclingPoint({
    required this.name,
    required this.lat,
    required this.lon,
    required this.materials,
  });

  Map<String, dynamic> toJson() =>
      {'name': name, 'lat': lat, 'lon': lon, 'materials': materials};

  static RecyclingPoint fromJson(Map<String, dynamic> j) => RecyclingPoint(
        name: j['name'] ?? '',
        lat: (j['lat'] as num?)?.toDouble() ?? 0,
        lon: (j['lon'] as num?)?.toDouble() ?? 0,
        materials:
            (j['materials'] as List?)?.whereType<String>().toList() ?? const [],
      );
}

class RecyclingCity {
  final String nameAr;
  final String nameEn;
  final double lat;
  final double lon;
  const RecyclingCity(this.nameAr, this.nameEn, this.lat, this.lon);
}

class RecyclingService {
  // Mirrors the air-quality city list (11 governorates).
  static const cities = <RecyclingCity>[
    RecyclingCity('القاهرة', 'Cairo', 30.0444, 31.2357),
    RecyclingCity('الجيزة', 'Giza', 30.0131, 31.2089),
    RecyclingCity('الإسكندرية', 'Alexandria', 31.2001, 29.9187),
    RecyclingCity('المنصورة', 'Mansoura', 31.0409, 31.3785),
    RecyclingCity('طنطا', 'Tanta', 30.7865, 31.0004),
    RecyclingCity('بورسعيد', 'Port Said', 31.2653, 32.3019),
    RecyclingCity('السويس', 'Suez', 29.9668, 32.5498),
    RecyclingCity('أسيوط', 'Asyut', 27.1809, 31.1837),
    RecyclingCity('الأقصر', 'Luxor', 25.6872, 32.6396),
    RecyclingCity('أسوان', 'Aswan', 24.0889, 32.8998),
    RecyclingCity('الغردقة', 'Hurghada', 27.2579, 33.8116),
  ];

  static String _cacheKey(String cityEn) => 'recycling_$cityEn';

  /// Points around [city], fresh cache first, then live Overpass,
  /// then stale cache when offline. Null means "could not load at all".
  static Future<List<RecyclingPoint>?> getPoints(RecyclingCity city) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _cacheKey(city.nameEn);
    final cached = _readCache(prefs.getString(key));
    if (cached != null) return cached.$1;
    final fresh = await _fetch(city);
    if (fresh != null) {
      await prefs.setString(
          key,
          jsonEncode({
            'at': DateTime.now().toIso8601String(),
            'points': fresh.map((p) => p.toJson()).toList(),
          }));
      return fresh;
    }
    // Offline or API down: stale cache of any age beats nothing.
    return _readCache(prefs.getString(key), allowStale: true)?.$1;
  }

  static (List<RecyclingPoint>, DateTime)? _readCache(String? raw,
      {bool allowStale = false}) {
    if (raw == null) return null;
    try {
      final j = jsonDecode(raw);
      final at = DateTime.tryParse(j['at'] ?? '') ?? DateTime(2000);
      if (!allowStale &&
          DateTime.now().difference(at) > const Duration(hours: 6)) {
        return null;
      }
      final pts = (j['points'] as List)
          .whereType<Map>()
          .map((e) => RecyclingPoint.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      return (pts, at);
    } catch (_) {
      return null;
    }
  }

  static Future<List<RecyclingPoint>?> _fetch(RecyclingCity city) async {
    // ~13 km box around the city center.
    const d = 0.12;
    final bbox =
        '${city.lat - d},${city.lon - d},${city.lat + d},${city.lon + d}';
    final query = '[out:json][timeout:20];('
        'node["amenity"="recycling"]($bbox);'
        'way["amenity"="recycling"]($bbox);'
        ');out center 30;';
    try {
      final uri = Uri.parse(
          'https://overpass-api.de/api/interpreter?data=${Uri.encodeComponent(query)}');
      final res = await http.get(uri).timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) return null;
      final elements = jsonDecode(res.body)['elements'];
      if (elements is! List) return null;
      return parseElements(elements);
    } catch (_) {
      return null;
    }
  }

  /// Pure parser (unit-tested): Overpass elements -> points.
  static List<RecyclingPoint> parseElements(List<dynamic> elements) {
    final out = <RecyclingPoint>[];
    for (final e in elements.whereType<Map>()) {
      final Map<String, dynamic> tags =
          e['tags'] is Map ? Map<String, dynamic>.from(e['tags']) : {};
      double? lat = (e['lat'] as num?)?.toDouble();
      double? lon = (e['lon'] as num?)?.toDouble();
      final center = e['center'];
      if (lat == null && center is Map) {
        lat = (center['lat'] as num?)?.toDouble();
        lon = (center['lon'] as num?)?.toDouble();
      }
      if (lat == null || lon == null) continue;
      final materials = tags.entries
          .where((t) =>
              t.key.startsWith('recycling:') &&
              t.key != 'recycling_type' &&
              '${t.value}' == 'yes')
          .map((t) => t.key.substring('recycling:'.length))
          .take(4)
          .toList();
      final name = (tags['name'] ??
              tags['operator'] ??
              tags['recycling_type'] ??
              'Recycling point')
          .toString();
      out.add(RecyclingPoint(
          name: name, lat: lat, lon: lon, materials: materials));
    }
    return out;
  }
}
