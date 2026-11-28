import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/air_quality.dart';
import '../services/prayer_times.dart';
import '../services/weather_service.dart';
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
  final TextEditingController _kwhCtrl = TextEditingController();
  double? _billKg;

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
    });
  }

  @override
  void dispose() {
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
          ],
        ),
      ),
    );
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
