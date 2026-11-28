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
  String get version => '0.2.0';
}
