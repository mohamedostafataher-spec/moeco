import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/bill_compare_service.dart';

/// F11 (on-device): month-over-month comparison of the user's own meter
/// readings. Honest labeling: bills are estimates on the official 2026
/// tariff, not the invoice amount.
class BillCompareScreen extends StatelessWidget {
  final S s;
  final FootprintStore store;
  const BillCompareScreen({super.key, required this.s, required this.store});

  @override
  Widget build(BuildContext context) {
    final cmp = BillCompareService.compare(store.meterReadings);
    return Scaffold(
      appBar: AppBar(title: Text(s.bcTitle)),
      body: !cmp.hasEnoughData
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Text(
                  s.bcEmpty,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: MoEcoTheme.textMuted, fontSize: 14, height: 1.6),
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline,
                            color: MoEcoTheme.primary, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            s.bcEstimateNote,
                            style: const TextStyle(
                                color: MoEcoTheme.textMuted,
                                fontSize: 12,
                                height: 1.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ...List.generate(cmp.months.length, (i) {
                  final m = cmp.months[i];
                  final delta = cmp.kwhDeltaVsPrev[i];
                  final maxKwh = cmp.highestMonth.kwh;
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(m.month,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14)),
                              ),
                              if (delta != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (delta <= 0
                                            ? MoEcoTheme.primary
                                            : Colors.orange)
                                        .withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    delta <= 0
                                        ? s.bcLess(delta.abs().round())
                                        : s.bcMore(delta.round()),
                                    style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w700,
                                        color: delta <= 0
                                            ? MoEcoTheme.primaryDark
                                            : Colors.orange.shade800),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: maxKwh > 0 ? m.kwh / maxKwh : 0,
                              minHeight: 8,
                              backgroundColor:
                                  MoEcoTheme.primary.withOpacity(0.08),
                              valueColor: const AlwaysStoppedAnimation(
                                  MoEcoTheme.primary),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            s.bcRow(m.kwh.round(), m.estimatedBill.round()),
                            style: const TextStyle(
                                color: MoEcoTheme.textMuted, fontSize: 12.5),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 8),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Text(
                      s.bcSummary(
                        cmp.averageKwh.round(),
                        cmp.lowestMonth.month,
                        cmp.highestMonth.month,
                      ),
                      style: const TextStyle(fontSize: 13, height: 1.6),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
