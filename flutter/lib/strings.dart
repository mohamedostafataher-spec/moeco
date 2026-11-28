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

  // Metro trip planner (offline, official lines + March 2026 fare bands).
  String get metroPlanTitle => ar ? 'خطط رحلتك في المترو' : 'Plan your metro trip';
  String get metroPlanFrom => ar ? 'من محطة' : 'From station';
  String get metroPlanTo => ar ? 'إلى محطة' : 'To station';
  String metroPlanStops(int n) => ar ? '$n محطات' : '$n stops';
  String metroPlanFare(String egp) =>
      ar ? 'التذكرة: $egp جنيه' : 'Fare: $egp EGP';
  String metroPlanSenior(String egp) =>
      ar ? 'كبار السن (60+): $egp جنيه' : 'Seniors (60+): $egp EGP';
  String metroPlanTransfer(String station) =>
      ar ? 'هتبدل في $station' : 'Change at $station';
  String get metroPlanDirect => ar ? 'مباشر من غير تبديل' : 'Direct, no change';
  String get metroPlanSame =>
      ar ? 'اختار محطتين مختلفتين' : 'Pick two different stations';
  String get metroPlanNote => ar
      ? 'عدد المحطات على خطوط المترو الرسمية، والتذكرة بشرايح مارس 2026.'
      : 'Stops counted on the official metro lines; fares per the March 2026 bands.';

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

  // National weather alerts (forecast-derived, honest label)
  String get wxAlertTitle => ar ? 'تنبيهات طقس اليوم' : "Today's weather alerts";
  String wxAlertHeat(String city, String t) =>
      ar ? 'حرارة مرتفعة في $city: تصل $t°' : 'High heat in $city: up to $t°';
  String wxAlertExtreme(String city, String t) =>
      ar ? 'حرارة شديدة في $city: تصل $t°' : 'Extreme heat in $city: up to $t°';
  String wxAlertCold(String city, String t) =>
      ar ? 'برودة في $city: تنخفض إلى $t°' : 'Cold in $city: down to $t°';
  String wxAlertWind(String city, String k) =>
      ar ? 'رياح قوية في $city: $k كم/س' : 'Strong wind in $city: $k km/h';
  String wxAlertRain(String city) =>
      ar ? 'أمطار متوقعة في $city' : 'Rain expected in $city';
  String wxAlertStorm(String city) =>
      ar ? 'عواصف رعدية متوقعة في $city' : 'Thunderstorms expected in $city';
  String wxAlertMore(String n) => ar ? '+$n تنبيهات أخرى' : '+$n more alerts';
  String get wxAlertNote => ar
      ? 'تنبيهات مشتقة من بيانات التوقعات (Open-Meteo) — مش تحذيرات رسمية من هيئة الأرصاد.'
      : 'Alerts derived from Open-Meteo forecast data, not official EMA warnings.';

  // Services & emergency screen
  String get svcHeroTitle => ar ? 'خدمات وطوارئ' : 'Services & Emergency';
  String get svcHeroSub => ar
      ? 'أرقام رسمية وروابط حكومية موثقة ونصائح ترشيد.'
      : 'Official numbers, verified government links, and saving tips.';
  String get svcHotlines => ar ? 'أرقام طوارئ رسمية' : 'Official emergency numbers';
  String get svcHotlinesNote => ar
      ? 'اتصل مباشرة بالرقم الرسمي عند الطوارئ.'
      : 'Call the official number directly in an emergency.';
  String get svcGovTitle => ar ? 'خدمات حكومية رقمية' : 'Digital government services';
  String get svcGovNote => ar
      ? 'روابط خارجية لمواقع حكومية رسمية، تفتح في المتصفح.'
      : 'External links to official government sites, opened in the browser.';
  String get svcWaterTitle => ar ? 'ترشيد المياه' : 'Saving water';
  String get svcEstimator => ar ? 'مُقدّر الترشيد المنزلي' : 'Home savings estimator';
  String get svcMembers => ar ? 'أفراد الأسرة' : 'Household members';
  String get svcFixTap => ar ? 'إصلاح حنفية تقطر' : 'Fix a dripping tap';
  String get svcAerator => ar ? 'تركيب مهوي للحنفيات' : 'Install faucet aerators';
  String get svcShower => ar ? 'تقليل مدة الدش (دقائق)' : 'Shorter showers (minutes)';
  String svcMonthlySave(String liters) =>
      ar ? 'توفير تقديري: $liters لتر/شهر' : 'Estimated saving: $liters liters/month';
  String svcCo2(String kg) => ar ? '≈ $kg كجم CO2e' : '≈ $kg kg CO2e';
  String get svcFormulaNote => ar
      ? 'افتراضات تقديرية: ١٥ لتر/يوم للحنفية، ٢٠ لتر/فرد/يوم للمهوي، ٩ لتر/دقيقة للدش. المعادلة: (اللترات اليومية × ٣٠) ÷ ١٠٠٠ × ٠٫٢٩٨ كجم CO2e/م³ (الشركة القابضة لمياه الشرب). أرقام إرشادية وليست قراءة عداد.'
      : 'Assumptions: 15 L/day per dripping tap, 20 L/person/day with aerators, 9 L/min shower. Formula: (daily liters x 30) / 1000 x 0.298 kg CO2e/m3 (HCWW). Indicative estimates, not a meter reading.';

  // Green spots screen (OpenStreetMap parks / gardens / drinking water)
  String get gsHeroTitle => ar ? 'حدائق ومياه شرب' : 'Parks & Drinking Water';
  String get gsHeroSub => ar
      ? 'حدائق ومنتزهات ونقاط مياه شرب قريبة منك.'
      : 'Parks, gardens, and drinking-water points near you.';
  String get gsTitle => ar ? 'أماكن خضراء على الخريطة' : 'Mapped green spots';
  String get gsPickCity => ar ? 'اختار المحافظة' : 'Pick a governorate';
  String get gsLoading => ar ? 'بنجيب الأماكن...' : 'Fetching places...';
  String get gsError => ar
      ? 'الأماكن مش متاحة دلوقتي. هنحاول تاني تلقائيًا.'
      : 'Places are unavailable right now. We will retry automatically.';
  String get gsEmpty => ar
      ? 'مفيش أماكن مسجلة قريبة في بيانات الخريطة المفتوحة لحد دلوقتي.'
      : 'No nearby places recorded in open map data yet.';
  String get gsPark => ar ? 'حديقة عامة' : 'Park';
  String get gsGarden => ar ? 'جَنينة' : 'Garden';
  String get gsWater => ar ? 'مياه شرب' : 'Drinking water';
  String get gsKm => ar ? 'كم' : 'km';
  String get gsDirections => ar ? 'الاتجاهات' : 'Directions';
  String get gsSource => ar
      ? 'المصدر: بيانات خريطة OpenStreetMap المفتوحة (مجتمعية)، تُحدَّث كل ٦ ساعات.'
      : 'Source: OpenStreetMap open community data, refreshed every 6 hours.';

  // National alert center (comprehensive, forecast-derived)
  String get alHeroTitle => ar ? 'مركز الإنذار القومي' : 'National Alert Center';
  String get alHeroSub => ar
      ? 'حرارة، غبار، جودة هواء، أمطار، رياح، أشعة — كل المحافظات في مكان واحد.'
      : 'Heat, dust, air quality, rain, wind, UV - every governorate in one place.';
  String get alLoading => ar ? 'بنجمع الإنذارات من كل المحافظات...' : 'Gathering alerts from all governorates...';
  String get alError => ar
      ? 'الإنذارات مش متاحة دلوقتي. هنحاول تاني تلقائيًا.'
      : 'Alerts are unavailable right now. We will retry automatically.';
  String get alAllClear => ar ? 'مفيش إنذارات نشطة النهاردة' : 'No active alerts today';
  String alActiveCount(String n) => ar ? '$n إنذار نشط على مستوى الجمهورية' : '$n active alerts nationwide';
  String alUpdated(String t) => ar ? 'آخر تحديث $t' : 'Updated $t';
  String get alAll => ar ? 'كل المحافظات' : 'All';
  String get alNoneHere => ar ? 'مفيش إنذارات هنا — الوضع مطمئن' : 'No alerts here - all clear';
  String get alDerivedTag => ar ? 'مشتق من التوقعات' : 'forecast-derived';
  String get alMapCredit => ar ? 'الخريطة: OpenStreetMap' : 'Map: OpenStreetMap';
  String get alSevAdvisory => ar ? 'تنبيه' : 'Advisory';
  String get alSevWatch => ar ? 'مراقبة' : 'Watch';
  String get alSevWarning => ar ? 'تحذير' : 'Warning';
  String get alSevSevere => ar ? 'شديد' : 'Severe';
  String alExtremeHeat(String c, String t) => ar ? 'موجة حر شديدة في $c: $t°' : 'Severe heat wave in $c: $t°';
  String alHeat(String c, String t) => ar ? 'حرارة مرتفعة في $c: $t°' : 'High heat in $c: $t°';
  String alCold(String c, String t) => ar ? 'برودة في $c: تنخفض إلى $t°' : 'Cold in $c: down to $t°';
  String alStorm(String c) => ar ? 'عواصف رعدية متوقعة في $c' : 'Thunderstorms expected in $c';
  String alHeavyRain(String c, String mm) => ar ? 'أمطار غزيرة في $c: $mm مم متوقعة — خذ بالك من السيول' : 'Heavy rain in $c: $mm mm expected - flood caution';
  String alWind(String c, String k) => ar ? 'رياح قوية في $c: $k كم/س' : 'Strong wind in $c: $k km/h';
  String alDust(String c, String v) => ar ? 'غبار كثيف في $c (تركيز $v ميكروجرام/م³)' : 'Heavy dust in $c ($v ug/m3)';
  String alUv(String c, String v) => ar ? 'أشعة فوق بنفسجية مرتفعة في $c (مؤشر $v)' : 'High UV in $c (index $v)';
  String alPoorAir(String c, String v) => ar ? 'جودة هواء سيئة في $c (مؤشر $v)' : 'Poor air quality in $c (AQI $v)';
  String alFireRisk(String c) => ar ? 'مؤشر خطر حرائق في $c (حرارة + رياح + جفاف)' : 'Fire-weather risk in $c (heat + wind + dry)';
  // National & global events (wars, disasters, major world events)
  String get geSectionTitle => ar ? 'أحداث وطنية وعالمية' : 'National & Global Events';
  String get geSectionSub => ar
      ? 'حروب وكوارث وأحداث كبرى مرتبطة بمصر أو مؤثرة عالميًا — كل بند بمصدره ووقته.'
      : 'Wars, disasters and major events tied to Egypt or the world - each with its source and time.';
  String get geAll => ar ? 'الكل' : 'All';
  String get geEgyptOnly => ar ? 'مرتبطة بمصر' : 'Egypt-related';
  String get geGlobal => ar ? 'عالمية' : 'Global';
  String get geNone => ar ? 'مفيش أحداث كبرى من المصادر المتاحة دلوقتي' : 'No major events from available sources right now';
  String get geLoading => ar ? 'بنجمع الأحداث من المصادر العالمية...' : 'Gathering events from global sources...';
  String get geFeedTag => ar ? 'تغذية بيانات' : 'data feed';
  String get geNewsTag => ar ? 'من الأخبار' : 'news-derived';
  String get geKindEarthquake => ar ? 'زلزال' : 'Earthquake';
  String get geKindDisaster => ar ? 'كارثة طبيعية' : 'Disaster';
  String get geKindConflict => ar ? 'صراع / حرب' : 'Conflict / war';
  String get geKindMajor => ar ? 'حدث كبير' : 'Major event';
  String get geSourceGdacs => 'GDACS';
  String get geSourceUsgs => 'USGS';
  String get geSourceEonet => 'NASA EONET';
  String get geSourceBbc => ar ? 'بي بي سي عربي' : 'BBC Arabic';
  String geMinutesAgo(String m) => ar ? 'منذ $m دقيقة' : '$m min ago';
  String geHoursAgo(String h) => ar ? 'منذ $h ساعة' : '$h h ago';
  String geDaysAgo(String d) => ar ? 'منذ $d يوم' : '$d d ago';
  String get geFootnote => ar
      ? 'المصادر: GDACS (مرصد الكوارث العالمي التابع للأمم المتحدة والاتحاد الأوروبي)، USGS للزلازل، NASA EONET للأحداث الطبيعية، وبي بي سي عربي للأخبار الكبرى. بنود "تغذية بيانات" من أنظمة رصد آلية، وبنود "من الأخبار" عناوين منقولة كما هي بمصدرها. لا يوجد مصدر رسمي مصري مجاني مقروء آليًا لهذه الأحداث، ولا نضيف أي محتوى من عندنا.'
      : 'Sources: GDACS (UN/EU global disaster observatory), USGS earthquakes, NASA EONET natural events, and BBC Arabic for major news. "Data feed" items come from monitoring systems; "news-derived" items are headlines shown as-is with their source. No free machine-readable official Egyptian feed exists for these events, and we add nothing ourselves.';
  String get alFootnote => ar
      ? 'كل البنود مشتقة من بيانات توقعات Open-Meteo (الطقس + CAMS لجودة الهواء والغبار) وليست تحذيرات رسمية من هيئة الأرصاد — لا تتوفر قناة رسمية مجانية مقروءة آليًا حتى الآن. عتبات الإنذار: حرارة ٣٨/٤٢/٤٥°، غبار ١٥٠/٣٠٠/٦٠٠، جودة هواء ١٠٠/١٥٠/٢٠٠، أشعة ٨/١١.'
      : 'All items are derived from Open-Meteo forecast data (weather + CAMS air/dust), not official EMA warnings - no machine-readable free official feed exists yet. Thresholds: heat 38/42/45C, dust 150/300/600, AQI 100/150/200, UV 8/11.';

  // F6: meter OCR (on-device, suggestion only, manual confirm)
  String get ocrScanButton => ar ? 'صوّر العدّاد' : 'Scan the meter';
  String get ocrScanning => ar ? 'بنقرا الرقم من الصورة...' : 'Reading the number from the photo...';
  String get ocrConfirmHint => ar
      ? 'قرأنا الرقم ده من الصورة — راجعه كويس قبل الحفظ (القراءة الآلية ممكن تغلط)'
      : 'We read this number from the photo - review it carefully before saving (OCR can be wrong)';
  String get ocrFailed => ar
      ? 'مش قادرين نقرا رقم واضح من الصورة — اكتبه يدويًا لو سمحت'
      : 'Could not read a clear number from the photo - please enter it manually';

  String get errLogTitle => ar ? 'سجل الأعطال' : 'Error log';
  String get errLogSub => ar
      ? 'أي عطل بيتسجل على موبايلك بس، وتقدر تشاركه بنفسك'
      : 'Errors are stored on your device only, and you share them yourself';
  String get errLogEmpty => ar
      ? 'مفيش أعطال متسجلة. لو حصلت مشكلة في التطبيق هتلاقيها هنا، وتقدر تشاركها معانا لو حابب.'
      : 'No errors recorded. If the app hits a problem it will show up here, and you can share it with us if you like.';
  String get errLogShare => ar ? 'شارك السجل' : 'Share log';
  String get errLogClear => ar ? 'امسح' : 'Clear';
  String get errLogCleared => ar ? 'اتمسح السجل' : 'Log cleared';

  String get bcTitle => ar ? 'قارن فواتيرك' : 'Compare your bills';
  String get bcSub => ar
      ? 'شوف استهلاكك بيزيد ولا بيقل شهر ورا شهر'
      : 'See whether your usage goes up or down month by month';
  String get bcEmpty => ar
      ? 'سجّل قراءة العدّاد لشهرين على الأقل من صفحة العدّادات، وهنا هتشوف المقارنة بينهم.'
      : 'Log at least two monthly meter readings from the meters page, and the comparison will show up here.';
  String get bcEstimateNote => ar
      ? 'الفواتير هنا تقديرية على أسعار ٢٠٢٦ الرسمية، مش قيمة الفاتورة اللي بتيجيلك بالظبط.'
      : 'Bills here are estimates on the official 2026 tariff, not your exact invoice amount.';
  String bcMore(int kwh) => ar ? '+$kwh ك.و.س' : '+$kwh kWh';
  String bcLess(int kwh) => ar ? '-$kwh ك.و.س' : '-$kwh kWh';
  String bcRow(int kwh, int egp) =>
      ar ? '$kwh ك.و.س - حوالي $egp جنيه' : '$kwh kWh - about EGP $egp';
  String bcSummary(int avg, String lowMonth, String highMonth) => ar
      ? 'متوسط استهلاكك: $avg ك.و.س في الشهر. أقل شهر: $lowMonth - أعلى شهر: $highMonth.'
      : 'Your average usage: $avg kWh/month. Lowest month: $lowMonth - highest: $highMonth.';

  // F7: offline mode (local-first, last-sync honesty)
  String get offBanner => ar
      ? 'أنت غير متصل — المعروض آخر بيانات محفوظة على جهازك'
      : 'You are offline - showing the last data saved on your device';
  String offLastSync(String t) => ar ? 'آخر مزامنة: $t' : 'Last sync: $t';

  // F5: shareable achievement card (real on-device numbers only)
  String get shCardTitle => ar ? 'إنجازي مع MoEco' : 'My MoEco achievement';
  String get shStreak => ar ? 'أيام متتالية' : 'day streak';
  String get shDays => ar ? 'يوم مسجل' : 'days logged';
  String get shGreenKm => ar ? 'كم مواصلات نظيفة' : 'green km';
  String get shCo2 => ar ? 'كجم كربون موفّر' : 'kg CO2 saved';
  String get shCardFooter => ar
      ? 'أرقام حقيقية من سجلي على التطبيق (محفوظة على جهازي فقط).'
      : 'Real numbers from my app log (stored on my device only).';
  String get shShareButton => ar ? 'مشاركة الصورة' : 'Share image';
  String get shCancel => ar ? 'إلغاء' : 'Cancel';
  String get shShareText => ar ? 'إنجازي في تطبيق MoEco 🌿' : 'My MoEco app achievement';
  String get shNothingYet => ar ? 'سجّل يومك الأول أو رحلة نظيفة الأول وبعدين شارك إنجازك' : 'Log your first day or green trip before sharing';
  String get shShareCard => ar ? 'شارك إنجازك' : 'Share your achievement';

  // F4: tier-nearing alert + savings tips (estimates, EGP)
  String svTierNow(String price) => ar ? 'شريحتك الحالية: $price جنيه لكل ك.و.س' : 'Your current slab: $price EGP/kWh';
  String svTierFar(String n) => ar ? 'باقي $n ك.و.س للشريحة التالية — أنت في المنطقة الآمنة' : '$n kWh to the next slab - you are in the safe zone';
  String svTierNear(String n, String jump) => ar
      ? 'تنبيه: باقي $n ك.و.س بس للشريحة الأعلى! لو عدّيتها، كل الكيلوواطات هتتحاسب بسعر أغلى (~$jump جنيه زيادة على الفاتورة).'
      : 'Warning: only $n kWh left before the higher slab! Crossing it re-rates ALL kWh at the higher price (~$jump EGP extra).';
  String get svTierTop => ar ? 'أنت على أعلى شريحة — أي توفير يرجعك لشريحة أرخص' : 'You are on the top slab - any saving drops you to a cheaper one';
  String get svTipTitle => ar ? 'نصيحة الأسبوع للتوفير' : 'Savings tip of the week';
  String svTipSave(String egp) => ar ? 'توفير تقديري: ~$egp جنيه في الشهر' : 'Estimated saving: ~$egp EGP/month';
  String get svTipNote => ar ? 'تقديرات تقريبية لمتوسط بيت مصري — التوفير الفعلي يختلف حسب الاستخدام' : 'Rough estimates for an average Egyptian home - actual savings vary with usage';

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
