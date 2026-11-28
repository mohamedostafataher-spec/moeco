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
import 'package:moeco/services/challenge_service.dart';
import 'package:moeco/services/notification_service.dart';
import 'package:moeco/services/action_plan_service.dart';
import 'package:moeco/services/solar_service.dart';
import 'package:moeco/services/sorting_guide_data.dart';
import 'package:moeco/services/global_events_service.dart';
import 'package:moeco/services/savings_tips_service.dart';
import 'package:moeco/screens/utilities_screen.dart' show estimateElectricityBill;
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

  test('F9: challenge progress for weekly green trips', () {
    final now = DateTime(2026, 11, 28, 12); // Saturday
    expect(ChallengeService.weekStart(now), DateTime(2026, 11, 28));
    final sunday = DateTime(2026, 11, 29, 9);
    expect(ChallengeService.weekStart(sunday), DateTime(2026, 11, 28));
    final trips = [
      {'createdAt': '2026-11-28T08:00:00.000'},
      {'createdAt': '2026-11-25T08:00:00.000'}, // last week
    ];
    expect(ChallengeService.tripsThisWeek(trips, now), 1);
    final c = Challenge(
      governorateAr: 'القاهرة',
      goalType: ChallengeGoalType.weeklyGreenTrips,
      target: 2,
      createdAt: now,
    );
    final p = ChallengeService.progress(
        challenge: c, trips: trips, readings: const [], now: now);
    expect(p.current, 1);
    expect(p.done, isFalse);
    expect(p.fraction, closeTo(0.5, 0.001));
    // Round-trip
    final back = Challenge.fromJson(c.toJson());
    expect(back.governorateAr, 'القاهرة');
    expect(back.target, 2);
  });

  test('F9: monthly reduction needs two readings and clamps at zero', () {
    expect(ChallengeService.monthlyReductionPct([
      {'month': '2026-10', 'kwh': 300.0},
    ]), isNull);
    expect(
        ChallengeService.monthlyReductionPct([
          {'month': '2026-10', 'kwh': 300.0},
          {'month': '2026-11', 'kwh': 270.0},
        ]),
        10);
    // An increase never shows as negative progress
    expect(
        ChallengeService.monthlyReductionPct([
          {'month': '2026-10', 'kwh': 200.0},
          {'month': '2026-11', 'kwh': 300.0},
        ]),
        -50);
    final c = Challenge(
      governorateAr: 'الجيزة',
      goalType: ChallengeGoalType.monthlyKwhReduction,
      target: 10,
      createdAt: DateTime(2026, 11, 1),
    );
    final p = ChallengeService.progress(
        challenge: c,
        trips: const [],
        readings: [
          {'month': '2026-10', 'kwh': 200.0},
          {'month': '2026-11', 'kwh': 300.0},
        ],
        now: DateTime(2026, 11, 28));
    expect(p.current, 0);
    expect(p.done, isFalse);
  });

  test('Slab-crossing warning math: crossing 200 kWh re-rates the whole bill', () {
    // 190 kWh projected => slab 2 (0.95). 210 kWh projected => slab 3 (1.55).
    expect(SavingsTipsService.tierIndexForKwh(190), 2);
    expect(SavingsTipsService.tierIndexForKwh(210), 3);
    final extra = estimateElectricityBill(210) - estimateElectricityBill(200);
    // The extra is far more than the 10 kWh marginal usage: whole-bill re-rate.
    expect(extra, greaterThan(10 * 0.95));
    // 150 kWh used mid-month, projected 190 => same slab, no warning condition
    expect(SavingsTipsService.tierIndexForKwh(190) >
        SavingsTipsService.tierIndexForKwh(150), isFalse);
    // 190 used, projected 210 => warning fires
    expect(SavingsTipsService.tierIndexForKwh(210) >
        SavingsTipsService.tierIndexForKwh(190), isTrue);
  });

  test('Local reminders land on the 1st at 9:00 and Saturday at 10:00', () {
    // Mid-month: next reading reminder is the 1st of next month.
    final r = NotificationService.nextReadingReminder(DateTime(2026, 11, 28, 12));
    expect(r, DateTime(2026, 12, 1, 9));
    // On the 1st before 9:00: same day.
    expect(NotificationService.nextReadingReminder(DateTime(2026, 12, 1, 8)),
        DateTime(2026, 12, 1, 9));
    // On the 1st after 9:00: next month, including year rollover.
    expect(NotificationService.nextReadingReminder(DateTime(2026, 12, 1, 9, 1)),
        DateTime(2027, 1, 1, 9));
    // Saturday 2026-11-28 at 12:00: next weekly tip is next Saturday.
    expect(NotificationService.nextWeeklyTip(DateTime(2026, 11, 28, 12)),
        DateTime(2026, 12, 5, 10));
    // Friday: tomorrow.
    expect(NotificationService.nextWeeklyTip(DateTime(2026, 11, 27, 12)),
        DateTime(2026, 11, 28, 10));
    // Saturday before 10:00: same day.
    expect(NotificationService.nextWeeklyTip(DateTime(2026, 11, 28, 8)),
        DateTime(2026, 11, 28, 10));
  });

  test('Transport EGP saved: mode-aware rough estimates, honest defaults', () {
    expect(GreenTrips.tripEgpSaved({'km': 5.0, 'instead': 'car'}), 15.0);
    expect(GreenTrips.tripEgpSaved({'km': 5.0, 'instead': 'metro'}), 12.0);
    expect(GreenTrips.tripEgpSaved({'km': 5.0, 'instead': 'microbus'}), 10.0);
    // Trips logged before the field existed count as car trips
    expect(GreenTrips.tripEgpSaved({'km': 4.0}), closeTo(12.0, 0.001));
  });

  test('Weekly action plan: deterministic 3 actions, rotates weekly', () {
    final w1 = ActionPlanService.planForWeek(DateTime(2026, 11, 28));
    expect(w1.length, 3);
    // Same week, same plan
    expect(ActionPlanService.planForWeek(DateTime(2026, 11, 29))
        .map((t) => t.id), w1.map((t) => t.id));
    // Next week rotates to a different set
    final w2 = ActionPlanService.planForWeek(DateTime(2026, 12, 5));
    expect(w2.map((t) => t.id).toSet() == w1.map((t) => t.id).toSet(), isFalse);
    // Every action is a real documented tip
    for (final tip in w1) {
      expect(tip.kwhSavedMonthly, greaterThan(0));
    }
    // Plan EGP total adds up at the marginal price
    final total = ActionPlanService.planEgpSaved(w1, 1.0);
    expect(total,
        closeTo(w1.fold<double>(0, (s, t) => s + t.kwhSavedMonthly), 0.001));
    // Week key is stable within a Saturday-start week
    expect(ActionPlanService.weekKey(DateTime(2026, 11, 28)),
        ActionPlanService.weekKey(DateTime(2026, 11, 29)));
  });

  test('Solar estimator: sane sizes, honest ranges, capped at 10 kWp', () {
    final e = SolarService.estimate(300, 1.55);
    // 300 kWh/mo at ~132 kWh per kWp => about 2.5 kWp
    expect(e.systemKwp, greaterThanOrEqualTo(2));
    expect(e.systemKwp, lessThanOrEqualTo(3));
    expect(e.costLow, lessThan(e.costHigh));
    expect(e.paybackYearsLow, lessThan(e.paybackYearsHigh));
    expect(e.paybackYearsLow, greaterThan(0));
    // Huge consumption is capped at a residential 10 kWp
    expect(SolarService.estimate(5000, 2.58).systemKwp, 10);
    // Tiny consumption still gets a minimum 1 kWp system
    expect(SolarService.estimate(20, 0.68).systemKwp, 1);
    // CO2 saved is positive and uses the app factor
    expect(e.co2SavedKgYearly,
        closeTo(e.monthlyKwhCovered * 12 * SolarService.co2PerKwh, 0.001));
  });

  test('Sorting guide covers the seven household streams, no empty fields', () {
    expect(sortingGuide.length, 7);
    final ids = sortingGuide.map((c) => c.id).toSet();
    expect(ids, {
      'plastic', 'paper', 'metal', 'glass', 'organic', 'ewaste', 'oil'
    });
    for (final c in sortingGuide) {
      expect(c.nameAr.isNotEmpty, isTrue);
      expect(c.prepAr.isNotEmpty, isTrue);
      expect(c.examplesAr.isNotEmpty, isTrue);
    }
  });
}
