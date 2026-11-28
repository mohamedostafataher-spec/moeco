/// Minimal AR/EN string catalog. Arabic (Egypt) is the default, matching the web app.
class S {
  final bool ar;
  const S(this.ar);

  String get appName => 'MoEco';
  String get appTag => ar ? 'بيئة مصر' : 'Egypt Eco';

  String get navHome => ar ? 'الرئيسية' : 'Home';
  String get navCalc => ar ? 'الحاسبة' : 'Calculator';
  String get navComplaints => ar ? 'شكاواي' : 'Complaints';
  String get navProjects => ar ? 'المشاريع' : 'Projects';
  String get navMore => ar ? 'المزيد' : 'More';

  // Home
  String get homeHeroTitle => ar ? 'بصمتك النهاردة في ٣٠ ثانية' : "Today's footprint in 30 seconds";
  String get homeHeroSub => ar
      ? '٣ خطوات. أرقام تقريبية للتوعية.'
      : '3 taps. Approximate numbers for awareness.';
  String get transportQ => ar ? 'اتحركت إزاي النهاردة؟' : 'How did you get around?';
  String get electricityQ => ar ? 'استهلاك الكهرباء في البيت' : 'Home electricity use';
  String get foodQ => ar ? 'أكلك النهاردة' : 'Your food today';
  String get logDay => ar ? 'احسب وسجّل يومك' : 'Calculate and log my day';
  String streakDays(int n) => ar ? 'سلسلة $n يوم' : '$n-day streak';
  String get savedLocalNote => ar
      ? 'محفوظ على جهازك فقط. القيم تقديرات (متوسطات للفرد).'
      : 'Saved on your device only. Values are estimates (per-person averages).';
  String get loggedToday => ar ? 'سجلت النهاردة' : 'Logged today';

  // Air quality (live, Open-Meteo)
  String get aqTitle => ar ? 'جودة الهواء دلوقتي' : 'Air quality right now';
  String aqSource(String time) => ar
      ? 'مصدر: Open-Meteo، آخر تحديث $time'
      : 'Source: Open-Meteo, updated $time';
  String get aqLoading => ar ? 'بنجيب جودة الهواء...' : 'Fetching air quality...';
  String get aqUnavailable => ar
      ? 'تعذّر تحميل بيانات الهواء دلوقتي. هنحاول تاني تلقائيًا.'
      : 'Could not load air data right now. We will retry automatically.';

  // Air quality alert banner on home (only when a city crosses the band).
  String aqAlertTitle(String city, int aqi) => ar
      ? 'تحذير: الهواء غير صحي في $city ($aqi)'
      : 'Warning: unhealthy air in $city ($aqi)';
  String get aqAlertTip => ar
      ? 'قلّل المجهود برّه النهاردة، بالذات للأطفال وكبار السن.'
      : 'Take it easy outdoors today, especially kids and older adults.';
  String aqAlertSensitiveTitle(String city, int aqi) => ar
      ? 'تنبيه لأصحاب الحساسية: الهواء مش كويس في $city ($aqi)'
      : 'For sensitive groups: air is poor in $city ($aqi)';
  String get aqAlertSensitiveTip => ar
      ? 'لو عندك حساسية صدرية، قلّل الخروج دلوقتي.'
      : 'If you have respiratory sensitivity, limit time outside for now.';
  String aqAlertMore(int n) =>
      ar ? '+$n محافظات تانية بنفس المستوى' : '+$n more governorates at this level';

