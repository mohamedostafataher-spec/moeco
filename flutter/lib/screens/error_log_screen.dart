import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/error_log_service.dart';

/// F15 (on-device): shows the local error log. The user shares it manually -
/// nothing is uploaded anywhere automatically.
class ErrorLogScreen extends StatefulWidget {
  final S s;
  const ErrorLogScreen({super.key, required this.s});

  @override
  State<ErrorLogScreen> createState() => _ErrorLogScreenState();
}

class _ErrorLogScreenState extends State<ErrorLogScreen> {
  List<ErrorLogEntry>? _entries;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final entries = await ErrorLogService.readAll();
    if (mounted) setState(() => _entries = entries);
  }

  Future<void> _clear() async {
    await ErrorLogService.clear();
    await _load();
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(widget.s.errLogCleared)));
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final entries = _entries;
    return Scaffold(
      appBar: AppBar(title: Text(s.errLogTitle)),
      body: entries == null
          ? const Center(child: CircularProgressIndicator())
          : entries.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Text(
                      s.errLogEmpty,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: MoEcoTheme.textMuted, fontSize: 14, height: 1.6),
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: entries.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final e = entries[i];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              e.message,
                              style: const TextStyle(
                                  fontSize: 12.5, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              e.at.toLocal().toString().split('.').first,
                              style: const TextStyle(
                                  color: MoEcoTheme.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      bottomNavigationBar: entries != null && entries.isNotEmpty
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => Share.share(
                            ErrorLogService.formatForShare(entries)),
                        icon: const Icon(Icons.share_outlined),
                        label: Text(s.errLogShare),
                      ),
                    ),
                    const SizedBox(width: 10),
                    OutlinedButton(
                      onPressed: _clear,
                      child: Text(s.errLogClear),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
