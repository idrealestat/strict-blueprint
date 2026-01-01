/**
 * PushNotificationSettings.tsx
 * إعدادات إشعارات Push للهاتف
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, Check, X, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    sendLocalNotification,
    unsubscribe,
  } = usePushNotifications();

  const handleTestNotification = async () => {
    await sendLocalNotification(
      '🔔 إشعار تجريبي',
      'هذا إشعار تجريبي للتأكد من عمل الإشعارات بشكل صحيح',
      { type: 'test' }
    );
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 ml-1" /> مفعل</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-700"><X className="w-3 h-3 ml-1" /> مرفوض</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="w-3 h-3 ml-1" /> غير محدد</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">الإشعارات غير مدعومة</h3>
          <p className="text-gray-500 text-sm">
            المتصفح الحالي لا يدعم إشعارات Push. جرب استخدام متصفح حديث.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-2 border-gray-100 shadow-lg">
        <CardHeader className="pb-3 bg-gradient-to-l from-blue-50 to-indigo-50">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              إشعارات الهاتف (Push)
            </div>
            {getPermissionBadge()}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* حالة الإشعارات */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                permission === 'granted' ? 'bg-green-100' : 'bg-gray-200'
              }`}>
                {permission === 'granted' ? (
                  <Bell className="w-6 h-6 text-green-600" />
                ) : (
                  <BellOff className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {permission === 'granted' ? 'الإشعارات مفعلة' : 'الإشعارات غير مفعلة'}
                </h3>
                <p className="text-sm text-gray-500">
                  {permission === 'granted' 
                    ? 'ستصلك إشعارات فورية عند مشاهدة عروضك'
                    : 'فعّل الإشعارات لتلقي تنبيهات فورية'}
                </p>
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3">
            {permission !== 'granted' ? (
              <Button
                onClick={requestPermission}
                className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90"
                disabled={permission === 'denied'}
              >
                <Bell className="w-4 h-4 ml-2" />
                تفعيل الإشعارات
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  className="flex-1"
                >
                  <Bell className="w-4 h-4 ml-2" />
                  إرسال تجريبي
                </Button>
                <Button
                  onClick={unsubscribe}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <BellOff className="w-4 h-4 ml-2" />
                  إلغاء
                </Button>
              </>
            )}
          </div>

          {/* تحذير للإذن المرفوض */}
          {permission === 'denied' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 inline ml-2" />
              تم رفض إذن الإشعارات. لتفعيلها، يرجى تغيير إعدادات المتصفح يدوياً.
            </div>
          )}

          {/* معلومات إضافية */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <h4 className="font-semibold mb-2">ما الذي ستحصل عليه؟</h4>
            <ul className="space-y-1 mr-4 list-disc">
              <li>إشعار فوري عند مشاهدة أي عرض من عروضك</li>
              <li>معلومات الزائر (المدينة، الجهاز)</li>
              <li>إمكانية التحكم بالإشعارات في أي وقت</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PushNotificationSettings;
