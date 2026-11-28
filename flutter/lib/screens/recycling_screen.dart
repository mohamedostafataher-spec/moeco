import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/recycling_service.dart';

class RecyclingScreen extends StatefulWidget {
  final S s;
  const RecyclingScreen({super.key, required this.s});

  @override
  State<RecyclingScreen> createState() => _RecyclingScreenState();
}

class _RecyclingScreenState extends State<RecyclingScreen> {
  RecyclingCity _city = RecyclingService.cities.first;
  List<RecyclingPoint>? _points;
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
    final pts = await RecyclingService.getPoints(city);
    if (!mounted) return;
    setState(() {
      _points = pts;
      _loading = false;
      _failed = pts == null;
    });
  }

  S get s => widget.s;

  Future<void> _open(Uri uri) async {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _bekiaCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.recycling, color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(s.recBekiaTitle,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(s.recBekiaBody, style: const TextStyle(fontSize: 12.5, height: 1.6)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () => _open(Uri.parse('https://bekia-egypt.com')),
                icon: const Icon(Icons.open_in_new, size: 18),
                label: Text(s.recBekiaOpen),
                style: FilledButton.styleFrom(
                  backgroundColor: MoEcoTheme.primary,
                  minimumSize: const Size.fromHeight(44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(s.recBekiaNote,
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _pointsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.place_outlined, color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(s.recPointsTitle,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<RecyclingCity>(
              value: _city,
              decoration: InputDecoration(
                labelText: s.recPickCity,
                border: const OutlineInputBorder(),
              ),
              items: [
                for (final c in RecyclingService.cities)
                  DropdownMenuItem(
                      value: c, child: Text(s.ar ? c.nameAr : c.nameEn)),
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
              Text(s.recLoading,
                  style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else if (_failed)
              Text(s.recError,
                  style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else if (_points == null || _points!.isEmpty)
              Text(s.recEmpty,
                  style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5))
            else ...[
              for (final p in _points!)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600, fontSize: 13.5)),
                            if (p.materials.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 3),
                                child: Text(
                                  p.materials.join(' · '),
                                  style: const TextStyle(
                                      color: MoEcoTheme.textMuted, fontSize: 11.5),
                                ),
                              ),
                          ],
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () => _open(Uri.parse(
                            'https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}')),
                        icon: const Icon(Icons.directions_outlined, size: 16),
                        label: Text(s.recDirections,
                            style: const TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                ),
            ],
            const SizedBox(height: 8),
            Text(s.recSource,
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(s.recHeroTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _bekiaCard(),
          const SizedBox(height: 16),
          _pointsCard(),
        ],
      ),
    );
  }
}
