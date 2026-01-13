/**
 * PushNotificationPrompt.tsx
 * مكون لطلب إذن الإشعارات Push من المستخدم
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const { isSupported, permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    // التحقق إذا تم رفض الطلب سابقاً
    const dismissed = localStorage.getItem('push_notification_dismissed');
    const lastPrompt = localStorage.getItem('push_notification_last_prompt');
    
    if (dismissed === 'true') {
      setHasBeenDismissed(true);
      return;
    }

    // عرض الطلب بعد 5 ثواني من فتح التطبيق
    // وفقط إذا لم يتم عرضه في آخر 24 ساعة
    const now = Date.now();
    const lastPromptTime = lastPrompt ? parseInt(lastPrompt) : 0;
    const dayInMs = 24 * 60 * 60 * 1000;

    if (isSupported && permission === 'default' && (now - lastPromptTime > dayInMs)) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('push_notification_last_prompt', now.toString());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
      toast.success('🔔 تم تفعيل الإشعارات! ستصلك إشعارات عند استلام عروض وطلبات جديدة');
    } else {
      toast.error('لم يتم تفعيل الإشعارات. يمكنك تفعيلها لاحقاً من الإعدادات');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push_notification_dismissed', 'true');
    setHasBeenDismissed(true);
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // سيظهر مرة أخرى بعد 24 ساعة
  };

  // لا تعرض إذا:
  // - غير مدعوم
  // - تم الإذن بالفعل
  // - تم رفضه بشكل دائم
  if (!isSupported || permission === 'granted' || hasBeenDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-wasata-gold overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-wasata-green to-wasata-green-dark p-4 text-white relative">
              <button
                onClick={handleDismiss}
                className="absolute top-2 left-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">تفعيل الإشعارات</h3>
                  <p className="text-sm text-white/80">ابقَ على اطلاع دائماً</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                فعّل الإشعارات لتصلك تنبيهات فورية عند:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  استلام عرض عقاري جديد
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  استلام طلب عقاري جديد
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  مشاهدة أحد عروضك المنشورة
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  فرص ذكية مطابقة لعروضك
                </li>
              </ul>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleEnableNotifications}
                  className="flex-1 bg-wasata-green hover:bg-wasata-green-dark text-white"
                >
                  <Bell className="w-4 h-4 ml-2" />
                  تفعيل الإشعارات
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRemindLater}
                  className="text-gray-600"
                >
                  لاحقاً
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                <Smartphone className="w-3 h-3 inline ml-1" />
                يعمل على الجوال والمتصفح
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
