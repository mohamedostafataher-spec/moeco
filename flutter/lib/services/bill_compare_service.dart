import '../screens/utilities_screen.dart' show estimateElectricityBill;

/// F11 (on-device): compare the user's own logged months. Everything is
/// computed locally from readings the user entered - no server, no other
/// people's data. Bills are ESTIMATES on the official 2026 tariff and are
/// labeled as such in the UI.
class MonthBill {
  final String month; // YYYY-MM
  final double kwh;
  final double estimatedBill; // EGP, official 2026 tariff estimate
  const MonthBill(this.month, this.kwh, this.estimatedBill);
}

class BillComparison {
  final List<MonthBill> months; // chronological
  /// Per-month delta vs the previous month, same order as [months];
  /// first entry is null.
  final List<double?> kwhDeltaVsPrev;

  const BillComparison(this.months, this.kwhDeltaVsPrev);

  bool get hasEnoughData => months.length >= 2;

  double get averageKwh =>
      months.fold(0.0, (a, m) => a + m.kwh) / months.length;

  MonthBill get highestMonth =>
      months.reduce((a, b) => a.kwh >= b.kwh ? a : b);

  MonthBill get lowestMonth =>
      months.reduce((a, b) => a.kwh <= b.kwh ? a : b);
}

class BillCompareService {
  /// readings: rows from FootprintStore.meterReadings ({month, kwh, m3}).
  static BillComparison compare(List<Map<String, dynamic>> readings) {
    final months = readings
        .where((r) => r['kwh'] != null)
        .map((r) => MonthBill(
              r['month'] as String,
              (r['kwh'] as num).toDouble(),
              estimateElectricityBill((r['kwh'] as num).toDouble()),
            ))
        .toList()
      ..sort((a, b) => a.month.compareTo(b.month));
    final deltas = <double?>[];
    for (var i = 0; i < months.length; i++) {
      deltas.add(i == 0 ? null : months[i].kwh - months[i - 1].kwh);
    }
    return BillComparison(months, deltas);
  }
}
