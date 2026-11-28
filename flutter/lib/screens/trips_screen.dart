import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';

/// Log walk / bike trips and see the CO2 avoided vs driving.
/// Local-only storage, same 0.192 kg CO2e/km factor as the calculator.
class TripsScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  final VoidCallback onChanged;
  const TripsScreen(
      {super.key,
      required this.s,
      required this.store,
      required this.onChanged});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> {
  String _mode = 'walk';
  String _instead = 'car';
  final _kmController = TextEditingController();

  @override
  void dispose() {
    _kmController.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    final km = double.tryParse(_kmController.text.replaceAll(',', '.'));
    if (km == null || km <= 0 || km > 200) return;
    await widget.store.addGreenTrip(mode: _mode, km: km, instead: _instead);
    widget.onChanged();
    setState(() => _kmController.clear());
  }

  Future<void> _delete(String id) async {
    await widget.store.deleteGreenTrip(id);
    widget.onChanged();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final trips = widget.store.greenTrips;
    final totalKm = widget.store.greenTripTotalKm;
    final savedKg = widget.store.greenTripCo2SavedKg;
    final savedEgpMonth =
        widget.store.greenTripEgpSavedThisMonth(DateTime.now());
    final dateFmt = DateFormat.yMMMd(s.ar ? 'ar' : 'en');

    return Scaffold(
      appBar: AppBar(title: Text(s.tripsHeroTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.tripsAddTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: SegmentedButton<String>(
                          segments: [
                            ButtonSegment(
                                value: 'walk',
                                icon: const Icon(Icons.directions_walk),
                                label: Text(s.tripsWalk)),
                            ButtonSegment(
                                value: 'bike',
                                icon: const Icon(Icons.directions_bike),
                                label: Text(s.tripsBike)),
                          ],
                          selected: {_mode},
                          onSelectionChanged: (v) =>
                              setState(() => _mode = v.first),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Text(s.tripsInstead,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 12)),
                  ),
                  const SizedBox(height: 6),
                  SegmentedButton<String>(
                    segments: [
                      ButtonSegment(
                          value: 'car',
                          icon: const Icon(Icons.directions_car_outlined),
                          label: Text(s.tripsInsteadCar)),
                      ButtonSegment(
                          value: 'metro',
                          icon: const Icon(Icons.subway_outlined),
                          label: Text(s.tripsInsteadMetro)),
                      ButtonSegment(
                          value: 'microbus',
                          icon: const Icon(Icons.airport_shuttle_outlined),
                          label: Text(s.tripsInsteadMicrobus)),
                    ],
                    selected: {_instead},
                    onSelectionChanged: (v) =>
                        setState(() => _instead = v.first),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _kmController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                    ],
                    decoration: InputDecoration(
                      labelText: s.tripsKmLabel,
                      border: const OutlineInputBorder(),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _add,
                      icon: const Icon(Icons.add),
                      label: Text(s.tripsAdd),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.tripsTotalsTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(totalKm.toStringAsFixed(1),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 22,
                                    color: MoEcoTheme.primary)),
                            Text(s.tripsTotalKm,
                                style: const TextStyle(
                                    color: MoEcoTheme.textMuted,
                                    fontSize: 11.5)),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(savedKg.toStringAsFixed(2),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 22,
                                    color: MoEcoTheme.accent)),
                            Text(s.tripsSavedKg,
                                style: const TextStyle(
                                    color: MoEcoTheme.textMuted,
                                    fontSize: 11.5)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: MoEcoTheme.primary.withOpacity(0.07),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.tripsSavedEgpMonth(savedEgpMonth.toStringAsFixed(0)),
                            style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: MoEcoTheme.primaryDark)),
                        const SizedBox(height: 3),
                        Text(s.tripsEgpNote,
                            style: const TextStyle(
                                color: MoEcoTheme.textMuted,
                                fontSize: 11,
                                height: 1.5)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(s.tripsFactorNote,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted, fontSize: 11)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (trips.isNotEmpty)
            ...trips.take(20).map((t) {
              final km = (t['km'] as num?)?.toDouble() ?? 0;
              final mode = t['mode'] as String? ?? 'walk';
              final at = DateTime.tryParse(t['createdAt'] ?? '');
              return Card(
                child: ListTile(
                  leading: Icon(
                    mode == 'bike'
                        ? Icons.directions_bike
                        : Icons.directions_walk,
                    color: MoEcoTheme.primary,
                  ),
                  title: Text(
                      '${km.toStringAsFixed(1)} ${s.tripsKmUnit} · ${mode == 'bike' ? s.tripsBike : s.tripsWalk}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 13.5)),
                  subtitle: at == null
                      ? null
                      : Text(dateFmt.format(at),
                          style: const TextStyle(fontSize: 11.5)),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline,
                        color: MoEcoTheme.textMuted, size: 20),
                    onPressed: () => _delete(t['id'] as String),
                  ),
                ),
              );
            })
          else
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(s.tripsEmpty,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: MoEcoTheme.textMuted)),
            ),
        ],
      ),
    );
  }
}
