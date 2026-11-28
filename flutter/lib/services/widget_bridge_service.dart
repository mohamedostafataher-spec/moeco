import 'package:home_widget/home_widget.dart';

import 'footprint_store.dart';
import 'weather_service.dart';
import '../screens/utilities_screen.dart' show estimateElectricityBill;

/// F8: writes the home-screen widget data (weather, bill estimate, streak)
/// to the shared store the Android widget reads. Failures are silent - the
/// widget is a bonus surface, never a reason to break the app.
class WidgetBridgeService {
  static Future<void> updateFromState({
    required bool arabic,
    required WeatherReading? weather,
    required FootprintStore store,
  }) async {
    try {
      final line1 = weather == null
          ? (arabic ? 'الطقس غير متاح دلوقتي' : 'Weather unavailable now')
          : (arabic
              ? 'القاهرة: ${weather.temp.toStringAsFixed(0)}°، رياح ${weather.windKmh.toStringAsFixed(0)} كم/س'
              : 'Cairo: ${weather.temp.toStringAsFixed(0)}°, wind ${weather.windKmh.toStringAsFixed(0)} km/h');

      final readings = store.meterReadings;
      final String line2;
      if (readings.isEmpty) {
        line2 = arabic
            ? 'سجّل قراءة العدّاد لتتبع فاتورتك'
            : 'Log your meter reading to track your bill';
      } else {
        final kwh = (readings.last['kwh'] as num?)?.toDouble() ?? 0;
        final bill = estimateElectricityBill(kwh);
        line2 = arabic
            ? 'فاتورة الشهر المقدّرة: ~${bill.toStringAsFixed(0)} جنيه'
            : 'Estimated bill this month: ~EGP ${bill.toStringAsFixed(0)}';
      }

      final streak = store.streak;
      final line3 = arabic
          ? 'سلسلة التسجيل: $streak ${streak == 1 ? "يوم" : "أيام"}'
          : 'Logging streak: $streak days';

      await HomeWidget.saveWidgetData('widget_title', 'MoEco');
      await HomeWidget.saveWidgetData('widget_line1', line1);
      await HomeWidget.saveWidgetData('widget_line2', line2);
      await HomeWidget.saveWidgetData('widget_line3', line3);
      await HomeWidget.updateWidget(androidName: 'MoEcoWidgetProvider');
    } catch (_) {
      // Widget not installed or platform channel unavailable: ignore.
    }
  }
}
