/**
 * usePushNotifications.ts
 * Hook لإدارة إشعارات Push للهاتف
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
  });

  // التحقق من دعم الإشعارات
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'default',
      }));

      if (isSupported && Notification.permission === 'granted') {
        registerServiceWorker();
      }
    };

    checkSupport();
  }, []);

  // تسجيل Service Worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      setState(prev => ({ ...prev, isSubscribed: true }));
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  // طلب إذن الإشعارات
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('المتصفح لا يدعم الإشعارات');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await registerServiceWorker();
        toast.success('تم تفعيل الإشعارات بنجاح');
        return true;
      } else if (permission === 'denied') {
        toast.error('تم رفض إذن الإشعارات');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('خطأ في طلب إذن الإشعارات');
      return false;
    }
  }, [state.isSupported]);

  // إرسال إشعار محلي
  const sendLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    if (!state.isSupported || Notification.permission !== 'granted') {
      console.log('Notifications not available');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // إرسال رسالة إلى Service Worker لعرض الإشعار
      registration.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: '/favicon.ico',
        data,
      });

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, [state.isSupported]);

  // إرسال إشعار مشاهدة عرض
  const sendViewNotification = useCallback(async (
    offerTitle: string,
    viewerInfo: {
      city?: string;
      device?: string;
      browser?: string;
    }
  ) => {
    const title = `👁️ مشاهدة جديدة: ${offerTitle}`;
    const body = `${viewerInfo.device || 'زائر'} من ${viewerInfo.city || 'موقع غير معروف'}`;
    
    return sendLocalNotification(title, body, {
      type: 'offer_view',
      offerTitle,
      ...viewerInfo,
    });
  }, [sendLocalNotification]);

  // إرسال إشعار عرض عقاري جديد
  const sendOfferNotification = useCallback(async (
    offerInfo: {
      ownerName: string;
      propertyType: string;
      purpose: string;
      city?: string;
      offerId?: string;
      customerId?: string;
    }
  ) => {
    const title = `🏠 عرض عقاري جديد`;
    const body = `${offerInfo.ownerName} - ${offerInfo.propertyType} ${offerInfo.purpose}${offerInfo.city ? ` في ${offerInfo.city}` : ''}`;
    
    return sendLocalNotification(title, body, {
      type: 'new_offer',
      actionUrl: '/app/crm',
      ...offerInfo,
    });
  }, [sendLocalNotification]);

  // إرسال إشعار طلب عقاري جديد
  const sendRequestNotification = useCallback(async (
    requestInfo: {
      clientName: string;
      propertyType: string;
      purpose: string;
      city?: string;
      requestId?: string;
      customerId?: string;
    }
  ) => {
    const title = `🔍 طلب عقاري جديد`;
    const body = `${requestInfo.clientName} - ${requestInfo.propertyType} ${requestInfo.purpose}${requestInfo.city ? ` في ${requestInfo.city}` : ''}`;
    
    return sendLocalNotification(title, body, {
      type: 'new_request',
      actionUrl: '/app/crm',
      ...requestInfo,
    });
  }, [sendLocalNotification]);

  // إرسال إشعار موعد جديد
  const sendAppointmentNotification = useCallback(async (
    appointmentInfo: {
      customerName: string;
      appointmentType: string;
      date: string;
      time: string;
      appointmentId?: string;
    }
  ) => {
    const title = `📅 موعد جديد`;
    const body = `${appointmentInfo.customerName} - ${appointmentInfo.appointmentType} في ${appointmentInfo.date} ${appointmentInfo.time}`;
    
    return sendLocalNotification(title, body, {
      type: 'new_appointment',
      actionUrl: '/app/calendar',
      ...appointmentInfo,
    });
  }, [sendLocalNotification]);

  // إرسال إشعار طلب عرض سعر جديد
  const sendQuoteNotification = useCallback(async (
    quoteInfo: {
      clientName: string;
      serviceType: string;
      propertyType?: string;
      quoteId?: string;
    }
  ) => {
    const title = `💰 طلب عرض سعر جديد`;
    const body = `${quoteInfo.clientName} - ${quoteInfo.serviceType}${quoteInfo.propertyType ? ` لـ ${quoteInfo.propertyType}` : ''}`;
    
    return sendLocalNotification(title, body, {
      type: 'new_quote',
      actionUrl: '/app/crm',
      ...quoteInfo,
    });
  }, [sendLocalNotification]);

  // إرسال إشعار فرصة ذكية جديدة
  const sendSmartOpportunityNotification = useCallback(async (
    opportunityInfo: {
      similarityScore: number;
      otherItemTitle: string;
      otherBrokerName?: string;
      opportunityKey: string;
      matchType: 'offer_to_request' | 'request_to_offer';
      city?: string;
      propertyType?: string;
    }
  ) => {
    const isOffer = opportunityInfo.matchType === 'offer_to_request';
    const emoji = opportunityInfo.similarityScore >= 90 ? '🎯' : opportunityInfo.similarityScore >= 80 ? '✨' : '💡';
    
    const title = `${emoji} فرصة ذكية ${opportunityInfo.similarityScore}%`;
    const body = `${isOffer ? 'عرض يطابق طلبك' : 'طلب يطابق عرضك'}: ${opportunityInfo.otherItemTitle}${opportunityInfo.otherBrokerName ? ` - ${opportunityInfo.otherBrokerName}` : ''}`;
    
    return sendLocalNotification(title, body, {
      type: 'smart_opportunity',
      actionUrl: '/app/smart-opportunities',
      ...opportunityInfo,
    });
  }, [sendLocalNotification]);

  // إلغاء الاشتراك
  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      setState(prev => ({ ...prev, isSubscribed: false }));
      toast.success('تم إلغاء الاشتراك في الإشعارات');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, []);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
    sendViewNotification,
    sendOfferNotification,
    sendRequestNotification,
    sendAppointmentNotification,
    sendQuoteNotification,
    sendSmartOpportunityNotification,
    unsubscribe,
  };
}

// دالة لعرض إشعار بسيط (للاستخدام خارج React)
export async function showPushNotification(title: string, body: string, data?: any) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: '/favicon.ico',
        data,
      });
      return true;
    }
    
    // Fallback للمتصفحات التي لا تدعم Service Worker
    new Notification(title, { body, icon: '/favicon.ico' });
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}
