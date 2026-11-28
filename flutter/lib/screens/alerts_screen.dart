import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/alert_center_service.dart';

/// The national alert center: every active alert across all governorates,
/// with severity levels, a live map, and per-governorate detail.
/// All items are forecast-derived and labeled as such.
class AlertsScreen extends StatefulWidget {
  final S s;
  const AlertsScreen({super.key, required this.s});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  AlertCenterData? _data;
  bool _loading = true;
  String? _cityFilter; // cityEn

  @override
  void initState() {
    super.initState();
    AlertCenterService.load().then((d) {
      if (!mounted) return;
      setState(() {
        _data = d;
        _loading = false;
      });
    });
  }

  S get s => widget.s;

  static const _severityColors = {
    AlertSeverity.advisory: Color(0xFF1565C0),
    AlertSeverity.watch: Color(0xFFF9A825),
    AlertSeverity.warning: Color(0xFFE65100),
    AlertSeverity.severe: Color(0xFFC62828),
  };

  String _sevLabel(AlertSeverity v) {
    switch (v) {
      case AlertSeverity.advisory:
        return s.alSevAdvisory;
      case AlertSeverity.watch:
        return s.alSevWatch;
      case AlertSeverity.warning:
        return s.alSevWarning;
      case AlertSeverity.severe:
        return s.alSevSevere;
    }
  }

  IconData _kindIcon(AlertKind k) {
    switch (k) {
      case AlertKind.extremeHeat:
      case AlertKind.heat:
        return Icons.thermostat;
      case AlertKind.cold:
        return Icons.ac_unit;
      case AlertKind.storm:
        return Icons.thunderstorm_outlined;
      case AlertKind.heavyRain:
        return Icons.water_drop_outlined;
      case AlertKind.strongWind:
        return Icons.air;
      case AlertKind.dust:
        return Icons.blur_on;
      case AlertKind.uv:
        return Icons.wb_sunny_outlined;
      case AlertKind.poorAir:
        return Icons.masks_outlined;
      case AlertKind.fireRisk:
        return Icons.local_fire_department_outlined;
    }
  }

