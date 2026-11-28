import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/climate_service.dart';

/// Historical yearly mean temperature for Egyptian cities, from the
/// Open-Meteo archive (ERA5). Honest labels, no fabricated values.
class ClimateScreen extends StatefulWidget {
  final S s;
  const ClimateScreen({super.key, required this.s});

  @override
  State<ClimateScreen> createState() => _ClimateScreenState();
}

class _ClimateScreenState extends State<ClimateScreen> {
  List<ClimateSeries>? _series;
  bool _failed = false;
  int _cityIndex = 0;

  @override
  void initState() {
    super.initState();
    ClimateService.getSeries().then((list) {
      if (!mounted) return;
      setState(() {
        _series = list;
        _failed = list.isEmpty;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.climateHeroTitle,
          subtitle: s.climateHeroSub,
          icon: Icons.thermostat_outlined,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: _series == null
              ? const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator()),
                )
              : _failed
                  ? Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Text(s.climateUnavailable,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: MoEcoTheme.textMuted, fontSize: 13, height: 1.5)),
                      ),
                    )
                  : _content(s),
        ),
      ],
    );
  }

  Widget _content(S s) {
    final series = _series!;
    final sel = series[_cityIndex.clamp(0, series.length - 1).toInt()];
    final years = sel.yearlyMean.keys.toList()..sort();
    final minV = years.map((y) => sel.yearlyMean[y]!).reduce((a, b) => a < b ? a : b);
    final maxV = years.map((y) => sel.yearlyMean[y]!).reduce((a, b) => a > b ? a : b);
    final change = sel.changeC;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (var i = 0; i < series.length; i++)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 8),
                  child: ChoiceChip(
                    label: Text(widget.s.ar ? series[i].cityAr : series[i].cityEn),
                    selected: i == _cityIndex,
                    onSelected: (_) => setState(() => _cityIndex = i),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.climateChange(change >= 0 ? '+' : '', change.toStringAsFixed(1)),
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 4),
                Text(s.climateWindow(years.first, years.last),
                    style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 140,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      for (final y in years)
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(sel.yearlyMean[y]!.toStringAsFixed(1),
                                    style: const TextStyle(fontSize: 9, color: MoEcoTheme.textMuted)),
                                const SizedBox(height: 4),
                                Container(
                                  height: maxV > minV
                                      ? 20 + 90 * (sel.yearlyMean[y]! - minV) / (maxV - minV)
                                      : 60,
                                  decoration: BoxDecoration(
                                    color: MoEcoTheme.primary
                                        .withOpacity(0.35 + 0.6 * ((sel.yearlyMean[y]! - minV) / ((maxV - minV) == 0 ? 1 : (maxV - minV)))),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text("'${y.toString().substring(2)}",
                                    style: const TextStyle(fontSize: 9, color: MoEcoTheme.textMuted)),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(s.climateSource,
            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5, height: 1.5)),
      ],
    );
  }
}
