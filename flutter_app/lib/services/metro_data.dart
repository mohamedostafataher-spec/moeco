/// Cairo Metro lines and stations, from the repo's verified seed
/// (database/SEED_METRO.sql). Offline data; fares follow the official
/// March 2026 tariff bands already used in metro_screen.dart.
class MetroStation {
  final String ar;
  final String en;
  const MetroStation(this.ar, this.en);
}

class MetroLine {
  final String nameAr;
  final String nameEn;
  final List<MetroStation> stations;
  const MetroLine(this.nameAr, this.nameEn, this.stations);
}

const metroLines = <MetroLine>[
  MetroLine('الخط الأول', 'Metro Line 1', [
    MetroStation('حلوان', "Helwan"),
    MetroStation('عين حلوان', "Ain Helwan"),
    MetroStation('جامعة حلوان', "Helwan University"),
    MetroStation('المعادي', "Maadi"),
    MetroStation('زهراء المعادي', "Zahraa El Maadi"),
    MetroStation('دار السلام', "Dar El Salam"),
    MetroStation('مار جرجس', "Mari Gerges"),
    MetroStation('السيدة زينب', "Al-Sayeda Zeinab"),
    MetroStation('السادات (التحرير)', "Sadat (Tahrir)"),
    MetroStation('جمال عبد الناصر', "Nasser"),
    MetroStation('عرابي', "Orabi"),
    MetroStation('الشهداء (رمسيس)', "Al-Shohada (Ramses)"),
    MetroStation('غمرة', "Ghamra"),
    MetroStation('الدمرداش', "El-Demerdash"),
    MetroStation('منشية الصدر', "Manshiet El-Sadr"),
    MetroStation('كوبري القبة', "Kobri El-Qobba"),
    MetroStation('حمامات القبة', "Hammamat El-Qobba"),
    MetroStation('سراي القبة', "Saray El-Qobba"),
    MetroStation('حدائق الزيتون', "Hadayeq El-Zaitoun"),
    MetroStation('المطرية', "Matareya"),
    MetroStation('عين شمس', "Ain Shams"),
    MetroStation('عزبة النخل', "Ezbet El-Nakhl"),
    MetroStation('المرج', "El-Marg"),
    MetroStation('المرج الجديدة', "New El-Marg"),
  ]),
  MetroLine('الخط الثاني', 'Metro Line 2', [
    MetroStation('شبرا الخيمة', "Shobra El-Kheima"),
    MetroStation('كلية الزراعة', "Kolleyyet El-Zeraa"),
    MetroStation('المظلات', "El-Mazallat"),
    MetroStation('الخلفاوي', "Khalafawy"),
    MetroStation('سانت تريزا', "St. Teresa"),
    MetroStation('روض الفرج', "Rod El-Farag"),
    MetroStation('مسرة', "Massara"),
    MetroStation('الشهداء (رمسيس)', "Al-Shohada (Ramses)"),
    MetroStation('العتبة', "Ataba"),
    MetroStation('محمد نجيب', "Mohamed Naguib"),
    MetroStation('السادات (التحرير)', "Sadat (Tahrir)"),
    MetroStation('الأوبرا', "Opera"),
    MetroStation('الدقي', "Dokki"),
    MetroStation('البحوث', "El Bohoth"),
    MetroStation('جامعة القاهرة', "Cairo University"),
    MetroStation('فيصل', "Faisal"),
    MetroStation('الجيزة', "Giza"),
    MetroStation('أم المصريين', "Omm El-Masryeen"),
    MetroStation('ساقية مكي', "Sakiat Mekki"),
    MetroStation('المنيب', "El-Mounib"),
  ]),
  MetroLine('الخط الثالث', 'Metro Line 3', [
    MetroStation('عدلي منصور', "Adly Mansour"),
    MetroStation('الهايكستب', "Hikestep"),
    MetroStation('عمر بن الخطاب', "Omar Ibn El-Khattab"),
    MetroStation('قباء', "Qobba El-Jedda"),
    MetroStation('هشام بركات', "Hesham Barakat"),
    MetroStation('النزهة', "El-Nozha"),
    MetroStation('نادي الشمس', "Nadi El-Shams"),
    MetroStation('ألف مسكن', "Alf Maskan"),
    MetroStation('مصر الجديدة', "Heliopolis"),
    MetroStation('هارون', "Haroun"),
    MetroStation('الأهرام', "Al-Ahram"),
    MetroStation('كلية البنات', "Koleyt El-Banat"),
    MetroStation('الاستاد', "Stadium"),
    MetroStation('أرض المعارض', "Fair Zone"),
    MetroStation('العباسية', "Abbassiya"),
    MetroStation('عبده باشا', "Abdou Pasha"),
    MetroStation('الجيش', "El-Geish"),
    MetroStation('باب الشعرية', "Bab El-Shaaria"),
    MetroStation('العتبة', "Ataba"),
    MetroStation('جمال عبد الناصر', "Nasser"),
    MetroStation('ماسبيرو', "Maspero"),
    MetroStation('صفاء حجازي', "Safaa Hegazy"),
    MetroStation('الكيت كات', "Kit Kat"),
  ]),
  ];

/// Official fare by stops traveled (March 2026 tariff).
double metroFareForStops(int stops) {
  if (stops <= 9) return 10;
  if (stops <= 16) return 12;
  if (stops <= 23) return 15;
  return 20;
}

/// Official reduced (60+) fare by stops traveled.
double metroSeniorFareForStops(int stops) {
  if (stops <= 9) return 5;
  if (stops <= 16) return 6;
  if (stops <= 23) return 8;
  return 10;
}

class MetroTrip {
  final int stops;
  final double fare;
  final double seniorFare;
  final String? transferAr;
  final String? transferEn;
  const MetroTrip(this.stops, this.fare, this.seniorFare,
      this.transferAr, this.transferEn);
}

/// Plans a trip between two stations (identified by line + index).
/// Direct when both are on one line; otherwise transfers at the shared
/// station that gives the fewest total stops. Real network: L1-L2 share
/// Sadat and Al-Shohada, L2-L3 share Ataba, L1-L3 share Nasser.
MetroTrip planMetroTrip(int fromLine, int fromIdx, int toLine, int toIdx) {
  final a = metroLines[fromLine].stations;
  if (fromLine == toLine) {
    final stops = (fromIdx - toIdx).abs();
    return MetroTrip(stops, metroFareForStops(stops),
        metroSeniorFareForStops(stops), null, null);
  }
  final b = metroLines[toLine].stations;
  final namesB = {for (var j = 0; j < b.length; j++) b[j].en: j};
  int bestStops = 1 << 30;
  MetroStation? bestTransfer;
  for (var i = 0; i < a.length; i++) {
    final j = namesB[a[i].en];
    if (j == null) continue;
    final total = (fromIdx - i).abs() + (toIdx - j).abs();
    if (total < bestStops) {
      bestStops = total;
      bestTransfer = a[i];
    }
  }
  return MetroTrip(bestStops, metroFareForStops(bestStops),
      metroSeniorFareForStops(bestStops), bestTransfer?.ar, bestTransfer?.en);
}

