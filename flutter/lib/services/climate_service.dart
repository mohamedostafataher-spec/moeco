import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Historical yearly mean temperatures for Egyptian cities from the
/// Open-Meteo archive (ERA5 reanalysis; free, no API key).
/// Cached locally for 24 hours. Never fabricates values.
class ClimateSeries {
  final String cityAr;
  final String cityEn;
  final Map<int, double> yearlyMean; // year -> mean °C
  final DateTime fetchedAt;

  ClimateSeries({
    required this.cityAr,
    required this.cityEn,
    required this.yearlyMean,
    required this.fetchedAt,
  });

  /// First-half vs second-half change over the available window.
  double get changeC {
    if (yearlyMean.length < 4) return 0;
    final years = yearlyMean.keys.toList()..sort();
    final half = years.length ~/ 2;
    final first = years.sublist(0, half).map((y) => yearlyMean[y]!);
    final last = years.sublist(years.length - half).map((y) => yearlyMean[y]!);
    double avg(Iterable<double> v) => v.reduce((a, b) => a + b) / v.length;
    return avg(last) - avg(first);
  }

  Map<String, dynamic> toJson() => {
        'cityAr': cityAr,
        'cityEn': cityEn,
        'yearlyMean': yearlyMean.map((k, v) => MapEntry(k.toString(), v)),
        'fetchedAt': fetchedAt.toIso8601String(),
      };

  static ClimateSeries fromJson(Map<String, dynamic> j) => ClimateSeries(
        cityAr: j['cityAr'] ?? '',
        cityEn: j['cityEn'] ?? '',
        yearlyMean: (j['yearlyMean'] as Map? ?? {}).map(
            (k, v) => MapEntry(int.tryParse(k.toString()) ?? 0, (v as num).toDouble())),
        fetchedAt: DateTime.tryParse(j['fetchedAt'] ?? '') ?? DateTime.now(),
      );
}

class ClimateService {
  static const _cacheKey = 'climate_series_v1';
  static const _years = 12;

  static const _cities = <List<dynamic>>[
    ['القاهرة', 'Cairo', 30.0444, 31.2357],
    ['الإسكندرية', 'Alexandria', 31.2001, 29.9187],
    ['أسوان', 'Aswan', 24.0889, 32.8998],
  ];

  static Future<List<ClimateSeries>> getSeries() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null) return cached;
    final fresh = await _fetchAll();
    if (fresh.isNotEmpty) {
      await prefs.setString(
          _cacheKey, jsonEncode(fresh.map((c) => c.toJson()).toList()));
      return fresh;
    }
    return _readCache(prefs, allowStale: true) ?? [];
  }

  static List<ClimateSeries>? _readCache(SharedPreferences prefs,
      {bool allowStale = false}) {
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      final list = (jsonDecode(raw) as List)
          .whereType<Map>()
          .map((e) => ClimateSeries.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      if (list.isEmpty) return null;
      final age = DateTime.now().difference(list.first.fetchedAt);
      if (!allowStale && age > const Duration(hours: 24)) return null;
      return list;
    } catch (_) {
      return null;
    }
  }

  static Future<List<ClimateSeries>> _fetchAll() async {
    final now = DateTime.now();
    // End at last full year so every yearly bar is complete.
    final start = DateTime(now.year - _years, 1, 1);
    final end = DateTime(now.year - 1, 12, 31);
    String d(DateTime x) => x.toIso8601String().substring(0, 10);
    final out = <ClimateSeries>[];
    for (final c in _cities) {
      try {
        final uri = Uri.parse('https://archive-api.open-meteo.com/v1/archive'
            '?latitude=${c[2]}&longitude=${c[3]}'
            '&start_date=${d(start)}&end_date=${d(end)}'
            '&daily=temperature_2m_mean&timezone=Africa%2FCairo');
        final res = await http.get(uri).timeout(const Duration(seconds: 20));
        if (res.statusCode != 200) continue;
        final data = jsonDecode(res.body);
        final daily = data['daily'];
        if (daily == null) continue;
        final times = (daily['time'] as List).cast<String>();
        final temps = (daily['temperature_2m_mean'] as List);
        final sums = <int, double>{};
        final counts = <int, int>{};
        for (var i = 0; i < times.length; i++) {
          final t = temps[i];
          if (t == null) continue;
          final y = int.parse(times[i].substring(0, 4));
          sums[y] = (sums[y] ?? 0) + (t as num).toDouble();
          counts[y] = (counts[y] ?? 0) + 1;
        }
        final yearly = <int, double>{};
        sums.forEach((y, s) {
          if ((counts[y] ?? 0) > 300) yearly[y] = s / counts[y]!;
        });
        if (yearly.isNotEmpty) {
          out.add(ClimateSeries(
            cityAr: c[0],
            cityEn: c[1],
            yearlyMean: yearly,
            fetchedAt: DateTime.now(),
          ));
        }
      } catch (_) {
        // skip this city; never fake values
      }
    }
    return out;
  }
}
