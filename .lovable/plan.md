## الهدف
استبدال زر "نشر إعلان" المفرد في تبويب العروض داخل صفحة تفاصيل العميل بقائمة فيها خياران:
1. **النشر على منصتي** — السلوك الحالي تماماً (يعبّئ نموذج نشر الإعلان في "منصتي").
2. **النشر على المنصات** — يعبّئ تلقائياً محرر "النشر على منصات التواصل" بنفس بيانات العرض (الوصف، الفيديو/الصور، الهاشتاقات).

## نطاق التغيير
ملف واحد رئيسي + ربط بسيط في ملفين آخرين:

### 1) `src/components/crm/CustomerDetailsPage.tsx`
- في زر "نشر إعلان" داخل تبويب العروض (السطر ~4389) نلفّه بـ `DropdownMenu` (موجود في `@/components/ui/dropdown-menu`) بزر رئيسي بنفس الشكل (أخضر + أيقونة Share2 + نص "نشر إعلان") وبداخله عنصران:
  - **النشر على منصتي** → نفس منطق `republishData` و`localStorage.setItem('wasata_republish_data', ...)` ثم `navigateFromAssistant` + `wasata:openPublishAd` (السلوك الحالي بدون تغيير).
  - **النشر على المنصات** → يُهيّئ كائن `socialPrefill` ويحفظه في `localStorage` ثم ينتقل لصفحة "النشر على المنصات".

#### تركيبة `socialPrefill` (مفتاح: `wasata_social_prefill`):
```ts
{
  description: <نص جاهز يُولَّد من بيانات العرض: نوع العقار + الغرض + المدينة/الحي + المساحة + السعر + المميزات>,
  hashtags: ['#عقارات', '#السعودية', `#${city}`, `#${propertyType}`, ...] ,
  media: offer.media || [],          // صور وفيديوهات
  videoUrl: <أول عنصر media من نوع video إن وُجد>,
  source: 'crm_offer',
  originalOfferId: offer.id,
}
```
ثم:
```ts
navigate('/app/dashboard');
window.dispatchEvent(new CustomEvent('navigateFromAssistant', { detail: { page: 'advertising' } }));
```
(الحالة `advertising` في `App.tsx` تفتح بالفعل `SocialMediaPublishingSystem`.)

### 2) `src/components/social-media-publishing/SocialContentEditorTab.tsx`
- إضافة `useEffect` يقرأ `localStorage.getItem('wasata_social_prefill')` مرة واحدة عند التحميل، فإن وُجد:
  - يفتح قسم `publish` بدل `editor` إن وُجد فيديو جاهز، وإلا يفتح `editor` ويمرّر `videoUrl` لـ `VideoTextEditor` كـ prop ابتدائي (سنضيف prop اختياري `initialVideoUrl`).
  - يحفظ الوصف والهاشتاقات في state ويمرّرها لـ `SocialPublishPanel` عبر props جديدة `initialDescription` و`initialHashtags`.
  - يمسح المفتاح من `localStorage` بعد القراءة لمنع التكرار.
  - يطلق toast: "تم تحميل بيانات العرض من بطاقة العميل".

### 3) `src/components/social-media-publishing/SocialPublishPanel.tsx`
- إضافة props اختيارية: `initialDescription?: string` و`initialHashtags?: string[]`.
- في `useState(...)` نستخدمها كقيم افتراضية.
- لا تغيير في منطق النشر.

### 4) `src/components/social-media-publishing/VideoTextEditor.tsx`
- إضافة prop اختياري `initialVideoUrl?: string` يُحمَّل في `useEffect` لاستدعاء نفس مسار رفع الفيديو الحالي (تعيين `videoUrl` و`videoSrc`).

## ملاحظات
- لا تعديل على قاعدة البيانات أو الـ Edge Functions.
- لا تأثير على السلوك الحالي للنشر على منصتي — فقط أُضيف خيار جانبي.
- بيانات العرض المنقولة هي نفسها المتوفرة بالفعل في `offer` داخل تبويب العروض.
- مفتاح `wasata_social_prefill` يُستهلك مرة واحدة ثم يُحذف لتفادي إعادة التعبئة عند الزيارات اللاحقة.
