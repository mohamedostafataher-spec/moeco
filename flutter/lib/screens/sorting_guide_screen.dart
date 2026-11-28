import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/sorting_guide_data.dart';

/// Recycling sorting guide: static household guidance, no live data.
class SortingGuideScreen extends StatelessWidget {
  final S s;
  const SortingGuideScreen({super.key, required this.s});

  static const _icons = <String, IconData>{
    'plastic': Icons.local_drink_outlined,
    'paper': Icons.description_outlined,
    'metal': Icons.settings_outlined,
    'glass': Icons.wine_bar_outlined,
    'organic': Icons.compost_outlined,
    'ewaste': Icons.devices_other_outlined,
    'oil': Icons.opacity_outlined,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(s.sgTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline,
                      color: MoEcoTheme.primary, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(s.sgIntro,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted,
                            fontSize: 12,
                            height: 1.6)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          ...sortingGuide.map((c) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: MoEcoTheme.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(_icons[c.id] ?? Icons.recycling,
                                color: MoEcoTheme.primary, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Text(s.ar ? c.nameAr : c.nameEn,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 14)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(s.ar ? c.examplesAr : c.examplesEn,
                          style: const TextStyle(
                              fontSize: 12.5,
                              height: 1.5,
                              color: MoEcoTheme.textMuted)),
                      const SizedBox(height: 6),
                      Text(s.ar ? c.prepAr : c.prepEn,
                          style: const TextStyle(fontSize: 12.5, height: 1.6)),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }
}
