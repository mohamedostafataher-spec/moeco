import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/action_plan_service.dart';
import '../services/savings_tips_service.dart';

/// Weekly action plan: 3 checkable actions, resets every Saturday.
/// Fully on-device; EGP figures are the documented tip estimates.
class ActionPlanScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  const ActionPlanScreen({super.key, required this.s, required this.store});

  @override
  State<ActionPlanScreen> createState() => _ActionPlanScreenState();
}

class _ActionPlanScreenState extends State<ActionPlanScreen> {
  Set<String>? _done;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final done = await ActionPlanService.doneIds(DateTime.now());
    if (mounted) setState(() => _done = done);
  }

  Future<void> _toggle(String id) async {
    final done = await ActionPlanService.toggle(id, DateTime.now());
    if (mounted) setState(() => _done = done);
  }

  double get _marginalPrice {
    final readings = widget.store.meterReadings;
    if (readings.isEmpty) return 0.95; // mid-slab default, labeled estimate
    final kwh = (readings.last['kwh'] as num?)?.toDouble() ?? 0;
    if (kwh <= 0) return 0.95;
    return SavingsTipsService.tierStatus(kwh).tierPrice;
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final plan = ActionPlanService.planForWeek(DateTime.now());
    final done = _done;
    final doneCount = done == null
        ? 0
        : plan.where((t) => done.contains(t.id)).length;
    final totalEgp = ActionPlanService.planEgpSaved(plan, _marginalPrice);
    return Scaffold(
      appBar: AppBar(title: Text(s.apTitle)),
      body: done == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.apSummary(doneCount, plan.length,
                            totalEgp.toStringAsFixed(0)),
                            style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 13.5,
                                height: 1.5)),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: doneCount / plan.length,
                            minHeight: 8,
                            backgroundColor:
                                MoEcoTheme.primary.withOpacity(0.08),
                            valueColor: const AlwaysStoppedAnimation(
                                MoEcoTheme.primary),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(s.apNote,
                            style: const TextStyle(
                                color: MoEcoTheme.textMuted,
                                fontSize: 11,
                                height: 1.5)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                ...plan.map((tip) {
                  final isDone = done.contains(tip.id);
                  return Card(
                    child: CheckboxListTile(
                      value: isDone,
                      onChanged: (_) => _toggle(tip.id),
                      title: Text(
                        s.ar ? tip.titleAr : tip.titleEn,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13.5,
                          decoration:
                              isDone ? TextDecoration.lineThrough : null,
                          color: isDone ? MoEcoTheme.textMuted : null,
                        ),
                      ),
                      subtitle: Text(
                        s.apSaves(
                            tip.egpSaved(_marginalPrice).toStringAsFixed(0)),
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 11.5),
                      ),
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  );
                }),
                if (doneCount == plan.length) ...[
                  const SizedBox(height: 10),
                  Card(
                    color: MoEcoTheme.primary.withOpacity(0.1),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Text(
                        s.apAllDone,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: MoEcoTheme.primaryDark),
                      ),
                    ),
                  ),
                ],
              ],
            ),
    );
  }
}
