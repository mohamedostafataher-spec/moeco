import 'dart:convert';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:xml/xml.dart';
import 'alert_center_service.dart' show AlertSeverity;

/// National & global major events: wars and conflicts, earthquakes,
/// disasters, and strong world events that may affect Egypt.
///
/// Sources are all free and key-less:
///  - GDACS RSS (UN/EU disaster coordination)          -> feed-derived
///  - USGS earthquake feed (M4.5+, past day)            -> feed-derived
///  - NASA EONET open natural events                   -> feed-derived
///  - BBC Arabic RSS, keyword-filtered                 -> news-derived
///
/// ReliefWeb needs a registered appname and GDELT rate-limits datacenter
/// IPs, so both were evaluated and excluded. Every item carries its source
/// and publish time; the UI labels feed-derived vs news-derived. Nothing
/// is invented: a source that fails simply contributes no items.
enum GlobalEventKind { earthquake, disaster, conflict, majorEvent }

enum GlobalEventSource { gdacs, usgs, eonet, bbcArabic }

class GlobalEvent {
  final String id;
  final String title;
  final GlobalEventKind kind;
  final GlobalEventSource source;
  final AlertSeverity severity;
  final bool egyptRelevant;
  final DateTime publishedAt;
  final String? link;
  final double? lat;
  final double? lon;

  const GlobalEvent({
    required this.id,
    required this.title,
    required this.kind,
    required this.source,
    required this.severity,
    required this.egyptRelevant,
    required this.publishedAt,
    this.link,
    this.lat,
    this.lon,
  });

  bool get isNews => source == GlobalEventSource.bbcArabic;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'kind': kind.name,
        'source': source.name,
        'severity': severity.name,
        'egyptRelevant': egyptRelevant,
        'publishedAt': publishedAt.toIso8601String(),
        'link': link,
        'lat': lat,
        'lon': lon,
      };

  static GlobalEvent fromJson(Map<String, dynamic> j) => GlobalEvent(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        kind: GlobalEventKind.values.firstWhere((k) => k.name == j['kind'],
            orElse: () => GlobalEventKind.majorEvent),
        source: GlobalEventSource.values.firstWhere(
            (s) => s.name == j['source'],
            orElse: () => GlobalEventSource.bbcArabic),
        severity: AlertSeverity.values.firstWhere((s) => s.name == j['severity'],
            orElse: () => AlertSeverity.advisory),
        egyptRelevant: j['egyptRelevant'] == true,
        publishedAt:
            DateTime.tryParse(j['publishedAt'] ?? '') ?? DateTime.now(),
        link: j['link'],
        lat: (j['lat'] as num?)?.toDouble(),
        lon: (j['lon'] as num?)?.toDouble(),
      );
}

class GlobalEventsService {
  static const _cacheKey = 'moeco_global_events_cache_v1';
  static const _cacheTimeKey = 'moeco_global_events_cache_time_v1';
  static const _cacheTtl = Duration(minutes: 30);

  /// Egypt + its immediate neighborhood: Egypt itself, north Sudan,
  /// eastern Libya, the Red Sea, Gaza/Israel/Jordan, the East Mediterranean.
  static bool isEgyptRelevantCoords(double lat, double lon) =>
      lat >= 19.0 && lat <= 34.5 && lon >= 22.0 && lon <= 40.5;

  /// Arabic keywords that tie a news item to Egypt's direct interests.
  static const _egyptTerms = [
    'مصر',
    'المصري',
    'القاهرة',
    'السويس',
    'البحر الأحمر',
    'سيناء',
    'غزة',
    'رفح',
    'السودان',
    'ليبيا',
    'قناة',
    'النيل',
    'سد النهضة',
    'إثيوبيا',
    'شرق المتوسط',
    'الشرق الأوسط',
  ];

  /// Conflict / war keywords. Presence of one of these marks a news item
  /// as a conflict event (it is still only shown with its source + time).
  static const _conflictTerms = [
    'حرب',
    'حروب',
    'غارة',
    'غارات',
    'هجوم',
    'هجمات',
    'صراع',
    'قتال',
    'اشتباكات',
    'قصف',
    'صواريخ',
    'صاروخ',
    'إطلاق نار',
    'وقف إطلاق النار',
    'توغل',
  ];

  static const _disasterTerms = [
    'زلزال',
    'زلازل',
    'فيضان',
    'فيضانات',
    'إعصار',
    'أعاصير',
    'كارثة',
    'انهيار',
    'بركان',
    'حريق هائل',
    'حرائق',
  ];

  static bool textMentionsEgypt(String text) =>
      _egyptTerms.any(text.contains);
  static bool textMentionsConflict(String text) =>
      _conflictTerms.any(text.contains);
  static bool textMentionsDisaster(String text) =>
      _disasterTerms.any(text.contains);

  static AlertSeverity _bump(AlertSeverity s) {
    switch (s) {
      case AlertSeverity.advisory:
        return AlertSeverity.watch;
      case AlertSeverity.watch:
        return AlertSeverity.warning;
      case AlertSeverity.warning:
      case AlertSeverity.severe:
        return AlertSeverity.severe;
    }
  }

