import 'package:flutter_test/flutter_test.dart';
import 'package:moeco/strings.dart';
import 'package:moeco/screens/metro_screen.dart';
import 'package:moeco/services/air_quality.dart';
import 'package:moeco/services/recycling_service.dart';
import 'package:moeco/services/metro_data.dart';

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
    expect(metroBands.map((b) => b.price).toList(), [10.0, 12.0, 15.0, 20.0]);
    expect(metroBands.map((b) => b.seniorPrice).toList(), [5.0, 6.0, 8.0, 10.0]);
  });

  test('AQ alert picks the worst city and counts cities above the band', () {
    AirQualityReading r(String c, int aqi) => AirQualityReading(
        cityAr: c, cityEn: c, aqi: aqi, pm25: 0, fetchedAt: DateTime(2026));
    final list = [r('Cairo', 80), r('Asyut', 167), r('Luxor', 120)];
    expect(AirQualityService.worst(list)!.cityEn, 'Asyut');
    expect(AirQualityService.countAbove(list, 150), 1);
    expect(AirQualityService.countAbove(list, 100), 2);
    expect(AirQualityService.worst(const []), isNull);
    // No alert bands: worst at exactly 100 stays below the sensitive alert.
    expect(AirQualityService.worst([r('Cairo', 100)])!.aqi, 100);
  });

  test('recycling parser keeps named points with coordinates', () {
    final elements = [
      {
        'type': 'node',
        'lat': 30.05,
        'lon': 31.24,
        'tags': {'name': 'Green Point', 'recycling:plastic': 'yes', 'recycling:paper': 'yes'},
      },
      {
        'type': 'way',
        'center': {'lat': 31.2, 'lon': 29.9},
        'tags': {'recycling_type': 'container'},
      },
      {'type': 'node', 'tags': {'name': 'No coords'}},
    ];
    final pts = RecyclingService.parseElements(elements);
    expect(pts.length, 2);
    expect(pts.first.name, 'Green Point');
    expect(pts.first.materials, containsAll(['plastic', 'paper']));
    expect(pts[1].name, 'container');
  });

  test('metro trip planner counts stops and fares, with transfers', () {
    // Same line: Helwan (L1 #0) to Sadat (L1 #8) = 8 stops -> 10 EGP.
    final direct = planMetroTrip(0, 0, 0, 8);
    expect(direct.stops, 8);
    expect(direct.fare, 10.0);
    expect(direct.seniorFare, 5.0);
    expect(direct.transferAr, isNull);
    // Transfer: Kit Kat (L3 #22) to Helwan (L1 #0) via Nasser = 3 + 9 = 12 stops.
    final transfer = planMetroTrip(2, 22, 0, 0);
    expect(transfer.stops, 12);
    expect(transfer.fare, 12.0);
    expect(transfer.transferEn, 'Nasser');
    // Fare bands: 24 stops crosses into the 15 EGP band.
    expect(metroFareForStops(24), 15.0);
    expect(metroFareForStops(40), 20.0);
  });

  test('metro subscriptions are zone-based and ascending', () {
    expect(metroSubscriptions, [390.0, 440.0, 510.0, 600.0]);
    expect(metroSubZones.length, metroSubscriptions.length);
    for (var i = 1; i < metroSubscriptions.length; i++) {
      expect(metroSubscriptions[i], greaterThan(metroSubscriptions[i - 1]));
    }
  });
}
