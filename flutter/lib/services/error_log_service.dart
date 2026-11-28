import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// F15 (on-device variant): local error log. No external account, no
/// network - crashes and errors are recorded on the device (capped at 50
/// entries) and the user can share the log themselves from Settings.
/// Nothing leaves the phone unless the user explicitly shares it.
class ErrorLogEntry {
  final DateTime at;
  final String message;
  final String? stackSummary;
  const ErrorLogEntry(this.at, this.message, this.stackSummary);

  Map<String, dynamic> toJson() => {
        'at': at.toIso8601String(),
        'message': message,
        'stackSummary': stackSummary,
      };

  static ErrorLogEntry fromJson(Map<String, dynamic> j) => ErrorLogEntry(
        DateTime.tryParse(j['at'] ?? '') ?? DateTime.now(),
        j['message'] ?? '',
        j['stackSummary'],
      );
}

class ErrorLogService {
  static const _key = 'moeco_error_log_v1';
  static const _maxEntries = 50;

  static Future<List<ErrorLogEntry>> readAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list
          .map((e) => ErrorLogEntry.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> record(Object error, StackTrace? stack) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final entries = await readAll();
      final summary = stack?.toString().split('\n').take(3).join('\n');
      entries.insert(
          0, ErrorLogEntry(DateTime.now(), error.toString(), summary));
      if (entries.length > _maxEntries) {
        entries.removeRange(_maxEntries, entries.length);
      }
      await prefs.setString(
          _key, jsonEncode(entries.map((e) => e.toJson()).toList()));
    } catch (_) {
      // Logging must never crash the app.
    }
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  static String formatForShare(List<ErrorLogEntry> entries) {
    final b = StringBuffer('MoEco error log (${entries.length} entries)\n');
    for (final e in entries) {
      b.writeln('---');
      b.writeln(e.at.toIso8601String());
      b.writeln(e.message);
      if (e.stackSummary != null) b.writeln(e.stackSummary);
    }
    return b.toString();
  }

  /// Wire into the app's error pipeline from main(). Safe to call once.
  static void install() {
    FlutterError.onError = (details) {
      record(details.exception, details.stack);
      FlutterError.presentError(details);
    };
    PlatformDispatcher.instance.onError = (error, stack) {
      record(error, stack);
      return true;
    };
  }
}
