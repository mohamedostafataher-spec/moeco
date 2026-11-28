import 'dart:async';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/savings_tips_service.dart';
import '../services/air_quality.dart';
import '../services/prayer_times.dart';
import '../services/weather_service.dart';
import '../services/widget_bridge_service.dart';
import 'package:intl/intl.dart';

class HomeScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  final VoidCallback onChanged;
  const HomeScreen({super.key, required this.s, required this.store, required this.onChanged});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _transport;
  String? _electricity;
  String? _food;
  List<AirQualityReading>? _aq;
  bool _aqLoading = true;
  PrayerTimes? _pt;
  bool _ptLoading = true;
  WeatherReading? _wx;
  bool _wxLoading = true;
  List<WeatherAlert>? _nalerts;
  final TextEditingController _kwhCtrl = TextEditingController();
  double? _billKg;
  bool _offline = false;
  StreamSubscription<List<ConnectivityResult>>? _connSub;

  // Rough awareness estimates (per-person daily averages), same spirit as the web app.
  /// Rough per-day EGP cost per mode (awareness estimates, see weeklyEstimateNote).
  static const _transportEgp = {
    'مشي/عجلة': 0.0, 'Walk/Bike': 0.0,
    'مترو/قطار': 24.0, 'Metro/Train': 24.0,
    'أتوبيس/ميكروباص': 20.0, 'Bus/Microbus': 20.0,
    'عربية/تاكسي': 45.0, 'Car/Taxi': 45.0,
  };
  static const _transportKg = {
    'مشي/عجلة': 0.0, 'Walk/Bike': 0.0,
    'مترو/قطار': 1.5, 'Metro/Train': 1.5,
    'أتوبيس/ميكروباص': 2.5, 'Bus/Microbus': 2.5,
    'عربية/تاكسي': 6.0, 'Car/Taxi': 6.0,
  };
  static const _elecKg = {
    'قليل': 1.5, 'Low': 1.5,
    'متوسط': 3.0, 'Medium': 3.0,
    'عالي (تكييف)': 6.0, 'High (A/C)': 6.0,
  };
  static const _foodKg = {
    'نباتي أغلبه': 1.9, 'Mostly veg': 1.9,
    'مشكل': 2.8, 'Mixed': 2.8,
    'لحوم كتير': 4.6, 'Meat-heavy': 4.6,
  };

  @override
  void initState() {
    super.initState();
    AirQualityService.getReadings().then((readings) {
      if (!mounted) return;
      setState(() {
        _aq = readings;
        _aqLoading = false;
      });
    });
    PrayerTimesService.getToday().then((pt) {
      if (!mounted) return;
      setState(() {
        _pt = pt;
        _ptLoading = false;
      });
    });
    WeatherService.getCurrent().then((w) {
      if (!mounted) return;
      setState(() {
        _wx = w;
        _wxLoading = false;
      });
      // F8: refresh the home-screen widget (weather + bill + streak)
      WidgetBridgeService.updateFromState(
          arabic: widget.s.ar, weather: w, store: widget.store);
    });
    NationalWeatherAlerts.getAlerts().then((alerts) {
      if (!mounted) return;
      setState(() => _nalerts = alerts);
    });
    // F7: offline-first. Watch connectivity and show an honest banner;
    // every data service already serves its last saved data when offline.
    Connectivity().checkConnectivity().then((r) {
      if (!mounted) return;
      setState(() => _offline = r.contains(ConnectivityResult.none));
    });
    _connSub = Connectivity().onConnectivityChanged.listen((r) {
      if (!mounted) return;
      setState(() => _offline = r.contains(ConnectivityResult.none));
    });
  }

  @override
  void dispose() {
    _connSub?.cancel();
    _kwhCtrl.dispose();
    super.dispose();
  }

  S get s => widget.s;

  double _dayKg(Map<String, dynamic> log) {
    return (_transportKg[log['transport']] ?? 0) +
        (_elecKg[log['electricity']] ?? 0) +
        (_foodKg[log['food']] ?? 0);
  }

  /// Last 7 days (oldest first): (dayLabel, kg or null when not logged).
  List<(String, double?)> _week() {
    final byDate = {for (final e in widget.store.logs) e['date'] as String: e};
    final arDays = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
    final enDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    final out = <(String, double?)>[];
    for (var i = 6; i >= 0; i--) {
      final d = DateTime.now().subtract(Duration(days: i));
      final key = d.toIso8601String().substring(0, 10);
      final wd = d.weekday % 7; // Sat=0 .. Fri=6
      final label = s.ar ? arDays[wd] : enDays[wd];
      final log = byDate[key];
      out.add((label, log == null ? null : _dayKg(log)));
    }
    return out;
  }

  /// This week's logs (last 7 days): (daysLogged, totalKg, estCostEgp, allCarCostEgp, allCarKg).
  (int, double, double, double, double) _weekStats() {
    final byDate = {for (final e in widget.store.logs) e['date'] as String: e};
    var days = 0;
    var kg = 0.0, cost = 0.0, carCost = 0.0, carKg = 0.0;
    const carDailyKg = 6.0, carDailyEgp = 45.0;
    for (var i = 6; i >= 0; i--) {
      final key = DateTime.now().subtract(Duration(days: i)).toIso8601String().substring(0, 10);
      final log = byDate[key];
      if (log == null) continue;
      days++;
      kg += _dayKg(log);
      cost += _transportEgp[log['transport']] ?? 0;
      carCost += carDailyEgp;
      carKg += (_elecKg[log['electricity']] ?? 0) + (_foodKg[log['food']] ?? 0) + carDailyKg;
    }
    return (days, kg, cost, carCost, carKg);
  }

  String _weeklyShareText() {
    final (days, kg, cost, carCost, carKg) = _weekStats();
    final savedEgp = carCost - cost;
    final savedKg = carKg - kg;
    final vs = savedEgp > 0
        ? s.weeklyVsCar(savedEgp.toStringAsFixed(0), savedKg.toStringAsFixed(1)) + '\n'
        : '';
    if (s.ar) {
      return 'أسبوعي مع MoEco:\n'
          '${s.weeklyDays(days)} — ${kg.toStringAsFixed(1)} كجم CO2 تقريبًا\n'
          '${s.weeklyCost(cost.toStringAsFixed(0))}\n'
          '$vs'
          '${s.weeklyEstimateNote}';
    }
    return 'My week with MoEco:\n'
        '${s.weeklyDays(days)} — ${kg.toStringAsFixed(1)} kg CO2 approx\n'
        '${s.weeklyCost(cost.toStringAsFixed(0))}\n'
        '$vs'
        '${s.weeklyEstimateNote}';
  }

  /// National weather alert card: forecast-derived, honestly labeled,
  /// hidden when there is nothing to warn about.
  Widget? _wxAlertCard() {
    final alerts = _nalerts;
    if (alerts == null || alerts.isEmpty) return null;
    final shown = alerts.take(3).toList();
    final extra = alerts.length - shown.length;
    Color colorFor(WeatherAlert a) =>
        (a.kind == WeatherAlertKind.extremeHeat || a.kind == WeatherAlertKind.storm)
            ? const Color(0xFFC62828)
            : const Color(0xFFE65100);
    IconData iconFor(WeatherAlert a) {
      switch (a.kind) {
        case WeatherAlertKind.extremeHeat:
        case WeatherAlertKind.heat:
          return Icons.thermostat;
        case WeatherAlertKind.storm:
          return Icons.thunderstorm_outlined;
        case WeatherAlertKind.rain:
          return Icons.water_drop_outlined;
        case WeatherAlertKind.wind:
          return Icons.air;
        case WeatherAlertKind.cold:
          return Icons.ac_unit;
      }
    }

    String lineFor(WeatherAlert a) {
      final city = s.ar ? a.cityAr : a.cityEn;
      switch (a.kind) {
        case WeatherAlertKind.extremeHeat:
          return s.wxAlertExtreme(city, a.value.toStringAsFixed(0));
        case WeatherAlertKind.heat:
          return s.wxAlertHeat(city, a.value.toStringAsFixed(0));
        case WeatherAlertKind.cold:
          return s.wxAlertCold(city, a.value.toStringAsFixed(0));
        case WeatherAlertKind.wind:
          return s.wxAlertWind(city, a.value.toStringAsFixed(0));
        case WeatherAlertKind.rain:
          return s.wxAlertRain(city);
        case WeatherAlertKind.storm:
          return s.wxAlertStorm(city);
      }
    }

    return Card(
      color: const Color(0xFFFFF8E1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.warning_amber_rounded,
                    color: Color(0xFFE65100), size: 20),
                const SizedBox(width: 8),
                Text(s.wxAlertTitle,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 10),
            for (final a in shown)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(iconFor(a), color: colorFor(a), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(lineFor(a),
                          style: const TextStyle(fontSize: 12.5, height: 1.4)),
                    ),
                  ],
                ),
              ),
            if (extra > 0)
              Text(s.wxAlertMore(extra.toString()),
                  style: const TextStyle(
                      fontSize: 12,
                      color: MoEcoTheme.textMuted,
                      fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(s.wxAlertNote,
                style: const TextStyle(
                    color: MoEcoTheme.textMuted, fontSize: 11, height: 1.5)),
          ],
        ),
      ),
    );
  }

  Widget _weatherCard() {
    final timeFmt = DateFormat.Hm();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.wb_sunny_outlined, color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(s.wxTitle, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 12),
            if (_wxLoading)
              Text(s.wxLoading, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else if (_wx == null)
              Text(s.wxUnavailable, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else ...[
              Text(
                s.wxLine(
                  _wx!.temp.toStringAsFixed(0),
                  WeatherService.label(_wx!.code, s.ar),
                  _wx!.humidity.toString(),
                  _wx!.windKmh.toStringAsFixed(0),
                ),
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.eco_outlined, color: MoEcoTheme.accent, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(WeatherService.tip(_wx!, s.ar),
                        style: const TextStyle(fontSize: 12.5, height: 1.5)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                s.wxSource(timeFmt.format(_wx!.fetchedAt)),
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _prayerCard() {
    final timeFmt = DateFormat.Hm();
    final next = _pt == null ? null : PrayerTimesService.nextPrayer(_pt!);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.mosque, color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(s.ptTitle,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                ),
                if (next != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      s.ptNext(s.ptName(next)),
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (_ptLoading)
              Text(s.ptLoading, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else if (_pt == null)
              Text(s.ptUnavailable, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else ...[
              ...PrayerTimesService.order.map((name) {
                final isNext = name == next;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(s.ptName(name),
                            style: TextStyle(
                                fontWeight: isNext ? FontWeight.w800 : FontWeight.w600,
                                fontSize: 13.5,
                                color: isNext ? MoEcoTheme.primary : null)),
                      ),
                      Text(
                        _pt!.times[name] ?? '--:--',
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: isNext ? FontWeight.w800 : FontWeight.w600,
                            color: isNext ? MoEcoTheme.primary : null),
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 8),
              Text(
                s.ptSource(timeFmt.format(_pt!.fetchedAt)),
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Governorate-level AQ alert banner: shown only when the worst city's
  /// AQI crosses the sensitive (100) or unhealthy (150) band. Real Open-Meteo
  /// readings only - no banner when data is missing or air is fine.
  Widget? _aqAlert() {
    if (_aqLoading || _aq == null || _aq!.isEmpty) return null;
    final worst = AirQualityService.worst(_aq!);
    if (worst == null || worst.aqi <= 100) return null;
    final unhealthy = worst.aqi > 150;
    final count = AirQualityService.countAbove(_aq!, unhealthy ? 150 : 100);
    final timeFmt = DateFormat.Hm();
    final bg = unhealthy ? const Color(0xFFFEF2F2) : const Color(0xFFFFFBEB);
    final fg = unhealthy ? const Color(0xFFB91C1C) : const Color(0xFFB45309);
    final iconBg = unhealthy ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7);
    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: fg.withValues(alpha: 0.25)),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
            child: Icon(
              unhealthy ? Icons.warning_amber_rounded : Icons.health_and_safety_outlined,
              color: fg, size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unhealthy
                      ? s.aqAlertTitle(s.ar ? worst.cityAr : worst.cityEn, worst.aqi)
                      : s.aqAlertSensitiveTitle(s.ar ? worst.cityAr : worst.cityEn, worst.aqi),
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: fg, height: 1.4),
                ),
                const SizedBox(height: 4),
                Text(
                  unhealthy ? s.aqAlertTip : s.aqAlertSensitiveTip,
                  style: TextStyle(fontSize: 12, color: fg.withValues(alpha: 0.85), height: 1.5),
                ),
                if (count > 1) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(20)),
                    child: Text(
                      s.aqAlertMore(count - 1),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg),
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Text(
                  s.aqSource(timeFmt.format(worst.fetchedAt)),
                  style: TextStyle(color: fg.withValues(alpha: 0.6), fontSize: 10.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _aqCard() {
    final timeFmt = DateFormat.Hm();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.air, color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(s.aqTitle, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 12),
            if (_aqLoading)
              Text(s.aqLoading, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else if (_aq == null || _aq!.isEmpty)
              Text(s.aqUnavailable, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else ...[
              ..._aq!.map((r) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(s.ar ? r.cityAr : r.cityEn,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: r.aqi <= 50
                                ? const Color(0xFFDCFCE7)
                                : r.aqi <= 100
                                    ? const Color(0xFFFEF9C3)
                                    : const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${r.aqi} · ${AirQualityService.label(r.aqi, s.ar)}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  )),
              const SizedBox(height: 8),
              Text(
                s.aqSource(timeFmt.format(_aq!.first.fetchedAt)),
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _weekCard() {
    final week = _week();
    final vals = week.map((e) => e.$2).whereType<double>().toList();
    final maxV = vals.isEmpty ? 1.0 : vals.reduce((a, b) => a > b ? a : b);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bar_chart_rounded, color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(s.weeklyTitle, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 14),
            if (vals.isEmpty)
              Text(s.weeklyEmpty, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else ...[
              SizedBox(
                height: 110,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: week.map((day) {
                    final kg = day.$2;
                    final h = kg == null ? 4.0 : (8.0 + 72.0 * (kg / (maxV <= 0 ? 1 : maxV)));
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (kg != null)
                              Text(kg.toStringAsFixed(1),
                                  style: const TextStyle(fontSize: 9.5, color: MoEcoTheme.textMuted)),
                            const SizedBox(height: 3),
                            Container(
                              height: h,
                              decoration: BoxDecoration(
                                color: kg == null
                                    ? MoEcoTheme.cardBorder
                                    : MoEcoTheme.primary.withOpacity(0.75),
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(day.$1,
                                style: const TextStyle(fontSize: 11, color: MoEcoTheme.textMuted)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const Divider(height: 24),
              Builder(builder: (ctx) {
                final (days, kg, cost, carCost, carKg) = _weekStats();
                final savedEgp = carCost - cost;
                final savedKg = carKg - kg;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.weeklyCompareTitle,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 6),
                    Text('${s.weeklyDays(days)} — ${kg.toStringAsFixed(1)} ${s.ar ? "كجم CO2 تقريبًا" : "kg CO2 approx"}',
                        style: const TextStyle(fontSize: 12, color: MoEcoTheme.textMuted)),
                    Text(s.weeklyCost(cost.toStringAsFixed(0)),
                        style: const TextStyle(fontSize: 12, color: MoEcoTheme.textMuted)),
                    if (savedEgp > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          s.weeklyVsCar(savedEgp.toStringAsFixed(0), savedKg.toStringAsFixed(1)),
                          style: const TextStyle(
                              fontSize: 12, height: 1.5, color: MoEcoTheme.primary,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    const SizedBox(height: 6),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextButton.icon(
                          onPressed: () async {
                            await Clipboard.setData(ClipboardData(text: _weeklyShareText()));
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(s.weeklyCopied),
                                  duration: const Duration(seconds: 2)),
                            );
                          },
                          icon: const Icon(Icons.copy_outlined, size: 15, color: MoEcoTheme.primary),
                          label: Text(s.weeklyShareBtn,
                              style: const TextStyle(fontSize: 11.5, color: MoEcoTheme.primary)),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(s.weeklyEstimateNote,
                              style: const TextStyle(fontSize: 10, color: MoEcoTheme.textMuted, height: 1.4)),
                        ),
                      ],
                    ),
                  ],
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  Widget _billCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bolt, color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(s.billTitle, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _kwhCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: s.billHint,
                      isDense: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (_) => setState(() => _billKg = null),
                  ),
                ),
                const SizedBox(width: 10),
                ElevatedButton(
                  onPressed: () {
                    final v = double.tryParse(_kwhCtrl.text.replaceAll(',', '.'));
                    setState(() => _billKg = v == null ? null : v * 0.42);
                  },
                  child: Text(s.billCalc),
                ),
              ],
            ),
            if (_billKg != null) ...[
              const SizedBox(height: 12),
              Text(
                s.billResult(_billKg!.toStringAsFixed(1)),
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: MoEcoTheme.primaryDark),
              ),
            ],
            const SizedBox(height: 6),
            Text(s.billNote, style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11)),
            ..._tierSection(),
          ],
        ),
      ),
    );
  }

  /// F4: slab-boundary warning + weekly savings tip, driven by the kWh
  /// the user already typed into the bill card. All local rules, no AI.
  List<Widget> _tierSection() {
    final kwh = double.tryParse(_kwhCtrl.text.replaceAll(',', '.'));
    if (kwh == null || kwh <= 0) return [];
    final status = SavingsTipsService.tierStatus(kwh);
    final tip = SavingsTipsService.weeklyTip(DateTime.now());
    final tipEgp = tip.egpSaved(status.tierPrice);
    return [
      const SizedBox(height: 14),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: status.nearNextTier || status.kwhToNext == null
              ? const Color(0xFFFFF8E1)
              : const Color(0xFFE8F5E9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: status.nearNextTier || status.kwhToNext == null
                  ? const Color(0xFFF9A825)
                  : const Color(0xFF66BB6A)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.svTierNow(status.tierPrice.toStringAsFixed(2)),
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5)),
            const SizedBox(height: 4),
            Text(
              status.kwhToNext == null
                  ? s.svTierTop
                  : status.nearNextTier
                      ? s.svTierNear(status.kwhToNext!.toStringAsFixed(0),
                          status.crossingJump!.toStringAsFixed(0))
                      : s.svTierFar(status.kwhToNext!.toStringAsFixed(0)),
              style: TextStyle(
                  fontSize: 12,
                  height: 1.5,
                  color: status.nearNextTier || status.kwhToNext == null
                      ? const Color(0xFF8D6E00)
                      : MoEcoTheme.primaryDark,
                  fontWeight: status.nearNextTier ? FontWeight.w700 : FontWeight.w500),
            ),
          ],
        ),
      ),
      const SizedBox(height: 10),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.eco_outlined, color: MoEcoTheme.primary, size: 16),
                const SizedBox(width: 6),
                Text(s.svTipTitle,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                        color: MoEcoTheme.primaryDark)),
              ],
            ),
            const SizedBox(height: 4),
            Text(s.ar ? tip.titleAr : tip.titleEn,
                style: const TextStyle(fontSize: 12.5, height: 1.5)),
            const SizedBox(height: 2),
            Text(s.svTipSave(tipEgp.toStringAsFixed(0)),
                style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: MoEcoTheme.primaryDark)),
            const SizedBox(height: 2),
            Text(s.svTipNote,
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 10)),
          ],
        ),
      ),
    ];
  }

  Future<void> _logDay() async {
    if (_transport == null || _electricity == null || _food == null) return;
    await widget.store.addLog(
      transport: _transport!,
      electricity: _electricity!,
      food: _food!,
    );
    widget.onChanged();
    setState(() {
      _transport = null;
      _electricity = null;
      _food = null;
    });
  }

  Widget _choiceRow(List<String> options, String? selected, void Function(String) onPick) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((o) {
        final isSel = o == selected;
        return ChoiceChip(
          label: Text(o),
          selected: isSel,
          onSelected: (_) => setState(() => onPick(o)),
          selectedColor: MoEcoTheme.primary.withOpacity(0.12),
          labelStyle: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: isSel ? MoEcoTheme.primaryDark : MoEcoTheme.textMain,
          ),
          side: BorderSide(color: isSel ? MoEcoTheme.primary : MoEcoTheme.cardBorder),
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final streak = widget.store.streak;
    final loggedToday = widget.store.loggedToday;
    final ready = _transport != null && _electricity != null && _food != null;
    final transportOpts = s.ar
        ? ['مشي/عجلة', 'مترو/قطار', 'أتوبيس/ميكروباص', 'عربية/تاكسي']
        : ['Walk/Bike', 'Metro/Train', 'Bus/Microbus', 'Car/Taxi'];
    final elecOpts = s.ar ? ['قليل', 'متوسط', 'عالي (تكييف)'] : ['Low', 'Medium', 'High (A/C)'];
    final foodOpts = s.ar ? ['نباتي أغلبه', 'مشكل', 'لحوم كتير'] : ['Mostly veg', 'Mixed', 'Meat-heavy'];

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.homeHeroTitle,
          subtitle: s.homeHeroSub,
          icon: Icons.spa_outlined,
          chip: streak > 0 ? s.streakDays(streak) : null,
        ),
        if (_offline)
          Container(
            width: double.infinity,
            color: const Color(0xFFFFF3CD),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Icon(Icons.wifi_off, size: 16, color: Color(0xFF8D6E00)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(s.offBanner,
                      style: const TextStyle(
                          color: Color(0xFF8D6E00),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        if (_aqAlert() != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _aqAlert()!,
          ),
        if (_wxAlertCard() != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _wxAlertCard()!,
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _weatherCard(),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _aqCard(),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _prayerCard(),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _weekCard(),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (loggedToday)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: MoEcoTheme.accent, size: 18),
                          const SizedBox(width: 6),
                          Text(s.loggedToday,
                              style: const TextStyle(
                                  color: MoEcoTheme.primaryDark, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  Text(s.transportQ, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 10),
                  _choiceRow(transportOpts, _transport, (v) => _transport = v),
                  const SizedBox(height: 18),
                  Text(s.electricityQ, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 10),
                  _choiceRow(elecOpts, _electricity, (v) => _electricity = v),
                  const SizedBox(height: 18),
                  Text(s.foodQ, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 10),
                  _choiceRow(foodOpts, _food, (v) => _food = v),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: ready ? _logDay : null,
                    icon: const Icon(Icons.check),
                    label: Text(s.logDay),
                  ),
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: _billCard(),
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            s.savedLocalNote,
            textAlign: TextAlign.center,
            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5),
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
