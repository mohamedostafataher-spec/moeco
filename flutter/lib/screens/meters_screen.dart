import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';
import '../services/savings_tips_service.dart';
import '../services/meter_ocr_service.dart';
import 'utilities_screen.dart' show estimateElectricityBill;

/// Monthly utility meter readings, stored on-device only.
/// Factors match the web app: 0.42 kg CO2e/kWh, 0.298 kg CO2e/m3.
class MetersScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  final VoidCallback onChanged;
  const MetersScreen({
    super.key,
    required this.s,
    required this.store,
    required this.onChanged,
  });

  @override
  State<MetersScreen> createState() => _MetersScreenState();
}

class _MetersScreenState extends State<MetersScreen> {
  final _kwhCtrl = TextEditingController();
  final _m3Ctrl = TextEditingController();
  final _prevCtrl = TextEditingController();
  final _nowCtrl = TextEditingController();
  final _daysCtrl = TextEditingController();
  bool _prefilled = false;
  double? _pKwh;
  double? _pBill;
  double? _pCo2;
  bool _pHigh = false;
  bool _pInvalid = false;
  // Slab-crossing early warning (vs the slab of current consumption).
  bool _pCross = false;
  double _pCrossCost = 0;
  double _pKwhToSave = 0;
  int _pCurCap = 0;

  @override
  void dispose() {
    _kwhCtrl.dispose();
    _m3Ctrl.dispose();
    _prevCtrl.dispose();
    _nowCtrl.dispose();
    _daysCtrl.dispose();
    super.dispose();
  }

  bool _ocrBusy = false;

