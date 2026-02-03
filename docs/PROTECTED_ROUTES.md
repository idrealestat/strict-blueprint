# ⚠️ الروابط والملفات المحمية - لا تعدل بدون إذن

هذا المستند يوثق الروابط والملفات المحمية التي يجب عدم تعديلها بدون موافقة صريحة من المستخدم.

---

## 🔒 القسم الأول: تبويب العروض (محمي بشكل صارم)

### الوظائف المحمية
| الوظيفة | الوصف | الملف |
|---------|-------|-------|
| `toggleOfferVisibility()` | إخفاء/إظهار العرض | `MyPlatformComplete.tsx` |
| `handleDeleteOffer()` | حذف العرض (Soft Delete) | `MyPlatformComplete.tsx` |
| `cityHierarchy` | الهيكل الهرمي (مدينة ← حي ← عرض) | `MyPlatformComplete.tsx` |
| `dbListings` | العروض من قاعدة البيانات | `usePlatformListings.ts` |

### الملفات المحمية
- `src/components/platform/MyPlatformComplete.tsx` - تبويب العروض الكامل
- `src/hooks/usePlatformListings.ts` - جلب/تحديث العروض من DB
- `src/components/offers/OfferActionsMenu.tsx` - قائمة إجراءات العرض

---

## 🔒 القسم الثاني: تبويب المنصة (محمي بشكل صارم)

### الوظائف المحمية
| الوظيفة | الوصف |
|---------|-------|
| عرض العروض الظاهرة فقط | فلتر `status=published && isHidden=false` |
| التزامن مع تبويب العروض | استخدام `ownerListingsFromParent` من المكون الأب |
| بناء الهيكل الهرمي | `buildHierarchy()` لعرض المدن والأحياء |

### الملفات المحمية
- `src/components/platform/MyPublicPlatformContent.tsx` - معاينة المنصة للمالك
- `src/components/platform/MyPlatformComplete.tsx` - تمرير `dbListings` كـ `ownerListingsFromParent`

---

## 🔒 القسم الثالث: منصة النشر العامة (محمي بشكل صارم - مقفل تماماً)

> ⛔ **تحذير صارم:** هذا القسم مقفل تماماً ولا يُعدّل بدون إذن مباشر من المستخدم!

### الروابط المحمية
| الرابط | الغرض | الملف |
|--------|-------|-------|
| `wasataai.com/:slug` | الصفحة الرئيسية للمنصة العامة | `SlugPlatformPage.tsx` |
| `wasataai.com/:slug/:city/:district/:offerId` | صفحة تفاصيل العرض | `SlugOfferDetailsPage.tsx` |
| `wasataai.com/platform/:slug` | المنصة العامة (مسار بديل) | `PublicPlatformPage.tsx` |

### سياسات RLS المحمية (قاعدة البيانات)
```sql
-- الزوار يرون فقط العروض المنشورة والظاهرة
Policy: "Public can view published listings"
USING: (status = 'published' AND is_hidden = false)

-- المالك يرى جميع عروضه
Policy: "Users can view their own listings"
USING: (auth.uid() = user_id)

-- سياسة business_cards المحمية (تم إصلاحها 2026-02-03)
Policy: "Anyone can view published cards or owners view their own"
USING: (published = true OR auth.uid() = user_id)

-- صلاحية تنفيذ دالة الملكية (تم منحها للمستخدمين المسجلين)
GRANT EXECUTE ON FUNCTION check_business_card_ownership TO authenticated;
```

### سلوك الرجوع المحمي
- زر الرجوع/الإغلاق من صفحة العرض يعود دائماً إلى `/{slug}`
- لا يعود لمستوى المدينة أو الحي

### الملفات المحمية
- `src/pages/SlugPlatformPage.tsx` - الصفحة الرئيسية العامة
- `src/pages/SlugOfferDetailsPage.tsx` - تفاصيل العرض + سلوك الرجوع
- `src/pages/PublicPlatformPage.tsx` - صفحة المنصة العامة (مسار بديل)
- `src/components/platform/MyPublicPlatformContent.tsx` - محتوى المنصة العامة
- `src/hooks/usePublicBusinessCard.ts` - جلب بيانات البطاقة العامة

---

## 🔒 القسم الرابع: نظام المشاهدات المباشرة (محمي بشكل صارم)

### المستويات المحمية
| المستوى | الدالة | الوظيفة |
|---------|--------|---------|
| المدينة | `getCityViewers(cityName)` | إجمالي المشاهدين في المدينة |
| الحي | `getDistrictViewers(city, district)` | إجمالي المشاهدين في الحي |
| العرض | `getOfferViewers(offerId)` | المشاهدين على العرض المحدد |

### قواعد التطبيع المحمية
- `normalizeKeyPart()` - توحيد المسافات وإزالة التشكيل
- `normalizeDistrictName()` - إزالة "حي " للتطابق
- الزائر يُسجل بـ `city` و `district` من سجل العرض في DB

### الملفات المحمية
- `src/hooks/useLiveViewersRealtime.ts` - منطق Presence + تطبيع المفاتيح
- `src/components/ui/LiveViewerIndicator.tsx` - مؤشر العين الحمراء/الخضراء

