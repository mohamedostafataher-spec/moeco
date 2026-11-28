import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'weather_service.dart' show NationalWeatherAlerts;

/// Comprehensive national alert center: heat, cold, storms, heavy rain,
/// strong wind, dust, UV, poor air quality, and derived fire-weather risk.
/// EVERY item is forecast-derived from Open-Meteo (forecast API + CAMS
/// air-quality API) — free, no key. No official EMA feed exists that we
/// can read; the UI says exactly that instead of inventing one.
enum AlertSeverity { advisory, watch, warning, severe }

enum AlertKind {
  extremeHeat,
  heat,
  cold,
  storm,
  heavyRain,
  strongWind,
  dust,
  uv,
  poorAir,
  fireRisk,
}

class AlertItem {
  final String cityAr;
  final String cityEn;
  final AlertKind kind;
  final AlertSeverity severity;
  final double value; // C, km/h, AQI, ug/m3, UV index, or mm
  const AlertItem(this.cityAr, this.cityEn, this.kind, this.severity, this.value);

  Map<String, dynamic> toJson() => {
        'cityAr': cityAr,
        'cityEn': cityEn,
        'kind': kind.name,
        'severity': severity.name,
        'value': value,
      };

  static AlertItem fromJson(Map<String, dynamic> j) => AlertItem(
        j['cityAr'] ?? '',
        j['cityEn'] ?? '',
        AlertKind.values.firstWhere((k) => k.name == j['kind'],
            orElse: () => AlertKind.heat),
        AlertSeverity.values.firstWhere((s) => s.name == j['severity'],
            orElse: () => AlertSeverity.advisory),
        (j['value'] as num?)?.toDouble() ?? 0,
      );
}

/// One city's combined inputs (pure, testable).
class CityAlertInput {
  final String cityAr;
  final String cityEn;
  final double lat;
  final double lon;
  final double maxTemp;
  final double minTemp;
  final double precipMm;
  final double precipProb; // %
  final double uvMax;
  final double windKmh;
  final int code;
  final int usAqi;
  final double dustUgM3;
  const CityAlertInput({
    required this.cityAr,
    required this.cityEn,
    required this.lat,
    required this.lon,
    required this.maxTemp,
    required this.minTemp,
    required this.precipMm,
    required this.precipProb,
    required this.uvMax,
    required this.windKmh,
    required this.code,
    required this.usAqi,
    required this.dustUgM3,
  });
}

class AlertCenterData {
  final List<AlertItem> alerts;
  final List<CityAlertInput> cities;
  final DateTime fetchedAt;
  const AlertCenterData(this.alerts, this.cities, this.fetchedAt);

  /// Worst severity per city, for the map markers and summary.
  Map<String, AlertSeverity> worstPerCity() {
    final out = <String, AlertSeverity>{};
    for (final a in alerts) {
      final cur = out[a.cityEn];
      if (cur == null || a.severity.index > cur.index) {
        out[a.cityEn] = a.severity;
      }
    }
    return out;
  }
}

class AlertCenterService {
  static const _cacheKey = 'alert_center_v1';
  static const _stormCodes = {95, 96, 99};
  static const _rainCodes = {61, 63, 65, 66, 67, 80, 81, 82};

  /// Pure derivation (unit-tested). Thresholds are documented in the UI
  /// footer and labeled forecast-derived.
  static List<AlertItem> deriveAlerts(List<CityAlertInput> cities) {
    final alerts = <AlertItem>[];
    for (final c in cities) {
      void add(AlertKind k, AlertSeverity s, double v) =>
          alerts.add(AlertItem(c.cityAr, c.cityEn, k, s, v));

      // Heat (WMO-style national warning practice: 38/42/45 steps).
      if (c.maxTemp >= 45) {
        add(AlertKind.extremeHeat, AlertSeverity.severe, c.maxTemp);
      } else if (c.maxTemp >= 42) {
        add(AlertKind.extremeHeat, AlertSeverity.warning, c.maxTemp);
      } else if (c.maxTemp >= 38) {
        add(AlertKind.heat, AlertSeverity.watch, c.maxTemp);
      }
      if (c.minTemp <= 5) add(AlertKind.cold, AlertSeverity.advisory, c.minTemp);
      // Storms / heavy rain (flood risk).
      if (_stormCodes.contains(c.code)) {
        add(AlertKind.storm, AlertSeverity.warning, 0);
      } else if (_rainCodes.contains(c.code) &&
          c.precipProb >= 70 &&
          c.precipMm >= 10) {
        add(AlertKind.heavyRain,
            c.precipMm >= 25 ? AlertSeverity.severe : AlertSeverity.warning,
            c.precipMm);
      }
      // Wind.
      if (c.windKmh >= 70) {
        add(AlertKind.strongWind, AlertSeverity.severe, c.windKmh);
      } else if (c.windKmh >= 50) {
        add(AlertKind.strongWind, AlertSeverity.warning, c.windKmh);
      }
      // Dust (CAMS dust mass concentration, ug/m3).
      if (c.dustUgM3 >= 600) {
        add(AlertKind.dust, AlertSeverity.severe, c.dustUgM3);
      } else if (c.dustUgM3 >= 300) {
        add(AlertKind.dust, AlertSeverity.warning, c.dustUgM3);
      } else if (c.dustUgM3 >= 150) {
        add(AlertKind.dust, AlertSeverity.watch, c.dustUgM3);
      }
      // UV (WHO bands: 8-10 very high, 11+ extreme).
      if (c.uvMax >= 11) {
        add(AlertKind.uv, AlertSeverity.warning, c.uvMax);
      } else if (c.uvMax >= 8) {
        add(AlertKind.uv, AlertSeverity.watch, c.uvMax);
      }
      // Air quality (US AQI).
      if (c.usAqi > 200) {
        add(AlertKind.poorAir, AlertSeverity.severe, c.usAqi.toDouble());
      } else if (c.usAqi > 150) {
        add(AlertKind.poorAir, AlertSeverity.warning, c.usAqi.toDouble());
      } else if (c.usAqi > 100) {
        add(AlertKind.poorAir, AlertSeverity.watch, c.usAqi.toDouble());
      }
      // Fire-weather risk indicator: hot + windy + dry (derived, honest).
      if (c.maxTemp >= 35 && c.windKmh >= 30 && c.precipMm < 1) {
        add(AlertKind.fireRisk, AlertSeverity.advisory, c.maxTemp);
      }
    }
    alerts.sort((a, b) => b.severity.index.compareTo(a.severity.index));
    return alerts;
  }

