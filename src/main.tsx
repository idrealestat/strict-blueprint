import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// تسجيل Service Worker للإشعارات Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);
      
      // طلب إذن الإشعارات إذا لم يتم طلبه من قبل
      if ('Notification' in window && Notification.permission === 'default') {
        // سيتم طلب الإذن عند أول تفاعل للمستخدم
        console.log('📱 Notifications permission can be requested');
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