  // Recycling (Bekia + OpenStreetMap collection points).
  String get recHeroTitle => ar ? 'إعادة التدوير' : 'Recycling';
  String get recHeroSub =>
      ar ? 'بيكيا ونقاط تجميع قريبة منك' : 'Bekia and collection points near you';
  String get recBekiaTitle =>
      ar ? 'بيكيا — حوّل مخلفاتك لفلوس' : 'Bekia: turn waste into money';
  String get recBekiaBody => ar
      ? 'بيكيا بيجمعوا بلاستيك وورق ومعدن وإلكترونيات وزيت طعام من البيت أو من نقاط التسليم، وبياخدوا منك المخلفات بفلوس أو بقالة. خدمة مصرية مستقلة.'
      : 'Bekia collects plastic, paper, metal, electronics and cooking oil from your home or at drop-off points, and pays you in cash or groceries. An independent Egyptian service.';
  String get recBekiaOpen => ar ? 'افتح بيكيا' : 'Open Bekia';
  String get recBekiaNote => ar
      ? 'خدمة خارجية، MoEco مش طرف فيها ولا بيضمنها.'
      : 'An external service; MoEco is not a party to it and does not guarantee it.';
  String get recPointsTitle => ar ? 'نقاط تجميع على الخريطة' : 'Mapped collection points';
  String get recPickCity => ar ? 'اختار المحافظة' : 'Pick your governorate';
  String get recLoading =>
      ar ? 'بندور على نقاط التجميع...' : 'Looking for collection points...';
  String get recEmpty => ar
      ? 'مفيش نقاط متسجلة في المنطقة دي على الخريطة لسه. جرّب محافظة تانية أو بيكيا.'
      : 'No mapped points in this area yet. Try another governorate or Bekia.';
  String get recError => ar
      ? 'تعذّر تحميل النقاط دلوقتي. هنحاول تاني لما تفتح الصفحة.'
      : 'Could not load points right now. We retry when you reopen the page.';
  String get recDirections => ar ? 'الاتجاهات' : 'Directions';
  String get recSource => ar
      ? 'مصدر النقاط: خريطة OpenStreetMap المجتمعية — ممكن تكون ناقصة أو قديمة.'
      : 'Points from the OpenStreetMap community map; may be incomplete or outdated.';

  // Bill prediction (meters screen): project the coming electricity bill
  // from the current meter reading, official 2026 tiers, honest estimate.
  String get metersPredictTitle =>
      ar ? 'توقّع فاتورة الشهر الجاي' : 'Predict the coming bill';
  String get metersPredictSub => ar
      ? 'من قراءة العدّاد دلوقتي، من غير ما تستنى أول الشهر.'
      : 'From the meter reading right now, no waiting for month end.';
  String get metersPredictPrev =>
      ar ? 'قراءة أول الشهر (ك.و.س)' : 'Cycle-start reading (kWh)';
  String get metersPredictNow =>
      ar ? 'القراءة الحالية (ك.و.س)' : 'Current reading (kWh)';
  String get metersPredictDays =>
      ar ? 'الأيام من قراءة أول الشهر' : 'Days since the first reading';
  String get metersPredictBtn => ar ? 'احسب التوقع' : 'Estimate';
  String metersPredictUsage(String kwh) =>
      ar ? 'استهلاك الشهر المتوقع: $kwh كيلوواط ساعة' : 'Projected month usage: $kwh kWh';
  String metersPredictBill(String egp) =>
      ar ? 'الفاتورة المتوقعة: $egp جنيه' : 'Projected bill: $egp EGP';
  String metersPredictCo2(String kg) =>
      ar ? 'انبعاثات متوقعة: $kg كجم CO2' : 'Projected emissions: $kg kg CO2';
  String get metersPredictHigh => ar
      ? 'استهلاكك رايح لفوق — قلّل التكييف والأجهزة الشغالة على الفاضي وممكن توفّر لحد 20%.'
      : 'Usage is trending high - trimming AC and idle devices can save up to 20%.';
  String get metersPredictGood =>
      ar ? 'ماشي كويس — استهلاكك في المعدل الطبيعي.' : 'On track - usage is within the normal range.';
  String get metersPredictNote => ar
      ? 'تقدير من استهلاكك لحد دلوقتي بالتعريفة الرسمية 2026 — مش فاتورة رسمية.'
      : 'An estimate from your usage so far at the official 2026 tariff - not an official bill.';
  String get metersPredictInvalid => ar
      ? 'القراءة الحالية لازم تكون أكبر من قراءة أول الشهر.'
      : 'The current reading must be higher than the cycle-start reading.';

