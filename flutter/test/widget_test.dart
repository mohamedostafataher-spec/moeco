import 'package:flutter_test/flutter_test.dart';
import 'package:moeco/strings.dart';
import 'package:moeco/screens/metro_screen.dart';
import 'package:moeco/services/air_quality.dart';
import 'package:moeco/services/recycling_service.dart';
import 'package:moeco/services/metro_data.dart';
import 'package:moeco/services/weather_service.dart';
import 'package:moeco/services/services_data.dart';
import 'package:moeco/services/green_spots_service.dart';
import 'package:moeco/services/alert_center_service.dart';
import 'package:moeco/services/error_log_service.dart';
import 'package:moeco/services/meter_ocr_service.dart';
import 'package:moeco/services/bill_compare_service.dart';
import 'package:moeco/services/global_events_service.dart';
import 'package:moeco/services/savings_tips_service.dart';
import 'package:moeco/services/share_card_service.dart';
import 'package:moeco/services/footprint_store.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

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

  test('alert center derives severities across all hazard kinds', () {
    CityAlertInput ci(String city,
            {double maxT = 33,
            double minT = 18,
            double mm = 0,
            double prob = 0,
            double uv = 4,
            double wind = 10,
            int code = 1,
            int aqi = 40,
            double dust = 20}) =>
        CityAlertInput(
            cityAr: city,
            cityEn: city,
            lat: 30,
            lon: 31,
            maxTemp: maxT,
            minTemp: minT,
            precipMm: mm,
            precipProb: prob,
            uvMax: uv,
            windKmh: wind,
            code: code,
            usAqi: aqi,
            dustUgM3: dust);
    // Calm day: no alerts.
    expect(AlertCenterService.deriveAlerts([ci('Cairo')]), isEmpty);
    final alerts = AlertCenterService.deriveAlerts([
      ci('Aswan', maxT: 46),
      ci('Cairo', code: 95),
      ci('Alexandria', code: 63, mm: 30, prob: 80),
      ci('Suez', wind: 75),
      ci('Giza', dust: 400),
      ci('Luxor', uv: 12),
      ci('Tanta', aqi: 180),
      ci('Mansoura', minT: 2),
      ci('Hurghada', maxT: 37, wind: 35),
    ]);
    expect(alerts.any((a) => a.kind == AlertKind.extremeHeat && a.severity == AlertSeverity.severe), isTrue);
    expect(alerts.any((a) => a.kind == AlertKind.storm), isTrue);
    expect(alerts.any((a) => a.kind == AlertKind.heavyRain && a.severity == AlertSeverity.severe), isTrue);
    expect(alerts.any((a) => a.kind == AlertKind.strongWind && a.severity == AlertSeverity.severe), isTrue);
    expect(alerts.any((a) => a.kind == AlertKind.dust && a.severity == AlertSeverity.warning), isTrue);
    expect(alerts.any((a) => a.kind == AlertKind.uv), isTrue);
    expect(alerts.any((a) => a.kind == AlertKind.poorAir && a.severity == AlertSeverity.warning), isTrue);
    expect(alerts.any((a) => a.kind == AlertKind.cold), isTrue);
    // Hurghada: 37C + 35 km/h wind + dry -> fire-weather advisory (no heat alert under 38).
    expect(alerts.any((a) => a.cityEn == 'Hurghada' && a.kind == AlertKind.fireRisk), isTrue);
    expect(alerts.any((a) => a.cityEn == 'Hurghada' && a.kind == AlertKind.heat), isFalse);
    // Sorted severe-first.
    expect(alerts.first.severity, AlertSeverity.severe);
    // Worst-per-city map helper.
    final data = AlertCenterData(alerts, const [], DateTime.now());
    expect(data.worstPerCity()['Aswan'], AlertSeverity.severe);
    expect(data.worstPerCity()['Mansoura'], AlertSeverity.advisory);
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


  test('global events: Egypt-relevance bounding box covers Egypt and neighbors', () {
    // Cairo
    expect(GlobalEventsService.isEgyptRelevantCoords(30.04, 31.24), isTrue);
    // Red Sea (shipping / Suez relevance)
    expect(GlobalEventsService.isEgyptRelevantCoords(26.5, 35.0), isTrue);
    // Gaza border area
    expect(GlobalEventsService.isEgyptRelevantCoords(31.3, 34.3), isTrue);
    // North Sudan border
    expect(GlobalEventsService.isEgyptRelevantCoords(20.0, 30.5), isTrue);
    // Far away: London, Tokyo
    expect(GlobalEventsService.isEgyptRelevantCoords(51.5, -0.12), isFalse);
    expect(GlobalEventsService.isEgyptRelevantCoords(35.7, 139.7), isFalse);
  });

  test('global events: news classifier only passes major events', () {
    expect(GlobalEventsService.classifyNews('غارات جديدة على المنطقة'),
        GlobalEventKind.conflict);
    expect(GlobalEventsService.classifyNews('زلزال يضرب شرق المتوسط'),
        GlobalEventKind.disaster);
    // Ordinary headlines are filtered out: no noise, no alarmism
    expect(GlobalEventsService.classifyNews('مباراة ودية في كرة القدم'), isNull);
    expect(GlobalEventsService.classifyNews('أسعار الذهب اليوم'), isNull);
  });

  test('global events: severity mapping and Egypt bump', () {
    expect(GlobalEventsService.gdacsSeverity('Red'), AlertSeverity.severe);
    expect(GlobalEventsService.gdacsSeverity('Orange'), AlertSeverity.warning);
    expect(GlobalEventsService.gdacsSeverity('Green'), AlertSeverity.advisory);
    expect(GlobalEventsService.quakeSeverity(6.5, false), AlertSeverity.warning);
    expect(GlobalEventsService.quakeSeverity(4.7, false), AlertSeverity.advisory);
    // A moderate quake near Egypt is raised one level
    expect(GlobalEventsService.quakeSeverity(4.7, true), AlertSeverity.watch);
    expect(GlobalEventsService.quakeSeverity(5.5, true), AlertSeverity.warning);
  });


  test('F4: tier table stays in sync with the official slab system', () {
    // Same bill as utilities_screen.dart for boundary + mid values
    expect(SavingsTipsService.estimateBill(0), 0 * 0.68 + 1);
    expect(SavingsTipsService.estimateBill(50), 50 * 0.68 + 1);
    expect(SavingsTipsService.estimateBill(100), 100 * 0.78 + 2);
    expect(SavingsTipsService.estimateBill(200), 200 * 0.95 + 6);
    expect(SavingsTipsService.estimateBill(201), 201 * 1.55 + 11);
    expect(SavingsTipsService.estimateBill(650), 650 * 1.95 + 15);
    expect(SavingsTipsService.estimateBill(1000), 1000 * 2.10 + 25);
    expect(SavingsTipsService.estimateBill(1500), 1500 * 2.58 + 40);
  });

  test('F4: slab-boundary warning fires only near the next tier', () {
    final safe = SavingsTipsService.tierStatus(120);
    expect(safe.nearNextTier, isFalse);
    final near = SavingsTipsService.tierStatus(195);
    expect(near.nearNextTier, isTrue);
    // Crossing 200->201 re-rates the whole bill: the jump is big and positive
    expect(near.crossingJump!, greaterThan(100));
    final top = SavingsTipsService.tierStatus(1500);
    expect(top.kwhToNext, isNull);
    expect(top.nearNextTier, isFalse);
  });

  test('F4: weekly tip rotates weekly and prices at the marginal slab', () {
    final a = SavingsTipsService.weeklyTip(DateTime(2026, 11, 28));
    final b = SavingsTipsService.weeklyTip(DateTime(2026, 11, 30)); // same week
    final c = SavingsTipsService.weeklyTip(DateTime(2026, 12, 7)); // next week
    expect(a.id, b.id);
    expect(a.id, isNot(c.id));
    expect(a.egpSaved(0.95), a.kwhSavedMonthly * 0.95);
  });


  test('F5: share card shows exactly the on-device numbers', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = FootprintStore(prefs);
    // Nothing logged: the card must refuse to render meaningful stats
    final empty = ShareCardService.compute(store);
    expect(empty.hasAnything, isFalse);
    // One logged day + one green trip: card numbers equal the record
    await store.addLog(transport: 'مترو/قطار', electricity: 'قليل', food: 'مشكل');
    await store.addGreenTrip(mode: 'مشي', km: 12.0);
    final stats = ShareCardService.compute(store);
    expect(stats.hasAnything, isTrue);
    expect(stats.totalLoggedDays, 1);
    expect(stats.streakDays, 1);
    expect(stats.greenKm, 12.0);
    expect(stats.co2SavedKg, closeTo(12.0 * GreenTrips.co2PerCarKm, 0.001));
  });


  test('F7: cached global events survive the offline round-trip', () {
    final seeded = GlobalEvent(
      id: 'test1',
      title: 'اختبار',
      kind: GlobalEventKind.disaster,
      source: GlobalEventSource.gdacs,
      severity: AlertSeverity.watch,
      egyptRelevant: true,
      publishedAt: DateTime.utc(2026, 11, 27),
    );
    final raw = jsonEncode([seeded.toJson()]);
    final parsed = GlobalEventsService.tryParseCache(raw);
    expect(parsed, isNotNull);
    expect(parsed!.length, 1);
    expect(parsed.first.id, 'test1');
    expect(parsed.first.egyptRelevant, isTrue);
    // Corrupt cache is reported, never thrown
    expect(GlobalEventsService.tryParseCache('not json'), isNull);
  });

  test('F15: error log entries round-trip and format for sharing', () {
    final e = ErrorLogEntry(DateTime.utc(2026, 11, 28, 12), 'boom', 'line1');
    final back = ErrorLogEntry.fromJson(e.toJson());
    expect(back.message, 'boom');
    expect(back.stackSummary, 'line1');
    final share = ErrorLogService.formatForShare([back]);
    expect(share.contains('boom'), isTrue);
    expect(share.contains('1 entries'), isTrue);
  });

  test('F6: meter OCR parser picks the plausible reading', () {
    expect(MeterOcrService.extractMeterReading('KWH 004521'), 4521);
    expect(MeterOcrService.extractMeterReading('2026-11-28 14:30'), isNull);
    expect(MeterOcrService.extractMeterReading('no digits at all'), isNull);
    // Longest plausible run wins over short noise
    expect(MeterOcrService.extractMeterReading('5 1234567 88'), 1234567);
  });

  test('F11: bill comparison orders months and computes deltas', () {
    final cmp = BillCompareService.compare([
      {'month': '2026-10', 'kwh': 300.0, 'm3': 10.0},
      {'month': '2026-09', 'kwh': 250.0, 'm3': 9.0},
      {'month': '2026-11', 'kwh': 200.0, 'm3': 8.0},
    ]);
    expect(cmp.hasEnoughData, isTrue);
    expect(cmp.months.map((m) => m.month).toList(),
        ['2026-09', '2026-10', '2026-11']);
    expect(cmp.kwhDeltaVsPrev, [null, 50.0, -100.0]);
    expect(cmp.highestMonth.month, '2026-10');
    expect(cmp.lowestMonth.month, '2026-11');
    expect(cmp.averageKwh, closeTo(250.0, 0.001));
    // Slab re-rating: 300 kWh lands in the 1.55 EGP tier (bill = 300*1.55+11)
    expect(cmp.months[1].estimatedBill, closeTo(300 * 1.55 + 11, 0.001));
  });

  test('F11: a single reading is not enough to compare', () {
    final cmp = BillCompareService.compare([
      {'month': '2026-10', 'kwh': 300.0, 'm3': 10.0},
    ]);
    expect(cmp.hasEnoughData, isFalse);
  });
}
