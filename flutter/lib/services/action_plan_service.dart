import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'savings_tips_service.dart';

/// Weekly action plan (Earth Hero style): 3 small, concrete, checkable
/// actions per week, drawn from the documented savings-tips pool. Fully
/// on-device: completion state is stored locally and resets each week.
class ActionPlanService {
  static const _key = 'moeco_action_plan_v1';
  static const actionsPerWeek = 3;

  /// Week key like 2026-W47 (ISO-ish, Saturday week start for Egypt).
  static String weekKey(DateTime now) {
    final start = ChallengeWeek.start(now);
    return '${start.year}-W${((start.difference(DateTime(start.year, 1, 1)).inDays) / 7).floor()}';
  }

  /// Deterministic 3 actions for the week: rotates through the tips pool,
  /// offset from the single weekly tip so they rarely coincide.
  static List<SavingsTip> planForWeek(DateTime now) {
    final tips = SavingsTipsService.tips;
    final weekIndex =
        (now.difference(DateTime(now.year, 1, 1)).inDays / 7).floor() +
            now.year * 53;
    return List.generate(
        actionsPerWeek, (i) => tips[(weekIndex + i * 2 + 1) % tips.length]);
  }

  static Future<Set<String>> doneIds(DateTime now) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return {};
    try {
      final j = Map<String, dynamic>.from(jsonDecode(raw));
      if (j['week'] != weekKey(now)) return {};
      return Set<String>.from(j['done'] as List? ?? []);
    } catch (_) {
      return {};
    }
  }

  static Future<Set<String>> toggle(String id, DateTime now) async {
    final prefs = await SharedPreferences.getInstance();
    final done = await doneIds(now);
    if (done.contains(id)) {
      done.remove(id);
    } else {
      done.add(id);
    }
    await prefs.setString(
        _key, jsonEncode({'week': weekKey(now), 'done': done.toList()}));
    return done;
  }

  /// EGP/month the plan saves in total at the user's marginal slab price.
  static double planEgpSaved(List<SavingsTip> plan, double marginalPrice) =>
      plan.fold(0.0, (sum, t) => sum + t.egpSaved(marginalPrice));
}

/// Saturday-start week helper (shared with the challenge service logic).
class ChallengeWeek {
  static DateTime start(DateTime now) {
    final d = DateTime(now.year, now.month, now.day);
    return d.subtract(Duration(days: (d.weekday + 1) % 7));
  }
}