---

## 🔒 القسم الخامس: التزامن بين التبويبات (محمي)

### آلية العمل المحمية
```mermaid
graph LR
    A[تبويب العروض] -->|dbListings| B[تبويب المنصة]
    A -->|updateListing + fetchListings| C[قاعدة البيانات]
    C -->|RLS Filter| D[منصة النشر العامة]
```

### القواعد المحمية
1. عند إخفاء عرض من تبويب العروض → يتم تحديث `is_hidden=true` في DB
2. تبويب المنصة يعرض فقط العروض الظاهرة (`isHidden=false`)
3. منصة النشر العامة تطبق سياسة RLS تلقائياً

---

## 🔒 القسم السادس: هيدر المنصة (محمي بشكل صارم)

### القواعد المحمية
| القاعدة | الوصف |
|---------|-------|
| مصدر البيانات | `businessCardData` من قاعدة البيانات فقط |
| لا قيم وهمية | تم حذف `digitalCardHeader` و `'مستخدم تجريبي'` |
| الألوان | ثابتة من نظام التصميم (`#01411C`, `#D4AF37`) |
| صورة الغلاف | من `businessCardData.coverImage` |
| الشعار | من `businessCardData.logoImage || profileImage` |

### أزرار الإجراءات المحمية (في الهيدر)
| الزر | الرابط | الوظيفة |
|------|--------|---------|
| إرسال طلب | `wasataai.com/{slug}/request` | فتح نموذج الطلب |
| إرسال عرض | `wasataai.com/{slug}/offer` | فتح نموذج العرض |
| عرض سعر | `wasataai.com/{slug}/quote` | فتح نموذج عرض السعر |
| إنشاء موعد | `wasataai.com/{slug}/appointment` | فتح نموذج الموعد |
| مشاركة البطاقة | `wasataai.com/{slug}/card` | مشاركة البطاقة الرقمية |

### الملفات المحمية
- `src/components/platform/MyPublicPlatformContent.tsx` - أزرار الإجراءات في الهيدر
- `src/components/platform/MyPlatformComplete.tsx` - هيدر تبويب منصتي

---

## 🔒 القسم السابع: النماذج العامة (محمي بشكل صارم - مقفل تماماً)

> ⛔ **تحذير صارم:** هذا القسم مقفل تماماً ولا يُعدّل بدون إذن مباشر من المستخدم!

### الصفحات المحمية المقفلة
| الصفحة | الرابط | الملف | الحالة |
|--------|--------|-------|--------|
| إرسال عرض | `/:slug/offer` | `PublicOfferForm.tsx` | 🔒 مقفل |
| إرسال طلب | `/:slug/request` | `PublicRequestForm.tsx` | 🔒 مقفل |
| عرض سعر | `/:slug/quote` | `PublicPriceQuoteForm.tsx` | 🔒 مقفل |
| إنشاء/جدولة موعد | `/:slug/calendar` | `PublicAppointmentForm.tsx` | 🔒 مقفل |

### القواعد المحمية
| القاعدة | الوصف |
|---------|-------|
| مصدر البيانات | من قاعدة البيانات `business_cards` فقط (مع `published = true`) |
| لا بيانات وهمية | تم حذف `getMockBroker()` نهائياً من جميع الملفات |
| شاشة تحميل | تظهر حتى جلب بيانات الوسيط الحقيقية |
| الهيدر | يستخدم `PublicFormLayout` مع بيانات الوسيط الحقيقية |

### سياسات RLS المحمية (تم إصلاحها 2026-02-03)
```sql
-- سياسة القراءة للبطاقات المنشورة (متاحة للجميع)
Policy: "Anyone can view published cards or owners view their own"
ON: public.business_cards
FOR: SELECT
USING: (published = true OR auth.uid() = user_id)

-- صلاحية تنفيذ دالة الملكية
GRANT EXECUTE ON FUNCTION check_business_card_ownership TO authenticated;

-- سياسة التحديث (للمستخدمين المسجلين فقط)
Policy: "Users can update their own business card"
ON: public.business_cards
FOR: UPDATE
TO: authenticated
USING: (auth.uid() = user_id OR check_business_card_ownership(...))
WITH CHECK: (auth.uid() = user_id)
```

### الملفات المحمية المقفلة
| الملف | الوصف | الحالة |
|-------|-------|--------|
| `src/pages/public-forms/PublicFormLayout.tsx` | الهيدر المشترك للنماذج | 🔒 مقفل |
| `src/pages/public-forms/PublicOfferForm.tsx` | نموذج إرسال عرض | 🔒 مقفل |
| `src/pages/public-forms/PublicRequestForm.tsx` | نموذج إرسال طلب | 🔒 مقفل |
| `src/pages/public-forms/PublicPriceQuoteForm.tsx` | نموذج عرض سعر | 🔒 مقفل |
| `src/pages/public-forms/PublicAppointmentForm.tsx` | نموذج جدولة موعد | 🔒 مقفل |
| `src/pages/public-forms/index.ts` | تصدير النماذج | 🔒 مقفل |

