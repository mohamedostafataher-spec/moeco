import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../strings.dart';

/// Cairo Metro fares, per the Ministry of Transport tariff effective
/// 27 March 2026 (unchanged as of Nov 2026 press coverage).
class MetroBand {
  final String stationsAr;
  final String stationsEn;
  final double price;
  final double seniorPrice; // 60+
  const MetroBand(this.stationsAr, this.stationsEn, this.price, this.seniorPrice);
}

const metroBands = <MetroBand>[
  MetroBand('حتى ٩ محطات', 'Up to 9 stations', 10, 5),
  MetroBand('حتى ١٦ محطة', 'Up to 16 stations', 12, 6),
  MetroBand('حتى ٢٣ محطة', 'Up to 23 stations', 15, 8),
  MetroBand('حتى ٣٩ محطة', 'Up to 39 stations', 20, 10),
];

/// Public monthly subscriptions by zone count (1 / 2 / 3-4 / 5-6).
const metroSubscriptions = <double>[390, 440, 510, 600];
const metroSubZones = ['1', '2', '3–4', '5–6'];

class MetroScreen extends StatefulWidget {
  final S s;
  const MetroScreen({super.key, required this.s});

  @override
  State<MetroScreen> createState() => _MetroScreenState();
}

class _MetroScreenState extends State<MetroScreen> {
  int _band = 0;
  int _sub = 0;
  final _ridesController = TextEditingController();
  double? _singlesCost;

  @override
  void dispose() {
    _ridesController.dispose();
    super.dispose();
  }

  void _calc() {
    final rides = double.tryParse(_ridesController.text.replaceAll(',', '.'));
    setState(() {
      _singlesCost =
          (rides == null || rides <= 0) ? null : rides * metroBands[_band].price;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final subPrice = metroSubscriptions[_sub];
    final saves = _singlesCost == null ? null : _singlesCost! - subPrice;

    return Scaffold(
      appBar: AppBar(title: Text(s.metroHeroTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.metroFaresTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 10),
                  ...metroBands.map((b) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(s.ar ? b.stationsAr : b.stationsEn,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13.5)),
                            ),
                            Text(
                              '${b.price.toStringAsFixed(0)} ${s.metroEgp}',
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      )),
                  const Divider(height: 24),
                  Text(s.metroReducedTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(height: 8),
                  Text(s.metroReducedBody,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted,
                          fontSize: 12.5,
                          height: 1.6)),
                  const SizedBox(height: 8),
                  Text(s.metroSource,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted, fontSize: 11)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.metroCalcTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    value: _band,
                    decoration: InputDecoration(
                      labelText: s.metroYourTicket,
                      border: const OutlineInputBorder(),
                    ),
                    items: [
                      for (var i = 0; i < metroBands.length; i++)
                        DropdownMenuItem(
                            value: i,
                            child: Text(
                                '${s.ar ? metroBands[i].stationsAr : metroBands[i].stationsEn} — ${metroBands[i].price.toStringAsFixed(0)} ${s.metroEgp}')),
                    ],
                    onChanged: (v) => setState(() {
                      _band = v ?? 0;
                      _calc();
                    }),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _ridesController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                    ],
                    decoration: InputDecoration(
                      labelText: s.metroRidesLabel,
                      border: const OutlineInputBorder(),
                    ),
                    onChanged: (_) => _calc(),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    value: _sub,
                    decoration: InputDecoration(
                      labelText: s.metroSubLabel,
                      border: const OutlineInputBorder(),
                    ),
                    items: [
                      for (var i = 0; i < metroSubscriptions.length; i++)
                        DropdownMenuItem(
                            value: i,
                            child: Text(
                                '${metroSubZones[i]} ${s.metroZones} — ${metroSubscriptions[i].toStringAsFixed(0)} ${s.metroEgp}')),
                    ],
                    onChanged: (v) => setState(() {
                      _sub = v ?? 0;
                    }),
                  ),
                  const SizedBox(height: 12),
                  if (_singlesCost != null) ...[
                    Text(
                        s.metroSinglesCost(_singlesCost!.toStringAsFixed(0)),
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13.5)),
                    const SizedBox(height: 6),
                    Text(
                      saves! > 0
                          ? s.metroVerdictSave(saves.toStringAsFixed(0))
                          : s.metroVerdictNoSave((-saves).toStringAsFixed(0)),
                      style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: saves! > 0
                              ? MoEcoTheme.accent
                              : MoEcoTheme.textMuted),
                    ),
                    const SizedBox(height: 6),
                    Text(s.metroCalcNote,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 11)),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.eco_outlined,
                      color: MoEcoTheme.accent, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(s.metroEcoNote,
                        style: const TextStyle(fontSize: 12.5, height: 1.6)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
