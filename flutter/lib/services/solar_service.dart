/// Rooftop solar estimator for Egypt (F-roadmap item 2). Everything is a
/// DOCUMENTED ROUGH ESTIMATE for awareness - the UI labels it clearly as
/// "تقديري مش عرض سعر". Assumptions are conservative and listed in [assumptions].
class SolarEstimate {
  final double systemKwp; // recommended PV size
  final double monthlyKwhCovered; // solar output per month at this size
  final double egpSavedMonthly; // at the user's marginal slab price
  final double costLow; // EGP, market range low
  final double costHigh; // EGP, market range high
  final double paybackYearsLow; // best case (cheap system, high tariff)
  final double paybackYearsHigh; // worst case
  final double co2SavedKgYearly;
  const SolarEstimate(
    this.systemKwp,
    this.monthlyKwhCovered,
    this.egpSavedMonthly,
    this.costLow,
    this.costHigh,
    this.paybackYearsLow,
    this.paybackYearsHigh,
    this.co2SavedKgYearly,
  );
}

class SolarService {
  /// Rough assumptions for Egypt (all shown in the UI):
  /// - ~5.5 peak sun hours/day on average (Egypt is 4.5-6+).
  /// - System losses ~20% (inverter, dust, temperature).
  /// - Turnkey rooftop price ~15,000-25,000 EGP per kWp (wide market range).
  /// - Grid CO2 factor 0.42 kg/kWh (same as the app methodology).
  static const sunHoursPerDay = 5.5;
  static const systemLossFactor = 0.8;
  static const pricePerKwpLow = 15000.0;
  static const pricePerKwpHigh = 25000.0;
  static const co2PerKwh = 0.42;

  /// kWh one kWp produces per month under the assumptions.
  static double kwhPerKwpMonthly() => sunHoursPerDay * 30 * systemLossFactor;

  /// Estimate for a household using [monthlyKwh] at [marginalPrice] EGP/kWh.
  /// Sizes the system to cover the full monthly usage, capped at 10 kWp
  /// (typical residential roof limit) so the range stays honest.
  static SolarEstimate estimate(double monthlyKwh, double marginalPrice) {
    final perKwp = kwhPerKwpMonthly();
    var kwp = monthlyKwh / perKwp;
    if (kwp > 10) kwp = 10;
    if (kwp < 1) kwp = 1;
    kwp = (kwp * 2).roundToDouble() / 2; // round to nearest 0.5 kWp
    final covered = kwp * perKwp;
    final savedMonthly = covered * marginalPrice;
    final low = kwp * pricePerKwpLow;
    final high = kwp * pricePerKwpHigh;
    final yearly = savedMonthly * 12;
    return SolarEstimate(
      kwp,
      covered,
      savedMonthly,
      low,
      high,
      yearly > 0 ? low / yearly : 0,
      yearly > 0 ? high / yearly : 0,
      covered * 12 * co2PerKwh,
    );
  }

  static const assumptionsAr =
      'الافتراضات: ~٥.٥ ساعة شمس ذروة في اليوم، فقد ٢٠٪ للنظام، سعر تركيب ١٥-٢٥ ألف جنيه لكل كيلوواط ذروة. الأرقام تقريبية للتوعية، مش عرض سعر - السعر الحقيقي بيتحدد بعد معاينة من شركة تركيبات.';
  static const assumptionsEn =
      'Assumptions: ~5.5 peak sun hours/day, 20% system losses, EGP 15-25k turnkey per kWp. All figures are rough awareness estimates, not a quote - real pricing needs an installer site visit.';
}