  /// Public for tests: classify a USGS magnitude + location into severity.
  static AlertSeverity quakeSeverity(double mag, bool egyptRelevant) {
    var s = mag >= 6.0
        ? AlertSeverity.warning
        : (mag >= 5.0 ? AlertSeverity.watch : AlertSeverity.advisory);
    return egyptRelevant ? _bump(s) : s;
  }

  /// Public for tests: classify GDACS alert level text.
  static AlertSeverity gdacsSeverity(String level) {
    switch (level.trim().toLowerCase()) {
      case 'red':
        return AlertSeverity.severe;
      case 'orange':
        return AlertSeverity.warning;
      default:
        return AlertSeverity.advisory;
    }
  }

  /// Public for tests: classify a filtered BBC Arabic headline.
  /// Returns null when the headline is not a major event worth showing.
  static GlobalEventKind? classifyNews(String title) {
    if (textMentionsConflict(title)) return GlobalEventKind.conflict;
    if (textMentionsDisaster(title)) return GlobalEventKind.disaster;
    return null;
  }

  static Future<List<GlobalEvent>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedAt =
        DateTime.fromMillisecondsSinceEpoch(prefs.getInt(_cacheTimeKey) ?? 0);
    final cachedRaw = prefs.getString(_cacheKey);
    if (cachedRaw != null &&
        DateTime.now().difference(cachedAt) < _cacheTtl) {
      try {
        final list = jsonDecode(cachedRaw) as List;
        return list
            .map((e) => GlobalEvent.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      } catch (_) {
        // fall through to network
      }
    }

    final results = await Future.wait([
      _fetchGdacs(),
      _fetchUsgs(),
      _fetchEonet(),
      _fetchBbcArabic(),
    ]);
    final all = results.expand((e) => e).toList()
      ..sort((a, b) => b.publishedAt.compareTo(a.publishedAt));

    if (all.isNotEmpty) {
      await prefs.setString(
          _cacheKey, jsonEncode(all.map((e) => e.toJson()).toList()));
      await prefs.setInt(_cacheTimeKey, DateTime.now().millisecondsSinceEpoch);
      return all;
    }

    // Offline (or every source failed): serve the stale cache instead of
    // an empty list, so the screen keeps its last real data (F7).
    if (cachedRaw != null) {
      try {
        final list = jsonDecode(cachedRaw) as List;
        return list
            .map((e) => GlobalEvent.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      } catch (_) {}
    }
    return [];
  }

  static Future<List<GlobalEvent>> _fetchGdacs() async {
    try {
      final res = await http
          .get(Uri.parse('https://www.gdacs.org/xml/rss.xml'))
          .timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) return [];
      final doc = XmlDocument.parse(utf8.decode(res.bodyBytes));
      final out = <GlobalEvent>[];
      for (final item in doc.findAllElements('item').take(30)) {
        final title = item.getElement('title')?.innerText.trim() ?? '';
        final link = item.getElement('link')?.innerText.trim();
        final pubRaw = item.getElement('pubDate')?.innerText.trim() ?? '';
        final eventType =
            item.getElement('gdacs:eventtype')?.innerText.trim() ?? '';
        final level =
            item.getElement('gdacs:alertlevel')?.innerText.trim() ?? '';
        final lat =
            double.tryParse(item.getElement('geo:lat')?.innerText.trim() ?? '');
        final lon = double.tryParse(
            item.getElement('geo:long')?.innerText.trim() ?? '');
        if (title.isEmpty) continue;
        final relevant = lat != null && lon != null
            ? isEgyptRelevantCoords(lat, lon)
            : textMentionsEgypt(title);
        out.add(GlobalEvent(
          id: 'gdacs_${title.hashCode}',
          title: title,
          kind: eventType.toUpperCase() == 'EQ'
              ? GlobalEventKind.earthquake
              : GlobalEventKind.disaster,
          source: GlobalEventSource.gdacs,
          severity: relevant ? _bump(gdacsSeverity(level)) : gdacsSeverity(level),
          egyptRelevant: relevant,
          publishedAt: _parseRfc822(pubRaw),
          link: link,
          lat: lat,
          lon: lon,
        ));
      }
      return out;
    } catch (_) {
      return [];
    }
  }

