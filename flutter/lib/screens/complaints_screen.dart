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
    final ch = _suggestedChannel(d);
    final chLine = s.ar ? 'الجهة: ${ch['nameAr']} (${ch['ref']})' : 'To: ${ch['nameEn']} (${ch['ref']})';
    if (s.ar) {
      return '$chLine\nشكوى: ${d['title']}\nالتصنيف: ${d['category']}\nالتاريخ: $date'
          + (notes.isEmpty ? '' : '\nالتفاصيل: $notes');
    }
    return '$chLine\nComplaint: ${d['title']}\nCategory: ${d['category']}\nDate: $date'
        + (notes.isEmpty ? '' : '\nDetails: $notes');
  }

  Future<void> _copy(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(s.compCopied), duration: const Duration(seconds: 2)),
    );
  }

  /// Category -> most relevant verified channel (indices into _channels).
  static const Map<int, int> _categoryChannel = {
    0: 1, // electricity -> Cabinet complaints hotline 16528
    1: 1, // water -> 16528
    2: 1, // sewage -> 16528
    3: 3, // waste -> Ministry of Environment 19808
    4: 3, // air pollution -> 19808
    5: 3, // noise -> 19808
    6: 0, // other -> Unified portal
  };

  Map<String, String> _suggestedChannel(Map d) {
    final idx = _categories.indexOf((d['category'] ?? '').toString());
    return _channels[_categoryChannel[idx] ?? 0];
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

  Widget _statusChip(String status) {
    final (bg, fg) = switch (status) {
      'sent' => (const Color(0xFFEFF6FF), const Color(0xFF1D4ED8)),
      'replied' => (const Color(0xFFECFDF5), const Color(0xFF047857)),
      _ => (const Color(0xFFF1F5F9), const Color(0xFF475569)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(s.compStatusLabel(status),
          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: fg)),
    );
  }

  Widget _channelHint(Map<String, String> ch) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.account_balance_outlined, size: 16, color: MoEcoTheme.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${s.compSuggestedChannel}: ${s.ar ? ch['nameAr'] : ch['nameEn']} — ${ch['ref']}',
              style: const TextStyle(fontSize: 11.5, height: 1.4, color: Color(0xFF166534)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusActions(Map d) {
    final status = (d['status'] ?? 'draft').toString();
    final id = (d['id'] ?? '').toString();
    Future<void> set(String next) async {
      await widget.store.updateDraftStatus(id, next);
      widget.onChanged();
    }

    Widget action(String label, IconData icon, String next, bool filled) {
      return filled
          ? ElevatedButton.icon(
              onPressed: () => set(next),
              icon: Icon(icon, size: 15),
              label: Text(label, style: const TextStyle(fontSize: 11.5)),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(0, 34),
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
            )
          : TextButton.icon(
              onPressed: () => set(next),
              icon: Icon(icon, size: 15, color: MoEcoTheme.textMuted),
              label: Text(label,
                  style: const TextStyle(fontSize: 11.5, color: MoEcoTheme.textMuted)),
            );
    }

    return Wrap(
      spacing: 8,
      runSpacing: 4,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (status == 'draft') action(s.compMarkSent, Icons.send_outlined, 'sent', true),
        if (status == 'sent') action(s.compMarkReplied, Icons.mark_email_read_outlined, 'replied', true),
        if (status != 'draft') action(s.compBackToDraft, Icons.undo, 'draft', false),
        Tooltip(
          message: s.compStatusNote,
          triggerMode: TooltipTriggerMode.tap,
          child: const Icon(Icons.info_outline, size: 16, color: MoEcoTheme.textMuted),
        ),
      ],
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
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(d['title'] ?? '',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w700, fontSize: 14)),
                                  ),
                                  _statusChip((d['status'] ?? 'draft').toString()),
                                  IconButton(
                                    tooltip: s.compCopy,
                                    icon: const Icon(Icons.copy_outlined,
                                        color: MoEcoTheme.primary),
                                    onPressed: () => _copy(_draftText(d)),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline,
                                        color: Colors.redAccent),
                                    onPressed: () async {
                                      await widget.store.deleteDraft(d['id'] ?? '');
                                      widget.onChanged();
                                    },
                                  ),
                                ],
                              ),
                              if ((d['category'] ?? '').toString().isNotEmpty ||
                                  (d['notes'] ?? '').toString().isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Text(
                                    '${d['category'] ?? ''}\n${d['notes'] ?? ''}'.trim(),
                                    style: const TextStyle(
                                        fontSize: 12, height: 1.4,
                                        color: MoEcoTheme.textMuted),
                                  ),
                                ),
                              _channelHint(_suggestedChannel(d)),
                              const SizedBox(height: 8),
                              _statusActions(d),
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

