import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import 'meters_screen.dart';
import 'achievements_screen.dart';
import 'climate_screen.dart';
import 'fuel_screen.dart';
import 'utilities_screen.dart';
import 'news_screen.dart';
import 'trips_screen.dart';

class MoreScreen extends StatelessWidget {
  final S s;
  final FootprintStore store;
  final VoidCallback onChanged;
  final VoidCallback onToggleLanguage;
  const MoreScreen({
    super.key,
    required this.s,
    required this.store,
    required this.onChanged,
    required this.onToggleLanguage,
  });

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

  Widget _navTile(BuildContext context, IconData icon, String title, String body, Widget page) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
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
              const Icon(Icons.chevron_right, color: MoEcoTheme.textMuted),
            ],
          ),
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
              _navTile(context, Icons.electric_meter_outlined, s.metersHeroTitle,
                  s.metersHeroSub, MetersScreen(s: s, store: store, onChanged: onChanged)),
              const SizedBox(height: 10),
              _navTile(context, Icons.emoji_events_outlined, s.achHeroTitle,
                  s.achHeroSub, AchievementsScreen(s: s, store: store)),
              const SizedBox(height: 10),
              _navTile(context, Icons.thermostat_outlined, s.climateHeroTitle,
                  s.climateHeroSub, ClimateScreen(s: s)),
              const SizedBox(height: 10),
              _navTile(context, Icons.local_gas_station_outlined, s.fuelHeroTitle,
                  s.fuelHeroSub, FuelScreen(s: s)),
              const SizedBox(height: 10),
              _navTile(context, Icons.receipt_long_outlined, s.utilHeroTitle,
                  s.utilHeroSub, UtilitiesScreen(s: s)),
              const SizedBox(height: 10),
              _navTile(context, Icons.article_outlined, s.newsHeroTitle,
                  s.newsHeroSub, NewsScreen(s: s)),
              const SizedBox(height: 10),
              _navTile(context, Icons.directions_walk, s.tripsHeroTitle,
                  s.tripsHeroSub,
                  TripsScreen(s: s, store: store, onChanged: onChanged)),
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
