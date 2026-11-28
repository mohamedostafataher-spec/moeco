import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';

/// Monthly utility meter readings, stored on-device only.
/// Factors match the web app: 0.42 kg CO2e/kWh, 0.298 kg CO2e/m3.
class MetersScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  final VoidCallback onChanged;
  const MetersScreen({
    super.key,
    required this.s,
    required this.store,
    required this.onChanged,
  });

  @override
  State<MetersScreen> createState() => _MetersScreenState();
}

class _MetersScreenState extends State<MetersScreen> {
  final _kwhCtrl = TextEditingController();
  final _m3Ctrl = TextEditingController();

  @override
  void dispose() {
    _kwhCtrl.dispose();
    _m3Ctrl.dispose();
    super.dispose();
  }

  String get _currentMonth => DateTime.now().toIso8601String().substring(0, 7);

  Future<void> _save() async {
    final kwh = double.tryParse(_kwhCtrl.text.trim()) ?? 0;
    final m3 = double.tryParse(_m3Ctrl.text.trim()) ?? 0;
    if (kwh <= 0 && m3 <= 0) return;
    await widget.store.addMeterReading(month: _currentMonth, kwh: kwh, m3: m3);
    _kwhCtrl.clear();
    _m3Ctrl.clear();
    widget.onChanged();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final readings = widget.store.meterReadings;
    final existing = readings.where((r) => r['month'] == _currentMonth).toList();

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.metersHeroTitle,
          subtitle: s.metersHeroSub,
          icon: Icons.electric_meter_outlined,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.metersAddTitle(_currentMonth),
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      if (existing.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(s.metersOverwrite,
                            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5)),
                      ],
                      const SizedBox(height: 12),
                      TextField(
                        controller: _kwhCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: s.metersKwh,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _m3Ctrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: s.metersM3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _save,
                          icon: const Icon(Icons.save_outlined),
                          label: Text(s.metersSave),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(s.metersNote,
                          style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5, height: 1.5)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              if (readings.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Icon(Icons.electric_meter_outlined,
                            size: 36, color: MoEcoTheme.textMuted),
                        const SizedBox(height: 8),
                        Text(s.metersEmpty,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(s.metersEmptySub,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5, height: 1.5)),
                      ],
                    ),
                  ),
                )
              else ...[
                Text(s.metersHistory,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 8),
                ...readings.reversed.map((r) => _readingCard(r)),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _readingCard(Map<String, dynamic> r) {
    final s = widget.s;
    final kwh = (r['kwh'] as num).toDouble();
    final m3 = (r['m3'] as num).toDouble();
    final kg = kwh * 0.42 + m3 * 0.298;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: MoEcoTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.calendar_month_outlined,
                  color: MoEcoTheme.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r['month'], style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(
                    s.metersLine(kwh.toStringAsFixed(0), m3.toStringAsFixed(1), kg.toStringAsFixed(1)),
                    style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 20, color: MoEcoTheme.textMuted),
              onPressed: () async {
                await widget.store.deleteMeterReading(r['month']);
                widget.onChanged();
                setState(() {});
              },
            ),
          ],
        ),
      ),
    );
  }
}
