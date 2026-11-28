import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/challenge_service.dart';

/// F9 (on-device): personal governorate challenge. No leaderboard - that
/// needs a server; the screen says so plainly.
class ChallengeScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  const ChallengeScreen({super.key, required this.s, required this.store});

  @override
  State<ChallengeScreen> createState() => _ChallengeScreenState();
}

class _ChallengeScreenState extends State<ChallengeScreen> {
  Challenge? _active;
  String _gov = ChallengeService.governorates.first.$1;
  ChallengeGoalType _goal = ChallengeGoalType.weeklyGreenTrips;
  int _target = 5;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    ChallengeService.load().then((c) {
      if (mounted) {
        setState(() {
          _active = c;
          _loaded = true;
        });
      }
    });
  }

  Future<void> _start() async {
    final c = Challenge(
      governorateAr: _gov,
      goalType: _goal,
      target: _target,
      createdAt: DateTime.now(),
    );
    await ChallengeService.save(c);
    setState(() => _active = c);
  }

  Future<void> _cancel() async {
    await ChallengeService.clear();
    setState(() => _active = null);
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    return Scaffold(
      appBar: AppBar(title: Text(s.chTitle)),
      body: !_loaded
          ? const Center(child: CircularProgressIndicator())
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
                          child: Text(s.chPersonalNote,
                              style: const TextStyle(
                                  color: MoEcoTheme.textMuted,
                                  fontSize: 12,
                                  height: 1.5)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                if (_active == null) _buildPicker(s) else _buildActive(s),
              ],
            ),
    );
  }

  Widget _buildPicker(S s) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.chPickGov,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _gov,
              isExpanded: true,
              items: ChallengeService.governorates
                  .map((g) => DropdownMenuItem(
                      value: g.$1,
                      child: Text(widget.s.ar ? g.$1 : g.$2)))
                  .toList(),
              onChanged: (v) => setState(() => _gov = v ?? _gov),
              decoration: InputDecoration(
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12)),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 14),
            Text(s.chGoal,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: Text(s.chGoalTrips),
                  selected: _goal == ChallengeGoalType.weeklyGreenTrips,
                  onSelected: (_) => setState(() {
                    _goal = ChallengeGoalType.weeklyGreenTrips;
                    _target = 5;
                  }),
                ),
                ChoiceChip(
                  label: Text(s.chGoalKwh),
                  selected: _goal == ChallengeGoalType.monthlyKwhReduction,
                  onSelected: (_) => setState(() {
                    _goal = ChallengeGoalType.monthlyKwhReduction;
                    _target = 10;
                  }),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: (_goal == ChallengeGoalType.weeklyGreenTrips
                      ? const [3, 5, 7]
                      : const [5, 10, 15])
                  .map((n) => ChoiceChip(
                        label: Text(_goal == ChallengeGoalType.weeklyGreenTrips
                            ? s.chTripsUnit(n)
                            : '$n%'),
                        selected: _target == n,
                        onSelected: (_) => setState(() => _target = n),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _start,
                icon: const Icon(Icons.flag_outlined),
                label: Text(s.chStart),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActive(S s) {
    final c = _active!;
    final p = ChallengeService.progress(
      challenge: c,
      trips: widget.store.greenTrips,
      readings: widget.store.meterReadings,
      now: DateTime.now(),
    );
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.emoji_events_outlined,
                    color: MoEcoTheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    c.goalType == ChallengeGoalType.weeklyGreenTrips
                        ? s.chActiveTrips(c.governorateAr, c.target)
                        : s.chActiveKwh(c.governorateAr, c.target),
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: p.fraction,
                minHeight: 10,
                backgroundColor: MoEcoTheme.primary.withOpacity(0.08),
                valueColor:
                    const AlwaysStoppedAnimation(MoEcoTheme.primary),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              p.done
                  ? s.chDone
                  : (c.goalType == ChallengeGoalType.weeklyGreenTrips
                      ? s.chProgressTrips(p.current, c.target)
                      : s.chProgressKwh(p.current, c.target)),
              style: const TextStyle(
                  color: MoEcoTheme.textMuted, fontSize: 12.5, height: 1.5),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: TextButton(
                onPressed: _cancel,
                child: Text(s.chCancel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
