import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../strings.dart';
import '../services/share_card_service.dart';

/// F5: the shareable achievement card. The card is rendered on-device as a
/// PNG (RepaintBoundary capture) and shared via the OS sheet (WhatsApp,
/// Facebook, anywhere). Numbers are the user's real on-device stats, and
/// the card itself says so.
class ShareCardView extends StatelessWidget {
  final S s;
  final ShareStats stats;
  const ShareCardView({super.key, required this.s, required this.stats});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 340,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF14532D), Color(0xFF166534), Color(0xFF1B5E20)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.spa, color: Colors.white, size: 22),
              const SizedBox(width: 8),
              Text('MoEco',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      letterSpacing: 0.5)),
              const Spacer(),
              const Icon(Icons.eco, color: Color(0xFFA5D6A7), size: 26),
            ],
          ),
          const SizedBox(height: 18),
          Text(s.shCardTitle,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 16)),
          const SizedBox(height: 16),
          Row(
            children: [
              _stat(s.shStreak, '${stats.streakDays}', Icons.local_fire_department),
              const SizedBox(width: 10),
              _stat(s.shDays, '${stats.totalLoggedDays}', Icons.calendar_month),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _stat(s.shGreenKm, stats.greenKm.toStringAsFixed(1), Icons.directions_walk),
              const SizedBox(width: 10),
              _stat(s.shCo2, stats.co2SavedKg.toStringAsFixed(1), Icons.cloud_outlined),
            ],
          ),
          const SizedBox(height: 18),
          Text(s.shCardFooter,
              style: const TextStyle(color: Colors.white70, fontSize: 10.5, height: 1.5)),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.10),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white24),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFFA5D6A7), size: 20),
            const SizedBox(height: 6),
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 20)),
            const SizedBox(height: 2),
            Text(label,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 10.5)),
          ],
        ),
      ),
    );
  }
}

/// Shows the card in a dialog and captures it as a PNG on share.
Future<void> showShareCardDialog(BuildContext context, S s, ShareStats stats) {
  return showDialog(
    context: context,
    builder: (_) => _ShareCardDialog(s: s, stats: stats),
  );
}

class _ShareCardDialog extends StatefulWidget {
  final S s;
  final ShareStats stats;
  const _ShareCardDialog({required this.s, required this.stats});

  @override
  State<_ShareCardDialog> createState() => _ShareCardDialogState();
}

class _ShareCardDialogState extends State<_ShareCardDialog> {
  final _boundaryKey = GlobalKey();
  bool _sharing = false;

  Future<void> _captureAndShare() async {
    if (_sharing) return;
    setState(() => _sharing = true);
    try {
      final boundary = _boundaryKey.currentContext!.findRenderObject()
          as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 2.5);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/moeco_achievement.png');
      await file.writeAsBytes(byteData.buffer.asUint8List());
      await Share.shareXFiles([XFile(file.path)], text: widget.s.shShareText);
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          RepaintBoundary(
            key: _boundaryKey,
            child: ShareCardView(s: widget.s, stats: widget.stats),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(widget.s.shCancel,
                    style: const TextStyle(color: Colors.white70)),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: _sharing ? null : _captureAndShare,
                icon: const Icon(Icons.share, size: 18),
                label: Text(widget.s.shShareButton),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
