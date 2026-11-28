import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// F13 (on-device): suggestion box. Suggestions are stored locally and the
/// user shares them manually (WhatsApp, email, any app) - no server.
class Suggestion {
  final String id;
  final String text;
  final DateTime createdAt;
  const Suggestion(this.id, this.text, this.createdAt);

  Map<String, dynamic> toJson() =>
      {'id': id, 'text': text, 'createdAt': createdAt.toIso8601String()};

  static Suggestion fromJson(Map<String, dynamic> j) => Suggestion(
        j['id'] ?? '',
        j['text'] ?? '',
        DateTime.tryParse(j['createdAt'] ?? '') ?? DateTime.now(),
      );
}

class SuggestionService {
  static const _key = 'moeco_suggestions_v1';

  /// Pure serialization helpers (unit-tested without prefs).
  static String encode(List<Suggestion> items) =>
      jsonEncode(items.map((s) => s.toJson()).toList());

  static List<Suggestion> decode(String raw) {
    try {
      return (jsonDecode(raw) as List)
          .map((e) => Suggestion.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<List<Suggestion>> readAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    return decode(raw);
  }

  static Future<Suggestion> add(String text) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await readAll();
    final s = Suggestion(
      DateTime.now().millisecondsSinceEpoch.toString(),
      text,
      DateTime.now(),
    );
    items.insert(0, s);
    await prefs.setString(_key, encode(items));
    return s;
  }

  static Future<void> delete(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await readAll()..removeWhere((s) => s.id == id);
    await prefs.setString(_key, encode(items));
  }

  static String formatForShare(List<Suggestion> items) {
    final b = StringBuffer('MoEco suggestions:\n');
    for (final s in items) {
      b.writeln('- [${s.createdAt.toIso8601String().split('T').first}] ${s.text}');
    }
    return b.toString();
  }
}
