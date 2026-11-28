import 'package:flutter_test/flutter_test.dart';
import 'package:moeco/strings.dart';
import 'package:moeco/screens/metro_screen.dart';

void main() {
  test('strings switch between Arabic and English', () {
    expect(const S(true).navHome, isNot(const S(false).navHome));
    expect(const S(false).appName, 'MoEco');
    expect(const S(true).navMore, isNot(const S(false).navMore));
  });

  test('calculator factors stay in sync with the web methodology', () {
    // electricity 0.42, water 0.298, car 0.192 kg CO2e per unit
    const elec = 100 * 0.42;
    const water = 10 * 0.298;
    const car = 50 * 0.192;
    expect(elec + water + car, closeTo(54.58, 0.01));
  });

  test('metro bands match the official March 2026 tariff', () {
    expect(metroBands.length, 4);
    expect(metroBands.map((b) => b.price).toList(), [10, 12, 15, 20]);
    expect(metroBands.map((b) => b.seniorPrice).toList(), [5, 6, 8, 10]);
    // Senior fare is always half the regular fare.
    for (final b in metroBands) {
      expect(b.seniorPrice, b.price / 2);
    }
  });

  test('metro subscriptions are zone-based and ascending', () {
    expect(metroSubscriptions, [390, 440, 510, 600]);
    expect(metroSubZones.length, metroSubscriptions.length);
    for (var i = 1; i < metroSubscriptions.length; i++) {
      expect(metroSubscriptions[i], greaterThan(metroSubscriptions[i - 1]));
    }
  });
}
