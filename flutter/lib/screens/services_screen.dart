import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/services_data.dart';

/// Emergency hotlines, official digital government links, and water
/// saving: all real, all free, everything honestly sourced.
class ServicesScreen extends StatefulWidget {
  final S s;
  const ServicesScreen({super.key, required this.s});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  int _members = 4;
  bool _fixTap = false;
  bool _aerator = false;
  double _showerMin = 0;

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      // No handler available: fail silently rather than fake a result.
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final liters = estimateMonthlyWaterSavings(
      householdMembers: _members,
      fixDrippingTap: _fixTap,
      installAerator: _aerator,
      shorterShowerMinutes: _showerMin,
    );
    final co2 = waterSavingsCo2Kg(liters);

    final byCat = <String, List<GovService>>{};
    final catEn = <String, String>{};
    for (final g in govServices) {
      byCat.putIfAbsent(g.catAr, () => []).add(g);
      catEn[g.catAr] = g.catEn;
    }

    return Scaffold(
      appBar: AppBar(title: Text(s.svcHeroTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ---- Emergency hotlines ----
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.phone_in_talk_outlined,
                          color: MoEcoTheme.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(s.svcHotlines,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final h in hotlines)
                        InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => _open('tel:${h.number}'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFEBEE),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: const Color(0xFFEF9A9A), width: 0.5),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.ar ? h.labelAr : h.labelEn,
                                  style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  h.number,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFFC62828),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(s.svcHotlinesNote,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted, fontSize: 11)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // ---- Water saving ----
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.water_drop_outlined,
                          color: MoEcoTheme.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(s.svcWaterTitle,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  for (final t in waterTips)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.check_circle_outline,
                              color: MoEcoTheme.accent, size: 15),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(s.ar ? t.titleAr : t.titleEn,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12.5)),
                                Text(s.ar ? t.descAr : t.descEn,
                                    style: const TextStyle(
                                        fontSize: 11.5,
                                        height: 1.5,
                                        color: MoEcoTheme.textMuted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  const Divider(height: 24),
                  Text(s.svcEstimator,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(s.svcMembers,
                          style: const TextStyle(fontSize: 12.5)),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, size: 20),
                        onPressed: _members > 1
                            ? () => setState(() => _members--)
                            : null,
                      ),
                      Text('$_members',
                          style: const TextStyle(fontWeight: FontWeight.w800)),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, size: 20),
                        onPressed: _members < 12
                            ? () => setState(() => _members++)
                            : null,
                      ),
                    ],
                  ),
                  SwitchListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(s.svcFixTap,
                        style: const TextStyle(fontSize: 12.5)),
                    value: _fixTap,
                    onChanged: (v) => setState(() => _fixTap = v),
                  ),
                  SwitchListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(s.svcAerator,
                        style: const TextStyle(fontSize: 12.5)),
                    value: _aerator,
                    onChanged: (v) => setState(() => _aerator = v),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: Text(s.svcShower,
                            style: const TextStyle(fontSize: 12.5)),
                      ),
                      Text(_showerMin.toStringAsFixed(0),
                          style: const TextStyle(fontWeight: FontWeight.w800)),
                    ],
                  ),
                  Slider(
                    value: _showerMin,
                    min: 0,
                    max: 10,
                    divisions: 10,
                    onChanged: (v) => setState(() => _showerMin = v),
                  ),
                  if (liters > 0)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: MoEcoTheme.primary.withOpacity(0.07),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.svcMonthlySave(liters.toStringAsFixed(0)),
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13.5,
                                  color: MoEcoTheme.primaryDark)),
                          Text(s.svcCo2(co2.toStringAsFixed(1)),
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: MoEcoTheme.textMuted)),
                        ],
                      ),
                    ),
                  const SizedBox(height: 6),
                  Text(s.svcFormulaNote,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted,
                          fontSize: 10.5,
                          height: 1.5)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // ---- Official digital services ----
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.account_balance_outlined,
                          color: MoEcoTheme.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(s.svcGovTitle,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  for (final cat in byCat.keys)
                    ExpansionTile(
                      dense: true,
                      tilePadding: EdgeInsets.zero,
                      title: Text(
                        s.ar ? cat : (catEn[cat] ?? cat),
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      children: [
                        for (final g in byCat[cat]!)
                          ListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            title: Text(g.nameAr,
                                style: const TextStyle(fontSize: 12.5)),
                            trailing: const Icon(Icons.open_in_new, size: 15),
                            onTap: () => _open(g.url),
                          ),
                      ],
                    ),
                  const SizedBox(height: 8),
                  Text(s.svcGovNote,
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
