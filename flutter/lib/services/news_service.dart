import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Environment news from The Guardian's environment RSS, read through the
/// free rss2json API (same approach as the web app). Cached for 3 hours.
class NewsItem {
  final String title;
  final String url;
  final DateTime publishedAt;

  NewsItem({required this.title, required this.url, required this.publishedAt});

  Map<String, dynamic> toJson() => {
        'title': title,
        'url': url,
        'publishedAt': publishedAt.toIso8601String(),
      };

  static NewsItem fromJson(Map<String, dynamic> j) => NewsItem(
        title: j['title'] ?? '',
        url: j['url'] ?? '',
        publishedAt:
            DateTime.tryParse(j['publishedAt'] ?? '') ?? DateTime.now(),
      );
}

class NewsService {
  static const _cacheKey = 'eco_news_v1';

  /// Fresh (< 3 h) cache, otherwise live; stale cache when offline.
  static Future<List<NewsItem>> getNews() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = _readCache(prefs);
    if (cached != null &&
        DateTime.now().difference(cached.fetchedAt) <
            const Duration(hours: 3)) {
      return cached.items;
    }
    final fresh = await _fetch();
    if (fresh.isNotEmpty) {
      await prefs.setString(
          _cacheKey,
          jsonEncode({
            'fetchedAt': DateTime.now().toIso8601String(),
            'items': fresh.map((n) => n.toJson()).toList(),
          }));
      return fresh;
    }
    return cached?.items ?? [];
  }

  static ({DateTime fetchedAt, List<NewsItem> items})? _readCache(
      SharedPreferences prefs) {
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      final j = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      final items = (j['items'] as List?)
              ?.whereType<Map>()
              .map((e) => NewsItem.fromJson(Map<String, dynamic>.from(e)))
              .where((n) => n.title.isNotEmpty && n.url.isNotEmpty)
              .toList() ??
          [];
      if (items.isEmpty) return null;
      return (
        fetchedAt: DateTime.tryParse(j['fetchedAt'] ?? '') ?? DateTime.now(),
        items: items,
      );
    } catch (_) {
      return null;
    }
  }

  static Future<List<NewsItem>> _fetch() async {
    try {
      final feedUrl = Uri.encodeComponent(
          'https://www.theguardian.com/uk/environment/rss');
      final uri = Uri.parse(
          'https://api.rss2json.com/v1/api.json?rss_url=$feedUrl');
      final res = await http.get(uri).timeout(const Duration(seconds: 12));
      if (res.statusCode != 200) return [];
      final data = jsonDecode(res.body);
      if (data['status'] != 'ok') return [];
      final items = (data['items'] as List?) ?? [];
      return items
          .whereType<Map>()
          .map((e) => NewsItem(
                title: (e['title'] ?? '').toString(),
                url: (e['link'] ?? '').toString(),
                publishedAt: DateTime.tryParse((e['pubDate'] ?? '').toString()) ??
                    DateTime.now(),
              ))
          .where((n) => n.title.isNotEmpty && n.url.isNotEmpty)
          .take(15)
          .toList();
    } catch (_) {
      return [];
    }
  }
}
