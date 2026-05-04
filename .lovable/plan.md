# خطة بناء بوابة العملاء العامة (الإصدار النهائي المدمج)

## 0. القرارات المعمارية
- **الصفحة الرئيسية `/`**: دمج Hero جديد فوق المحتوى التسويقي الحالي في `LandingPage.tsx`.
- **المصادقة الموحدة**:
  - `/register`: تسجيل أول مرة عبر **رقم الجوال + OTP واتساب** (نستفيد من `send-phone-otp` و `verify-otp` و `phone-login` الموجودة).
  - `/login`: حقل ذكي واحد يقبل **بريد إلكتروني (+ كلمة مرور)** أو **رقم جوال (+ OTP واتساب)**.
- **البريد الإلكتروني**: اختياري في التسجيل. إن تُرك فارغًا يُولَّد تلقائيًا بصيغة `{phone}@owners.wasataai.com`.

> ملاحظة: هذه الصفحات الجديدة منفصلة عن `/app/login` (الخاص بالوسطاء) ولن تمس تدفق الوسطاء الحالي.

---

## 1. تعديلات قاعدة البيانات (Migration)

### جدول `owner_profiles`
| العمود | النوع | ملاحظات |
|---|---|---|
| `user_id` | uuid PK | FK → `auth.users.id` ON DELETE CASCADE |
| `full_name` | text NOT NULL | الاسم الرباعي |
| `national_id` | text | الهوية الوطنية |
| `date_of_birth` | date | |
| `phone` | text UNIQUE NOT NULL | الجوال السعودي المفعل |
| `email` | text UNIQUE | اختياري |
| `city` | text | |
| `neighborhood` | text | |
| `created_at`, `updated_at` | timestamptz | |

RLS: المالك يقرأ/يحدّث ملفه فقط. الوسطاء (دور `member`/`admin`) يمكنهم القراءة عند ربط العرض.

### جدول `public_property_offers`
| العمود | النوع | ملاحظات |
|---|---|---|
| `id` | uuid PK | |
| `owner_user_id` | uuid | FK → `auth.users` |
| `offer_kind` | text | `sale` / `rent` |
| `property_type` | text | شقة، فيلا... |
| `area_sqm` | numeric | |
| `price_sar` | numeric | |
| `city`, `neighborhood` | text | |
| `description` | text | |
| `photos` | text[] | روابط Storage |
| `status` | text | `pending_review` / `published` / `accepted` / `rejected` |
| `created_at`, `updated_at` | timestamptz | |

RLS: المالك يدير عروضه فقط. الوسطاء يقرؤون `published`.

### Storage Bucket
- `property-offer-photos` (public read، write للمالك المسجَّل).

---

## 2. الصفحات والمسارات الجديدة

```text
src/pages/public-portal/
├── HunaWaseetakPage.tsx          /huna-waseetak (تبويبا العروض/الطلبات)
├── OfferSaleFormPage.tsx          /huna-waseetak/offer-sale (5 خطوات)
├── OfferSubmitPage.tsx            /huna-waseetak/offer-sale/submit (بوابة الرفع)
├── OfferSuccessPage.tsx           /huna-waseetak/offer-sale/success
├── OwnerRegisterPage.tsx          /register
├── OwnerLoginPage.tsx             /login
├── SearchPlaceholderPage.tsx      /search
└── OfferPropertyRedirect.tsx      /offer-property → /huna-waseetak/offer-sale
```

تحديثات:
- `LandingPage.tsx`: إضافة Hero + 3 بطاقات إجراء أعلى الصفحة.
- `App.tsx`: إضافة المسارات الجديدة (عامة، خارج `/app`).

---

## 3. تدفق العمل

### Hero في الصفحة الرئيسية
- عنوان: **"بوابتك الذكية للعقار"**
- عنوان فرعي: "من التيه... إلى التمكن"
- 3 بطاقات: 🔍 ابحث | 🏠 اعرض عقارك | 🤝 هنا وسيطك (بارزة بالذهبي #D4AF37)

### نموذج عرض البيع
- 5 خطوات: نوع العقار → التفاصيل → الوصف → الصور → المراجعة.
- حفظ مؤقت في `sessionStorage["wasata_pending_offer"]`.
- زر "نشر" → إن لم يكن مسجَّلًا، يفتح Modal بخيارَي:
  - "إنشاء حساب" → `/register?redirect=/huna-waseetak/offer-sale/submit`
  - "تسجيل الدخول" → `/login?redirect=/huna-waseetak/offer-sale/submit`

### `/register` (مالك عقار)
- الحقول: جوال (إلزامي 9665XXXXXXXX) | بريد (اختياري) | كلمة مرور + تأكيد | اسم رباعي | هوية | تاريخ ميلاد | مدينة | حي | موافقة على الشروط والخصوصية (إلزامية).
- الإرسال:
  1. توليد `email` إن كان فارغًا: `${phone}@owners.wasataai.com`.
  2. `supabase.auth.signUp({ email, password, options: { data: { phone, full_name } } })`.
  3. استدعاء `send-phone-otp` → عرض حقل OTP.
  4. `verify-otp` → عند النجاح، إدراج `owner_profiles`.
  5. تسجيل دخول تلقائي + التوجيه إلى `redirect` أو `/`.

### `/login` الذكي
- حقل واحد: "رقم الجوال أو البريد الإلكتروني".
- اكتشاف:
  - يحتوي `@` → بريد ← إظهار كلمة المرور ← `signInWithPassword`.
  - يبدأ بأرقام (سعودي) → جوال ← `send-phone-otp` ← OTP ← `phone-login`.
- بعد النجاح، التوجيه للـ `redirect`.

### `/huna-waseetak/offer-sale/submit`
- يقرأ `sessionStorage`.
- يرفع الصور إلى bucket `property-offer-photos`.
- يُدرج صفًا في `public_property_offers` بحالة `pending_review`.
- يمسح `sessionStorage`.
- Toast: "تم! عرضك يُرسل للوسطاء المناسبين في [المدينة]."
- Navigate → `/huna-waseetak/offer-sale/success`.

### `/huna-waseetak/offer-sale/success`
- أيقونة CheckCircle ذهبية + رسالة + زر "العودة للرئيسية" → `/`.

---

## 4. التفاصيل الفنية

- **Validation**: zod schemas لكل نموذج (جوال سعودي regex `^9665\d{8}$`، الهوية 10 أرقام).
- **OTP**: نعيد استخدام Edge Functions القائمة `send-phone-otp` / `verify-otp` / `phone-login`.
- **RTL + Cairo**: التزام كامل بهوية وساطة AI (#D4AF37 ذهبي، #1a5c2e أخضر).
- **حماية القراءة**: لن نمس مكونات الوسطاء (CRM/Publishing/Platform) — هذه إضافة منفصلة فقط.
- **AuthContext**: لا تغيير في الواجهة العامة، فقط استخدامها كما هي.

---

## 5. ما خارج النطاق (لاحقًا)
- صفحات `/search`, نماذج "طلب شراء/استئجار" (Placeholders فقط الآن).
- لوحة الوسيط لاستقبال هذه العروض (تتطلب قرارًا مستقلاً).
- ربط مع `crm_customers` تلقائيًا عند قبول وسيط.
