import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Local-only persistence for daily footprint logs, complaint drafts and streaks.
/// Nothing leaves the device in this version.
class FootprintStore {
  static const _kLogs = 'daily_logs_v1';
  static const _kDrafts = 'complaint_drafts_v1';
  static const _kOnboarding = 'onboarding_done_v1';

  final SharedPreferences _prefs;
  FootprintStore(this._prefs);

  static Future<FootprintStore> load() async =>
      FootprintStore(await SharedPreferences.getInstance());

  bool get onboardingDone => _prefs.getBool(_kOnboarding) ?? false;

  Future<void> markOnboardingDone() => _prefs.setBool(_kOnboarding, true);

  List<Map<String, dynamic>> _readList(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<void> _writeList(String key, List<Map<String, dynamic>> items) =>
      _prefs.setString(key, jsonEncode(items));

  // ---- Daily logs ----

  List<Map<String, dynamic>> get logs => _readList(_kLogs);

  Future<void> addLog({
    required String transport,
    required String electricity,
    required String food,
  }) async {
    final items = logs;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    items.removeWhere((e) => e['date'] == today);
    items.add({
      'date': today,
      'transport': transport,
      'electricity': electricity,
      'food': food,
    });
    await _writeList(_kLogs, items);
  }

  bool get loggedToday {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    return logs.any((e) => e['date'] == today);
  }

  /// Consecutive days logged ending today (0 if today is not logged yet).
  int get streak {
    final dates = logs.map((e) => e['date'] as String).toSet();
    var count = 0;
    var day = DateTime.now();
    if (!dates.contains(day.toIso8601String().substring(0, 10))) {
      return 0;
    }
    while (dates.contains(day.toIso8601String().substring(0, 10))) {
      count++;
      day = day.subtract(const Duration(days: 1));
    }
    return count;
  }

  // ---- Complaint drafts ----

  List<Map<String, dynamic>> get drafts => _readList(_kDrafts);

  Future<void> addDraft({
    required String title,
    required String category,
    required String notes,
  }) async {
    final items = drafts;
    items.add({
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'title': title,
      'category': category,
      'notes': notes,
      'status': 'draft',
      'createdAt': DateTime.now().toIso8601String(),
    });
    await _writeList(_kDrafts, items);
  }

  /// User-kept status: draft -> sent -> replied (and back, if needed).
  Future<void> updateDraftStatus(String id, String status) async {
    final items = drafts;
    final i = items.indexWhere((d) => d['id'] == id);
    if (i < 0) return;
    items[i]['status'] = status;
    items[i]['statusAt'] = DateTime.now().toIso8601String();
    await _writeList(_kDrafts, items);
  }

  Future<void> deleteDraft(String id) async {
    final items = drafts..removeWhere((e) => e['id'] == id);
    await _writeList(_kDrafts, items);
  }
}

// ---- Meter readings (monthly utility tracking) ----
extension MeterReadings on FootprintStore {
  static const _kMeters = 'meter_readings_v1';

  /// Readings: {month: 'YYYY-MM', kwh: num, m3: num, createdAt: iso}
  List<Map<String, dynamic>> get meterReadings {
    final items = _readList(_kMeters);
    items.sort((a, b) => (a['month'] as String).compareTo(b['month'] as String));
    return items;
  }

  Future<void> addMeterReading({
    required String month,
    required double kwh,
    required double m3,
  }) async {
    final items = _readList(_kMeters);
    items.removeWhere((e) => e['month'] == month);
    items.add({
      'month': month,
      'kwh': kwh,
      'm3': m3,
      'createdAt': DateTime.now().toIso8601String(),
    });
    await _writeList(_kMeters, items);
  }

  Future<void> deleteMeterReading(String month) async {
    final items = _readList(_kMeters)..removeWhere((e) => e['month'] == month);
    await _writeList(_kMeters, items);
  }
}

// ---- Green trips (walk / bike instead of car) ----
extension GreenTrips on FootprintStore {
  static const _kTrips = 'green_trips_v1';

  /// CO2 avoided vs driving, using the app methodology factor
  /// 0.192 kg CO2e per car-km (same as the calculator).
  static const co2PerCarKm = 0.192;

  /// Trips: {id, mode: 'walk'|'bike', km: num, createdAt: iso}
  List<Map<String, dynamic>> get greenTrips {
    final items = _readList(_kTrips);
    items.sort((a, b) =>
        (b['createdAt'] as String).compareTo(a['createdAt'] as String));
    return items;
  }

  Future<void> addGreenTrip({
    required String mode,
    required double km,
    // What the trip replaced: 'car' (default), 'metro' or 'microbus'.
    // Used for the EGP-saved estimate; trips logged before this field
    // existed are treated as car trips.
    String instead = 'car',
  }) async {
    final items = _readList(_kTrips);
    items.add({
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'mode': mode,
      'km': km,
      'instead': instead,
      'createdAt': DateTime.now().toIso8601String(),
    });
    await _writeList(_kTrips, items);
  }

  Future<void> deleteGreenTrip(String id) async {
    final items = _readList(_kTrips)..removeWhere((e) => e['id'] == id);
    await _writeList(_kTrips, items);
  }

  double get greenTripTotalKm => greenTrips.fold<double>(
      0, (sum, e) => sum + ((e['km'] as num?)?.toDouble() ?? 0));

  double get greenTripCo2SavedKg => greenTripTotalKm * co2PerCarKm;

  /// Rough EGP saved vs the transport the trip replaced. Honest
  /// approximation, labeled as تقديري in the UI: car ~3 EGP/km (fuel +
  /// wear), metro ~12 EGP/ride, microbus ~10 EGP/ride.
  static const carCostPerKm = 3.0;
  static const metroTripCost = 12.0;
  static const microbusTripCost = 10.0;

  static double tripEgpSaved(Map<String, dynamic> trip) {
    final instead = trip['instead'] as String? ?? 'car';
    final km = (trip['km'] as num?)?.toDouble() ?? 0;
    switch (instead) {
      case 'metro':
        return metroTripCost;
      case 'microbus':
        return microbusTripCost;
      default:
        return km * carCostPerKm;
    }
  }

  double get greenTripEgpSaved =>
      greenTrips.fold<double>(0, (sum, t) => sum + GreenTrips.tripEgpSaved(t));

  /// EGP saved this calendar month only.
  double greenTripEgpSavedThisMonth(DateTime now) {
    final prefix =
        '${now.year}-${now.month.toString().padLeft(2, '0')}';
    return greenTrips
        .where((t) => (t['createdAt'] as String? ?? '').startsWith(prefix))
        .fold<double>(0, (sum, t) => sum + GreenTrips.tripEgpSaved(t));
  }
}

