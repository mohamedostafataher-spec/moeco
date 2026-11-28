/// Recycling sorting guide: static, documented household guidance for
/// Egypt. No live data - prices and programs change, so the guide stays
/// descriptive (what goes where and how to prep it) and points to Bekia /
/// local collectors already listed in the recycling screen.
class SortCategory {
  final String id;
  final String nameAr;
  final String nameEn;
  final String examplesAr;
  final String examplesEn;
  final String prepAr;
  final String prepEn;
  const SortCategory(this.id, this.nameAr, this.nameEn, this.examplesAr,
      this.examplesEn, this.prepAr, this.prepEn);
}

const sortingGuide = <SortCategory>[
  SortCategory(
    'plastic',
    'بلاستيك',
    'Plastic',
    'زجاجات مياه ومشروبات، عبوات شامبو، أكياس بلاستيك نضيفة',
    'Water and soda bottles, shampoo bottles, clean plastic bags',
    'اشطف وافضى الهوا من الزجاجة واطبقها. الكيس الوسخ مش بيتعاد تدويره.',
    'Rinse, squeeze the air out and flatten. Dirty bags are not recyclable.',
  ),
  SortCategory(
    'paper',
    'ورق وكرتون',
    'Paper and cardboard',
    'جرايد، كراسات، كراتين، علب كرتون',
    'Newspapers, notebooks, cardboard boxes',
    'فك الكرتونة واطبقها. الورق المتبلل بالزيت (زي علب البيتزا) بيتفصل الجزء النضيف منه بس.',
    'Break boxes down flat. Grease-soaked paper (like pizza boxes) - only the clean parts count.',
  ),
  SortCategory(
    'metal',
    'معدن',
    'Metal',
    'علب صلصة وصودا، برطمانات صفيح، ألومنيوم',
    'Sauce and soda cans, tin cans, aluminum',
    'اشطف العلبة. الألومنيوم أغلى حاجة في السلة، متتسابش في الزبالة.',
    'Rinse the can. Aluminum is the most valuable item in the bin - never trash it.',
  ),
  SortCategory(
    'glass',
    'زجاج',
    'Glass',
    'برطمانات، زجاجات زجاج',
    'Jars, glass bottles',
    'اشطف وشيل الغطا (الغطا معدن، يتفرز لوحده). الزجاج المكسور يتلف كويس في كيس منفصل.',
    'Rinse and remove the lid (metal, sorted separately). Wrap broken glass in a separate bag.',
  ),
  SortCategory(
    'organic',
    'عضوي',
    'Organic',
    'بقايا أكل، قشور خضار وفاكهة، تفل قهوة',
    'Food scraps, vegetable and fruit peels, coffee grounds',
    'لو عندك حديقة أو سطح: الكمبوست بيحوّلها لسماد. وإلا اتفصل عن باقي الزبالة عشان متبوظش القابلة للتدوير.',
    'With a garden or roof: compost turns it into fertilizer. Otherwise keep it separate so it does not spoil the recyclables.',
  ),
  SortCategory(
    'ewaste',
    'إلكترونيات',
    'E-waste',
    'موبايلات قديمة، شواحن، بطاريات، لمبات موفرة',
    'Old phones, chargers, batteries, CFL bulbs',
    'متترميش في الزبالة العادية أبد - فيها مواد خطرة. سلّمها لنقاط تجميع الإلكترونيات أو شركات زي Bekia.',
    'Never in the regular bin - they contain hazardous materials. Hand them to e-waste collection points or companies like Bekia.',
  ),
  SortCategory(
    'oil',
    'زيت طعام مستعمل',
    'Used cooking oil',
    'زيت قلي مستعمل',
    'Used frying oil',
    'اجمعه في زجاجة بلاستيك مقفولة وسلّمه للي بيشتروا الزيت المستعمل (بيتصنع منه صابون وبيو-ديزل). متصبّوش في الحوض.',
    'Collect it in a sealed plastic bottle and sell it to used-oil buyers (it becomes soap and biodiesel). Never pour it down the drain.',
  ),
];
