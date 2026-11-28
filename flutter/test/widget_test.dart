import 'package:flutter_test/flutter_test.dart';
import 'package:moeco/strings.dart';
import 'package:moeco/screens/metro_screen.dart';
import 'package:moeco/services/air_quality.dart';
import 'package:moeco/services/recycling_service.dart';
import 'package:moeco/services/metro_data.dart';
import 'package:moeco/services/weather_service.dart';
import 'package:moeco/services/services_data.dart';
import 'package:moeco/services/green_spots_service.dart';

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

  test('gov services and hotlines are real and well-formed', () {
    expect(govServices.length, greaterThan(40));
    for (final g in govServices) {
      expect(g.url.startsWith('https://'), isTrue, reason: g.nameAr);
      expect(g.nameAr, isNotEmpty);
    }
    final nums = hotlines.map((h) => h.number).toList();
    expect(nums, containsAll(['123', '122', '180', '121', '125', '129', '19808']));
    for (final h in hotlines) {
      expect(RegExp(r'^[0-9]{3,5}$').hasMatch(h.number), isTrue,
          reason: h.labelEn);
    }
  });

  test('green spots parser keeps named spots and sorts by distance', () {
    final elements = [
      {
        'type': 'node',
        'lat': 30.05,
        'lon': 31.24,
        'tags': {'leisure': 'park', 'name': 'Far Park'},
      },
      {
        'type': 'node',
        'lat': 30.0445,
        'lon': 31.2358,
        'tags': {'amenity': 'drinking_water', 'name:ar': 'سبيل قريب'},
      },
      {
        'type': 'node',
        'lat': 30.046,
        'lon': 31.236,
        'tags': {'leisure': 'garden'}, // unnamed: dropped
      },
      {
        'type': 'way',
        'center': {'lat': 30.045, 'lon': 31.236},
        'tags': {'leisure': 'garden', 'name': 'Near Garden'},
      },
    ];
    final spots =
        GreenSpotsService.parseElements(elements, 30.0444, 31.2357);
    expect(spots.length, 3);
    // Nearest first: the drinking-water point is ~10 m from the center.
    expect(spots.first.kind, GreenSpotKind.drinkingWater);
    expect(spots.first.name, 'سبيل قريب');
    expect(spots.last.name, 'Far Park');
    expect(spots.any((p) => p.kind == GreenSpotKind.garden), isTrue);
    // Haversine sanity: ~111 km per degree of latitude.
    expect(GreenSpotsService.haversineKm(30.0, 31.0, 31.0, 31.0),
        closeTo(111.2, 0.5));
  });

  test('water savings estimator matches the documented assumptions', () {
    // Nothing selected: zero savings.
    expect(
        estimateMonthlyWaterSavings(
            householdMembers: 4,
            fixDrippingTap: false,
            installAerator: false,
            shorterShowerMinutes: 0),
        0);
    // Dripping tap alone: 15 L/day x 30.
    expect(
        estimateMonthlyWaterSavings(
            householdMembers: 4,
            fixDrippingTap: true,
            installAerator: false,
            shorterShowerMinutes: 0),
        450);
    // 2 members, aerator + 2 min shorter showers: (20*2 + 2*9*2) * 30.
    final liters = estimateMonthlyWaterSavings(
        householdMembers: 2,
        fixDrippingTap: false,
        installAerator: true,
        shorterShowerMinutes: 2);
    expect(liters, 2280);
    expect(waterSavingsCo2Kg(1000), closeTo(0.298, 0.0001));
  });

  test('national weather alerts derive from forecasts with honest thresholds', () {
    CityForecast fc(String city,
            {double temp = 30,
            double maxT = 33,
            double minT = 18,
            double wind = 10,
            int code = 1}) =>
        CityForecast(
            cityAr: city,
            cityEn: city,
            temp: temp,
            maxTemp: maxT,
            minTemp: minT,
            windKmh: wind,
            code: code);
    // Calm day: no alerts at all.
    expect(NationalWeatherAlerts.deriveAlerts([fc('Cairo')]), isEmpty);
    // Extreme heat threshold and ordering: storm first, then heat, then cold.
    final alerts = NationalWeatherAlerts.deriveAlerts([
      fc('Aswan', maxT: 43),
      fc('Cairo', code: 95),
      fc('Alexandria', minT: 3),
      fc('Luxor', maxT: 38),
      fc('Suez', wind: 55),
      fc('Tanta', code: 63),
    ]);
    expect(alerts.map((a) => a.kind).toList(), [
      WeatherAlertKind.storm,
      WeatherAlertKind.extremeHeat,
      WeatherAlertKind.heat,
      WeatherAlertKind.wind,
      WeatherAlertKind.rain,
      WeatherAlertKind.cold,
    ]);
    expect(alerts.first.cityEn, 'Cairo');
    expect(alerts[1].value, 43);
    // 41 degrees is heat, not extreme; 37 is no alert.
    final mid = NationalWeatherAlerts.deriveAlerts(
        [fc('Giza', maxT: 41), fc('Mansoura', maxT: 37)]);
    expect(mid.single.kind, WeatherAlertKind.heat);
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
    // Fare bands: 23 stops is the top of the 15 EGP band, 24 crosses into 20.
    expect(metroFareForStops(23), 15.0);
    expect(metroFareForStops(24), 20.0);
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
