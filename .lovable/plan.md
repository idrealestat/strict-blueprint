
## إصلاح تدفق "هنا وسيطك" ليطابق المسار الصحيح

التدفق المستهدف:
```
DirectSubmissionForm → sessionStorage → /register
   → OwnerRegisterPage (OTP + إنشاء حساب) → حفظ المسودة في owner_submissions (status=draft) → /choose-plan
   → ChoosePlanPage (اختيار الباقة) → /owner/home
   → OwnerHomePage (تنبيه مراجعة المسودة) → /owner/submission/:id/review
   → SubmissionReviewPage → "تأكيد الإرسال" → status = pending_acceptance
```

### التعديلات

**1. `src/pages/public-portal/DirectSubmissionForm.tsx`**
- إزالة كل منطق `supabase.auth.getUser()` والإدراج المباشر في `owner_submissions`.
- عند الضغط على "إرسال": فقط
  - `sessionStorage.setItem("huna_waseetak_pending", JSON.stringify({ kind, purpose, data: form }))`
  - `toast.success("أحسنت! لإيجاد وسيطك يتطلب التسجيل")`
  - `navigate("/register?redirect=/choose-plan")`
- إزالة `import { supabase }` غير المستخدم.

**2. `src/pages/public-portal/OwnerRegisterPage.tsx`**
- في `verifyAndCreate` بعد إنشاء `owner_profiles`:
  - إذا كان هناك `pendingSubmission`: إدراج صف في `owner_submissions` بحالة `draft` (كما هو حاليًا) **لكن** بدلاً من التوجيه إلى `/owner/submission/:id/review`، التوجيه إلى `/choose-plan`.
  - إضافة `sessionStorage.setItem("owner_post_register", "1")` ليعرف `ChoosePlanPage` أن يذهب إلى `/owner/home` بدل `/app/businesscard/edit`.
  - إزالة المسودة من `sessionStorage` (`huna_waseetak_pending`) كما هو حاليًا.

**3. `src/pages/ChoosePlanPage.tsx`**
- في `handleSelectPlan` بعد نجاح `updatePlan`:
  - فحص `sessionStorage.getItem("owner_post_register")`؛ إذا كان موجودًا:
    - حذفه
    - `navigate("/owner/home")` بدل `/app/businesscard/edit`
  - وإلا: السلوك الحالي.
- في `useEffect` redirect (عندما `onboardingCompleted` أو `planCode` موجود): فحص نفس العلامة وتحويل إلى `/owner/home` بدل `/app/dashboard`.

**4. `src/pages/owner-home/OwnerHomePage.tsx`**
- لا تغيير منطقي؛ التنبيه الموجود (`showHint`) يظهر بالفعل عند `pendingDrafts > 0`. يكفي.

### بدون تغييرات في
- قاعدة البيانات / RLS / Edge Functions.
- `SubmissionReviewPage` (يستخدم بالفعل `pending_acceptance`).
- `HunaWaseetakPage`.