### الممنوعات (بشكل قاطع)
- ❌ إعادة إضافة `getMockBroker()` أو أي بيانات وهمية
- ❌ عرض النموذج قبل تحميل بيانات الوسيط
- ❌ استخدام قيم افتراضية مثل "أحمد محمد" أو "شركة الوساطة"
- ❌ تعديل سياسات RLS بدون إذن صريح
- ❌ تغيير روابط الصفحات العامة

---

## الروابط المحمية الأخرى

### أزرار بطاقة الأعمال الرقمية
| الزر | الصفحة العامة | الملف |
|------|--------------|-------|
| إرسال عرض | `/:slug/offer` | `SlugOfferPage.tsx` |
| إرسال طلب | `/:slug/request` | `SlugRequestPage.tsx` |
| إنشاء موعد | `/:slug/calendar` | `SlugCalendarPage.tsx` |
| عرض سعر | `/:slug/quote` | `SlugQuotePage.tsx` |

### روابط المواعيد
| الرابط | الغرض | الملف |
|--------|-------|-------|
| `/:slug/appointmentapproval/broker/:appointmentId` | تأكيد حضور الوسيط | `SlugAppointmentApprovalBroker.tsx` |
| `/:slug/appointmentapproval/customer/:appointmentId` | تأكيد حضور العميل | `SlugAppointmentApprovalCustomer.tsx` |
| `/:slug/appointmentapproval/sorry` | صفحة الاعتذار | `SlugAppointmentApprovalSorry.tsx` |

### الفرص الذكية
| الرابط | الغرض |
|--------|-------|
| `/app/smart-opportunities` | صفحة الفرص الذكية |
| `/app/offers-requests` | صفحة العروض والطلبات المقبولة |

---

## ⛔ قواعد الحماية الصارمة

### 1. 🚫 لا تعديل بدون إذن صريح
أي تغيير على الملفات أو الوظائف المذكورة أعلاه يتطلب:
- **إبلاغ المستخدم بالعربية** بسبب التعديل المطلوب
- **انتظار الموافقة أو الرفض** قبل أي تنفيذ

### 2. 📝 صيغة طلب الإذن (إلزامية)
```
⚠️ أحتاج لتعديل [اسم الملف/الوظيفة]
السبب: [شرح واضح بالعربية]
التأثير: [ما الذي سيتغير]
هل توافق على هذا التعديل؟ (نعم / لا)
```

### 3. 🔗 الحفاظ على الروابط
أي تغيير في مسار الرابط يكسر الروابط المشاركة سابقاً

### 4. ✅ الاختبار بعد التعديل
التأكد من عمل جميع الوظائف بعد أي تغيير مُوافق عليه

### 5. 👁️ حماية نظام المشاهدات
لا تعديل على منطق Presence أو التطبيع بدون إذن

### 6. ↩️ حماية سلوك الرجوع
الرجوع من العرض يعود لـ `/{slug}` فقط - لا تغيير

### 7. 🔄 حماية التزامن
لا تعديل على آلية تمرير `dbListings` بين التبويبات

### 8. 🎨 حماية الهيدر
- لا استخدام لـ `digitalCardHeader` - تم حذفه نهائياً
- لا قيم وهمية مثل `'مستخدم تجريبي'`
- البيانات من `businessCardData` (قاعدة البيانات) فقط

### 9. 📋 حماية النماذج العامة (مقفل تماماً)
- لا إعادة لـ `getMockBroker()` - تم حذفه نهائياً
- لا عرض للنموذج قبل تحميل بيانات الوسيط
- الهيدر يعرض بيانات البطاقة الرقمية الحقيقية فقط

### 10. 🔐 حماية سياسات RLS (مقفل تماماً)
- لا تعديل على سياسات `business_cards` بدون إذن صريح
- لا تغيير على صلاحيات دالة `check_business_card_ownership`
- السياسات الحالية تم اختبارها وتعمل بشكل صحيح

---

## 🔒 ملخص الأقفال الصارمة

| الفئة | الملفات/الوظائف | الحالة |
|-------|-----------------|--------|
| منصة النشر العامة | `SlugPlatformPage`, `PublicPlatformPage`, `MyPublicPlatformContent` | 🔒 مقفل |
| نموذج إرسال عرض | `PublicOfferForm.tsx` | 🔒 مقفل |
| نموذج إرسال طلب | `PublicRequestForm.tsx` | 🔒 مقفل |
| نموذج عرض سعر | `PublicPriceQuoteForm.tsx` | 🔒 مقفل |
| نموذج جدولة موعد | `PublicAppointmentForm.tsx` | 🔒 مقفل |
| الهيدر المشترك | `PublicFormLayout.tsx` | 🔒 مقفل |
| هوك البطاقة العامة | `usePublicBusinessCard.ts` | 🔒 مقفل |
| سياسات RLS | `business_cards` SELECT/UPDATE policies | 🔒 مقفل |
| دالة الملكية | `check_business_card_ownership` | 🔒 مقفل |

---

**آخر تحديث:** 2026-02-03
**سبب التحديث:** إضافة حماية صارمة على منصة النشر العامة والنماذج العامة بعد إصلاح سياسات RLS
