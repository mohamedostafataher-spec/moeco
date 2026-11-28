import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'recycling_service.dart' show RecyclingCity;

/// Green and water spots (parks, gardens, drinking water) from
/// OpenStreetMap's Overpass API (free, no key, community data).
/// Same caching pattern as the recycling service: fresh cache,
/// then live, then stale cache when offline.
enum GreenSpotKind { park, garden, drinkingWater }

class GreenSpot {
  final String name;
  final double lat;
  final double lon;
  final GreenSpotKind kind;
  final double distKm; // from the searched city center

  GreenSpot({
    required this.name,
    required this.lat,
    required this.lon,
    required this.kind,
    required this.distKm,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'lat': lat,
        'lon': lon,
        'kind': kind.name,
        'distKm': distKm,
      };

  static GreenSpot fromJson(Map<String, dynamic> j) => GreenSpot(
        name: j['name'] ?? '',
        lat: (j['lat'] as num?)?.toDouble() ?? 0,
        lon: (j['lon'] as num?)?.toDouble() ?? 0,
        kind: GreenSpotKind.values.firstWhere(
          (k) => k.name == j['kind'],
          orElse: () => GreenSpotKind.park,
        ),
        distKm: (j['distKm'] as num?)?.toDouble() ?? 0,
      );
}

class GreenSpotsService {
  static String _cacheKey(String cityEn) => 'green_spots_$cityEn';

  static Future<List<GreenSpot>?> getSpots(RecyclingCity city) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _cacheKey(city.nameEn);
    final cached = _readCache(prefs.getString(key));
    if (cached != null) return cached;
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
    return _readCache(prefs.getString(key), allowStale: true);
  }

  static List<GreenSpot>? _readCache(String? raw, {bool allowStale = false}) {
    if (raw == null) return null;
    try {
      final j = jsonDecode(raw);
      final at = DateTime.tryParse(j['at'] ?? '') ?? DateTime(2000);
      if (!allowStale &&
          DateTime.now().difference(at) > const Duration(hours: 6)) {
        return null;
      }
      return (j['points'] as List)
          .whereType<Map>()
          .map((e) => GreenSpot.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      return null;
    }
  }

  static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = (lat2 - lat1) * pi / 180;
    final dLon = (lon2 - lon1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) *
            cos(lat2 * pi / 180) *
            sin(dLon / 2) *
            sin(dLon / 2);
    return r * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  static Future<List<GreenSpot>?> _fetch(RecyclingCity city) async {
    const d = 0.12; // ~13 km box
    final bbox =
        '${city.lat - d},${city.lon - d},${city.lat + d},${city.lon + d}';
    final query = '[out:json][timeout:20];('
        'node["leisure"="park"]($bbox);'
        'way["leisure"="park"]($bbox);'
        'node["leisure"="garden"]($bbox);'
        'way["leisure"="garden"]($bbox);'
        'node["amenity"="drinking_water"]($bbox);'
        ');out center 40;';
    try {
      final uri = Uri.parse(
          'https://overpass-api.de/api/interpreter?data=${Uri.encodeComponent(query)}');
      final res = await http.get(uri).timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) return null;
      final elements = jsonDecode(res.body)['elements'];
      if (elements is! List) return null;
      return parseElements(elements, city.lat, city.lon);
    } catch (_) {
      return null;
    }
  }

  /// Pure parser (unit-tested): Overpass elements -> spots near the center.
  static List<GreenSpot> parseElements(
      List<dynamic> elements, double centerLat, double centerLon) {
    final out = <GreenSpot>[];
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
      final kind = tags['amenity'] == 'drinking_water'
          ? GreenSpotKind.drinkingWater
          : tags['leisure'] == 'garden'
              ? GreenSpotKind.garden
              : GreenSpotKind.park;
      final name = '${tags['name:ar'] ?? tags['name'] ?? ''}'.trim();
      if (name.isEmpty) continue; // unnamed points help no one
      out.add(GreenSpot(
        name: name,
        lat: lat,
        lon: lon,
        kind: kind,
        distKm: haversineKm(centerLat, centerLon, lat, lon),
      ));
    }
    out.sort((a, b) => a.distKm.compareTo(b.distKm));
    return out;
  }
}
