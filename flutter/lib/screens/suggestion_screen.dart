import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/suggestion_service.dart';

/// F13 (on-device): suggestion box. Saved locally; the user shares
/// suggestions manually through any app they choose.
class SuggestionScreen extends StatefulWidget {
  final S s;
  const SuggestionScreen({super.key, required this.s});

  @override
  State<SuggestionScreen> createState() => _SuggestionScreenState();
}

class _SuggestionScreenState extends State<SuggestionScreen> {
  final _ctrl = TextEditingController();
  List<Suggestion>? _items;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final items = await SuggestionService.readAll();
    if (mounted) setState(() => _items = items);
  }

  Future<void> _add() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    await SuggestionService.add(text);
    _ctrl.clear();
    await _load();
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(widget.s.sugSaved)));
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final items = _items;
    return Scaffold(
      appBar: AppBar(title: Text(s.sugTitle)),
      body: items == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Text(s.sugIntro,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted,
                            fontSize: 12,
                            height: 1.6)),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        TextField(
                          controller: _ctrl,
                          maxLines: 3,
                          decoration: InputDecoration(
                            hintText: s.sugHint,
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: _add,
                            icon: const Icon(Icons.add),
                            label: Text(s.sugAdd),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                if (items.isNotEmpty) ...[
                  ...items.map((it) => Card(
                        child: ListTile(
                          title: Text(it.text,
                              style: const TextStyle(fontSize: 13, height: 1.5)),
                          subtitle: Text(
                            it.createdAt.toLocal().toString().split('.').first,
                            style: const TextStyle(
                                color: MoEcoTheme.textMuted, fontSize: 11),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline,
                                color: MoEcoTheme.textMuted, size: 20),
                            onPressed: () async {
                              await SuggestionService.delete(it.id);
                              await _load();
                            },
                          ),
                        ),
                      )),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          Share.share(SuggestionService.formatForShare(items)),
                      icon: const Icon(Icons.share_outlined),
                      label: Text(s.sugShare),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(46),
                        side: const BorderSide(color: MoEcoTheme.primary),
                        foregroundColor: MoEcoTheme.primaryDark,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ],
            ),
    );
  }
}