  // Prayer times (live, Aladhan — Egyptian General Authority of Survey)
  String get ptTitle => ar ? 'مواقيت الصلاة — القاهرة' : 'Prayer times — Cairo';
  String get ptLoading => ar ? 'بنجيب مواقيت الصلاة...' : 'Fetching prayer times...';
  String get ptUnavailable => ar
      ? 'مواقيت الصلاة مش متاحة دلوقتي. هنحاول تاني تلقائيًا.'
      : 'Prayer times are unavailable right now. We will retry automatically.';
  String ptSource(String time) => ar
      ? 'مصدر: Aladhan (الهيئة المصرية للمساحة)، آخر تحديث $time'
      : 'Source: Aladhan (Egyptian Survey Authority), updated $time';
  String ptNext(String name) => ar ? 'القادمة: $name' : 'Next: $name';
  // Cairo Metro fares (Ministry of Transport, effective 2026-03-27)
  String get metroHeroTitle => ar ? 'أسعار المترو' : 'Metro Fares';
  String get metroHeroSub => ar
      ? 'تعريفة المترو الرسمية وحاسبة الاشتراك.'
      : 'Official metro tariff plus a subscription calculator.';
  String get metroFaresTitle => ar ? 'سعر التذكرة حسب المحطات' : 'Ticket price by stations';
  String get metroEgp => ar ? 'جنيه' : 'EGP';
  String get metroReducedTitle => ar ? 'تذاكر مخفضة' : 'Reduced tickets';
  String get metroReducedBody => ar
      ? 'كبار السن (فوق ٦٠ سنة): نصف السعر تقريبًا (٥/٦/٨/١٠ جنيه حسب المحطات). ذوو الإعاقة: ٥ جنيه لأي مسافة. فوق ٧٠ سنة: اشتراك مجاني لكل الخطوط.'
      : 'Seniors (60+): roughly half price (5/6/8/10 EGP by stations). People with disabilities: 5 EGP for any distance. Over 70: free subscription for all lines.';
  String get metroSource => ar
      ? 'المصدر: وزارة النقل — التعريفة المطبقة منذ ٢٧ مارس ٢٠٢٦ (ثابتة حتى نوفمبر ٢٠٢٦).'
      : 'Source: Ministry of Transport — tariff effective 27 Mar 2026 (unchanged as of Nov 2026).';
  String get metroCalcTitle => ar ? 'هل الاشتراك أوفر ليك؟' : 'Is a subscription worth it?';
  String get metroYourTicket => ar ? 'تذكرتك العادية' : 'Your usual ticket';
  String get metroRidesLabel => ar ? 'عدد المشاوير في الشهر' : 'Rides per month';
  String get metroSubLabel => ar ? 'الاشتراك الشهري' : 'Monthly subscription';
  String get metroZones => ar ? 'مناطق' : 'zones';
  String metroSinglesCost(String egp) => ar
      ? 'تذاكر مفردة هتكلفك: $egp جنيه في الشهر'
      : 'Single tickets would cost you: $egp EGP per month';
  String metroVerdictSave(String egp) => ar
      ? 'الاشتراك أوفر بحوالي $egp جنيه في الشهر'
      : 'The subscription saves you about $egp EGP per month';
  String metroVerdictNoSave(String egp) => ar
      ? 'التذاكر المفردة أوفر بحوالي $egp جنيه في الشهر'
      : 'Single tickets are cheaper by about $egp EGP per month';
  String get metroCalcNote => ar
      ? 'مقارنة مبسطة: الاشتراكات بتتحسب بالمناطق مش بالمحطات — التقدير تقريبي.'
      : 'Simplified comparison: subscriptions are zone-based, not station-based; this is approximate.';
  String get metroEcoNote => ar
      ? 'المترو كهربا: مشوارك فيه أقل كربون بكتير من العربية — وبيوفرك من الزحمة.'
      : 'The metro is electric: your ride emits far less carbon than a car, and skips the traffic.';

  // Green trips (walk / bike vs car)
  String get tripsHeroTitle => ar ? 'مشاوير خضرا' : 'Green Trips';
  String get tripsHeroSub => ar
      ? 'سجّل مشي وعجلة وشوف وفّرت كام كربون.'
      : 'Log walks and bike rides, see the carbon you avoided.';
  String get tripsAddTitle => ar ? 'سجّل مشوار' : 'Log a trip';
  String get tripsWalk => ar ? 'مشي' : 'Walk';
  String get tripsBike => ar ? 'عجلة' : 'Bike';
  String get tripsKmLabel => ar ? 'المسافة (كم)' : 'Distance (km)';
  String get tripsAdd => ar ? 'سجّل' : 'Log it';
  String get tripsTotalsTitle => ar ? 'إجمالي توفيرك' : 'Your totals';
  String get tripsTotalKm => ar ? 'كم مشي/عجلة' : 'km walked/cycled';
  String get tripsSavedKg => ar ? 'كجم CO₂ اتوفرت' : 'kg CO2 avoided';
  String get tripsFactorNote => ar
      ? 'المقارنة بعربية بنزين: ٠.١٩٢ كجم CO₂ لكل كم (نفس معامل الحاسبة).'
      : 'Compared to a petrol car: 0.192 kg CO2 per km (same factor as the calculator).';
  String get tripsKmUnit => ar ? 'كم' : 'km';
  String get tripsEmpty => ar
      ? 'لسه مفيش مشاوير. أول مشوار مشي أو عجلة هيبان هنا.'
      : 'No trips yet. Your first walk or bike ride will show here.';

