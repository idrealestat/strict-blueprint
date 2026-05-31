
# خطة تنفيذ ميزات إدارة الفريق المتقدمة

تعمل بالكامل من خلال زر **"إدارة الفريق"** في الـ Right Slider — كل شيء **إضافات جديدة** في `TeamManagementPanel`، بدون تعديل وحدات Core (CRM، النشر، المساعد) ولا جدول `crm_customers`.

---

## المرحلة 1 — تعيين العملاء (الأساس)

### قاعدة البيانات (migration جديد)
- جدول `customer_assignments`:
  - `organization_id` (uuid) — حساب المنظمة
  - `customer_id` (uuid) — معرف عميل من `crm_customers`
  - `assigned_to_user_id` (uuid) — العضو
  - `assigned_by_user_id` (uuid)، `assigned_at`، `is_active`، `notes`
  - فهرس فريد: `(organization_id, customer_id)` لتفادي تعيين مزدوج
- RLS: قراءة/كتابة فقط للمسؤول (`is_organization_admin`) أو العضو نفسه (للقراءة فقط لما هو معين له).
- GRANT للـ `authenticated` و `service_role`.
- دالة `get_assigned_customer_ids(member_uuid)` — مساعدة للفلترة.

### الكود
- **Hook جديد** `useCustomerAssignments.ts` — CRUD + Realtime على `customer_assignments`.
- **Hook جديد** `useCRMCustomersFiltered.ts` يلفّ `useCRMCustomers` الحالي ثم يطبق `useMemo` لفلترة العملاء (المسؤول يرى الكل، العضو يرى المعينين له فقط). **لن يُعدّل** `useCRMCustomers.ts`.
- **مكون جديد** `AssignCustomerDropdown.tsx` (في `src/components/team/`) — يفتح من بطاقة العميل بزر "تعيين لوسيط" ويستدعي hook التعيين.
- **تبويب جديد داخل TeamManagementPanel** اسمه "العملاء" يعرض جدول تعيين سريع (عميل ← وسيط) للمسؤول فقط.
- بطاقة العميل في واجهة المسؤول تعرض شارة صغيرة "مسند إلى: [اسم]".

> ملاحظة: يُستخدم `AssignCustomerToMemberDialog` و `AssignCustomerPopover` الموجودين كما هما إذا كانا متوافقين، أو يُربطان بالـ hook الجديد دون تعديل سلوكهما الحالي.

---

## المرحلة 2 — مراقبة الأعضاء (Impersonation الآمن)

- **زر "عرض المنصة"** بجانب كل عضو داخل تبويب "الزملاء" الحالي (لا يحلّ محل القائمة).
- **مكون جديد** `ImpersonationWrapper.tsx` يعرض شريطاً أحمر علوياً ثابتاً: "أنت تشاهد منصة [اسم العضو] — اضغط للخروج".
- **Hook جديد** `useImpersonate.ts` يخزن `impersonatedUserId` في `sessionStorage` + يوفّر `enter/exit`.
- **Edge Function جديدة** `team-impersonate-data` (verify JWT) تتأكد أن المستدعي مسؤول في نفس المنظمة عبر `is_organization_admin` ثم تُعيد ملخص بيانات العضو (عملاء، مواعيد، فرص، تحليلات) للقراءة فقط. **لا تعديل** على مسار "منصتي" الأصلي.

---

## المرحلة 3 — تحليلات الأعضاء

- **توسيع** `TeamAnalyticsPanel.tsx` الحالي (مكون موجود سلفاً):
  - قائمة جانبية بالأعضاء.
  - بطاقة لكل عضو: عدد العملاء المعينين، الصفقات المغلقة (من listings بحالة sold/rented)، المواعيد المنجزة، الفرص المقبولة/المرفوضة.
  - رسم بياني Recharts بسيط (موجود في المشروع) يقارن أداء العضو بمتوسط الفريق.
- **لوحة "المتصدرين"** أسفل التبويب — تصنيف الأعضاء حسب مؤشر يختاره المسؤول.

---

## المرحلة 4 — المساعد الصامت + التحليلات التنبؤية

### قاعدة البيانات (migration ثانٍ)
- `silent_assistant_alerts`: `organization_id, alert_type, severity, title, description, suggested_action, related_member_id, related_customer_id, is_dismissed`.
- `predictive_metrics`: `organization_id, member_id, metric_type, predicted_value, confidence_score, calculated_at`.
- RLS: المسؤول فقط يقرأ/يكتب لمنظمته.

