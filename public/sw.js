/**
 * Service Worker للإشعارات Push
 * يتعامل مع إشعارات مشاهدة العروض والعروض العقارية الجديدة
 * يعمل في الخلفية حتى لو كان التطبيق مغلقاً
 */

const CACHE_NAME = 'wasata-v1';

// عند تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// عند تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// تحديد أيقونة ولون حسب نوع الإشعار
function getNotificationStyle(type) {
  switch (type) {
    case 'new_offer':
    case 'offer':
      return {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-offer',
        vibrate: [300, 100, 300, 100, 300], // اهتزاز قوي للعروض الجديدة
        requireInteraction: true, // يبقى حتى يتفاعل المستخدم
      };
    case 'smart_opportunity':
      return {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'smart-opportunity',
        vibrate: [400, 100, 400, 100, 400, 100, 400], // اهتزاز مميز للفرص الذكية
        requireInteraction: true, // يبقى حتى يتفاعل المستخدم
      };
    case 'offer_view':
      return {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'offer-view',
        vibrate: [200, 100, 200],
        requireInteraction: false,
      };
    case 'calendar':
      return {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'calendar',
        vibrate: [200, 100, 200],
        requireInteraction: true,
      };
    case 'request':
      return {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'request',
        vibrate: [300, 100, 300],
        requireInteraction: true,
      };
    default:
      return {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'general',
        vibrate: [200, 100, 200],
        requireInteraction: false,
      };
  }
}

// استقبال رسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data } = event.data;
    const style = getNotificationStyle(data?.type);
    
    self.registration.showNotification(title, {
      body,
      icon: icon || style.icon,
      badge: style.badge,
      vibrate: style.vibrate,
      tag: data?.notificationId || data?.offerId || style.tag,
      renotify: true,
      requireInteraction: style.requireInteraction,
      data,
      actions: getActionsForType(data?.type),
      dir: 'rtl',
      lang: 'ar',
    });
  }
});

// تحديد الأزرار حسب نوع الإشعار
function getActionsForType(type) {
  switch (type) {
    case 'new_offer':
    case 'offer':
      return [
        { action: 'view_customer', title: '👤 عرض العميل' },
        { action: 'view', title: '📋 عرض التفاصيل' },
      ];
    case 'smart_opportunity':
      return [
        { action: 'view', title: '🎯 عرض الفرصة' },
        { action: 'view_all', title: '📊 كل الفرص' },
      ];
    case 'offer_view':
      return [
        { action: 'view_stats', title: '📊 الإحصائيات' },
        { action: 'dismiss', title: 'إغلاق' },
      ];
    case 'calendar':
      return [
        { action: 'view', title: '📅 عرض الموعد' },
        { action: 'dismiss', title: 'إغلاق' },
      ];
    case 'request':
      return [
        { action: 'view', title: '📝 عرض الطلب' },
        { action: 'dismiss', title: 'إغلاق' },
      ];
    default:
      return [
        { action: 'view', title: 'عرض التفاصيل' },
        { action: 'dismiss', title: 'إغلاق' },
      ];
  }
}

// عند النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetUrl = '/app/dashboard';
  
  // تحديد الصفحة المستهدفة حسب نوع الإشعار والإجراء
  if (event.action === 'view_customer' && data.customerId) {
    targetUrl = `/app/dashboard?customer=${data.customerId}`;
  } else if (event.action === 'view_stats') {
    targetUrl = '/app/dashboard?tab=analytics';
  } else if (event.action === 'view_all' && data.type === 'smart_opportunity') {
    targetUrl = '/app/smart-opportunities';
  } else if (event.action === 'view') {
    if (data.actionUrl) {
      targetUrl = data.actionUrl;
    } else if (data.type === 'smart_opportunity') {
      targetUrl = '/app/smart-opportunities';
    } else if (data.type === 'new_offer' || data.type === 'offer') {
      targetUrl = data.customerId 
        ? `/app/dashboard?customer=${data.customerId}&tab=offers`
        : '/app/dashboard?section=crm';
    } else if (data.type === 'calendar') {
      targetUrl = '/app/dashboard?tab=calendar';
    } else if (data.type === 'request') {
      targetUrl = '/app/dashboard?section=crm';
    }
  } else if (event.action === 'dismiss') {
    return; // مجرد إغلاق
  } else {
    // النقر على الإشعار نفسه (وليس زر)
    if (data.actionUrl) {
      targetUrl = data.actionUrl;
    } else if (data.type === 'smart_opportunity') {
      targetUrl = '/app/smart-opportunities';
    } else if (data.type === 'new_offer' || data.type === 'offer') {
      targetUrl = '/app/dashboard?section=crm';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // البحث عن نافذة مفتوحة للتطبيق
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // تحديث URL والتركيز
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }
      // فتح نافذة جديدة إذا لم تكن هناك نافذة مفتوحة
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// استقبال Push notifications من السيرفر (للمستقبل)
self.addEventListener('push', (event) => {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { 
        title: 'إشعار جديد', 
        body: event.data.text() 
      };
    }
    
    const style = getNotificationStyle(data.type);
    
    const options = {
      body: data.body || 'لديك إشعار جديد',
      icon: style.icon,
      badge: style.badge,
      vibrate: style.vibrate,
      data: data,
      actions: getActionsForType(data.type),
      requireInteraction: style.requireInteraction,
      dir: 'rtl',
      lang: 'ar',
      tag: data.notificationId || style.tag,
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '🔔 إشعار جديد', options)
    );
  }
});

// استقبال حدث إغلاق الإشعار
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});