# دليل ربط MoEco بمشروع Supabase الخاص بك

هذا الدليل يشرح للمالك الخطوات العملية لربط تطبيق **MoEco** بمشروع **Supabase** الخاص به بأمان، مع دعم الاستخدام دون حساب تقليدي عبر المصادقة المجهولة (Anonymous Sign-Ins)، وحماية البيانات عبر سياسات RLS، وعرض إحصاءات الاستخدام المجمّعة للمالك فقط.

---

## 1. تفعيل المصادقة المجهولة (Anonymous Sign-Ins) في لوحة Supabase

1. افتح لوحة تحكم مشروعك في [Supabase Dashboard](https://supabase.com/dashboard).
2. من القائمة الجانبية انتقل إلى **Authentication** ← **Providers** (أو **Sign In / Providers**).
3. ابحث عن خيار **Anonymous Sign-Ins** وفعّله (**Enable**).
4. يُنصح بتفعيل حماية **CAPTCHA** (مثل Turnstile أو hCaptcha) في **Authentication** ← **Bot and Abuse Protection** عند النشر العام لتجنب إنشاء جلسات مجهولة عشوائية بكميات كبيرة.

> **تنبيه مهم:** صفحة التطبيق في MoEco لا تستدعي `signInAnonymously()` تلقائيًا عند فتح الموقع، بل تستدعيه فقط بعد قراءة المستخدم لإشعار الخصوصية والضغط على زر الموافقة الصريحة.

---

## 2. تشغيل ملف الترحيل (SQL Migration)

1. افتح **SQL Editor** داخل لوحة Supabase.
2. انسخ كامل محتوى الملف:
   `supabase/migrations/20261121000000_moeco_core_rls_and_analytics.sql`
3. شغّل الاستعلام (**Run**). يقوم هذا الملف بإنشاء الجداول التالية وتفعيل `FORCE ROW LEVEL SECURITY` عليها:
   - `public.profiles` (حالة الموافقة الأساسية، حالة التحليلات الاختيارية `analytics_enabled`، ونوع الجلسة `anonymous` / `linked`)
   - `public.consents` (سجل الموافقات والنسخ والإلغاءات)
   - `public.household_readings` (سجلات «ملف بيتي»)
   - `public.complaint_drafts` (مسودات «شكواي ما تضيعش»)
   - `public.official_sources` (المشروعات/المصادر الحكومية الموثقة — قراءة عامة للصفوف المنشورة فقط، والكتابة للمشرفين/الخادم فقط)
   - `public.saved_project_notes` (ملاحظات المستخدم الخاصة على المشروعات)
   - `public.usage_events` (أحداث استخدام عامة ومحدودة؛ تُرفض قاعدة البيانات أي حدث إذا لم تكن `analytics_enabled = true` أو إذا احتوى `metadata` على أي مفاتيح غير `feature` و`status`)
   - `public.app_admins` (جدول صلاحيات المالك على مستوى الخادم)
4. كما ينشئ الدوال المحمية:
   - `public.is_current_user_admin()`
   - `public.get_owner_usage_summary(p_days integer)`
   - `public.delete_my_moeco_data()`
   - `public.prune_old_usage_events(p_retention_days integer)`

---

## 3. إعداد متغيرات البيئة في التطبيق (`.env`)

1. انسخ `.env.example` إلى `.env` في جذر المشروع:
   ```bash
   cp .env.example .env
   ```
2. احصل على القيم العامة فقط من لوحة Supabase:
   **Project Settings** ← **API**:
   - `VITE_SUPABASE_URL` (رابط المشروع، مثل `https://YOUR_PROJECT_REF.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` (مفتاح `anon` / `publishable` العام)
3. **لا تضع أبدًا** مفتاح `service_role` أو `SECRET_KEY` في ملفات الواجهة أو أي متغير يبدأ بـ `VITE_`. مفتاح `anon` مصمم للواجهة بشرط تفعيل سياسات RLS الصحيحة.

---

## 4. منح نفسك صلاحية المالك لعرض الإحصاءات المجمّعة (`/owner-stats` و`/admin`)

لا يعتمد التطبيق على أي علم في `localStorage` أو فحص بريد إلكتروني في الواجهة. لمنح نفسك صلاحية المالك:

1. أنشئ حسابك الشخصي من **Authentication** ← **Users** في Supabase (أو ادخل للتطبيق واربط بريدك الإلكتروني من صفحة `/my-data`).
2. انسخ معرّف المستخدم (`User UID` بصيغة UUID).
3. في **SQL Editor** نفّذ:
   ```sql
   INSERT INTO public.app_admins (user_id, role)
   VALUES ('YOUR-USER-UUID-HERE', 'owner')
   ON CONFLICT (user_id) DO NOTHING;
   ```
4. سجّل الدخول بهذا الحساب أو افتح `/owner-stats` لعرض الإحصاءات المجمّعة من دالة `get_owner_usage_summary` (أعداد مجمّعة فقط، بدون أي نصوص شكاوى أو قيم فواتير أو عناوين بريد).

---

## 5. إعداد ربط البريد الإلكتروني الاختياري (للاحتفاظ بالبيانات عبر الأجهزة)

1. في لوحة Supabase افتح **Authentication** ← **URL Configuration**.
2. أضف رابط تطبيقك الفعلي إلى **Site URL** و**Redirect URLs** (مثل `http://localhost:3000` للتطوير أو نطاق الإنتاج الفعلي).
3. عندما يطلب المستخدم ربط بريده في صفحة `/privacy` أو `/my-data`:
   - يُستدعى `supabase.auth.updateUser({ email })` لتحويل الجلسة المجهولة الحالية إلى حساب مرتبط بالبريد دون فقدان سجلاته السابقة.
   - إذا كان البريد مستخدمًا مسبقًا لحساب آخر، يظهر تنبيه واضح بالعربية دون مسح البيانات المحلية للجلسة الحالية.

---

## 6. التحقق من عزل RLS قبل الإطلاق

افتح **SQL Editor** وشغّل محتوى الملف:
`supabase/tests/rls_verification.sql`

الاختبار يعمل داخل `BEGIN; ... ROLLBACK;` لذلك لا يترك أي بيانات تجريبية في قاعدتك، ويتحقق من:
- منع المستخدم (أ) من قراءة أو تعديل أو حذف سجلات المستخدم (ب).
- منع الدور `anon` غير المصادق عليه من الوصول إلى الجداول الشخصية.
- رفض إدخال أي حدث في `usage_events` عندما تكون `analytics_enabled = false`.
- رفض إدخال أي مفاتيح غير مصرح بها في `usage_events.metadata` (مثل `amount_paid`).
- منع المستخدمين العاديين من استدعاء `get_owner_usage_summary`.

---

## 7. حدود الخطة المجانية وتقليل استهلاك الحصة

- **المصادقة المجهولة:** الخطة المجانية تشمل حدًا شهريًا للمستخدمين النشطين (MAU)، لذا يؤخر MoEco إنشاء الجلسة المجهولة حتى يوافق المستخدم صراحة.
- **حجم قاعدة البيانات (500 MB في الخطة المجانية):** لا يحفظ MoEco ملفات الصور أو PDF في قاعدة البيانات، بل يحفظ فقط بيانات وصفية صغيرة (`attachment_meta` دون البيانات الثنائية).
- **الإيقاف المؤقت (Paused Project):** في الخطة المجانية يتوقف المشروع تلقائيًا بعد 7 أيام دون نشاط؛ يعرض التطبيق رسالة واضحة بالعربية عند تعذر الاتصال أو تجاوز الحد.
- **تنظيف الأحداث القديمة (Retention):** يُنصح بتشغيل الدالة التالية دوريًا (أو جدولتها عبر `pg_cron` في الخطط الداعمة) لحذف أحداث الاستخدام الأقدم من 90 يومًا:
  ```sql
  SELECT public.prune_old_usage_events(90);
  ```
