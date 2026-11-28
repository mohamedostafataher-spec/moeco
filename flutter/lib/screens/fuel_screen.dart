import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../strings.dart';

/// Official Egyptian fuel prices from the automatic pricing committee
/// decision, as reported 28 Nov 2026 (Ministry of Petroleum via press).
/// Static on purpose: values carry their date and source, never faked.
class FuelPrice {
  final String nameAr;
  final String nameEn;
  final double price;
  final String unitAr;
  final String unitEn;
  final double? co2PerUnit; // kg CO2 per liter (liquid fuels only)

  const FuelPrice(this.nameAr, this.nameEn, this.price, this.unitAr, this.unitEn,
      [this.co2PerUnit]);
}

const fuelPrices = <FuelPrice>[
  FuelPrice('بنزين 80', 'Gasoline 80', 20.75, 'جنيه/لتر', 'EGP/L', 2.31),
  FuelPrice('بنزين 92', 'Gasoline 92', 22.25, 'جنيه/لتر', 'EGP/L', 2.31),
  FuelPrice('بنزين 95', 'Gasoline 95', 24.00, 'جنيه/لتر', 'EGP/L', 2.31),
  FuelPrice('سولار', 'Diesel', 20.50, 'جنيه/لتر', 'EGP/L', 2.68),
  FuelPrice('كيروسين', 'Kerosene', 20.50, 'جنيه/لتر', 'EGP/L', 2.68),
  FuelPrice('غاز السيارات', 'CNG for cars', 13.00, 'جنيه/م³', 'EGP/m³'),
  FuelPrice('أنبوبة بوتاجاز 12.5 كجم', 'Home gas cylinder 12.5kg', 275.00, 'جنيه/أسطوانة', 'EGP/cylinder'),
  FuelPrice('أنبوبة بوتاجاز 25 كجم', 'Commercial gas cylinder 25kg', 550.00, 'جنيه/أسطوانة', 'EGP/cylinder'),
];

class FuelScreen extends StatefulWidget {
  final S s;
  const FuelScreen({super.key, required this.s});

  @override
  State<FuelScreen> createState() => _FuelScreenState();
}

class _FuelScreenState extends State<FuelScreen> {
  int _fuelIndex = 1; // Gasoline 92, the most common
  final _litersController = TextEditingController();
  double? _cost;
  double? _co2;

  @override
  void dispose() {
    _litersController.dispose();
    super.dispose();
  }

  void _calc() {
    final liters = double.tryParse(_litersController.text.replaceAll(',', '.'));
    final fuel = fuelPrices[_fuelIndex];
    setState(() {
      if (liters == null || liters <= 0 || fuel.co2PerUnit == null) {
        _cost = null;
        _co2 = null;
      } else {
        _cost = liters * fuel.price;
        _co2 = liters * fuel.co2PerUnit!;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final calcFuels = <int>[0, 1, 2, 3]; // liquid fuels only (per-liter + CO2)
    return Scaffold(
      appBar: AppBar(title: Text(s.fuelHeroTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.local_gas_station_outlined,
                          color: MoEcoTheme.primary, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(s.fuelPricesTitle,
                            style: const TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 14)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...fuelPrices.map((f) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(s.ar ? f.nameAr : f.nameEn,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600, fontSize: 13.5)),
                            ),
                            Text(
                              '${f.price % 1 == 0 ? f.price.toStringAsFixed(0) : f.price.toStringAsFixed(2)} ${s.ar ? f.unitAr : f.unitEn}',
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 8),
                  Text(s.fuelAsOf,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted, fontSize: 11)),
                  Text(s.fuelSource,
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
                  Text(s.fuelCalcTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    value: _fuelIndex,
                    decoration: InputDecoration(
                      labelText: s.fuelType,
                      border: const OutlineInputBorder(),
                    ),
                    items: [
                      for (final i in calcFuels)
                        DropdownMenuItem(
                            value: i,
                            child:
                                Text(s.ar ? fuelPrices[i].nameAr : fuelPrices[i].nameEn)),
                    ],
                    onChanged: (v) => setState(() {
                      _fuelIndex = v ?? 1;
                      _cost = null;
                      _co2 = null;
                    }),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _litersController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                    ],
                    decoration: InputDecoration(
                      labelText: s.fuelLiters,
                      border: const OutlineInputBorder(),
                    ),
                    onChanged: (_) => _calc(),
                  ),
                  const SizedBox(height: 12),
                  if (_cost != null) ...[
                    Text(s.fuelCostResult(_cost!.toStringAsFixed(2)),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(s.fuelCo2Result(_co2!.toStringAsFixed(2)),
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 12.5)),
                    const SizedBox(height: 4),
                    Text(s.fuelCo2Note,
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.fuelTipsTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 8),
                  for (final tip in [s.fuelTip1, s.fuelTip2, s.fuelTip3])
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.eco_outlined,
                              color: MoEcoTheme.accent, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(tip,
                                style: const TextStyle(
                                    fontSize: 12.5, height: 1.5)),
                          ),
                        ],
                      ),
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
