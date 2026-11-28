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
      ? 'جودة الهواء مش متاحة دلوقتي (مفيش نت).'
      : 'Air quality is unavailable right now (offline).';

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
  String get version => '0.1.0';
}
