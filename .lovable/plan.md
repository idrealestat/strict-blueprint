## الخطة النهائية لبوابة "هنا وسيطك"

### نظرة عامة
بوابة عامة كاملة للملاك تبدأ من زر "هنا وسيطك" في الصفحة الرئيسية، تتيح للمالك إرسال عرض/طلب بنماذج مبسطة قبل التسجيل، ثم بعد التسجيل يستخدم النماذج العامة الأصلية كما هي داخل تبويبات لوحة التحكم مع تغيير زر "إرسال" إلى "حفظ". الربط بـ slug يستخدم نفس منطق الإرسال الحالي. تتبع الأداء يأتي من المنصة العامة `wasataai.com/{slug}`.

> **محمي - لن يُمَس:** صفحات `/app/*` للوسطاء، `PublicOfferForm`/`PublicRequestForm` (سيُضاف لهما prop اختياري فقط لتغيير سلوك الزر إلى "حفظ" دون أي تعديل في المنطق الأساسي)، `SlugOfferPage`/`SlugRequestPage`، جداول `crm_customers` و `business_cards`.

---

### المرحلة الأولى — البنية الأساسية والتسجيل

**1. `HunaWaseetakPage.tsx` (إعادة بناء كامل)**
- هيدر أخضر `#01411C` + خط ذهبي `#D4AF37` + زر "تسجيل دخول"
- عنوان: "أرسل عرضك أو طلبك للوسطاء"
- تبويبان: العروض / الطلبات
- داخل العروض: خياران (بيع/تأجير)
- داخل الطلبات: خياران (شراء/استئجار)

**2. مكونان مبسّطان جديدان (لما قبل التسجيل فقط)**
- `src/pages/public-portal/DirectOfferForm.tsx`
- `src/pages/public-portal/DirectRequestForm.tsx`
- يحويان نسخة مختصرة من حقول النماذج العامة (لا اعتماد على `slug`)
- عند الإرسال:
  - زائر → تخزين البيانات في `sessionStorage` ثم تحويل إلى `OwnerRegisterPage` مع رسالة "أحسنت! لإيجاد وسيطك يتطلب التسجيل"
  - مسجّل → حفظ مباشر في `owner_submissions` بحالة `draft` و `source: 'direct'`

**3. تعديل `OwnerRegisterPage.tsx`**
- قراءة بيانات `sessionStorage` وتعبئة الاسم/الجوال/المدينة تلقائياً
- بعد تحقق رقم الجوال عبر واتساب → إنشاء `owner_profiles` + إدراج المسودة + تحويل إلى `ChoosePlanPage`

**4. تعديل `OwnerLoginPage.tsx`**
- تبويبان: بريد + كلمة مرور / جوال + OTP واتساب (نفس آلية الوسطاء)

---

### المرحلة الثانية — قاعدة البيانات (جدولان جديدان)

**جدول `owner_submissions`:**
- `submission_type`: 'offer' | 'request'
- `purpose`: 'sale' | 'rent' | 'buy' | 'lease'
- `status`: 'draft' | 'saved' | 'pending_acceptance' | 'broker_assigned' | 'completed'
- `source`: 'direct' | 'link'
- `data` (jsonb), `media` (jsonb)
- `assigned_broker_slug` (nullable)
- `owner_user_id`, `city`, `district`

**جدول `owner_broker_proposals`:**
- `submission_id`, `broker_user_id`, `broker_slug`, `services` (jsonb), `commission_percent`, `status`: pending/accepted/rejected

**RLS:** المالك يدير سجلاته فقط؛ الوسطاء يرون السجلات `pending_acceptance` في مدنهم؛ Owner عبر `has_role`.

---

### المرحلة الثالثة — لوحة المالك بعد التسجيل

**5. صفحة `/owner/home` (`OwnerHomePage`)**
- ترحيب باسم المالك + Tooltip سحابي على أيقونة العروض/الطلبات: "قم بمراجعة عرضك/طلبك من هنا وتأكيد إرساله"
- هيدر أخضر + برقر يمين + جرس يسار

**6. `OwnerRightSlider` (نسختان حسب الباقة)**
- العادية: بطاقة الأعمال الرقمية / خدمة العملاء / الإعدادات / تسجيل خروج (+ زر "ترقية الباقة" في الهيدر)
- المطورة: + المقيمين العقاريين / المكاتب الهندسية / المقاولين

**7. أزرار الصفحة الرئيسية**
- العادية: إرسال العروض والطلبات / العروض والطلبات المقبولة
- المطورة: إدارة العملاء / إرسال العروض والطلبات / العروض والطلبات المقبولة / أداء عقاراتي وطلباتي

**8. زر "إرسال العروض والطلبات" داخل لوحة المالك**
- تبويبان: العروض / الطلبات
- تبويب العروض: **`PublicOfferForm` نفسه** مع `mode="owner-save"` (prop جديد اختياري) → الزر يصبح "حفظ" ويحفظ في `owner_submissions` بحالة `saved` بدل الإرسال إلى وسيط
- تبويب الطلبات: **`PublicRequestForm` نفسه** مع نفس النمط

---

### المرحلة الرابعة — مراجعة وتأكيد الإرسال

