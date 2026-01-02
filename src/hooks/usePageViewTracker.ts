/**
 * usePageViewTracker.ts
 * Hook لتسجيل مشاهدات الصفحات العامة
 */

import { useEffect, useRef } from 'react';

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

export function usePageViewTracker(pageType: string, pageSlug?: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!pageSlug || hasTracked.current) return;

    // تسجيل المشاهدة مرة واحدة فقط
    hasTracked.current = true;

    // جمع معلومات الزائر
    const ua = navigator.userAgent;
    let browser = 'غير معروف';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    let os = 'غير معروف';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    let device = 'Desktop';
    if (/Mobile|Android|iPhone/.test(ua)) device = 'Mobile';
    if (/Tablet|iPad/.test(ua)) device = 'Tablet';

    const viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const viewLog: ViewLog = {
      pageType,
      pageSlug,
      timestamp: new Date().toISOString(),
      viewerId,
      device,
      browser,
      os,
    };

    // حفظ في localStorage
    try {
      const existingLogs: ViewLog[] = JSON.parse(localStorage.getItem('public_pages_views_log') || '[]');
      existingLogs.push(viewLog);
      
      // الاحتفاظ بآخر 1000 سجل فقط
      const trimmedLogs = existingLogs.slice(-1000);
      localStorage.setItem('public_pages_views_log', JSON.stringify(trimmedLogs));
      
      // إرسال حدث للتحديث
      window.dispatchEvent(new CustomEvent('pageViewRecorded', { detail: viewLog }));
    } catch (error) {
      console.error('Error saving view log:', error);
    }

    // إعادة التعيين عند تغيير الصفحة
    return () => {
      hasTracked.current = false;
    };
  }, [pageType, pageSlug]);
}

// دالة مساعدة للحصول على إحصائيات صفحة معينة
export function getPageStats(pageType: string) {
  try {
    const viewsLog: ViewLog[] = JSON.parse(localStorage.getItem('public_pages_views_log') || '[]');
    const pageViews = viewsLog.filter(v => v.pageType === pageType);
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return {
      total: pageViews.length,
      today: pageViews.filter(v => new Date(v.timestamp).getTime() >= todayStart).length,
    };
  } catch {
    return { total: 0, today: 0 };
  }
}
