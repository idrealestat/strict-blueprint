## الهدف
استبدال `DirectSubmissionForm` في تبويبَي `/owner/submissions` بنفس نماذج البطاقة الرقمية حرفياً عبر استخراج جسم النموذج إلى مكوّن مشترك (الخيار 2)، وإصلاح صفحة الأداء لتعرض مشاهدات حقيقية من `offer_views_log` المرتبطة بإرسالات المالك.

---

## ١) استخراج جسم النموذج المشترك (بدون أي تعديل سلوكي على النماذج العامة)

### مكوّنات جديدة
- `src/components/forms/OfferFormBody.tsx` — يحتوي **حرفياً** على نفس JSX، نفس الحقول، نفس أقسام الألوان، نفس التحقق، نفس مكوّن الخريطة/الرفع، الموجود حالياً في `PublicOfferForm.tsx`.
- `src/components/forms/RequestFormBody.tsx` — مثلها لـ `PublicRequestForm.tsx`.

### Props للمكوّن المشترك
```ts
type Mode =
  | { kind: "broker"; brokerSlug: string; broker: BrokerInfo }   // الاستخدام العام wasataai.com/:slug/offer
  | { kind: "owner"; ownerUserId: string };                       // الاستخدام داخل /owner/submissions
```
- في `kind: "broker"`: السلوك الحالي حرفياً — يستدعي Edge Function `public-form-submit` بـ `{ slug, formType, data }`.
- في `kind: "owner"`: عند الإرسال يُحفظ السجل في `owner_submissions` بحالة `pending_acceptance` (نفس البيانات في عمود `data` jsonb + `media`)، ولا يُربط بأي وسيط بعد. اختيار الوسيط لاحقاً يبقى عبر شاشة `SubmissionProposalsPage` التي تستدعي `submitToBrokerCRM` (دون تغيير).

### تحديث النماذج العامة لتستهلك الجسم المشترك
- `src/pages/public-forms/PublicOfferForm.tsx` يصبح غلافاً رقيقاً: يجلب `broker` بالـ `slug` كما يفعل اليوم، ثم يعرض `<OfferFormBody mode={{kind:"broker", brokerSlug, broker}} />`. لا تغيير سلوكي.
- `src/pages/public-forms/PublicRequestForm.tsx` بنفس النمط مع `<RequestFormBody />`.
- لا تغيير على Edge Function، ولا على `PublicFormLayout`، ولا على `submitToBrokerCRM`.

### استخدام الجسم المشترك في صفحة المالك
- `src/pages/owner-home/SubmissionsListPage.tsx`:
  - حذف استيراد `DirectSubmissionForm`.
  - تبويب "ارسال عرض" → `<OfferFormBody mode={{kind:"owner", ownerUserId}} />`
  - تبويب "ارسال طلب" → `<RequestFormBody mode={{kind:"owner", ownerUserId}} />`
  - يبقى الرأس الأخضر وعنوان الصفحة وقسم "إرسالاتك السابقة" كما هو.

### القيود الواجبة
- لا تغيير في الحقول، الترتيب، الألوان، الفونت، RTL، رسائل التحقق، أو نصوص الموافقة القانونية.
- نفس آلية الحفظ المؤقت في `sessionStorage`/`localStorage` تُنقل كما هي إلى المكوّن المشترك.

---

## ٢) إصلاح صفحة الأداء `/owner/performance`

### المنطق الجديد
1. جلب إرسالات المالك مع: `id, status, data, city, district, assigned_broker_slug, assigned_broker_user_id, created_at`.
2. تجميع `assigned_broker_user_id` (أصحاب البطاقات المنشورة الذين قبلوا).
3. استعلام `offer_views_log` مفلتر بـ:
   - `user_id IN (assigned_broker_user_ids)` (لأن سجل المشاهدات مرتبط بالوسيط الناشر)
   - **و** `offer_id IN (submission_ids)` أو `offer_id IN (source_property_ids)` المُسجّلة عند الإنشاء عبر `submitToBrokerCRM` (المُمرَّر `id: "owner_<sub.id>"`).
4. حساب: عدد المشاهدات الإجمالي + التجزئة لكل عقار للمالك.

### التغييرات في الكود
- `src/pages/owner-home/PerformancePage.tsx`:
  - استبدال استعلام `offer_views_log` العام بفلترة دقيقة عبر `offer_id` (ومجال `user_id` لتأكيد).
  - إظهار عمود "مشاهدات" لكل سطر في "تفاصيل عقاراتك" بدل سلسلة slug فقط.
  - الحفاظ على البطاقات الإحصائية الأربع كما هي شكلاً، مع قيم حقيقية.

### ملاحظة بخصوص ربط المشاهدات
- `submitToBrokerCRM` يمرّر اليوم `id: "owner_<sub.id>"` إلى `public-form-submit`. يجب التأكد أن هذا المعرف يُسجَّل لاحقاً في `offer_views_log.offer_id` عند فتح الإعلان على `wasataai.com/{slug}/...`. إذا لم يكن كذلك، نُضيف خطوة بسيطة في `PerformancePage` لاستخراج المشاهدات عبر `metadata->>source_owner_submission_id` كحل احتياطي. (لن يُلمس المسار العام؛ فقط القراءة في صفحة الأداء.)

---

## ٣) ملفات ستتغير
- جديد: `src/components/forms/OfferFormBody.tsx`, `src/components/forms/RequestFormBody.tsx`.
- معدّل (غلاف رقيق): `src/pages/public-forms/PublicOfferForm.tsx`, `src/pages/public-forms/PublicRequestForm.tsx`.
- معدّل: `src/pages/owner-home/SubmissionsListPage.tsx` (استبدال النماذج).
- معدّل: `src/pages/owner-home/PerformancePage.tsx` (فلترة المشاهدات الحقيقية).

## ٤) ما لن يُلمس
- `submitToBrokerCRM.ts`، Edge Function `public-form-submit`، `OwnerHomePage`، `OwnerRightSlider`، `ChoosePlanPage`، `SubmissionProposalsPage`، البطاقة الرقمية، الألوان، الخطوط، RTL.

## ٥) معايير القبول
- فتح `/owner/submissions` يعرض في كل تبويب نفس النموذج المرئي حرفياً كما في `wasataai.com/{slug}/offer` و `/request` (نفس الأقسام، نفس الألوان، نفس الموافقة القانونية).
- إرسال من تبويب المالك يحفظ في `owner_submissions` بحالة `pending_acceptance` ويظهر في "إرسالاتك السابقة" فوراً.
- `/owner/performance` يعرض رقم مشاهدات يساوي صفراً عندما لا يوجد إرسال مرتبط بوسيط، ويزداد فعلياً عند فتح الإعلان من المنصة العامة.