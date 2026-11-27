import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';

/// Indicative factors, same as the web app methodology:
/// electricity 0.42 kg CO2e/kWh (Egyptian grid), water 0.298 kg CO2e/m3,
/// passenger car 0.192 kg CO2e/km (average). Estimates only.
class CalculatorScreen extends StatefulWidget {
  final S s;
  const CalculatorScreen({super.key, required this.s});

  @override
  State<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends State<CalculatorScreen> {
  static const double kElecFactor = 0.42;
  static const double kWaterFactor = 0.298;
  static const double kCarFactor = 0.192;

  final _elecCtrl = TextEditingController();
  final _waterCtrl = TextEditingController();
  final _kmCtrl = TextEditingController();
  double? _result;

  S get s => widget.s;

  @override
  void dispose() {
    _elecCtrl.dispose();
    _waterCtrl.dispose();
    _kmCtrl.dispose();
    super.dispose();
  }

  void _calculate() {
    final elec = double.tryParse(_elecCtrl.text.trim()) ?? 0;
    final water = double.tryParse(_waterCtrl.text.trim()) ?? 0;
    final km = double.tryParse(_kmCtrl.text.trim()) ?? 0;
    setState(() {
      _result = elec * kElecFactor + water * kWaterFactor + km * kCarFactor;
    });
  }

  Widget _field(String label, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          textDirection: TextDirection.ltr,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            hintText: '0',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: MoEcoTheme.cardBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: MoEcoTheme.cardBorder),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.calcHeroTitle,
          subtitle: s.calcHeroSub,
          icon: Icons.calculate_outlined,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _field(s.calcElec, _elecCtrl),
                  const SizedBox(height: 16),
                  _field(s.calcWater, _waterCtrl),
                  const SizedBox(height: 16),
                  _field(s.calcKm, _kmCtrl),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _calculate,
                    icon: const Icon(Icons.bolt),
                    label: Text(s.calcButton),
                  ),
                  if (_result != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: MoEcoTheme.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: MoEcoTheme.primary.withOpacity(0.25)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.calcResult,
                              style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5)),
                          const SizedBox(height: 4),
                          Directionality(
                            textDirection: TextDirection.ltr,
                            child: Text(
                              '${_result!.toStringAsFixed(1)} ${s.calcUnit}',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: MoEcoTheme.primaryDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            s.calcDisclaimer,
            textAlign: TextAlign.center,
            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
