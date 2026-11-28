import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// F9 (on-device variant): a personal governorate challenge. The original
/// spec is a cross-governorate leaderboard - that needs a server, which
/// option (b) rules out, so this is a self-challenge tied to the user's
/// governorate: everything stays on the device and the UI says so honestly.
enum ChallengeGoalType { weeklyGreenTrips, monthlyKwhReduction }

class Challenge {
  final String governorateAr;
  final ChallengeGoalType goalType;
  final int target; // trips count, or reduction percent
  final DateTime createdAt;
  const Challenge({
    required this.governorateAr,
    required this.goalType,
    required this.target,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'governorateAr': governorateAr,
        'goalType': goalType.name,
        'target': target,
        'createdAt': createdAt.toIso8601String(),
      };

  static Challenge fromJson(Map<String, dynamic> j) => Challenge(
        governorateAr: j['governorateAr'] ?? '',
        goalType: ChallengeGoalType.values
            .firstWhere((g) => g.name == j['goalType'], orElse: () => ChallengeGoalType.weeklyGreenTrips),
        target: (j['target'] as num?)?.toInt() ?? 0,
        createdAt: DateTime.tryParse(j['createdAt'] ?? '') ?? DateTime.now(),
      );
}

class ChallengeProgress {
  final double fraction; // 0..1
  final int current; // trips this week, or reduction % achieved
  final bool done;
  const ChallengeProgress(this.fraction, this.current, this.done);
}

class ChallengeService {
  static const _key = 'moeco_challenge_v1';

  /// The 27 Egyptian governorates (Arabic, English).
  static const governorates = <(String, String)>[
    ('القاهرة', 'Cairo'),
    ('الجيزة', 'Giza'),
    ('الإسكندرية', 'Alexandria'),
    ('القليوبية', 'Qalyubia'),
    ('بورسعيد', 'Port Said'),
    ('السويس', 'Suez'),
    ('الإسماعيلية', 'Ismailia'),
    ('الدقهلية', 'Dakahlia'),
    ('الشرقية', 'Sharqia'),
    ('الغربية', 'Gharbia'),
    ('المنوفية', 'Monufia'),
    ('البحيرة', 'Beheira'),
    ('كفر الشيخ', 'Kafr El Sheikh'),
    ('دمياط', 'Damietta'),
    ('الفيوم', 'Faiyum'),
    ('بني سويف', 'Beni Suef'),
    ('المنيا', 'Minya'),
    ('أسيوط', 'Asyut'),
    ('سوهاج', 'Sohag'),
    ('قنا', 'Qena'),
    ('الأقصر', 'Luxor'),
    ('أسوان', 'Aswan'),
    ('البحر الأحمر', 'Red Sea'),
    ('الوادي الجديد', 'New Valley'),
    ('مطروح', 'Matrouh'),
    ('شمال سيناء', 'North Sinai'),
    ('جنوب سيناء', 'South Sinai'),
  ];

  static Future<Challenge?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return null;
    try {
      return Challenge.fromJson(Map<String, dynamic>.from(jsonDecode(raw)));
    } catch (_) {
      return null;
    }
  }

  static Future<void> save(Challenge c) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(c.toJson()));
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  /// Start of the current week. Egypt's week starts on Saturday.
  static DateTime weekStart(DateTime now) {
    final d = DateTime(now.year, now.month, now.day);
    final daysSinceSaturday = (d.weekday + 1) % 7;
    return d.subtract(Duration(days: daysSinceSaturday));
  }

  /// Count green trips logged since Saturday (pure for testing).
  static int tripsThisWeek(List<Map<String, dynamic>> trips, DateTime now) {
    final start = weekStart(now);
    var count = 0;
    for (final t in trips) {
      final at = DateTime.tryParse(t['createdAt'] ?? '');
      if (at != null && !at.isBefore(start)) count++;
    }
    return count;
  }

  /// % reduction of the latest month's kWh vs the month before
  /// (readings sorted chronologically). Null when fewer than 2 months.
  static int? monthlyReductionPct(List<Map<String, dynamic>> readings) {
    final rows = readings.where((r) => r['kwh'] != null).toList()
      ..sort((a, b) => (a['month'] as String).compareTo(b['month'] as String));
    if (rows.length < 2) return null;
    final prev = (rows[rows.length - 2]['kwh'] as num).toDouble();
    final last = (rows.last['kwh'] as num).toDouble();
    if (prev <= 0) return null;
    return ((prev - last) / prev * 100).round();
  }

  static ChallengeProgress progress({
    required Challenge challenge,
    required List<Map<String, dynamic>> trips,
    required List<Map<String, dynamic>> readings,
    required DateTime now,
  }) {
    switch (challenge.goalType) {
      case ChallengeGoalType.weeklyGreenTrips:
        final n = tripsThisWeek(trips, now);
        return ChallengeProgress(
          (n / challenge.target).clamp(0.0, 1.0),
          n,
          n >= challenge.target,
        );
      case ChallengeGoalType.monthlyKwhReduction:
        final pct = monthlyReductionPct(readings) ?? 0;
        final clamped = pct < 0 ? 0 : pct;
        return ChallengeProgress(
          (clamped / challenge.target).clamp(0.0, 1.0),
          clamped,
          pct >= challenge.target,
        );
    }
  }
}
