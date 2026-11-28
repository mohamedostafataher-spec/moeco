import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Today's prayer times for Cairo from Aladhan (free, no API key),
/// using calculation method 5 (Egyptian General Authority of Survey).
/// Cached per Gregorian date so the app stays offline-friendly.
class PrayerTimes {
  final String date; // yyyy-MM-dd (local)
  final Map<String, String> times; // name -> "HH:mm" (24h)
  final DateTime fetchedAt;

  PrayerTimes({required this.date, required this.times, required this.fetchedAt});

  Map<String, dynamic> toJson() => {
        'date': date,
        'times': times,
        'fetchedAt': fetchedAt.toIso8601String(),
      };

  static PrayerTimes fromJson(Map<String, dynamic> j) => PrayerTimes(
        date: j['date'] ?? '',
        times: (j['times'] as Map?)
                ?.map((k, v) => MapEntry(k.toString(), v.toString())) ??
            {},
        fetchedAt: DateTime.tryParse(j['fetchedAt'] ?? '') ?? DateTime.now(),
      );
}

class PrayerTimesService {
  static const _cacheKey = 'prayer_times_v1';

  /// Prayer order shown in the app (Sunrise omitted: it is not a prayer).
  static const order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  static String _todayKey() {
    final now = DateTime.now();
    final m = now.month.toString().padLeft(2, '0');
    final d = now.day.toString().padLeft(2, '0');
    return '${now.year}-$m-$d';
  }

  /// Returns today's times, from cache when already fetched today,
  /// otherwise live. Falls back to yesterday's cache when offline so the
  /// card never shows fabricated values, only slightly stale ones.
  static Future<PrayerTimes?> getToday() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null && cached.date == _todayKey()) return cached;
    final fresh = await _fetch();
    if (fresh != null) {
      await prefs.setString(_cacheKey, jsonEncode(fresh.toJson()));
      return fresh;
    }
    return cached; // may be null (first launch offline) or stale
  }

  static PrayerTimes? _readCache(SharedPreferences prefs) {
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      final pt = PrayerTimes.fromJson(
          Map<String, dynamic>.from(jsonDecode(raw) as Map));
      if (pt.times.isEmpty) return null;
      return pt;
    } catch (_) {
      return null;
    }
  }

  static Future<PrayerTimes?> _fetch() async {
    try {
      final uri = Uri.parse(
          'https://api.aladhan.com/v1/timingsByCity'
          '?city=Cairo&country=Egypt&method=5');
      final res = await http.get(uri).timeout(const Duration(seconds: 10));
      if (res.statusCode != 200) return null;
      final data = jsonDecode(res.body);
      final timings = data['data']?['timings'];
      if (timings is! Map) return null;
      final times = <String, String>{};
      for (final name in order) {
        final v = timings[name];
        if (v is String && v.length >= 5) {
          // API returns "HH:mm" or "HH:mm (EET)"; keep the clock part.
          times[name] = v.substring(0, 5);
        }
      }
      if (times.length != order.length) return null;
      return PrayerTimes(
          date: _todayKey(), times: times, fetchedAt: DateTime.now());
    } catch (_) {
      return null;
    }
  }

  /// Name of the next prayer today, or null when Isha has passed
  /// (or when times are not for today).
  static String? nextPrayer(PrayerTimes pt) {
    if (pt.date != _todayKey()) return null;
    final now = DateTime.now();
    final nowMinutes = now.hour * 60 + now.minute;
    for (final name in order) {
      final t = pt.times[name];
      if (t == null) continue;
      final parts = t.split(':');
      final minutes = int.parse(parts[0]) * 60 + int.parse(parts[1]);
      if (minutes > nowMinutes) return name;
    }
    return null;
  }
}