  /// F6: photograph the meter, read the number on-device, pre-fill the
  /// field. The user always reviews and saves manually - never auto-save.
  Future<void> _scanMeter() async {
    if (_ocrBusy) return;
    setState(() => _ocrBusy = true);
    try {
      final picker = ImagePicker();
      final photo = await picker.pickImage(
          source: ImageSource.camera, maxWidth: 1600, imageQuality: 85);
      if (photo == null) return;
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(widget.s.ocrScanning)));
      }
      final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
      try {
        final result = await recognizer.processImage(InputImage.fromFilePath(photo.path));
        final reading = MeterOcrService.extractMeterReading(result.text);
        if (!mounted) return;
        if (reading == null) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(widget.s.ocrFailed)));
        } else {
          setState(() => _kwhCtrl.text = reading.toStringAsFixed(0));
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(widget.s.ocrConfirmHint)));
        }
      } finally {
        recognizer.close();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(widget.s.ocrFailed)));
      }
    } finally {
      if (mounted) setState(() => _ocrBusy = false);
    }
  }

  /// Project the coming month's electricity bill from the current meter
  /// reading: (current - cycleStart) scaled to 30 days, priced with the
  /// official 2026 tier function shared with the utilities screen.
  void _predict() {
    final prev = double.tryParse(_prevCtrl.text.trim());
    final now = double.tryParse(_nowCtrl.text.trim());
    final days = int.tryParse(_daysCtrl.text.trim()) ?? 0;
    setState(() {
      _pInvalid = false;
      if (prev == null || now == null || now <= prev || days <= 0) {
        _pInvalid = true;
        _pKwh = _pBill = _pCo2 = null;
        _pCross = false;
        return;
      }
      final projected = (now - prev) * 30 / days;
      _pKwh = projected;
      _pBill = estimateElectricityBill(projected);
      _pCo2 = projected * 0.42;
      _pHigh = projected > 300;

      // The differentiator: warn BEFORE the slab crosses. Egyptian slabs
      // re-rate the whole bill, so crossing a boundary is expensive.
      final used = now - prev;
      final curIdx = SavingsTipsService.tierIndexForKwh(used);
      final projIdx = SavingsTipsService.tierIndexForKwh(projected);
      if (projIdx > curIdx) {
        const caps = [50, 100, 200, 350, 650, 1000];
        final cap = caps[curIdx];
        _pCross = true;
        _pCurCap = cap;
        _pCrossCost =
            estimateElectricityBill(projected) - estimateElectricityBill(cap.toDouble());
        _pKwhToSave = projected - cap;
      } else {
        _pCross = false;
      }
    });
  }

  String get _currentMonth => DateTime.now().toIso8601String().substring(0, 7);

  Future<void> _save() async {
    final kwh = double.tryParse(_kwhCtrl.text.trim()) ?? 0;
    final m3 = double.tryParse(_m3Ctrl.text.trim()) ?? 0;
    if (kwh <= 0 && m3 <= 0) return;
    await widget.store.addMeterReading(month: _currentMonth, kwh: kwh, m3: m3);
    _kwhCtrl.clear();
    _m3Ctrl.clear();
    widget.onChanged();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final readings = widget.store.meterReadings;
    final existing = readings.where((r) => r['month'] == _currentMonth).toList();

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.metersHeroTitle,
          subtitle: s.metersHeroSub,
          icon: Icons.electric_meter_outlined,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.metersAddTitle(_currentMonth),
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      if (existing.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(s.metersOverwrite,
                            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5)),
                      ],
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _ocrBusy ? null : _scanMeter,
                          icon: const Icon(Icons.photo_camera_outlined, size: 18),
                          label: Text(s.ocrScanButton),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _kwhCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: s.metersKwh,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _m3Ctrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: s.metersM3,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _save,
                          icon: const Icon(Icons.save_outlined),
                          label: Text(s.metersSave),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(s.metersNote,
                          style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11.5, height: 1.5)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              _predictCard(readings),
              const SizedBox(height: 14),
              if (readings.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Icon(Icons.electric_meter_outlined,
                            size: 36, color: MoEcoTheme.textMuted),
                        const SizedBox(height: 8),
                        Text(s.metersEmpty,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(s.metersEmptySub,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5, height: 1.5)),
                      ],
                    ),
                  ),
                )
              else ...[
                Text(s.metersHistory,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 8),
                ...readings.reversed.map((r) => _readingCard(r)),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _predictCard(List<Map<String, dynamic>> readings) {
    final s = widget.s;
    // Prefill the cycle-start reading from the newest stored reading of a
    // previous month, and default the days to how far we are into this month.
    if (!_prefilled) {
      _prefilled = true;
      final past = readings.where((r) => r['month'] != _currentMonth).toList();
      if (past.isNotEmpty) {
        _prevCtrl.text = (past.last['kwh'] as num).toStringAsFixed(0);
      }
      final d = DateTime.now().day - 1;
      _daysCtrl.text = (d < 1 ? 1 : d).toString();
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.online_prediction_outlined,
                    color: MoEcoTheme.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(s.metersPredictTitle,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(s.metersPredictSub,
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12)),
            const SizedBox(height: 12),
            TextField(
              controller: _prevCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: s.metersPredictPrev,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _nowCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: s.metersPredictNow,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _daysCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: s.metersPredictDays,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _predict,
                icon: const Icon(Icons.calculate_outlined),
                label: Text(s.metersPredictBtn),
              ),
            ),
            if (_pInvalid) ...[
              const SizedBox(height: 10),
              Text(s.metersPredictInvalid,
                  style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 12.5)),
            ],
            if (_pKwh != null && _pBill != null && _pCo2 != null) ...[
              const SizedBox(height: 12),
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
                    Text(s.metersPredictUsage(_pKwh!.toStringAsFixed(0)),
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                    const SizedBox(height: 4),
                    Text(s.metersPredictBill(_pBill!.toStringAsFixed(0)),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: MoEcoTheme.primaryDark)),
                    const SizedBox(height: 4),
                    Text(s.metersPredictCo2(_pCo2!.toStringAsFixed(1)),
                        style: const TextStyle(fontSize: 12.5)),
                    const SizedBox(height: 8),
                    if (_pCross) ...[
                      const SizedBox(height: 10),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          s.metersCrossWarn(
                            _pCurCap,
                            _pCrossCost.toStringAsFixed(0),
                            _pKwhToSave.toStringAsFixed(0),
                          ),
                          style: TextStyle(
                              fontSize: 12.5,
                              height: 1.6,
                              fontWeight: FontWeight.w600,
                              color: Colors.orange.shade900),
                        ),
                      ),
                    ] else ...[
                      Text(_pHigh ? s.metersPredictHigh : s.metersPredictGood,
                          style: const TextStyle(fontSize: 12, height: 1.5)),
                    ],
                  ],
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(s.metersPredictNote,
                style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 11, height: 1.5)),
          ],
        ),
      ),
    );
  }

  Widget _readingCard(Map<String, dynamic> r) {
    final s = widget.s;
    final kwh = (r['kwh'] as num).toDouble();
    final m3 = (r['m3'] as num).toDouble();
    final kg = kwh * 0.42 + m3 * 0.298;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: MoEcoTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.calendar_month_outlined,
                  color: MoEcoTheme.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r['month'], style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(
                    s.metersLine(kwh.toStringAsFixed(0), m3.toStringAsFixed(1), kg.toStringAsFixed(1)),
                    style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 20, color: MoEcoTheme.textMuted),
              onPressed: () async {
                await widget.store.deleteMeterReading(r['month']);
                widget.onChanged();
                setState(() {});
              },
            ),
          ],
        ),
      ),
    );
  }
}