  // Eco news (The Guardian environment RSS via rss2json)
  String get newsHeroTitle => ar ? 'أخبار البيئة' : 'Eco News';
  String get newsHeroSub => ar
      ? 'آخر أخبار البيئة من مصدر موثوق (بالإنجليزية).'
      : 'Latest environment news from a trusted source.';
  String get newsLoading => ar ? 'بنجيب الأخبار...' : 'Fetching news...';
  String get newsUnavailable => ar
      ? 'الأخبار مش متاحة دلوقتي. هنحاول تاني تلقائيًا.'
      : 'News is unavailable right now. We will retry automatically.';
  String get newsSourceNote => ar
      ? 'المصدر: The Guardian — قسم البيئة (محتوى إنجليزي، بيتحدث كل ٣ ساعات).'
      : 'Source: The Guardian — environment desk (updates every 3 hours).';

  // Weather (live, Open-Meteo)
  String get wxTitle => ar ? 'طقس القاهرة دلوقتي' : 'Cairo weather right now';
  String get wxLoading => ar ? 'بنجيب الطقس...' : 'Fetching weather...';
  String get wxUnavailable => ar
      ? 'الطقس مش متاح دلوقتي. هنحاول تاني تلقائيًا.'
      : 'Weather is unavailable right now. We will retry automatically.';
  String wxLine(String temp, String cond, String hum, String wind) => ar
      ? '$temp° · $cond · رطوبة $hum٪ · رياح $wind كم/س'
      : '$temp° · $cond · humidity $hum% · wind $wind km/h';
  String wxSource(String time) => ar
      ? 'مصدر: Open-Meteo، آخر تحديث $time'
      : 'Source: Open-Meteo, updated $time';

  // Fuel prices (official, pricing committee 2026-11-28)
  String get fuelHeroTitle => ar ? 'أسعار الوقود' : 'Fuel Prices';
  String get fuelHeroSub => ar
      ? 'الأسعار الرسمية وحاسبة التموين بالكربون.'
      : 'Official prices plus a fill-up carbon calculator.';
  String get fuelPricesTitle => ar ? 'الأسعار الرسمية الحالية' : 'Current official prices';
  String get fuelAsOf => ar
      ? 'بناءً على قرار لجنة التسعير التلقائي، ٢٨ نوفمبر ٢٠٢٦ (تثبيت الأسعار).'
      : 'Per the automatic pricing committee decision, 28 Nov 2026 (prices unchanged).';
  String get fuelSource => ar
      ? 'المصدر: وزارة البترول، منقول عن الصحافة المصرية.'
      : 'Source: Ministry of Petroleum, via Egyptian press.';
  String get fuelCalcTitle => ar ? 'حاسبة التموين' : 'Fill-up calculator';
  String get fuelType => ar ? 'نوع الوقود' : 'Fuel type';
  String get fuelLiters => ar ? 'عدد اللترات' : 'Liters';
  String fuelCostResult(String egp) => ar ? 'التكلفة: $egp جنيه' : 'Cost: $egp EGP';
  String fuelCo2Result(String kg) => ar
      ? 'انبعاثات ≈ $kg كجم CO₂'
      : 'Emissions ≈ $kg kg CO2';
  String get fuelCo2Note => ar
      ? 'معاملات احتراق قياسية (٢.٣١ بنزين / ٢.٦٨ سولار كجم لكل لتر) — تقدير.'
      : 'Standard combustion factors (2.31 gasoline / 2.68 diesel kg per liter), estimate.';
  String get fuelTipsTitle => ar ? 'نصائح توفر وقود' : 'Fuel-saving tips';
  String get fuelTip1 => ar
      ? 'ضغط الكاوتش الصحيح يقلل الاستهلاك حوالي ٣٪.'
      : 'Correct tire pressure cuts consumption by about 3%.';
  String get fuelTip2 => ar
      ? 'السرعة الثابتة ٨٠–٩٠ كم/س أوفر من التسارع والفرملة المتكررة.'
      : 'Steady 80-90 km/h beats repeated acceleration and braking.';
  String get fuelTip3 => ar
      ? 'اطفي الموتور لو هتقف أكتر من دقيقة.'
      : 'Turn the engine off when stopping for more than a minute.';

