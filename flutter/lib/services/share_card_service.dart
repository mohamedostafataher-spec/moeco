import 'footprint_store.dart';

/// F5: the real numbers behind the shareable achievement card.
/// Everything comes from on-device logs. The card says exactly that,
/// so nobody mistakes it for a leaderboard or a cloud stat.
class ShareStats {
  final int streakDays;
  final int totalLoggedDays;
  final double greenKm;
  final double co2SavedKg;
  final int meterMonths;
  const ShareStats({
    required this.streakDays,
    required this.totalLoggedDays,
    required this.greenKm,
    required this.co2SavedKg,
    required this.meterMonths,
  });

  bool get hasAnything =>
      totalLoggedDays > 0 || greenKm > 0 || meterMonths > 0;
}

class ShareCardService {
  static ShareStats compute(FootprintStore store) {
    return ShareStats(
      streakDays: store.streak,
      totalLoggedDays: store.logs.length,
      greenKm: store.greenTripTotalKm,
      co2SavedKg: store.greenTripCo2SavedKg,
      meterMonths: store.meterReadings.length,
    );
  }
}
