import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../strings.dart';

/// Official Egyptian 2026 residential utility tariffs, matching the web app's
/// verified data (INSERT_OFFICIAL_PRICES_2026.sql):
/// electricity: Ministry of Electricity, water: Ministry of Housing,
/// household gas: Ministry of Petroleum.
class TariffTier {
  final int min;
  final int max; // inclusive; 99999 = open-ended
  final double price; // EGP per unit
  final double fixedFee; // EGP added to the bill
  const TariffTier(this.min, this.max, this.price, this.fixedFee);
}

/// Electricity: Egyptian slab system — your total consumption picks ONE tier
/// whose rate applies to ALL kWh, plus that tier's fixed fee.
/// (Tiers 3 and 6 start from 0 in the official table for this reason.)
const electricityTiers = <TariffTier>[
  TariffTier(0, 50, 0.68, 1),
  TariffTier(51, 100, 0.78, 2),
  TariffTier(0, 200, 0.95, 6),
  TariffTier(201, 350, 1.55, 11),
  TariffTier(351, 650, 1.95, 15),
  TariffTier(0, 1000, 2.10, 25),
  TariffTier(1001, 99999, 2.58, 40),
];

/// Water: progressive tiers (each slab billed at its own rate).
const waterTiers = <TariffTier>[
  TariffTier(0, 10, 2.00, 0),
  TariffTier(11, 20, 3.00, 0),
  TariffTier(21, 30, 5.00, 0),
  TariffTier(31, 40, 7.00, 0),
  TariffTier(41, 99999, 10.00, 0),
];

/// Household natural gas: progressive tiers.
const gasTiers = <TariffTier>[
  TariffTier(0, 30, 6.00, 0),
  TariffTier(31, 60, 8.00, 0),
  TariffTier(61, 99999, 12.00, 0),
];

/// Electricity bill estimate: total kWh picks one slab for the whole bill.
/// Zero-based tiers (0-200, 0-1000) apply once consumption crosses into them.
double estimateElectricityBill(double kwh) {
  if (kwh <= 50) return kwh * 0.68 + 1;
  if (kwh <= 100) return kwh * 0.78 + 2;
  if (kwh <= 200) return kwh * 0.95 + 6;
  if (kwh <= 350) return kwh * 1.55 + 11;
  if (kwh <= 650) return kwh * 1.95 + 15;
  if (kwh <= 1000) return kwh * 2.10 + 25;
  return kwh * 2.58 + 40;
}

class UtilitiesScreen extends StatefulWidget {
  final S s;
  const UtilitiesScreen({super.key, required this.s});

  @override
  State<UtilitiesScreen> createState() => _UtilitiesScreenState();
}

class _UtilitiesScreenState extends State<UtilitiesScreen> {
  final _kwhController = TextEditingController();
  double? _bill;

  @override
  void dispose() {
    _kwhController.dispose();
    super.dispose();
  }

  Widget _tierTable(String title, List<TariffTier> tiers, String unit) {
    final s = widget.s;
    String range(TariffTier t) {
      final hi = t.max >= 99999 ? '+' : '${t.max}';
      return '${t.min}–$hi';
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            const SizedBox(height: 10),
            ...tiers.map((t) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text('${range(t)} $unit',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                      Text(
                        '${t.price.toStringAsFixed(2)} ${s.utilEgpPerUnit}' +
                            (t.fixedFee > 0
                                ? '  (+${t.fixedFee.toStringAsFixed(0)} ${s.utilFeeUnit})'
                                : ''),
                        style: const TextStyle(
                            fontSize: 12.5, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    return Scaffold(
      appBar: AppBar(title: Text(s.utilHeroTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.utilCalcTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _kwhController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                    ],
                    decoration: InputDecoration(
                      labelText: s.utilKwhLabel,
                      border: const OutlineInputBorder(),
                    ),
                    onChanged: (v) {
                      final kwh =
                          double.tryParse(v.replaceAll(',', '.'));
                      setState(() {
                        _bill = (kwh == null || kwh < 0)
                            ? null
                            : estimateElectricityBill(kwh);
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  if (_bill != null) ...[
                    Text(s.utilBillResult(_bill!.toStringAsFixed(2)),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(s.utilBillNote,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 11)),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _tierTable(s.utilElecTitle, electricityTiers, s.utilKwhUnit),
          const SizedBox(height: 16),
          _tierTable(s.utilWaterTitle, waterTiers, s.utilM3Unit),
          const SizedBox(height: 16),
          _tierTable(s.utilGasTitle, gasTiers, s.utilM3Unit),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.utilSourceTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 13)),
                  const SizedBox(height: 6),
                  Text(s.utilSourceBody,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted,
                          fontSize: 11.5,
                          height: 1.5)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
