/// F4: tier-nearing alert + weekly savings tip with EGP values.
///
/// The Egyptian electricity slab system re-rates the ENTIRE bill when
/// consumption crosses a boundary (e.g. 200 -> 201 kWh moves every kWh
/// from 0.95 to 1.55 EGP). So the most valuable warning we can give is
/// "you are N kWh from a boundary; crossing it adds about X EGP".
///
/// Tier table must stay identical to the official one in
/// utilities_screen.dart (a widget test asserts both agree).
/// Savings figures are documented engineering estimates (labeled as
/// estimates in the UI), never promises.
class TierStatus {
  final int tierIndex; // 0-based index into the slab table
  final double tierPrice; // EGP/kWh at current slab
  final double? kwhToNext; // null when already on the top slab
  final double? crossingJump; // estimated extra EGP if the next slab is crossed
  const TierStatus(this.tierIndex, this.tierPrice, this.kwhToNext, this.crossingJump);

  bool get nearNextTier =>
      kwhToNext != null && (kwhToNext! <= 25 || kwhToNext! <= 0.1 * _tierSpan);
  double get _tierSpan => const [50.0, 50.0, 100.0, 150.0, 300.0, 350.0][tierIndex.clamp(0, 5)];
}

class SavingsTip {
  final String id;
  final String titleAr;
  final String titleEn;
  final double kwhSavedMonthly;
  const SavingsTip(this.id, this.titleAr, this.titleEn, this.kwhSavedMonthly);

  /// EGP saved per month at the user's marginal slab price.
  double egpSaved(double marginalPrice) => kwhSavedMonthly * marginalPrice;
}

class SavingsTipsService {
  /// Official 2026 slabs (mirrors utilities_screen.dart; test keeps sync).
  static const _slabCaps = [50.0, 100.0, 200.0, 350.0, 650.0, 1000.0];
  static const _slabPrices = [0.68, 0.78, 0.95, 1.55, 1.95, 2.10, 2.58];
  static const _slabFees = [1.0, 2.0, 6.0, 11.0, 15.0, 25.0, 40.0];

  static double estimateBill(double kwh) {
    final i = tierIndexForKwh(kwh);
    return kwh * _slabPrices[i] + _slabFees[i];
  }

  static int tierIndexForKwh(double kwh) {
    if (kwh <= 50) return 0;
    if (kwh <= 100) return 1;
    if (kwh <= 200) return 2;
    if (kwh <= 350) return 3;
    if (kwh <= 650) return 4;
    if (kwh <= 1000) return 5;
    return 6;
  }

  static TierStatus tierStatus(double kwh) {
    final i = tierIndexForKwh(kwh);
    if (i >= 6) return TierStatus(i, _slabPrices[i], null, null);
    final next = _slabCaps[i];
    final kwhToNext = next - kwh + 1; // first kWh of the next slab
    // Jump if the user crosses: whole-bill re-rating at the boundary.
    final nowBill = estimateBill(kwh);
    final crossedBill = estimateBill(next + 1);
    final jump = crossedBill - nowBill - (next + 1 - kwh) * _slabPrices[i];
    return TierStatus(i, _slabPrices[i], kwhToNext, jump < 0 ? 0 : jump);
  }

  /// Documented conservation estimates for Egyptian homes (estimates).
  static const tips = <SavingsTip>[
    SavingsTip('ac_degree', 'ارفع درجة التكييف درجة واحدة', 'Raise the AC setpoint by 1 degree', 30),
    SavingsTip('ac_hour', 'قلل التكييف ساعة كل يوم', 'Run the AC one hour less each day', 45),
    SavingsTip('led', 'بدّل ٥ لمبات عادية بلمات ليد', 'Swap 5 old bulbs for LED', 24),
    SavingsTip('heater', 'قلل السخان ١٠ دقائق يوميًا', 'Cut the water heater by 10 min/day', 35),
    SavingsTip('standby', 'افصل الأجهزة في وضع الاستعداد', 'Unplug standby devices', 15),
    SavingsTip('fridge', 'نضّف ملفات التلاجة وابعدها عن الحيطة', 'Clean fridge coils and ventilate it', 20),
  ];

  /// Deterministic weekly rotation: same tip all week, changes next week.
  static SavingsTip weeklyTip(DateTime now) {
    final weekOfYear =
        (now.difference(DateTime(now.year, 1, 1)).inDays / 7).floor();
    return tips[(weekOfYear + now.year) % tips.length];
  }
}