  /// Fresh (< 30 min) cache, otherwise live; stale cache when offline.
  static Future<AlertCenterData?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null &&
        DateTime.now().difference(cached.fetchedAt) <
            const Duration(minutes: 30)) {
      return cached;
    }
    final fresh = await _fetch();
    if (fresh != null) {
      await prefs.setString(
          _cacheKey,
          jsonEncode({
            'at': fresh.fetchedAt.toIso8601String(),
            'alerts': fresh.alerts.map((a) => a.toJson()).toList(),
            'cities': fresh.cities
                .map((c) => {
                      'cityAr': c.cityAr,
                      'cityEn': c.cityEn,
                      'lat': c.lat,
                      'lon': c.lon,
                    })
                .toList(),
          }));
      return fresh;
    }
    return cached;
  }

  static AlertCenterData? _readCache(SharedPreferences prefs) {
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      final j = jsonDecode(raw) as Map<String, dynamic>;
      final at = DateTime.tryParse(j['at'] ?? '') ?? DateTime(2000);
      final alerts = (j['alerts'] as List? ?? [])
          .map((e) => AlertItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      final cities = (j['cities'] as List? ?? [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .map((m) => CityAlertInput(
                cityAr: m['cityAr'] ?? '',
                cityEn: m['cityEn'] ?? '',
                lat: (m['lat'] as num?)?.toDouble() ?? 0,
                lon: (m['lon'] as num?)?.toDouble() ?? 0,
                maxTemp: 0, minTemp: 0, precipMm: 0, precipProb: 0,
                uvMax: 0, windKmh: 0, code: 0, usAqi: 0, dustUgM3: 0,
              ))
          .toList();
      return AlertCenterData(alerts, cities, at);
    } catch (_) {
      return null;
    }
  }

  static Future<AlertCenterData?> _fetch() async {
    final cities = NationalWeatherAlerts.cities;
    final lats = cities.map((c) => c.$3).join(',');
    final lons = cities.map((c) => c.$4).join(',');
    try {
      final wxUri = Uri.parse(
        'https://api.open-meteo.com/v1/forecast'
        '?latitude=$lats&longitude=$lons'
        '&current=temperature_2m,weather_code,wind_speed_10m'
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max'
        '&forecast_days=1&timezone=Africa%2FCairo',
      );
      final airUri = Uri.parse(
        'https://air-quality-api.open-meteo.com/v1/air-quality'
        '?latitude=$lats&longitude=$lons'
        '&current=us_aqi,dust&timezone=Africa%2FCairo',
      );
      final results = await Future.wait([
        http.get(wxUri).timeout(const Duration(seconds: 12)),
        http.get(airUri).timeout(const Duration(seconds: 12)),
      ]);
      if (results[0].statusCode != 200) return null;
      double firstOf(dynamic v) =>
          v is List && v.isNotEmpty ? (v.first as num).toDouble() : 0;
      final wxBody = jsonDecode(results[0].body);
      final List<dynamic> wxItems = wxBody is List ? wxBody : [wxBody];
      Map<String, dynamic>? airAt(int i) {
        if (results[1].statusCode != 200) return null;
        final ab = jsonDecode(results[1].body);
        final List<dynamic> items = ab is List ? ab : [ab];
        if (i >= items.length) return null;
        return (items[i]['current'] as Map?)?.cast<String, dynamic>();
      }

      final inputs = <CityAlertInput>[];
      for (var i = 0; i < wxItems.length && i < cities.length; i++) {
        final item = wxItems[i] as Map<String, dynamic>;
        final cur = (item['current'] as Map?)?.cast<String, dynamic>() ?? {};
        final daily = (item['daily'] as Map?)?.cast<String, dynamic>() ?? {};
        final air = airAt(i) ?? {};
        inputs.add(CityAlertInput(
          cityAr: cities[i].$1,
          cityEn: cities[i].$2,
          lat: cities[i].$3,
          lon: cities[i].$4,
          maxTemp: firstOf(daily['temperature_2m_max']),
          minTemp: firstOf(daily['temperature_2m_min']),
          precipMm: firstOf(daily['precipitation_sum']),
          precipProb: firstOf(daily['precipitation_probability_max']),
          uvMax: firstOf(daily['uv_index_max']),
          windKmh: (cur['wind_speed_10m'] as num?)?.toDouble() ?? 0,
          code: (cur['weather_code'] as num?)?.toInt() ?? 0,
          usAqi: (air['us_aqi'] as num?)?.toInt() ?? 0,
          dustUgM3: (air['dust'] as num?)?.toDouble() ?? 0,
        ));
      }
      if (inputs.isEmpty) return null;
      return AlertCenterData(deriveAlerts(inputs), inputs, DateTime.now());
    } catch (_) {
      return null;
    }
  }
}
