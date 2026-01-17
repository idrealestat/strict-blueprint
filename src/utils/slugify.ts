/**
 * slugify.ts
 * تحويل النصوص العربية/الإنجليزية إلى slugs صالحة للروابط
 */

// خريطة الحروف العربية إلى اللاتينية
const arabicToLatinMap: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
  'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a',
  'و': 'w', 'ي': 'y', 'ى': 'a',
  'ئ': 'e', 'ء': '', 'ؤ': 'o',
};

// خريطة المدن الشائعة
const citySlugMap: Record<string, string> = {
  'الرياض': 'riyadh',
  'جدة': 'jeddah',
  'مكة': 'makkah',
  'مكة المكرمة': 'makkah',
  'المدينة': 'madinah',
  'المدينة المنورة': 'madinah',
  'الدمام': 'dammam',
  'الخبر': 'alkhobr',
  'الظهران': 'dhahran',
  'تبوك': 'tabuk',
  'أبها': 'abha',
  'الطائف': 'taif',
  'بريدة': 'buraidah',
  'القصيم': 'qassim',
  'حائل': 'hail',
  'نجران': 'najran',
  'جازان': 'jazan',
  'الجبيل': 'jubail',
  'ينبع': 'yanbu',
  'الأحساء': 'ahsa',
  'القطيف': 'qatif',
  'خميس مشيط': 'khamis',
};

/**
 * تحويل نص عربي إلى slug
 */
export function arabicToSlug(text: string): string {
  if (!text) return '';
  
  // تنظيف النص
  let slug = text.trim().toLowerCase();
  
  // التحقق من وجود ترجمة مباشرة للمدن
  const directMapping = citySlugMap[text.trim()];
  if (directMapping) return directMapping;
  
  // إزالة "حي" و"منطقة" من البداية
  slug = slug.replace(/^(حي|منطقة)\s*/i, '');
  
  // تحويل الحروف العربية
  let result = '';
  for (const char of slug) {
    if (arabicToLatinMap[char] !== undefined) {
      result += arabicToLatinMap[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else if (char === ' ' || char === '-' || char === '_') {
      result += '-';
    }
  }
  
  // تنظيف الـ dashes المتكررة
  result = result.replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  return result || 'item';
}

/**
 * تحويل slug إلى نص عربي (للعرض)
 * يستخدم الخريطة العكسية للمدن
 */
export function slugToArabic(slug: string): string {
  if (!slug) return '';
  
  // البحث في خريطة المدن
  const cityEntry = Object.entries(citySlugMap).find(([, value]) => value === slug);
  if (cityEntry) return cityEntry[0];
  
  // إرجاع الـ slug كما هو مع تنسيق
  return slug.replace(/-/g, ' ');
}

/**
 * بناء رابط المدينة
 */
export function buildCityUrl(baseSlug: string, cityName: string): string {
  const citySlug = arabicToSlug(cityName);
  return `/${baseSlug}/${citySlug}`;
}

/**
 * بناء رابط الحي
 */
export function buildDistrictUrl(baseSlug: string, cityName: string, districtName: string): string {
  const citySlug = arabicToSlug(cityName);
  const districtSlug = arabicToSlug(districtName);
  return `/${baseSlug}/${citySlug}/${districtSlug}`;
}

/**
 * بناء رابط العرض
 */
export function buildOfferUrl(baseSlug: string, cityName: string, districtName: string, offerId: string): string {
  const citySlug = arabicToSlug(cityName);
  const districtSlug = arabicToSlug(districtName);
  // استخدام آخر 8 أحرف من الـ ID للاختصار
  const shortId = offerId.length > 8 ? offerId.slice(-8) : offerId;
  return `/${baseSlug}/${citySlug}/${districtSlug}/${shortId}`;
}

/**
 * الحصول على الدومين المنشور
 */
export function getPublishedDomain(): string {
  return import.meta.env.VITE_PUBLIC_BASE_DOMAIN || 'wasataai.com';
}

/**
 * الحصول على الرابط الكامل
 */
export function getFullUrl(path: string, origin?: string): string {
  const defaultOrigin = `https://${getPublishedDomain()}`;
  return `${origin || defaultOrigin}${path}`;
}

/**
 * استخراج معلومات المسار من الـ URL
 */
export function parseHierarchicalPath(pathname: string): {
  slug?: string;
  citySlug?: string;
  districtSlug?: string;
  offerId?: string;
} {
  const parts = pathname.split('/').filter(Boolean);
  
  return {
    slug: parts[0],
    citySlug: parts[1],
    districtSlug: parts[2],
    offerId: parts[3],
  };
}
