import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';

/// Achievements computed from on-device logs only. Nothing is awarded for
/// data the user never entered, and thresholds are shown honestly.
class AchievementsScreen extends StatelessWidget {
  final S s;
  final FootprintStore store;
  const AchievementsScreen({super.key, required this.s, required this.store});

  @override
  Widget build(BuildContext context) {
    final totalDays = store.logs.length;
    final streak = store.streak;
    final drafts = store.drafts.length;
    final meters = store.meterReadings.length;

    final items = <_Achievement>[
      _Achievement(Icons.edit_note, s.achFirstLog, 1, totalDays),
      _Achievement(Icons.local_fire_department_outlined, s.achStreak3, 3, streak),
      _Achievement(Icons.local_fire_department, s.achStreak7, 7, streak),
      _Achievement(Icons.emoji_events_outlined, s.achStreak30, 30, streak),
      _Achievement(Icons.calendar_view_week_outlined, s.achDays14, 14, totalDays),
      _Achievement(Icons.assignment_turned_in_outlined, s.achFirstDraft, 1, drafts),
      _Achievement(Icons.electric_meter_outlined, s.achFirstMeter, 1, meters),
    ];

    final done = items.where((a) => a.unlocked).length;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.achHeroTitle,
          subtitle: s.achHeroSub,
          icon: Icons.emoji_events_outlined,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.emoji_events, color: MoEcoTheme.primary, size: 26),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          s.achProgress(done, items.length),
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              ...items.map((a) => Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: a.unlocked
                                  ? MoEcoTheme.primary.withOpacity(0.12)
                                  : Colors.grey.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(a.icon,
                                color: a.unlocked ? MoEcoTheme.primary : MoEcoTheme.textMuted,
                                size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(a.title,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700, fontSize: 13.5)),
                                const SizedBox(height: 4),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: a.progress,
                                    minHeight: 6,
                                    backgroundColor: Colors.grey.withOpacity(0.15),
                                    color: a.unlocked ? MoEcoTheme.primary : MoEcoTheme.textMuted,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  a.unlocked ? s.achUnlocked : s.achCount(a.current, a.target),
                                  style: const TextStyle(
                                      color: MoEcoTheme.textMuted, fontSize: 11.5),
                                ),
                              ],
                            ),
                          ),
                          if (a.unlocked)
                            const Padding(
                              padding: EdgeInsetsDirectional.only(start: 8),
                              child: Icon(Icons.check_circle, color: MoEcoTheme.primary, size: 20),
                            ),
                        ],
                      ),
                    ),
                  )),
              const SizedBox(height: 8),
              Text(s.achNote,
                  style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5, height: 1.5)),
            ],
          ),
        ),
      ],
    );
  }
}

class _Achievement {
  final IconData icon;
  final String title;
  final int target;
  final int current;
  const _Achievement(this.icon, this.title, this.target, this.current);

  bool get unlocked => current >= target;
  double get progress =>
      target <= 0 ? 0 : ((current / target).clamp(0.0, 1.0)).toDouble();
}