### Edge Functions جديدة
- `silent-assistant-scan` (cron يومي عبر pg_cron + pg_net): يفحص عملاء غير متفاعلين 7+ أيام، مهام متأخرة، انخفاض أداء، عملاء عاليي النشاط.
- `predictive-metrics-compute` (cron أسبوعي): متوسط متحرك لآخر 3 أشهر لكل عضو.

### UI
- **تبويب جديد داخل لوحة التحكم** "المساعد الصامت" — قائمة هادئة لآخر التنبيهات + زر تطبيق الإجراء المقترح. أيقونة جرس صغيرة منفصلة داخل header الـ TeamManagementPanel (ليست مودال).
- التوقعات تظهر كعمود إضافي داخل تبويب التحليلات.

---

## المرحلة 5 — توزيع العملاء التلقائي

- **حقل جديد في `team_settings`**: `lead_distribution_mode` (`manual` | `round_robin` | `load_based`) — migration ALTER TABLE فقط بإضافة عمود اختياري بقيمة افتراضية `manual` (آمن).
- **جدول `auto_distribution_log`** لتتبع كل توزيع.
- **دالة DB / Edge Function** `auto-assign-customer` تُستدعى عند إنشاء عميل جديد (Trigger AFTER INSERT على `crm_customers` يستدعي `pg_net` فقط إذا الوضع ≠ manual، حتى لا يكسر السلوك الحالي).
- **UI داخل تبويب الإعدادات في TeamManagementPanel**:
  - اختيار الوضع (راديو).
  - زر "إعادة توزيع العملاء غير المعينين الآن" مع تأكيد.

---

## تفاصيل تقنية

```text
src/
├─ hooks/
│   ├─ useCustomerAssignments.ts        (جديد)
│   ├─ useCRMCustomersFiltered.ts       (جديد - يلفّ useCRMCustomers)
│   ├─ useImpersonate.ts                (جديد)
│   └─ useSilentAssistantAlerts.ts      (جديد)
├─ components/team/
│   ├─ TeamManagementPanel.tsx          (توسيع: إضافة تبويبَي "العملاء" و"المساعد الصامت")
│   ├─ AssignCustomerDropdown.tsx       (جديد)
│   ├─ ImpersonationWrapper.tsx         (جديد)
│   ├─ TeamAnalyticsPanel.tsx           (توسيع: قائمة جانبية + Leaderboard + توقعات)
│   ├─ TeamSettingsPanel.tsx            (توسيع: lead_distribution_mode)
│   ├─ SilentAssistantPanel.tsx         (جديد)
│   └─ MemberImpersonateButton.tsx      (جديد)
supabase/
├─ functions/
│   ├─ team-impersonate-data/index.ts
│   ├─ silent-assistant-scan/index.ts
│   ├─ predictive-metrics-compute/index.ts
│   └─ auto-assign-customer/index.ts
└─ migrations/
    ├─ <ts>_customer_assignments.sql
    ├─ <ts>_silent_assistant_and_predictive.sql
    ├─ <ts>_team_settings_distribution.sql
    └─ <ts>_cron_jobs.sql
```

### ضمانات عدم التعارض
- لا تعديل على `crm_customers` (لا أعمدة، لا triggers تكسر).
- لا تعديل على `useCRMCustomers` الأصلي — نلفّه فقط.
- لا تعديل على مسار "منصتي" الأصلي — Impersonation يعمل عبر Wrapper مستقل.
- جميع الجداول الجديدة لها GRANT + RLS كاملة لـ `authenticated` و `service_role`.
- الألوان والخطوط: نفس Wasata Green `#01411C` و Gold `#D4AF37` + Cairo + RTL.

### ترتيب التنفيذ
1. Migration المرحلة 1 (customer_assignments) + UI التعيين.
2. Impersonation.
3. تحليلات الأعضاء.
4. Migration المرحلة 4 + Edge Functions + UI المساعد الصامت/التوقعات.
5. توزيع العملاء التلقائي.

سأبدأ بعد موافقتك على الخطة بتشغيل migration المرحلة 1 أولاً وانتظار اعتمادك له قبل المتابعة للكود.