  // Utility tariffs (official 2026 residential prices)
  String get utilHeroTitle => ar ? 'تعريفة المرافق ٢٠٢٦' : 'Utility Tariffs 2026';
  String get utilHeroSub => ar
      ? 'شرائح الكهرباء والمياه والغاز الرسمية وحاسبة فاتورة الكهرباء.'
      : 'Official electricity, water and gas tiers plus an electricity bill estimator.';
  String get utilCalcTitle => ar ? 'حاسبة فاتورة الكهرباء' : 'Electricity bill estimator';
  String get utilKwhLabel => ar ? 'استهلاك الشهر (كيلووات ساعة)' : 'Monthly consumption (kWh)';
  String utilBillResult(String egp) => ar ? 'فاتورتك التقديرية: $egp جنيه' : 'Estimated bill: $egp EGP';
  String get utilBillNote => ar
      ? 'تقدير حسب الشرائح الرسمية (الشريحة بتتحسب على كل الاستهلاك + رسوم الشريحة) — مش بديل للفاتورة.'
      : 'Estimate per official tiers (one tier rate applies to all kWh plus its fee), not a bill substitute.';
  String get utilElecTitle => ar ? 'شرائح الكهرباء (سكني)' : 'Electricity tiers (residential)';
  String get utilWaterTitle => ar ? 'شرائح المياه (سكني)' : 'Water tiers (residential)';
  String get utilGasTitle => ar ? 'شرائح الغاز المنزلي' : 'Household gas tiers';
  String get utilKwhUnit => ar ? 'ك.و.س' : 'kWh';
  String get utilM3Unit => ar ? 'م³' : 'm3';
  String get utilEgpPerUnit => ar ? 'جنيه' : 'EGP';
  String get utilFeeUnit => ar ? 'جنيه رسوم' : 'EGP fee';
  String get utilSourceTitle => ar ? 'المصدر' : 'Source';
  String get utilSourceBody => ar
      ? 'أسعار ٢٠٢٦ الرسمية: الكهرباء (وزارة الكهرباء)، المياه (وزارة الإسكان)، الغاز (وزارة البترول). الأسعار ممكن تتغير بقرارات رسمية جديدة.'
      : 'Official 2026 prices: electricity (Ministry of Electricity), water (Ministry of Housing), gas (Ministry of Petroleum). Prices may change by new official decisions.';

  String ptName(String key) {
    if (!ar) return key;
    switch (key) {
      case 'Fajr': return 'الفجر';
      case 'Dhuhr': return 'الظهر';
      case 'Asr': return 'العصر';
      case 'Maghrib': return 'المغرب';
      case 'Isha': return 'العشاء';
      default: return key;
    }
  }

  // Weekly chart + bill converter (Home)
  String get weeklyTitle => ar ? 'أسبوعك بالكربون (تقدير)' : 'Your week in carbon (estimate)';
  String get weeklyEmpty => ar
      ? 'سجّل يومك عشان يظهر رسم الأسبوع.'
      : 'Log your day to see the weekly chart.';
  String get billTitle => ar ? 'فاتورة الكهربا = كام كربون؟' : 'Your bill in carbon';
  String get billHint => ar ? 'الكيلووات ساعة من الفاتورة (kWh)' : 'kWh from your bill';
  String get billCalc => ar ? 'احسب' : 'Calculate';
  String billResult(String kg) => ar
      ? '≈ $kg كجم CO₂e في الشهر'
      : '≈ $kg kg CO₂e per month';
  String get billNote => ar
      ? 'معامل ٠.٤٢ كجم لكل كيلووات ساعة (تقدير للشبكة المصرية، مش بديل للفاتورة).'
      : 'Factor 0.42 kg per kWh (Egyptian grid estimate, not a bill substitute).';

  // Calculator
  String get calcHeroTitle => ar ? 'حاسبة البصمة الكربونية' : 'Carbon Footprint Calculator';
  String get calcHeroSub => ar
      ? 'قدّر بصمتك من المرافق اليومية والمواصلات بالكيلوجرام CO₂e.'
      : 'Estimate carbon footprint from your daily utilities and commute in kg CO₂e.';
  String get calcElec => ar ? 'الكهرباء الشهرية (كيلووات ساعة)' : 'Monthly electricity (kWh)';
  String get calcWater => ar ? 'المياه الشهرية (متر مكعب)' : 'Monthly water (m³)';
  String get calcKm => ar ? 'كيلومترات السيارة الشهرية' : 'Monthly car kilometers';
  String get calcButton => ar ? 'احسب دلوقتي' : 'Calculate now';
  String get calcResult => ar ? 'الإجمالي الشهري التقديري' : 'Estimated monthly total';
  String get calcUnit => 'kg CO₂e';
  String get calcDisclaimer => ar
      ? 'التقديرات تستخدم معاملات استرشادية للشبكة المصرية والمياه والنقل ولا تُغني عن الفاتورة الرسمية.'
      : 'Estimates use indicative factors for the Egyptian grid, water and transport, and do not replace the official bill.';

