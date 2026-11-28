import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import 'savings_tips_service.dart';

/// Local notifications: 100% on-device, no account, no key, no server.
/// Two schedules, respecting the engagement plan's max-1/day cap:
///   id 1 - 1st of the month, 9:00: log your meter reading.
///   id 2 - Saturday, 10:00: the weekly savings tip.
class NotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;

  /// Next 1st-of-month at 9:00 local (pure, for tests).
  static DateTime nextReadingReminder(DateTime now) {
    final firstThisMonth = DateTime(now.year, now.month, 1, 9);
    if (now.isBefore(firstThisMonth)) return firstThisMonth;
    final y = now.month == 12 ? now.year + 1 : now.year;
    final m = now.month == 12 ? 1 : now.month + 1;
    return DateTime(y, m, 1, 9);
  }

  /// Next Saturday at 10:00 local (pure, for tests).
  static DateTime nextWeeklyTip(DateTime now) {
    var d = DateTime(now.year, now.month, now.day, 10);
    final daysUntilSaturday = (DateTime.saturday - d.weekday) % 7;
    d = d.add(Duration(days: daysUntilSaturday));
    if (!now.isBefore(d)) d = d.add(const Duration(days: 7));
    return d;
  }

  static Future<void> init() async {
    if (_ready) return;
    tzdata.initializeTimeZones();
    try {
      tz.setLocalLocation(tz.getLocation('Africa/Cairo'));
    } catch (_) {
      // Unknown location name on this device: fall back to UTC offsets.
    }
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );
    await _plugin.initialize(settings);
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    _ready = true;
  }

  static const _details = NotificationDetails(
    android: AndroidNotificationDetails(
      'moeco_reminders',
      'MoEco reminders',
      importance: Importance.defaultImportance,
    ),
  );

  static Future<void> scheduleAll({required bool arabic}) async {
    if (!_ready) return;
    final now = tz.TZDateTime.now(tz.local);
    final readingAt = tz.TZDateTime.from(nextReadingReminder(now), tz.local);
    await _plugin.zonedSchedule(
      1,
      arabic ? 'سجّل قراءة العدّاد' : 'Log your meter reading',
      arabic
          ? 'أول الشهر: سجّل القراءة الحالية عشان تحسب فاتورتك بدقة.'
          : 'Start of the month: log the current reading to estimate your bill accurately.',
      readingAt,
      _details,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.dayOfMonthAndTime,
    );
    final tip = SavingsTipsService.weeklyTip(DateTime.now());
    final tipAt = tz.TZDateTime.from(nextWeeklyTip(now), tz.local);
    await _plugin.zonedSchedule(
      2,
      arabic ? 'نصيحة الأسبوع للتوفير' : 'Weekly savings tip',
      arabic ? tip.titleAr : tip.titleEn,
      tipAt,
      _details,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
    );
  }
}