**9. صفحة `/owner/submission/:id/review`**
- عرض كل البيانات المعبأة (للقراءة)
- زر "تأكيد الإرسال" → يحوّل `status` من `draft`/`saved` إلى `pending_acceptance`
- رسالة: "تم! عرضك يُرسل الآن إلى N وسيطاً في {المدينة}"

**10. تنبيه الوسطاء**
- DB Trigger عند `pending_acceptance` → إدراج إشعارات في `notifications` للوسطاء بنفس المدينة

---

### المرحلة الخامسة — تفاعل الوسطاء (نظام المستطيلات)

**11. `SubmissionInboxCard.tsx` داخل صفحة العروض/الطلبات الحالية للوسيط**
- مستطيل يعرض معلومات المالك (بدون رقم) + معلومات العقار
- زرّا قبول/رفض. عند القبول: مثلث + توسعة لإدخال الخدمات + نسبة العمولة → حفظ في `owner_broker_proposals`

---

### المرحلة السادسة — اختيار المالك للوسيط (الربط بـ slug)

**12. صفحة `/owner/submission/:id/proposals`**
- بطاقات الوسطاء (اسم، تقييم، مدينة/حي، خدمات، عمولة)
- زر "اختيار" → عند الضغط:
  - تحديث `assigned_broker_slug` في `owner_submissions`
  - **استدعاء نفس منطق الإرسال الحالي** الموجود في `PublicOfferForm`/`PublicRequestForm` (يُستخرج إلى دالة مشتركة `submitToBrokerCRM`) مع تمرير بيانات النموذج المحفوظ + `slug` + `source: 'direct'`
  - النتيجة: عميل جديد في CRM الوسيط مع العرض/الطلب في تبويباته الصحيحة، وإشعار للوسيط

---

### المرحلة السابعة — شارات التمييز والأداء

**13. شارة المصدر في CRM الوسيط**
- في `CustomerDetailsPage` تبويبي العروض/الطلبات: قراءة `metadata.source`:
  - `direct` → "عرض/طلب مباشر" (أخضر `#01411C`)
  - `link` → "عرض/طلب من الرابط" (ذهبي `#D4AF37`)

**14. `PerformancePage` (المطورة فقط)**
- ربط `owner_submissions` بـ `platform_listings` عبر `source_property_id`
- جلب من `events` و `offer_views_log` لمشاهدات/نقرات/تواصل من المنصة العامة `wasataai.com/{slug}`
- ترتيب الوسطاء حسب الأداء

**15. `OwnerCustomersPage` (المطورة)**
- بطاقات الوسطاء الذين تعامل معهم + زر "إبلاغ" (نفس آلية الإبلاغ الحالية)

---

### المرحلة الثامنة — اختيار الباقة

**16. تعديل `ChoosePlanPage`** — إضافة النصوص التوضيحية تحت الباقة المطورة:
- 📊 متابعة عقارك مباشرة من خلال الوسيط
- 👁️ كم عميلاً مهتم بعقارك / تواصل / شاهد إعلانك
- 💬 تحليلات وبيانات لحظية
- 🧑‍💼 حفظ معلومات الوسطاء الذين تعاملت معهم

---

### الملفات

**جديدة:**
- `src/pages/public-portal/DirectOfferForm.tsx`
- `src/pages/public-portal/DirectRequestForm.tsx`
- `src/pages/owner-home/OwnerHomePage.tsx`
- `src/pages/owner-home/OwnerHeader.tsx`
- `src/pages/owner-home/OwnerRightSlider.tsx`
- `src/pages/owner-home/SendOfferRequestPage.tsx` (تبويبان يحويان النماذج العامة)
- `src/pages/owner-home/SubmissionReviewPage.tsx`
- `src/pages/owner-home/SubmissionProposalsPage.tsx`
- `src/pages/owner-home/AcceptedListPage.tsx`
- `src/pages/owner-home/PerformancePage.tsx`
- `src/pages/owner-home/OwnerCustomersPage.tsx`
- `src/components/broker/SubmissionInboxCard.tsx`
- `src/utils/submitToBrokerCRM.ts` (استخراج منطق الإرسال المشترك)

**معدلة:**
- `src/pages/public-portal/HunaWaseetakPage.tsx`
- `src/pages/public-portal/OwnerRegisterPage.tsx`
- `src/pages/public-portal/OwnerLoginPage.tsx`
- `src/pages/ChoosePlanPage.tsx`
- `src/App.tsx` (مسارات جديدة `/owner/*`)
- `src/components/crm/CustomerDetailsPage.tsx` (شارة المصدر فقط)
- `PublicOfferForm.tsx` / `PublicRequestForm.tsx` (إضافة prop `mode?: 'owner-save'` فقط — لتبديل نص الزر ووجهة الحفظ، دون أي تغيير في المنطق الأساسي)

---

### تنفيذ على ٣ دفعات
- **دفعة 1:** المراحل 1-4 (البوابة + التسجيل + لوحة المالك + المراجعة)
- **دفعة 2:** المراحل 5-6 (تفاعل الوسطاء + اختيار + الربط بـ slug)
- **دفعة 3:** المراحل 7-8 (الشارات + الأداء + نصوص الباقة)

سنبدأ بالدفعة الأولى عند الموافقة.