  // Complaints
  String get compHeroTitle => ar ? 'شكاواي، مش بتضيع' : 'My Complaints, Never Lost';
  String get compHeroSub => ar
      ? 'جهّز مسودة الشكوى وملاحظاتك الخاصة، وافتح القناة الرسمية الموثقة وقدّم بنفسك.'
      : 'Prepare your complaint draft and private notes, open the verified official channel, and submit it yourself.';
  String get compNew => ar ? 'جهّز مسودة شكوى جديدة' : 'Prepare a new complaint draft';
  String get compTitleHint => ar ? 'عنوان مختصر للشكوى' : 'Short complaint title';
  String get compCategory => ar ? 'التصنيف' : 'Category';
  String get compNotesHint => ar ? 'ملاحظاتك الخاصة (تُحفظ على جهازك فقط)' : 'Your private notes (saved on your device only)';
  String get compSave => ar ? 'احفظ المسودة' : 'Save draft';
  String get compEmpty => ar ? 'لسه مفيش مسودات' : 'No drafts yet';
  String get compEmptySub => ar
      ? 'أول مسودة هتظهر هنا، محفوظة على جهازك.'
      : 'Your first draft will appear here, saved on your device.';
  String get compTransparency => ar
      ? 'MoEco مابيبعتش أي شكوى لأي جهة حكومية تلقائيًا. بيرتب بياناتك في مسودة خاصة على جهازك وبيرشحلك الروابط الرسمية الموثقة عشان تقدم بنفسك.'
      : 'MoEco never sends complaints to any government body automatically. It organizes your data in a private draft on your device and refers you to verified official links to submit yourself.';
  String get compChannels => ar ? 'قنوات رسمية موثقة' : 'Verified official channels';

  // Projects
  String get projHeroTitle => ar ? 'المشاريع في منطقتي' : 'Projects in My Area';
  String get projHeroSub => ar
      ? 'تابع المشاريع المعلنة رسميًا في منطقتك، كل مشروع باسم جهته ورابطه الأصلي.'
      : 'Follow officially announced projects in your area, each with its authority name and original link.';
  String get projEmpty => ar ? 'لسه مفيش مشاريع في منطقتك' : 'No projects in your area yet';
  String get projEmptySub => ar
      ? 'لما الجهات تنشر مشاريع هتظهر هنا بمصدرها. مابنعرضش أرقام غير موثقة أبدًا.'
      : 'When authorities publish projects they will appear here with their source. We never show unverified figures.';

  // More
  String get moreHeroTitle => ar ? 'أدوات وخدمات أكتر' : 'More Tools & Services';
  String get moreHeroSub => ar ? 'كل أدوات MoEco مرتبة بوضوح.' : 'All MoEco tools organized clearly by purpose.';
  String get moreLanguage => ar ? 'English' : 'العربية';
  String get moreAbout => ar ? 'عن التطبيق' : 'About';
  String get moreAboutBody => ar
      ? 'MoEco تطبيق مصري مجاني للوعي البيئي: بصمة كربونية يومية، تنظيم الشكاوى، ومتابعة المشاريع العامة من مصادرها الرسمية. بياناتك على جهازك أولًا.'
      : 'MoEco is a free Egyptian environmental awareness app: daily carbon footprint, complaint organizing, and local public projects from official sources. Your data stays on your device first.';
  String get morePrivacy => ar ? 'الخصوصية' : 'Privacy';
  String get morePrivacyBody => ar
      ? 'النسخة دي من التطبيق بتحفظ بياناتك على جهازك فقط. مفيش حساب، ومفيش تتبع، ومفيش إعلانات.'
      : 'This version of the app saves your data on your device only. No account, no tracking, no ads.';
  String get moreWeb => ar ? 'نسخة الويب' : 'Web version';
  String get moreWebUrl => 'https://moeco-eg.vercel.app';

