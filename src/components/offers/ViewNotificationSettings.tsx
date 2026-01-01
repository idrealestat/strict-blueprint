/**
 * ViewNotificationSettings.tsx
 * إعدادات الإشعارات الفورية للمشاهدات
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, Eye, Smartphone } from 'lucide-react';

interface ViewNotificationSettingsProps {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  onSettingsChange: (enabled: boolean, sound: boolean) => void;
}

const ViewNotificationSettings: React.FC<ViewNotificationSettingsProps> = ({
  notificationsEnabled,
  soundEnabled,
  onSettingsChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-2 border-gray-100 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D4AF37]" />
            إعدادات الإشعارات
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* تفعيل الإشعارات */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-900">
                  إشعارات المشاهدات
                </Label>
                <p className="text-xs text-gray-500">
                  تلقي إشعار فوري عند مشاهدة عرض
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(checked) => onSettingsChange(checked, soundEnabled)}
            />
          </div>

          {/* تفعيل الصوت */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-900">
                  صوت الإشعار
                </Label>
                <p className="text-xs text-gray-500">
                  تشغيل صوت تنبيه مع الإشعار
                </p>
              </div>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={(checked) => onSettingsChange(notificationsEnabled, checked)}
              disabled={!notificationsEnabled}
            />
          </div>

          {/* معلومات إضافية */}
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Smartphone className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-xs text-green-800 font-medium">
                بيانات الزائر
              </p>
              <p className="text-xs text-green-700 mt-1">
                يتم جمع معلومات الجهاز والموقع التقريبي للزائر لمساعدتك على فهم جمهورك بشكل أفضل.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ViewNotificationSettings;
