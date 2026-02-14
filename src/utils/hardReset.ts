// src/utils/hardReset.ts
// تنظيف جذري وشامل لبيانات التطبيق (Clean Slate)

const HARD_RESET_VERSION = 'v3'; // تم تحديث الإصدار لإعادة التنظيف وإزالة assistant_silent_mode

/**
 * تنظيف جذري لبيانات التطبيق (Client-side) بدون لمس:
 * - بيانات تسجيل الدخول/المستخدم
 * - بطاقة الأعمال الرقمية
 */
export async function runHardResetOnce(userId?: string): Promise<boolean> {
  const flagKey = `wasata_hard_reset_${HARD_RESET_VERSION}_${userId || 'anon'}`;
  if (localStorage.getItem(flagKey) === 'true') return false;

  // قائمة شاملة بجميع المفاتيح المطلوب حذفها
  const keysToRemove = [
    // ======= منصتي / العروض =======
    'wasata_platform_complete',
    'published_ads_list',
    'platform_visibility_state',
    'wasata_published_ads',
    'platform_ads',
    'wasata_offers',
    'offers_cache',
    'public_platform_slug',
    
    // ======= الطلبات / النماذج العامة =======
    'received_documents',
    'wasata_republish_request',
    'wasata_requests',
    'requests_cache',
    
    // ======= إدارة العملاء (CRM) =======
    'customers',
    'crm_customers',
    'linked_customers',
    'crm_column_order',
    'crm_migrated_*',
    
    // ======= التقويم والمواعيد =======
    'appointments',
    'calendar_appointments',
    'wasata_appointments',
    
    // ======= التحليلات والسجلات =======
    'offer_views_log',
    'wasata_call_logs',
    'wasata_analytics',
    'analytics_cache',
    
    // ======= الفرص الذكية =======
    'smart_opportunities',
    'smart_opportunity_cache',
    
    // ======= المسودات والمؤقتات =======
    'wasata_property_draft',
    'wasata_republish_data',
    'wasata_ai_conversation_id',
    'wasata_images',
    
    // ======= الإشعارات =======
    'wasata_notifications',
    'notifications_cache',
    
    // ======= الرسائل المجدولة =======
    'scheduled_messages',
    'sms_logs',
    
    // ======= المساعد الذكي =======
    'assistant_silent_mode',
  ];

  // حذف المفاتيح المحددة
  for (const k of keysToRemove) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }

  // حذف أي مفاتيح تبدأ بـ wasata_ أو crm_ (ما عدا بطاقة الأعمال)
  try {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // الحفاظ على بطاقة الأعمال
      if (
        key.startsWith('business_card_') || 
        key.startsWith('business_card_swap_') ||
        key === 'supabase.auth.token' ||
        key.includes('sb-') || // Supabase session
        key === flagKey
      ) {
        continue;
      }

      // حذف أي مفتاح مرتبط بالبيانات القديمة
      const shouldDelete =
        key.startsWith('wasata_') ||
        key.startsWith('crm_') ||
        key.startsWith('calendar_') ||
        key.startsWith('offer_') ||
        key.startsWith('smart_') ||
        key.startsWith('analytics_') ||
        key === 'published_ads_list' ||
        key === 'platform_visibility_state' ||
        key === 'customers' ||
        key === 'received_documents' ||
        key === 'appointments';

      if (shouldDelete) {
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

  // تنظيف sessionStorage (ما عدا بيانات الجلسة الحالية)
  try {
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      
      // لا نحذف مفاتيح الترحيب ومفاتيح الجلسة
      if (key.startsWith('welcome_shown_') || key.includes('sb-')) {
        continue;
      }
      
      if (
        key.startsWith('wasata_') ||
        key.startsWith('crm_') ||
        key.startsWith('offer_') ||
        key.startsWith('smart_')
      ) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach((k) => {
      try {
        sessionStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }

  // تنظيف CacheStorage (PWA/Service Worker cache)
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }

  // تسجيل اكتمال التنظيف
  try {
    localStorage.setItem(flagKey, 'true');
    console.log('[HardReset] ✅ تم التنظيف الجذري بنجاح');
  } catch {
    // ignore
  }

  return true;
}

/**
 * إعادة تشغيل التنظيف الجذري (تجاهل الـ flag)
 */
export async function forceHardReset(userId?: string): Promise<boolean> {
  const flagKey = `wasata_hard_reset_${HARD_RESET_VERSION}_${userId || 'anon'}`;
  localStorage.removeItem(flagKey);
  return runHardResetOnce(userId);
}