  // Meters (home utility tracking)
  String get navMeters => ar ? 'العدادات' : 'Meters';
  String get metersHeroTitle => ar ? 'عدادات بيتك' : 'Your home meters';
  String get metersHeroSub => ar
      ? 'سجّل قراءة الكهربا والمياه كل شهر وشوف الفرق. محفوظة على جهازك فقط.'
      : 'Log electricity and water readings monthly and see the difference. Saved on your device only.';
  String metersAddTitle(String month) => ar ? 'قراءة شهر $month' : 'Reading for $month';
  String get metersOverwrite => ar
      ? 'عندك قراءة للشهر ده، الحفظ هيحدّثها.'
      : 'You have a reading for this month; saving updates it.';
  String get metersKwh => ar ? 'الكهرباء (كيلووات ساعة)' : 'Electricity (kWh)';
  String get metersM3 => ar ? 'المياه (متر مكعب)' : 'Water (m³)';
  String get metersSave => ar ? 'احفظ القراءة' : 'Save reading';
  String get metersNote => ar
      ? 'تقدير الكربون: ٠.٤٢ كجم لكل كيلووات ساعة و٠.٢٩٨ كجم لكل متر مكعب مياه (معاملات استرشادية).'
      : 'Carbon estimate: 0.42 kg per kWh and 0.298 kg per m³ of water (indicative factors).';
  String get metersHistory => ar ? 'القراءات السابقة' : 'Past readings';
  String get metersEmpty => ar ? 'لسه مفيش قراءات' : 'No readings yet';
  String get metersEmptySub => ar
      ? 'أضف أول قراءة من عدادك أو فاتورتك، وهتشوف الفرق شهر بشهر.'
      : 'Add your first reading from your meter or bill, and track month by month.';
  String metersLine(String kwh, String m3, String kg) => ar
      ? '$kwh ك.و.س • $m3 م³ • ≈ $kg كجم CO₂e'
      : '$kwh kWh • $m3 m³ • ≈ $kg kg CO₂e';

  // Achievements
  String get achHeroTitle => ar ? 'إنجازاتك' : 'Your achievements';
  String get achHeroSub => ar
      ? 'بتتحسب من سجلاتك على جهازك بس، من غير ما نبعت حاجة.'
      : 'Computed from your on-device logs only, nothing sent anywhere.';
  String achProgress(int done, int total) => ar
      ? 'فتحت $done من $total إنجاز'
      : '$done of $total achievements unlocked';
  String get achFirstLog => ar ? 'أول يوم مسجل' : 'First day logged';
  String get achStreak3 => ar ? 'سلسلة ٣ أيام' : '3-day streak';
  String get achStreak7 => ar ? 'سلسلة ٧ أيام' : '7-day streak';
  String get achStreak30 => ar ? 'سلسلة ٣٠ يوم' : '30-day streak';
  String get achDays14 => ar ? '١٤ يوم مسجل' : '14 days logged';
  String get achFirstDraft => ar ? 'أول مسودة شكوى' : 'First complaint draft';
  String get achFirstMeter => ar ? 'أول قراءة عداد' : 'First meter reading';
  String get achUnlocked => ar ? 'اتفتح' : 'Unlocked';
  String achCount(int cur, int target) => ar ? '$cur من $target' : '$cur of $target';
  String get achNote => ar
      ? 'الإنجازات تشجيع شخصي بس، مش مسابقة ومش بتتشارك مع حد.'
      : 'Achievements are personal encouragement only, not a competition and never shared.';

