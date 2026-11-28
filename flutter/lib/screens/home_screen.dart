import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/air_quality.dart';
import '../services/prayer_times.dart';
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
  final TextEditingController _kwhCtrl = TextEditingController();
  double? _billKg;

  // Rough awareness estimates (per-person daily averages), same spirit as the web app.
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
            else
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
