/**
 * publicPlatform.ts
 * مصدر الحقيقة للـ slug هو قاعدة البيانات (business_cards.slug)
 * localStorage يُستخدم فقط كـ cache للأداء
 */

export function sanitizePublicPlatformSlug(raw: unknown): string {
  const slug = String(raw ?? '').trim();
  if (!slug) return '';

  // Reject pure numeric slugs (these were legacy fallbacks like user.id = "1")
  if (/^\d+$/.test(slug)) return '';

  // Keep URLs consistent with routing + DB lookups
  return slug.toLowerCase();
}

/**
 * يحصل على الـ slug من:
 * 1. الـ fallbacks المقدمة (عادة من DB)
 * 2. localStorage كـ cache فقط
 * ملاحظة: الأفضل دائماً جلب الـ slug من business_cards.slug في DB
 */
export function getPublicPlatformSlug(fallbacks?: Array<unknown>): string {
  // 1) explicit fallbacks from DB (priority)
  for (const f of fallbacks ?? []) {
    const s = sanitizePublicPlatformSlug(f);
    if (s) return s;
  }

  // 2) localStorage as cache only
  const stored = sanitizePublicPlatformSlug(localStorage.getItem('public_platform_slug'));
  if (stored) return stored;

  return '';
}

/**
 * يبني رابط المنصة العامة
 * يجب تمرير الـ slug من DB، لا يوجد fallback افتراضي
 */
export function getPublicPlatformUrl(origin?: string, slug?: unknown): string {
  const publishedDomain = import.meta.env.VITE_PUBLIC_BASE_DOMAIN || 'strict-page-playbook.lovable.app';
  const defaultOrigin = `https://${publishedDomain}`;
  const safeSlug = slug ? sanitizePublicPlatformSlug(slug) : '';
  if (!safeSlug) {
    console.warn('getPublicPlatformUrl: No valid slug provided');
    return origin || defaultOrigin;
  }
  return `${origin || defaultOrigin}/${safeSlug}`;
}

/**
 * يحفظ الـ slug في localStorage كـ cache
 * المصدر الأصلي يبقى DB
 */
export function cachePublicPlatformSlug(slug: string): void {
  const sanitized = sanitizePublicPlatformSlug(slug);
  if (sanitized) {
    localStorage.setItem('public_platform_slug', sanitized);
  }
}