  String _line(AlertItem a) {
    final city = s.ar ? a.cityAr : a.cityEn;
    final v = a.value.toStringAsFixed(0);
    switch (a.kind) {
      case AlertKind.extremeHeat:
        return s.alExtremeHeat(city, v);
      case AlertKind.heat:
        return s.alHeat(city, v);
      case AlertKind.cold:
        return s.alCold(city, v);
      case AlertKind.storm:
        return s.alStorm(city);
      case AlertKind.heavyRain:
        return s.alHeavyRain(city, v);
      case AlertKind.strongWind:
        return s.alWind(city, v);
      case AlertKind.dust:
        return s.alDust(city, v);
      case AlertKind.uv:
        return s.alUv(city, v);
      case AlertKind.poorAir:
        return s.alPoorAir(city, v);
      case AlertKind.fireRisk:
        return s.alFireRisk(city);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    final alerts = data?.alerts ?? [];
    final filtered = _cityFilter == null
        ? alerts
        : alerts.where((a) => a.cityEn == _cityFilter).toList();
    final worst = data?.worstPerCity() ?? {};

    return Scaffold(
      appBar: AppBar(title: Text(s.alHeroTitle)),
      body: _loading
          ? Center(
              child: Text(s.alLoading,
                  style: const TextStyle(color: MoEcoTheme.textMuted)))
          : data == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(s.alError,
                        textAlign: TextAlign.center,
                        style:
                            const TextStyle(color: MoEcoTheme.textMuted)),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // ---- summary header ----
                    AnimatedOpacity(
                      opacity: 1,
                      duration: const Duration(milliseconds: 400),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: alerts.isEmpty
                                ? const [Color(0xFF1B5E20), Color(0xFF2E7D32)]
                                : const [Color(0xFF4E342E), Color(0xFF6D4C41)],
                            begin: Alignment.topRight,
                            end: Alignment.bottomLeft,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              alerts.isEmpty
                                  ? s.alAllClear
                                  : s.alActiveCount(alerts.length.toString()),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 17),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              s.alUpdated(
                                  '${data.fetchedAt.hour.toString().padLeft(2, '0')}:${data.fetchedAt.minute.toString().padLeft(2, '0')}'),
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 11.5),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // ---- map ----
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SizedBox(
                        height: 220,
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: const LatLng(29.3, 31.2),
                            initialZoom: 5.6,
                            interactionOptions: const InteractionOptions(
                                flags: InteractiveFlag.pinchZoom |
                                    InteractiveFlag.drag),
                          ),
                          children: [
                            TileLayer(
                              urlTemplate:
                                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'eg.moeco.app',
                            ),
                            MarkerLayer(
                              markers: [
                                for (final c in data.cities)
                                  Marker(
                                    point: LatLng(c.lat, c.lon),
                                    width: 26,
                                    height: 26,
                                    child: GestureDetector(
                                      onTap: () => setState(() =>
                                          _cityFilter =
                                              _cityFilter == c.cityEn
                                                  ? null
                                                  : c.cityEn),
                                      child: Container(
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: _severityColors[
                                                  worst[c.cityEn] ??
                                                      AlertSeverity
                                                          .advisory] ??
                                              Colors.green,
                                          border: Border.all(
                                              color: worst.containsKey(
                                                      c.cityEn)
                                                  ? Colors.white
                                                  : Colors.green,
                                              width: 2),
                                          boxShadow: const [
                                            BoxShadow(
                                                blurRadius: 4,
                                                color: Colors.black26)
                                          ],
                                        ),
                                        child: worst.containsKey(c.cityEn)
                                            ? const Icon(
                                                Icons.priority_high,
                                                size: 14,
                                                color: Colors.white)
                                            : const Icon(Icons.check,
                                                size: 14,
                                                color: Colors.white),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(s.alMapCredit,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 10)),
                    const SizedBox(height: 12),
                    // ---- governorate filter ----
                    SizedBox(
                      height: 34,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          Padding(
                            padding: const EdgeInsetsDirectional.only(end: 6),
                            child: ChoiceChip(
                              label: Text(s.alAll,
                                  style: const TextStyle(fontSize: 12)),
                              selected: _cityFilter == null,
                              onSelected: (_) =>
                                  setState(() => _cityFilter = null),
                            ),
                          ),
                          for (final c in data.cities)
                            Padding(
                              padding:
                                  const EdgeInsetsDirectional.only(end: 6),
                              child: ChoiceChip(
                                label: Text(
                                    s.ar ? c.cityAr : c.cityEn,
                                    style: const TextStyle(fontSize: 12)),
                                selected: _cityFilter == c.cityEn,
                                onSelected: (_) => setState(() =>
                                    _cityFilter = _cityFilter == c.cityEn
                                        ? null
                                        : c.cityEn),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // ---- alert cards ----
                    if (filtered.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(s.alNoneHere,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: MoEcoTheme.textMuted, fontSize: 13)),
                      )
                    else
                      for (final a in filtered)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: BorderDirectional(
                                start: BorderSide(
                                    color: _severityColors[a.severity]!,
                                    width: 4),
                              ),
                              boxShadow: const [
                                BoxShadow(
                                    blurRadius: 6,
                                    color: Color(0x14000000),
                                    offset: Offset(0, 2))
                              ],
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(_kindIcon(a.kind),
                                    color: _severityColors[a.severity],
                                    size: 22),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(_line(a),
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 13,
                                              height: 1.4)),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets
                                                .symmetric(
                                                horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: _severityColors[
                                                      a.severity]!
                                                  .withOpacity(0.12),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              _sevLabel(a.severity),
                                              style: TextStyle(
                                                  color: _severityColors[
                                                      a.severity],
                                                  fontSize: 10.5,
                                                  fontWeight:
                                                      FontWeight.w800),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(s.alDerivedTag,
                                                style: const TextStyle(
                                                    color: MoEcoTheme
                                                        .textMuted,
                                                    fontSize: 10)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    const SizedBox(height: 8),
                    Text(s.alFootnote,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted,
                            fontSize: 10.5,
                            height: 1.6)),
                  ],
                ),
    );
  }
}
