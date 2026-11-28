import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/footprint_store.dart';

class ComplaintsScreen extends StatefulWidget {
  final S s;
  final FootprintStore store;
  final VoidCallback onChanged;
  const ComplaintsScreen({super.key, required this.s, required this.store, required this.onChanged});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  S get s => widget.s;

  String _draftText(Map d) {
    final date = (d['createdAt'] ?? '').toString().split('T').first;
    final notes = (d['notes'] ?? '').toString();
    if (s.ar) {
      return 'شكوى: ${d['title']}\nالتصنيف: ${d['category']}\nالتاريخ: $date'
          + (notes.isEmpty ? '' : '\nالتفاصيل: $notes');
    }
    return 'Complaint: ${d['title']}\nCategory: ${d['category']}\nDate: $date'
        + (notes.isEmpty ? '' : '\nDetails: $notes');
  }

  Future<void> _copy(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(s.compCopied), duration: const Duration(seconds: 2)),
    );
  }

  /// Verified official channels, same source as the web app's civic service.
  static const List<Map<String, String>> _channels = [
    {'nameAr': 'بوابة الشكاوى الحكومية الموحدة', 'nameEn': 'Unified Government Complaints Portal', 'ref': 'shakwa.eg'},
    {'nameAr': 'منظومة الشكاوى الحكومية - مجلس الوزراء', 'nameEn': 'Cabinet complaints system', 'ref': 'Hotline 16528'},
    {'nameAr': 'جهاز حماية المستهلك', 'nameEn': 'Consumer Protection Agency', 'ref': 'Hotline 19588'},
    {'nameAr': 'وزارة البيئة - شكاوى البيئة', 'nameEn': 'Ministry of Environment complaints', 'ref': 'Hotline 19808'},
  ];

  List<String> get _categories => s.ar
      ? ['كهرباء', 'مياه', 'صرف صحي', 'قمامة ونظافة', 'هواء ملوث', 'ضوضاء', 'أخرى']
      : ['Electricity', 'Water', 'Sewage', 'Waste & cleaning', 'Air pollution', 'Noise', 'Other'];

  void _newDraft() {
    final titleCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String category = _categories.first;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: 16, right: 16, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s.compNew, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 14),
              TextField(
                controller: titleCtrl,
                decoration: InputDecoration(
                  labelText: s.compTitleHint,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: category,
                decoration: InputDecoration(
                  labelText: s.compCategory,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (v) => setSheet(() => category = v ?? category),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: s.compNotesHint,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () async {
                  if (titleCtrl.text.trim().isEmpty) return;
                  await widget.store.addDraft(
                    title: titleCtrl.text.trim(),
                    category: category,
                    notes: notesCtrl.text.trim(),
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                  widget.onChanged();
                },
                icon: const Icon(Icons.save_outlined),
                label: Text(s.compSave),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final drafts = widget.store.drafts;
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        MoEcoTheme.hero(
          title: s.compHeroTitle,
          subtitle: s.compHeroSub,
          icon: Icons.assignment_outlined,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.verified_user_outlined, color: Color(0xFFB45309), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        s.compTransparency,
                        style: const TextStyle(fontSize: 12, height: 1.5, color: Color(0xFF92400E)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _newDraft,
                  icon: const Icon(Icons.add),
                  label: Text(s.compNew),
                ),
              ),
              const SizedBox(height: 16),
              if (drafts.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    children: [
                      Icon(Icons.inbox_outlined, size: 44, color: MoEcoTheme.textMuted.withOpacity(0.5)),
                      const SizedBox(height: 10),
                      Text(s.compEmpty, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 4),
                      Text(s.compEmptySub,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: MoEcoTheme.textMuted, fontSize: 12.5)),
                    ],
                  ),
                )
              else
                ...drafts.reversed.map((d) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Card(
                        child: ListTile(
                          title: Text(d['title'] ?? '',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                          subtitle: Text('${d['category'] ?? ''}\n${d['notes'] ?? ''}',
                              style: const TextStyle(fontSize: 12, height: 1.4)),
                          isThreeLine: (d['notes'] ?? '').toString().isNotEmpty,
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                tooltip: s.compCopy,
                                icon: const Icon(Icons.copy_outlined, color: MoEcoTheme.primary),
                                onPressed: () => _copy(_draftText(d)),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                onPressed: () async {
                                  await widget.store.deleteDraft(d['id'] ?? '');
                                  widget.onChanged();
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                    )),
              const SizedBox(height: 10),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(s.compChannels,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              ),
              const SizedBox(height: 8),
              ..._channels.map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Card(
                      child: ListTile(
                        dense: true,
                        leading: const Icon(Icons.account_balance_outlined,
                            color: MoEcoTheme.primary, size: 22),
                        title: Text(s.ar ? c['nameAr']! : c['nameEn']!,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        subtitle: Text(c['ref']!,
                            style: const TextStyle(fontSize: 12, color: MoEcoTheme.textMuted)),
                        trailing: const Icon(Icons.copy_outlined,
                            size: 18, color: MoEcoTheme.textMuted),
                        onTap: () => _copy(c['ref']!),
                      ),
                    ),
                  )),
            ],
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