  static Future<List<GlobalEvent>> _fetchUsgs() async {
    try {
      final res = await http
          .get(Uri.parse(
              'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'))
          .timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) return [];
      final j = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final features = (j['features'] as List?) ?? [];
      final out = <GlobalEvent>[];
      for (final f in features) {
        final props =
            Map<String, dynamic>.from((f as Map)['properties'] as Map? ?? {});
        final coords =
            ((f as Map)['geometry'] as Map?)?['coordinates'] as List? ?? [];
        final mag = (props['mag'] as num?)?.toDouble() ?? 0;
        final place = props['place']?.toString() ?? '';
        final lon = coords.isNotEmpty ? (coords[0] as num).toDouble() : null;
        final lat = coords.length > 1 ? (coords[1] as num).toDouble() : null;
        final relevant = lat != null && lon != null
            ? isEgyptRelevantCoords(lat, lon)
            : textMentionsEgypt(place);
        out.add(GlobalEvent(
          id: 'usgs_${props['id'] ?? place.hashCode}',
          title: 'M${mag.toStringAsFixed(1)} - $place',
          kind: GlobalEventKind.earthquake,
          source: GlobalEventSource.usgs,
          severity: quakeSeverity(mag, relevant),
          egyptRelevant: relevant,
          publishedAt: DateTime.fromMillisecondsSinceEpoch(
              (props['time'] as num?)?.toInt() ?? 0),
          link: props['url']?.toString(),
          lat: lat,
          lon: lon,
        ));
      }
      return out;
    } catch (_) {
      return [];
    }
  }

  static Future<List<GlobalEvent>> _fetchEonet() async {
    try {
      final res = await http
          .get(Uri.parse(
              'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50'))
          .timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) return [];
      final j = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final events = (j['events'] as List?) ?? [];
      final out = <GlobalEvent>[];
      for (final e in events) {
        final m = e as Map<String, dynamic>;
        final title = m['title']?.toString() ?? '';
        if (title.isEmpty) continue;
        final cats = (m['categories'] as List?) ?? [];
        final catTitle = cats.isNotEmpty
            ? (cats.first as Map)['title']?.toString() ?? ''
            : '';
        final geoms = (m['geometry'] as List?) ?? [];
        double? lat, lon;
        DateTime when = DateTime.now();
        if (geoms.isNotEmpty) {
          final g = geoms.last as Map;
          final coords = g['coordinates'] as List? ?? [];
          if (coords.length >= 2) {
            lon = (coords[0] as num).toDouble();
            lat = (coords[1] as num).toDouble();
          }
          when = DateTime.tryParse(g['date']?.toString() ?? '') ?? when;
        }
        final relevant = lat != null && lon != null
            ? isEgyptRelevantCoords(lat, lon)
            : textMentionsEgypt(title);
        final cat = catTitle.toLowerCase();
        final sev = (cat.contains('volcano') || cat.contains('severe storm'))
            ? AlertSeverity.watch
            : AlertSeverity.advisory;
        out.add(GlobalEvent(
          id: 'eonet_${m['id'] ?? title.hashCode}',
          title: '$title ($catTitle)',
          kind: cat.contains('earthquake')
              ? GlobalEventKind.earthquake
              : GlobalEventKind.disaster,
          source: GlobalEventSource.eonet,
          severity: relevant ? _bump(sev) : sev,
          egyptRelevant: relevant,
          publishedAt: when,
          link: m['link']?.toString(),
          lat: lat,
          lon: lon,
        ));
      }
      return out;
    } catch (_) {
      return [];
    }
  }

  static Future<List<GlobalEvent>> _fetchBbcArabic() async {
    try {
      final res = await http
          .get(Uri.parse('https://feeds.bbci.co.uk/arabic/rss.xml'))
          .timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) return [];
      final doc = XmlDocument.parse(utf8.decode(res.bodyBytes));
      final out = <GlobalEvent>[];
      for (final item in doc.findAllElements('item').take(40)) {
        final title = item.getElement('title')?.innerText.trim() ?? '';
        final link = item.getElement('link')?.innerText.trim();
        final pubRaw = item.getElement('pubDate')?.innerText.trim() ?? '';
        if (title.isEmpty) continue;
        final kind = classifyNews(title);
        if (kind == null) continue; // not a major event: skip, no noise
        final relevant = textMentionsEgypt(title);
        final sev = kind == GlobalEventKind.conflict
            ? (relevant ? AlertSeverity.warning : AlertSeverity.watch)
            : (relevant ? AlertSeverity.watch : AlertSeverity.advisory);
        out.add(GlobalEvent(
          id: 'bbc_${title.hashCode}',
          title: title,
          kind: kind,
          source: GlobalEventSource.bbcArabic,
          severity: sev,
          egyptRelevant: relevant,
          publishedAt: _parseRfc822(pubRaw),
          link: link,
        ));
        if (out.length >= 10) break; // cap news items: signal, not a feed dump
      }
      return out;
    } catch (_) {
      return [];
    }
  }

  /// RFC-822 dates ("Sat, 28 Nov 2026 13:55:00 GMT") used by both RSS feeds.
  static DateTime _parseRfc822(String raw) {
    final months = {
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
    };
    final m = RegExp(
            r'(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?')
        .firstMatch(raw);
    if (m == null) return DateTime.now();
    final mon = months[m.group(2)!.toLowerCase()] ?? 1;
    return DateTime.utc(
      int.parse(m.group(3)!),
      mon,
      int.parse(m.group(1)!),
      int.parse(m.group(4)!),
      int.parse(m.group(5)!),
      int.parse(m.group(6) ?? '0'),
    );
  }

  /// Haversine distance in km (kept for future map/detail use).
  static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = (lat2 - lat1) * math.pi / 180;
    final dLon = (lon2 - lon1) * math.pi / 180;
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * math.pi / 180) *
            math.cos(lat2 * math.pi / 180) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }
}
