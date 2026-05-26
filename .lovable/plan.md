## الهدف
تطبيق التعديلات الست المطلوبة حرفياً دون لمس أي شيء آخر:
- تلوين أيقونة العين تدريجياً حسب عدد المشاهدين المباشرين.
- إزالة `totalViews` من `LiveViewerIndicator` (الإجمالي يبقى يُعرض من السطور الموجودة أصلاً تحت البطاقات).
- اشتراك Realtime على `offer_views_log` لتشغيل النغمة عند مشاهدات من أجهزة أخرى.
- زر إسكات «نغمة مشاهدات العروض» داخل الرايت سلايدر.

## الملفات التي ستتغير
1. `src/components/ui/LiveViewerIndicator.tsx`
2. `src/components/platform/MyPlatformComplete.tsx`
3. `src/pages/SlugOfferDetailsPage.tsx` (تحقق فقط — يستخدم `LiveViewersBadge` لا `LiveViewerIndicator`، لا تعديل مطلوب)
4. `src/hooks/useOfferViewNotifications.ts`
5. `src/components/layout/RightSlider.tsx`

## التفاصيل

### 1) `LiveViewerIndicator.tsx`
- حذف `totalViews` و`showTotalViews` من `Props` ومن جسم المكون (إزالة كتلة `{showTotalViews && ...}`).
- إضافة دالة `getColorByLiveCount(count)`:
  - `0` → `#22c55e` (أخضر)
  - `<50` → `#eab308` (أصفر)
  - `<100` → `#ef4444` (أحمر)
  - `<500` → `#a855f7` (بنفسجي)
  - وإلا → `#3b82f6` (أزرق)
- تطبيق اللون كـ `backgroundColor` على الدائرة (motion.div) عبر `style={{ backgroundColor: eyeColor }}`، مع لون أيقونة أبيض دائماً عند `liveViewers>0` وأخضر عند `0` (الحفاظ على الحدود الذهبية الحالية عند 0).
- تشغيل النبض (pulse + ring) فقط عند `liveViewers>0` (يبقى كما هو) مع تحديث لون ring ليتوافق مع اللون الجديد.
- الشارة بجانب العين تعرض `liveViewers` دائماً عند `>0` (سلوك حالي).

### 2) `MyPlatformComplete.tsx`
- في الاستخدامات الخمسة لـ `LiveViewerIndicator` (الأسطر 2214, 2252, 2344, 2459, 2630): حذف props `totalViews` و`showTotalViews` فقط. تمرير `liveViewers` و`size` كما هو.
- لا تغيير على السطور التي تعرض `totalViews` نصياً أسفل البطاقات (مثل سطر 2224, 2431) ولا على `Eye {offer.views.toLocaleString()}`.

### 3) `SlugOfferDetailsPage.tsx`
- يستخدم `LiveViewersBadge` (مكون آخر) وليس `LiveViewerIndicator`. لا تعديل — تأكيد فقط.

### 4) `useOfferViewNotifications.ts`
- إضافة `useEffect` يفتح قناة Supabase Realtime:
  ```
  supabase.channel(`offer-views-log-${user.id}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'offer_views_log', filter: `user_id=eq.${user.id}` }, (payload) => {
      if (soundEnabled) soundManager.playSound();
      if (notificationsEnabled) toast.info(`👁️ مشاهدة جديدة: ${payload.new.offer_title || 'عرض'}`);
      loadStats();
    })
    .subscribe();
  ```
- التنظيف: `supabase.removeChannel(channel)`.
- المستمع الحالي على `window` `offerViewedWithDetails` يبقى دون تغيير.
- التبعيات: `[user?.id, soundEnabled, notificationsEnabled, loadStats]`.

### 5) `RightSlider.tsx`
- قراءة الملف للعثور على قسم الإعدادات الحالي (مثلاً ضمن `ComprehensiveAppSettings` أو القسم العام)، وإضافة بطاقة/صف صغير يحتوي:
  - `Switch` متصل بـ state محلي يقرأ ابتدائياً من `localStorage['offer_view_notification_settings']` (الحقل `sound`، افتراضي `true`).
  - عند التغيير: تحديث `localStorage` بنفس المفتاح مع الحفاظ على `enabled`، وبث `window.dispatchEvent(new Event('storage'))` ليلتقطه أي مستهلك.
  - أيقونة `Volume2` عند التفعيل و`VolumeX` عند الكتم.
  - النص: «نغمة مشاهدات العروض».
- التزام بالـ design tokens (لا ألوان مباشرة خارج التوكنز للنص/الحاوية، الـ hex للعين فقط داخل `LiveViewerIndicator`).

## ما لن يتغير
- `useLiveViewersRealtime`, `usePlatformListings`, دوال Presence، `CollapsibleStatsSection`, `CollapsiblePerformanceComparison`.
- قاعدة البيانات، RLS، Edge Functions.
- أي قسم آخر في `MyPlatformComplete` غير الـ 5 استخدامات المذكورة.

## التحقق بعد التنفيذ
- بناء ناجح.
- فتح تبويب العروض في `/app/dashboard`: العين خضراء عند 0، تتحول للون الجدول مع زيادة المشاهدين المباشرين.
- إجمالي المشاهدات لا يزال ظاهراً تحت البطاقات (نص منفصل) و`Eye {offer.views}` كما هو.
- وجود سويتش «نغمة مشاهدات العروض» في الرايت سلايدر يبقى محفوظاً بعد إعادة التحميل.
