/**
 * Service Worker للإشعارات Push
 * يتعامل مع إشعارات مشاهدة العروض
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

// استقبال رسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data } = event.data;
    
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: data?.offerId || 'offer-view',
      renotify: true,
      requireInteraction: false,
      data,
      actions: [
        { action: 'view', title: 'عرض التفاصيل' },
        { action: 'dismiss', title: 'إغلاق' }
      ]
    });
  }
});

// عند النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    // فتح صفحة سجل المشاهدات
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// استقبال Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'مشاهدة جديدة لعرضك',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        { action: 'view', title: 'عرض' },
        { action: 'dismiss', title: 'إغلاق' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '👁️ مشاهدة جديدة', options)
    );
  }
});
