
# خطة: الموجز الصباحي (Daily Morning Briefing) – النسخة المطوّرة

## الفكرة باختصار
نافذة منبثقة تظهر تلقائياً عند أول دخول في الصباح (أو يدوياً عبر زر "موجز فوري" في الهيدر)، تعرض مستجدات اليوم في بطاقات قابلة للتصفّح، وتُحفظ نسخة منها في جرس الإشعارات للرجوع لاحقاً. في حال غياب 3 أيام، يُعرض "موجز تراكمي – ما فاتك".

---

## 1) محتوى الموجز (12 بطاقة)

| # | البطاقة | المصدر |
|---|---------|--------|
| 1 | مهام اليوم + متأخرات 3 أيام (مع أزرار: تأجيل الكل / إعادة توزيع تلقائي) | `crm_tasks` |
| 2 | مواعيد اليوم | `calendar_appointments` |
| 3 | عملاء جدد آخر 3 أيام | `crm_customers` |
| 4 | عروض/طلبات جديدة | offers + requests + `owner_submissions` |
| 5 | فرص ذكية مطابقة جديدة | `useSmartOpportunities` |
| 6 | طلبات VIP مطابقة | special_requests |
| 7 | تحليلات السوق السريعة (أنا/الفريق/السوق) | `useMarketAnalytics` + `useTeamAnalytics` |
| 8 | مستجدات الفريق | `organization_members` |
| 9 | تنبيهات حرجة (فال، عقود إيجار، عروض على وشك الانتهاء) | تجميع |
| 10 | ملخّص أداء أمس | events + offer_views_log |
| 11 | توصية ذكية (سلوك المستخدم) | `useSmartRecommendations` |
| 12 | فرصة محتملة (تحليل سوق + سلوك) | `useSmartRecommendations` |

**عدم التكرار:** نستثني أي عنصر سبق ظهوره في موجز اليوم أو كإشعار push مفرد.
**شريط تنبيه أحمر علوي:** يظهر فوق البطاقات إذا كانت هناك مهام متأخرة >3 أيام أو عقود تنتهي خلال 24 ساعة.

---

## 2) آلية الظهور
- **تلقائي:** أول جلسة بعد `briefing_time` (افتراضي 07:00 الرياض) لكل تاريخ، عبر `localStorage["briefing_last_shown_date"]` في `MainLayout`.
- **زر "موجز فوري":** أيقونة منفصلة بجوار جرس الإشعارات في `MainHeader` (تظهر فقط لو فعّلها المستخدم في الإعدادات).
- **الجرس:** يُسجَّل إشعار `daily_briefing` واحد بعنوان "موجز اليوم – {date}"، النقر يفتح نفس النافذة محمّلة من `snapshot`.
- **الموجز التراكمي:** إذا كان الفرق بين الآن و`user_last_seen.last_seen_at` > 3 أيام → بطاقة إضافية "📆 ما فاتك" تجمع ملخص الأيام الفائتة.

---

## 3) تجربة المستخدم
- Modal كامل الشاشة على الجوال / كبير على الديسكتوب، RTL، Cairo، ألوان `#01411C` و`#D4AF37`.
- رأس: "صباح الخير 👋 – موجز يومك" + تاريخ هجري وميلادي.
- شريط تقدّم "بطاقة 3 من 10".
- أزرار: التالي / السابق / تخطّي / تذكير بعد ساعة / إغلاق.
- كل بطاقة: عدد العناصر + أول 3 أمثلة + "عرض الكل" (يفتح الصفحة المعنية بدون إغلاق الموجز) + "تم الاطلاع".
- البطاقات الفارغة تُخفى تلقائياً.

---

## 4) مكان التفعيل في الإعدادات
تبويب جديد داخل `ComprehensiveAppSettings.tsx` باسم **"الموجز الصباحي"**:
- مفتاح تشغيل/إيقاف عام.
- Time Picker لوقت الظهور (افتراضي 07:00).
- أيام التفعيل (سبت–خميس مثلاً).
- Checkboxes لاختيار البطاقات المفعّلة (12).
- مفتاح إرسال نسخة push.
- مفتاح إرسال عبر واتساب (Wasender) – اختياري.
- مفتاح "إظهار زر موجز فوري في الهيدر".
- مفتاح "تفعيل الموجز التراكمي بعد غياب 3 أيام" + اختيار عدد أيام الغياب.
- زر "اعرض موجز اليوم الآن" للتجربة.

---

## 5) الملفات الجديدة
```
src/components/briefing/
  ├─ DailyBriefingModal.tsx
  ├─ BriefingCard.tsx
  ├─ BriefingTrigger.tsx
  ├─ CumulativeBriefingBar.tsx
  └─ cards/
      ├─ TasksCard.tsx (مع أزرار تأجيل/إعادة توزيع)
      ├─ AppointmentsCard.tsx
      ├─ NewCustomersCard.tsx
      ├─ OffersRequestsCard.tsx
      ├─ SmartOpportunitiesCard.tsx
      ├─ VIPRequestsCard.tsx
      ├─ MarketAnalyticsCard.tsx
      ├─ TeamUpdatesCard.tsx
      ├─ CriticalAlertsCard.tsx
      ├─ YesterdayPerformanceCard.tsx
      ├─ SmartRecommendationCard.tsx
      └─ PotentialOpportunityCard.tsx

src/hooks/
  ├─ useDailyBriefing.ts
  ├─ useBriefingSettings.ts
  ├─ useSmartRecommendations.ts
  └─ useCumulativeBriefing.ts

src/components/settings/
  └─ DailyBriefingSettings.tsx
```
دمج `BriefingTrigger` داخل `MainHeader`، وفتح تلقائي من `MainLayout`، وتوجيه فتح من `NotificationsSidebar` عبر `action_url`.

---

## 6) قاعدة البيانات (Migration واحدة)
- `daily_briefing_settings` (إعدادات المستخدم + كل المفاتيح الجديدة).
- `daily_briefing_log` (snapshot يومي + read_cards + opened/dismissed).
- `user_last_seen` (لمنطق الموجز التراكمي).
كلها بـ RLS صارمة `auth.uid() = user_id` و GRANT للـ authenticated + service_role.

---

## 7) مراحل التنفيذ

1. **المرحلة 1 (MVP):** Migration + `useDailyBriefing` + Modal + 4 بطاقات (مهام، مواعيد، فرص ذكية، تنبيهات حرجة) + الفتح التلقائي + تبويب الإعدادات + **زر "موجز فوري" في الهيدر** + **شريط التنبيه الأحمر**.
2. **المرحلة 2:** باقي البطاقات حتى 10 + تكامل الجرس + منطق "الموجز التراكمي" + بطاقة "ما فاتك".
3. **المرحلة 3:** أزرار إدارة المهام (تأجيل/إعادة توزيع) + بطاقتي التوصية الذكية والفرصة المحتملة (11 و12) + Edge Function للجدولة الخلفية + إرسال Push/WhatsApp.

---

## 8) ملاحظات احترام بنية المشروع
- لا مساس بوحدات Core المحمية (Platform / CRM / Publishing) – نقرأ منها فقط.
- خط Cairo + RTL صارم + ألوان الهوية.
- لا مفاتيح API خارجية جديدة في المرحلة 1.

ابدأ بالمرحلة 1 عند الموافقة.
