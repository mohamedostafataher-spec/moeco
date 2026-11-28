import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/air_quality.dart';
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

  S get s => widget.s;

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
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            s.savedLocalNote,
            textAlign: TextAlign.center,
            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
