import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';

class LocalProjectsScreen extends StatelessWidget {
  final S s;
  const LocalProjectsScreen({super.key, required this.s});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.projHeroTitle,
          subtitle: s.projHeroSub,
          icon: Icons.location_city_outlined,
          chip: s.ar ? 'مصادر رسمية' : 'Official sources',
        ),
        Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: MoEcoTheme.accent.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.water_drop_outlined, size: 40, color: MoEcoTheme.primary),
              ),
              const SizedBox(height: 18),
              Text(s.projEmpty,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 8),
              Text(
                s.projEmptySub,
                textAlign: TextAlign.center,
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 13, height: 1.5),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
