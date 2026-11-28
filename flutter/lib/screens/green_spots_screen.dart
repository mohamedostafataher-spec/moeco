import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/recycling_service.dart';
import '../services/green_spots_service.dart';

/// Parks, gardens and drinking-water points near each governorate,
/// live from OpenStreetMap (Overpass). Honest source label, no fake pins.
class GreenSpotsScreen extends StatefulWidget {
  final S s;
  const GreenSpotsScreen({super.key, required this.s});

  @override
  State<GreenSpotsScreen> createState() => _GreenSpotsScreenState();
}

class _GreenSpotsScreenState extends State<GreenSpotsScreen> {
  RecyclingCity _city = RecyclingService.cities.first;
  List<GreenSpot>? _spots;
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load(_city);
  }

  Future<void> _load(RecyclingCity city) async {
    setState(() {
      _loading = true;
      _failed = false;
    });
    final pts = await GreenSpotsService.getSpots(city);
    if (!mounted) return;
    setState(() {
      _spots = pts;
      _loading = false;
      _failed = pts == null;
    });
  }

  S get s => widget.s;

  Future<void> _open(Uri uri) async {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  String _kindLabel(GreenSpotKind k) {
    switch (k) {
      case GreenSpotKind.park:
        return s.gsPark;
      case GreenSpotKind.garden:
        return s.gsGarden;
      case GreenSpotKind.drinkingWater:
        return s.gsWater;
    }
  }

  IconData _kindIcon(GreenSpotKind k) {
    switch (k) {
      case GreenSpotKind.park:
        return Icons.park_outlined;
      case GreenSpotKind.garden:
        return Icons.local_florist_outlined;
      case GreenSpotKind.drinkingWater:
        return Icons.water_drop_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(s.gsHeroTitle)),
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
                      const Icon(Icons.park_outlined,
                          color: MoEcoTheme.primary, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(s.gsTitle,
                            style: const TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 14)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<RecyclingCity>(
                    initialValue: _city,
                    decoration: InputDecoration(
                      labelText: s.gsPickCity,
                      border: const OutlineInputBorder(),
                    ),
                    items: [
                      for (final c in RecyclingService.cities)
                        DropdownMenuItem(
                            value: c,
                            child: Text(s.ar ? c.nameAr : c.nameEn)),
                    ],
                    onChanged: (c) {
                      if (c != null && c != _city) {
                        _city = c;
                        _load(c);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  if (_loading)
                    Text(s.gsLoading,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 12.5))
                  else if (_failed)
                    Text(s.gsError,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 12.5))
                  else if (_spots == null || _spots!.isEmpty)
                    Text(s.gsEmpty,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 12.5))
                  else ...[
                    for (final p in _spots!)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(_kindIcon(p.kind),
                                size: 16, color: MoEcoTheme.primary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p.name,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13.5)),
                                  Padding(
                                    padding: const EdgeInsets.only(top: 3),
                                    child: Text(
                                      '${_kindLabel(p.kind)} · ${p.distKm.toStringAsFixed(1)} ${s.gsKm}',
                                      style: const TextStyle(
                                          color: MoEcoTheme.textMuted,
                                          fontSize: 11.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () => _open(Uri.parse(
                                  'https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}')),
                              icon: const Icon(Icons.directions_outlined,
                                  size: 16),
                              label: Text(s.gsDirections,
                                  style: const TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                  ],
                  const SizedBox(height: 8),
                  Text(s.gsSource,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted, fontSize: 11)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
