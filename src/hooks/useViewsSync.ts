/**
 * useViewsSync.ts
 * Hook لمزامنة المشاهدات مع قاعدة البيانات
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showPushNotification } from './usePushNotifications';

interface ViewerInfo {
  device?: string;
  browser?: string;
  os?: string;
  city?: string;
  country?: string;
  ip?: string;
  screenSize?: string;
}

/**
 * Hook لمزامنة المشاهدات مع DB وإرسال الإشعارات
 */
export function useViewsSync() {
  
  /**
   * تسجيل مشاهدة وتحديث DB + إرسال إشعار
   */
  const recordView = useCallback(async (
    offerId: string,
    offerTitle: string,
    viewerInfo?: ViewerInfo
  ): Promise<boolean> => {
    try {
      // 1. تحديث عدد المشاهدات في قاعدة البيانات
      const { data: listing, error: fetchError } = await supabase
        .from('platform_listings')
        .select('views')
        .eq('id', offerId)
        .single();

      if (!fetchError && listing) {
        const newViews = (listing.views || 0) + 1;
        
        await supabase
          .from('platform_listings')
          .update({ views: newViews })
          .eq('id', offerId);

        console.log(`Views updated for ${offerId}: ${newViews}`);
      }

      // 2. إرسال حدث للإشعارات المحلية
      window.dispatchEvent(new CustomEvent('offerViewedWithDetails', {
        detail: {
          offerId,
          offerTitle,
          viewerId: `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          viewerInfo,
          timestamp: new Date().toISOString(),
        }
      }));

      // 3. إرسال Push Notification
      const notificationsEnabled = localStorage.getItem('offer_view_notifications_enabled') !== 'false';
      
      if (notificationsEnabled) {
        await showPushNotification(
          `👁️ مشاهدة جديدة: ${offerTitle}`,
          `${viewerInfo?.device || 'زائر'} من ${viewerInfo?.city || 'موقع غير معروف'}`,
          { type: 'offer_view', offerId, offerTitle, viewerInfo }
        );
      }

      return true;
    } catch (err) {
      console.error('Error recording view:', err);
      return false;
    }
  }, []);

  /**
   * جمع معلومات الزائر
   */
  const collectViewerInfo = useCallback(async (): Promise<ViewerInfo> => {
    const ua = navigator.userAgent;
    
    // تحديد المتصفح
    let browser = 'غير معروف';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    
    // تحديد نظام التشغيل
    let os = 'غير معروف';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    // تحديد نوع الجهاز
    let device = 'كمبيوتر';
    if (/iPhone|iPad|iPod/.test(ua)) device = 'iPhone/iPad';
    else if (/Android/.test(ua)) device = /Mobile/.test(ua) ? 'هاتف أندرويد' : 'تابلت';

    // محاولة الحصول على الموقع
    let locationInfo: { city?: string; country?: string; ip?: string } = {};
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        locationInfo = { ip: data.ip, city: data.city, country: data.country_name };
      }
    } catch (e) {
      // تجاهل الخطأ
    }

    return {
      ...locationInfo,
      device,
      browser,
      os,
      screenSize: `${window.screen.width}x${window.screen.height}`,
    };
  }, []);

  /**
   * تسجيل مشاهدة مع جمع المعلومات تلقائياً
   */
  const recordViewWithInfo = useCallback(async (
    offerId: string,
    offerTitle: string
  ): Promise<boolean> => {
    const viewerInfo = await collectViewerInfo();
    return recordView(offerId, offerTitle, viewerInfo);
  }, [recordView, collectViewerInfo]);

  return {
    recordView,
    collectViewerInfo,
    recordViewWithInfo,
  };
}

export default useViewsSync;
