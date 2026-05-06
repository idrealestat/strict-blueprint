
## الدستور النهائي للحسابات

**المبدأ:** مستخدم واحد في `auth.users` يمكن أن يكون مالكًا (سجل في `owner_profiles`) ووسيطًا (سجل في `business_cards`) معًا. لا تكرار، لا بريد وهمي.

---

## 1. مسح الحل القديم

- إزالة كل استخدام لـ `@owners.wasataai.com` من `OwnerRegisterPage.tsx`.
- استخدام البريد/الجوال الحقيقي حصرًا.

---

## 2. تسجيل المالك من `/register` (هنا وسيطك)

تدفّق ذكي يكتشف إذا كان المستخدم موجودًا مسبقًا (وسيط) أو جديدًا، عبر **Edge Function جديدة `check-account-exists`**:

**Input:** `{ phone, email }`  
**Output:** `{ exists: boolean, user_id?: string, has_owner_profile: boolean, has_business_card: boolean }`  
تستخدم `SUPABASE_SERVICE_ROLE_KEY` للبحث في `auth.users` و`owner_profiles` و`business_cards`.

**سيناريوهات الواجهة:**

### أ. مستخدم جديد كليًا
1. تحقق OTP للجوال (موجود).
2. `supabase.auth.signUp({ email: realEmail, password })` — بريد حقيقي.
3. `INSERT INTO owner_profiles` مرتبط بـ `user_id` الجديد.
4. تحويل إلى `/choose-plan`. بعد اختيار الباقة → `/owner/home`.

### ب. وسيط حالي (لديه حساب في `auth.users` و`business_cards`)
1. UI يكتشف عبر `check-account-exists` ويعرض:  
   *"اكتشفنا أن لديك حسابًا كوسيط. أدخل كلمة مرورك لإضافة دور المالك."*  
2. بعد التحقق من OTP الجوال + كلمة المرور → `signInWithPassword`.  
3. `INSERT INTO owner_profiles` (نفس `user_id`، **لا حساب جديد**).
4. تحويل إلى `/choose-plan` ثم `/owner/home`.

### ج. مستخدم بدون كلمة مرور (سجل سابقًا بـ OTP فقط)
1. بعد التحقق من OTP، استخدم `phone-login` edge function للحصول على جلسة.  
2. `supabase.auth.updateUser({ password })` لإعداد كلمة مرور للحساب.  
3. `INSERT owner_profiles` ثم `/choose-plan`.

---

## 3. تسجيل الوسيط من قسم المالك (التجربة الذهبية)

في صفحة تسجيل الوسيط (`AuthPage` أو ما يقابلها) عندما يكون المستخدم مسجّل دخوله ولديه `owner_profiles`:

- اقرأ بياناته من `owner_profiles` + `auth.users`.
- اعرض الحقول (الاسم، البريد، الجوال، الهوية، تاريخ الميلاد، المدينة، الحي) **read-only برمادي**.
- الحقل القابل للإدخال: **رقم رخصة فال** + أي إضافات للوسيط.
- عند الحفظ: `INSERT INTO business_cards` بنفس `user_id`. تحويل إلى `/app/dashboard`.

---

## 4. حراس البوابات (Route Guards)

مكوّنان جديدان:

**`OwnerRouteGuard`** يحرس `/owner/*`:
- إذا غير مسجّل دخول → `/login?redirect=...`
- إذا مسجّل لكن لا يوجد سجل في `owner_profiles` → رسالة *"لست مسجلاً كمالك. سجل من هنا"* + زر إلى `/register`.

**`BrokerRouteGuard`** يحرس `/app/*` (يدمج مع `BusinessCardGuard` الحالي):
- إذا غير مسجّل → `/app/login`.
- إذا مسجّل لكن لا يوجد `business_cards` → رسالة *"هذه المنطقة للوسطاء. سجل كوسيط من هنا"* + زر تسجيل وسيط (يستفيد من المُلء التلقائي إن كان مالكًا).

---

## 5. تسجيل دخول المالك `/login`

- بريد + كلمة مرور: عادي.
- جوال + OTP: عبر `phone-login` (موجود) — **يُسمح بالدخول إذا وُجد `owner_profiles` أو سيتم إنشاؤه عبر `/register`**.
- إزالة شرط *"لا يوجد حساب بهذا الرقم"* إذا كان المستخدم وسيطًا — بدلاً من ذلك: تحويل إلى `/register` للترقية إلى مالك.

---

## التغييرات بالملفات

```text
جديد:
  supabase/functions/check-account-exists/index.ts   ← فحص وجود حساب بـ phone/email

تعديل:
  src/pages/public-portal/OwnerRegisterPage.tsx      ← التدفّق الذكي (3 سيناريوهات)
  src/pages/public-portal/OwnerLoginPage.tsx         ← السماح بـ phone-login لأي user_id
  src/pages/AuthPage.tsx (تسجيل الوسيط)              ← مُلء تلقائي read-only للمالك
  src/components/auth/OwnerRouteGuard.tsx (جديد)
  src/components/auth/BrokerRouteGuard.tsx (جديد، أو تعديل BusinessCardGuard)
  src/App.tsx                                        ← تطبيق الحرّاس على /owner/* و/app/*
```

---

## ملاحظات تقنية

- لا حاجة لتعديل سكيمة قاعدة البيانات؛ `owner_profiles` و`business_cards` يربطان بـ `user_id` فقط.
- `check-account-exists` تتطلب Service Role Key (مفتاحة موجودة).
- تحقق OTP يبقى عبر `send-phone-otp` / `verify-otp` الحاليين.
- بعد إنشاء `owner_profiles`، التحويل **دائمًا** إلى `/choose-plan` قبل `/owner/home` (لا دخول مباشر).

هل أبدأ بالتنفيذ؟