  // Climate trends
  String get climateHeroTitle => ar ? 'مناخ مصر عبر السنين' : "Egypt's climate over the years";
  String get climateHeroSub => ar
      ? 'متوسط الحرارة السنوي لمدن مصرية من بيانات حقيقية، بيتحدث تلقائيًا.'
      : 'Yearly mean temperature for Egyptian cities from real data, updated automatically.';
  String climateChange(String sign, String v) => ar
      ? 'الفرق: $sign$v°م بين أول وآخر الفترة'
      : 'Change: $sign$v°C between the first and last half';
  String climateWindow(int first, int last) => ar
      ? 'متوسطات سنوية $first - $last'
      : 'Yearly means $first - $last';
  String get climateUnavailable => ar
      ? 'تعذّر تحميل بيانات المناخ دلوقتي. هنحاول تاني لما تفتح الصفحة.'
      : 'Could not load climate data right now. We will retry when you reopen this page.';
  String get climateSource => ar
      ? 'المصدر: Open-Meteo (إعادة تحليل ERA5). أرقام تقديرية للتوعية، مش بديل عن تقارير الأرصاد الرسمية.'
      : 'Source: Open-Meteo (ERA5 reanalysis). Estimates for awareness, not a substitute for official met reports.';
  // Onboarding (first run)
  String get onbSkip => ar ? 'تخطي' : 'Skip';
  String get onbNext => ar ? 'التالي' : 'Next';
  String get onbStart => ar ? 'ابدأ' : 'Get started';
  String get onbTitle1 => ar ? 'بصمتك اليومية في ٣٠ ثانية' : 'Your daily footprint in 30 seconds';
  String get onbBody1 => ar
      ? 'سجّل مواصلاتك وكهربتك وأكلك كل يوم، وشوف أثرك التقريبي بالأرقام والرسوم. القيم تقديرات للتوعية من مصادر موثقة.'
      : 'Log your transport, electricity and food each day and see your approximate impact in numbers and charts. Values are awareness estimates from verified sources.';
  String get onbTitle2 => ar ? 'شكاويك منظمة، وتتقدم بنفسك' : 'Your complaints, organized and submitted by you';
  String get onbBody2 => ar
      ? 'جهّز مسودة شكواك على جهازك، انسخها جاهزة، وقدّمها بنفسك في القناة الرسمية الموثقة. التطبيق لا يرسل أي شكوى نيابة عنك.'
      : 'Prepare your complaint draft on your device, copy it ready-made, and submit it yourself through the verified official channel. The app never submits complaints for you.';
  String get onbTitle3 => ar ? 'بياناتك على جهازك أولًا' : 'Your data stays on your device first';
  String get onbBody3 => ar
      ? 'سجلاتك ومسوداتك تُحفظ محليًا على هاتفك. لا حساب إجباري، ولا بيانات تخرج من جهازك في هذه النسخة.'
      : 'Your logs and drafts are stored locally on your phone. No mandatory account, and nothing leaves your device in this version.';

  // Complaints: copy helpers
  String get compCopy => ar ? 'نسخ الشكوى' : 'Copy complaint';
  String get compCopied => ar
      ? 'اتنسخت! الصقها في القناة الرسمية المناسبة'
      : 'Copied! Paste it into the right official channel';

  // Complaints: status tracking + suggested channel
  String compStatusLabel(String status) {
    switch (status) {
      case 'sent':
        return ar ? 'أرسلتها بنفسي' : 'Submitted by me';
      case 'replied':
        return ar ? 'وصلني رد' : 'Got a reply';
      default:
        return ar ? 'مسودة على جهازي' : 'Draft on my device';
    }
  }

  String get compMarkSent => ar ? 'سجّل إني قدّمتها' : 'Mark as submitted';
  String get compMarkReplied => ar ? 'سجّل إن رد وصل' : 'Mark reply received';
  String get compBackToDraft => ar ? 'أرجعها مسودة' : 'Move back to draft';
  String get compSuggestedChannel => ar ? 'القناة المقترحة' : 'Suggested channel';
  String get compStatusNote => ar
      ? 'الحالة دي انت اللي بتحدثها بنفسك على جهازك — التطبيق مش بيتابع مع الجهات.'
      : 'You update this status yourself on your device — the app does not follow up with authorities.';

  // Weekly transport comparison (estimates, honest labels)
  String get weeklyCompareTitle => ar ? 'مواصلات الأسبوع بالفلوس' : 'This week\'s transport in money';
  String weeklyDays(int n) => ar ? '$n أيام مسجلة هذا الأسبوع' : '$n days logged this week';
  String weeklyCost(String egp) => ar
      ? 'تكلفة تقديرية لمواصلاتك: $egp جنيه'
      : 'Estimated transport cost: EGP $egp';
  String weeklyVsCar(String egp, String kg) => ar
      ? 'لو كنت ركبت عربية كل يوم: كنت هتدفع ~$egp جنيه أكتر وتطلّع ~$kg كجم CO2 زيادة'
      : 'Had you driven every day: ~EGP $egp more and ~$kg kg more CO2';
  String get weeklyShareBtn => ar ? 'انسخ ملخص الأسبوع' : 'Copy weekly summary';
  String get weeklyCopied => ar ? 'اتنسخ ملخص الأسبوع!' : 'Weekly summary copied!';
  String get weeklyEstimateNote => ar
      ? 'تقديرات تقريبية للتوعية (مترو ~12 ج/رحلة، ميكروباص ~10 ج/رحلة، عربية ~45 ج/يوم وقود).'
      : 'Rough awareness estimates (metro ~EGP 12/ride, microbus ~EGP 10/ride, car ~EGP 45/day fuel).';

  String get version => '0.2.0';
}
