// src/utils/hardReset.ts

const HARD_RESET_VERSION = 'v1';

/**
 * تنظيف جذري لبيانات التطبيق (Client-side فقط) بدون لمس تسجيل الدخول/المستخدم/بطاقات الأعمال.
 * - يمسح مفاتيح localStorage المتعلقة بالعروض/الطلبات/CRM/التحليلات/المسودات
 * - يمسح CacheStorage (إن وجد) لتقليل بقايا الكاش
 * - يعمل مرة واحدة لكل مستخدم (حسب userId) عبر flag
 */
export async function runHardResetOnce(userId?: string): Promise<boolean> {
  const flagKey = `wasata_hard_reset_${HARD_RESET_VERSION}_${userId || 'anon'}`;
  if (localStorage.getItem(flagKey) === 'true') return false;

  const keysToRemove = [
    // Business / Offers
    'wasata_platform_complete',
    'published_ads_list',
    'platform_visibility_state',
    'wasata_published_ads',
    'platform_ads',

    // Requests / Public forms legacy
    'received_documents',
    'wasata_republish_request',

    // CRM legacy
    'customers',
    'crm_customers',

    // Appointments legacy
    'appointments',
    'calendar_appointments',

    // Analytics / logs legacy
    'offer_views_log',
    'wasata_call_logs',

    // Drafts / temp
    'wasata_property_draft',
    'wasata_republish_data',
    'wasata_ai_conversation_id',

    // Images cache (غير خاصة ببطاقة الأعمال)
    'wasata_images',

    // Slugs
    'public_platform_slug',
  ];

  // ملاحظة: لا نمسح أي مفاتيح تبدأ بـ business_card_ أو business_card_swap_
  for (const k of keysToRemove) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }

  // مسح أي مفاتيح قديمة متعلقة بالمنصة بدون لمس بطاقة الأعمال
  try {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isBusinessCard = key.startsWith('business_card_') || key.startsWith('business_card_swap_');
      if (isBusinessCard) continue;

      // مفاتيح مرتبطة بالعروض/الطلبات/التحليلات/المسودات
      const looksLikeWasataData =
        key.startsWith('wasata_') ||
        key === 'published_ads_list' ||
        key === 'platform_visibility_state' ||
        key === 'crm_customers' ||
        key === 'customers' ||
        key === 'received_documents';

      if (looksLikeWasataData && key !== flagKey) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }

  // CacheStorage (PWA/Service Worker cache)
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(flagKey, 'true');
  } catch {
    // ignore
  }

  return true;
}
