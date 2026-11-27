import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';

class MoreScreen extends StatelessWidget {
  final S s;
  final VoidCallback onToggleLanguage;
  const MoreScreen({super.key, required this.s, required this.onToggleLanguage});

  Widget _tile(IconData icon, String title, String body) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: MoEcoTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: MoEcoTheme.primary, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(body,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted, fontSize: 12.5, height: 1.5)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.moreHeroTitle,
          subtitle: s.moreHeroSub,
          icon: Icons.grid_view_outlined,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _tile(Icons.info_outline, s.moreAbout, s.moreAboutBody),
              const SizedBox(height: 10),
              _tile(Icons.lock_outline, s.morePrivacy, s.morePrivacyBody),
              const SizedBox(height: 10),
              _tile(Icons.language, s.moreWeb, s.moreWebUrl),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onToggleLanguage,
                  icon: const Icon(Icons.translate),
                  label: Text(s.moreLanguage),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    side: const BorderSide(color: MoEcoTheme.primary),
                    foregroundColor: MoEcoTheme.primaryDark,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'MoEco ${s.version}',
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
