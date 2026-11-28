import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/solar_service.dart';
import '../services/savings_tips_service.dart';

/// Rooftop solar estimator. Rough awareness numbers only, clearly labeled.
class SolarScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  const SolarScreen({super.key, required this.s, required this.store});

  @override
  State<SolarScreen> createState() => _SolarScreenState();
}

class _SolarScreenState extends State<SolarScreen> {
  final _kwhCtrl = TextEditingController();
  SolarEstimate? _est;

  @override
  void initState() {
    super.initState();
    final readings = widget.store.meterReadings;
    if (readings.isNotEmpty) {
      final kwh = (readings.last['kwh'] as num?)?.toDouble();
      if (kwh != null && kwh > 0) {
        _kwhCtrl.text = kwh.toStringAsFixed(0);
        _calc();
      }
    }
  }

  @override
  void dispose() {
    _kwhCtrl.dispose();
    super.dispose();
  }

  void _calc() {
    final kwh = double.tryParse(_kwhCtrl.text.replaceAll(',', '.'));
    if (kwh == null || kwh <= 0 || kwh > 5000) {
      setState(() => _est = null);
      return;
    }
    final price = SavingsTipsService.tierStatus(kwh).tierPrice;
    setState(() => _est = SolarService.estimate(kwh, price));
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final est = _est;
    return Scaffold(
      appBar: AppBar(title: Text(s.solTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.solInputLabel,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _kwhCtrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                    ],
                    decoration: InputDecoration(
                      labelText: s.solKwhHint,
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.calculate_outlined),
                        onPressed: _calc,
                      ),
                    ),
                    onChanged: (_) => _calc(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (est != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _row(Icons.solar_power_outlined,
                        s.solSize(est.systemKwp.toStringAsFixed(1))),
                    const Divider(height: 20),
                    _row(Icons.bolt,
                        s.solCovers(est.monthlyKwhCovered.toStringAsFixed(0))),
                    const Divider(height: 20),
                    _row(Icons.payments_outlined,
                        s.solSaves(est.egpSavedMonthly.toStringAsFixed(0))),
                    const Divider(height: 20),
                    _row(
                        Icons.price_change_outlined,
                        s.solCost(est.costLow.toStringAsFixed(0),
                            est.costHigh.toStringAsFixed(0))),
                    const Divider(height: 20),
                    _row(
                        Icons.schedule,
                        s.solPayback(est.paybackYearsLow.toStringAsFixed(1),
                            est.paybackYearsHigh.toStringAsFixed(1))),
                    const Divider(height: 20),
                    _row(Icons.eco_outlined,
                        s.solCo2(est.co2SavedKgYearly.toStringAsFixed(0))),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Card(
              color: Colors.orange.withOpacity(0.08),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline,
                        color: Colors.orange.shade800, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        s.ar
                            ? SolarService.assumptionsAr
                            : SolarService.assumptionsEn,
                        style: const TextStyle(fontSize: 12, height: 1.6),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _row(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: MoEcoTheme.primary, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text,
              style: const TextStyle(fontSize: 13, height: 1.5)),
        ),
      ],
    );
  }
}
