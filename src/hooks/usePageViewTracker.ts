/**
 * usePageViewTracker.ts
 * Hook لتسجيل مشاهدات الصفحات العامة
 * يستخدم نظام الأحداث الموحد للتسجيل في قاعدة البيانات
 */

import { useEffect, useRef } from 'react';
import { trackEvent, EventChannel, EntityType } from './useEventTracker';

interface ViewLog {
  pageType: string;
  pageSlug: string;
  timestamp: string;
  viewerId: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export function usePageViewTracker(
  pageType: string, 
  pageSlug?: string,
  channel: EventChannel = 'public_web'
) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!pageSlug || hasTracked.current) return;

    // تسجيل المشاهدة مرة واحدة فقط
    hasTracked.current = true;

    // تسجيل الحدث في قاعدة البيانات
    trackEvent({
      eventName: 'page_view',
      actorType: 'visitor',
      channel,
      entityType: pageType as EntityType,
      entityId: pageSlug,
      metadata: {
        url: window.location.href,
        referrer: document.referrer || null,
      },
    }).then((success) => {
      if (success) {
        // إرسال حدث للتحديث في الواجهة
        window.dispatchEvent(new CustomEvent('pageViewRecorded', { 
          detail: { pageType, pageSlug, channel } 
        }));
      }
    }).catch(console.error);

    // إعادة التعيين عند تغيير الصفحة
    return () => {
      hasTracked.current = false;
    };
  }, [pageType, pageSlug, channel]);
}

// دالة مساعدة للحصول على إحصائيات صفحة معينة (للتوافق مع الكود القديم)
export function getPageStats(pageType: string) {
  // الآن نستخدم البيانات من قاعدة البيانات
  // هذه الدالة موجودة للتوافق مع الكود القديم
  return { total: 0, today: 0 };
}
