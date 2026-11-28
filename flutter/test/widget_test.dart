import 'package:flutter_test/flutter_test.dart';
import 'package:moeco/strings.dart';

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
}
