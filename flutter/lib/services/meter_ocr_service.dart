/// F6: on-device OCR for the electricity meter.
///
/// google_mlkit_text_recognition runs fully on-device (free, no key, no
/// network). The result is ALWAYS only a suggestion: the UI pre-fills the
/// reading field and the user confirms before saving (mandatory manual
/// confirmation, per spec). Nothing is auto-saved.
///
/// Only the pure parser is unit-tested; the recognizer itself needs a
/// device camera.
library;

class MeterOcrService {
  /// Pick the most plausible meter reading from raw OCR text.
  ///
  /// Heuristic: meter displays show one long number (4-7 digits, optional
  /// decimal tail). We collect every digit run, drop runs that look like
  /// dates or times (contain ':' or '/'-separated short groups nearby),
  /// and prefer the longest run in the 3-7 digit range. Returns null when
  /// nothing plausible exists - the UI then asks for manual entry.
  static double? extractMeterReading(String rawText) {
    final cleaned = rawText.replaceAll(',', '.');
    final runs = RegExp(r'\d+(?:\.\d+)?').allMatches(cleaned);
    String? best;
    for (final m in runs) {
      final token = m.group(0)!;
      // Skip tokens that are part of a date or time (adjacent : or /).
      final before = m.start > 0 ? cleaned[m.start - 1] : '';
      final after = m.end < cleaned.length ? cleaned[m.end] : '';
      if (before == ':' || after == ':' || before == '/' || after == '/') {
        continue;
      }
      final intPart = token.split('.').first;
      if (intPart.length < 3 || intPart.length > 7) continue;
      if (best == null || intPart.length > best.split('.').first.length) {
        best = token;
      }
    }
    if (best == null) return null;
    return double.tryParse(best);
  }
}
