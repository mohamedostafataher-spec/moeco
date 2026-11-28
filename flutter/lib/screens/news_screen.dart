import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import '../strings.dart';
import '../services/news_service.dart';

/// Environment news list (The Guardian environment RSS via rss2json).
/// Titles stay in English — the source is English; labeled honestly.
class NewsScreen extends StatefulWidget {
  final S s;
  const NewsScreen({super.key, required this.s});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  List<NewsItem>? _items;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    NewsService.getNews().then((items) {
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    });
  }

  Future<void> _open(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final dateFmt = DateFormat.yMMMd(s.ar ? 'ar' : 'en');
    return Scaffold(
      appBar: AppBar(title: Text(s.newsHeroTitle)),
      body: _loading
          ? Center(child: Text(s.newsLoading))
          : (_items == null || _items!.isEmpty)
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(s.newsUnavailable,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: MoEcoTheme.textMuted)),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(s.newsSourceNote,
                        style: const TextStyle(
                            color: MoEcoTheme.textMuted, fontSize: 11.5)),
                    const SizedBox(height: 10),
                    ..._items!.map((n) => Card(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () => _open(n.url),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(n.title,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 13.5,
                                          height: 1.5)),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          dateFmt.format(n.publishedAt),
                                          style: const TextStyle(
                                              color: MoEcoTheme.textMuted,
                                              fontSize: 11.5),
                                        ),
                                      ),
                                      const Icon(Icons.open_in_new,
                                          size: 15,
                                          color: MoEcoTheme.textMuted),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )),
                  ],
                ),
    );
  }
}
