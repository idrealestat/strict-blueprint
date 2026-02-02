/**
 * CallLogsLinkingSettings.tsx
 * إعدادات ربط الاتصالات الأخيرة بالعملاء
 * 
 * ✅ متوافق مع سياسات Google Play و Apple App Store:
 * - خيار تفعيل/إيقاف الربط
 * - شرح واضح للصلاحيات المطلوبة
 * - المعالجة محلية فقط
 * - لا إرسال للسيرفر
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  Link2,
  Link2Off,
  Shield,
  Lock,
  Smartphone,
  Apple,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface CallLogsLinkingSettingsProps {
  isLinkingEnabled: boolean;
  onEnableLinking: () => Promise<boolean>;
  onDisableLinking: () => void;
  isLoading?: boolean;
}

export default function CallLogsLinkingSettings({
  isLinkingEnabled,
  onEnableLinking,
  onDisableLinking,
  isLoading = false,
}: CallLogsLinkingSettingsProps) {
  const [enabling, setEnabling] = useState(false);
  
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isNative = Capacitor.isNativePlatform();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      setEnabling(true);
      try {
        await onEnableLinking();
      } finally {
        setEnabling(false);
      }
    } else {
      onDisableLinking();
    }
  };

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50/50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-violet-600" />
              ربط الاتصالات الأخيرة
            </CardTitle>
            <CardDescription>
              ربط سجل المكالمات بعملائك في إدارة العملاء
            </CardDescription>
          </div>
          
          {/* مؤشر الحالة */}
          {isLinkingEnabled ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle2 className="w-3 h-3 ml-1" />
              مفعّل
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              <Link2Off className="w-3 h-3 ml-1" />
              معطّل
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* التحكم الرئيسي */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            {isLinkingEnabled ? (
              <Link2 className="w-5 h-5 text-green-600" />
            ) : (
              <Link2Off className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <Label htmlFor="callLogsLinking" className="font-medium">
                تفعيل ربط الاتصالات
              </Label>
              <p className="text-xs text-muted-foreground">
                {isLinkingEnabled 
                  ? 'الاتصالات تظهر في عمود خاص داخل إدارة العملاء'
                  : 'فعّل لعرض الاتصالات الأخيرة مع بطاقات العملاء'
                }
              </p>
            </div>
          </div>
          <Switch
            id="callLogsLinking"
            checked={isLinkingEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading || enabling}
          />
        </div>

        <Separator />

        {/* معلومات الخصوصية والأمان */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            الخصوصية والأمان
          </Label>
          
          <div className="grid gap-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700">المعالجة محلية فقط - لا إرسال للسيرفر</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
              <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700">لا تخزين دائم لسجل المكالمات</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700">البيانات تستخدم فقط داخل إدارة العملاء</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* معلومات المنصة */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            معلومات المنصة
          </Label>
          
          {isAndroid && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-green-700" />
                <span className="text-sm font-medium text-green-800">Android</span>
              </div>
              <p className="text-xs text-green-700">
                يتم الوصول لسجل المكالمات وجهات الاتصال لمطابقة الأرقام مع العملاء.
              </p>
            </div>
          )}
          
          {isIOS && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="w-4 h-4 text-amber-700" />
                <span className="text-sm font-medium text-amber-800">iOS</span>
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">محدود</Badge>
              </div>
              <p className="text-xs text-amber-700">
                نظام iOS لا يسمح بالوصول لسجل المكالمات. يمكن ربط جهات الاتصال فقط.
              </p>
            </div>
          )}
          
          {!isNative && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-medium text-blue-800">متصفح الويب</span>
              </div>
              <p className="text-xs text-blue-700">
                في المتصفح، يمكن إدخال المكالمات يدوياً أو استيرادها من ملف CSV.
              </p>
            </div>
          )}
        </div>

        {/* الصلاحيات المطلوبة */}
        {isNative && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">الصلاحيات المطلوبة</Label>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">READ_CONTACTS</Badge>
                  <span>قراءة جهات الاتصال</span>
                </div>
                
                {isAndroid && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">READ_CALL_LOG</Badge>
                    <span>قراءة سجل المكالمات (Android فقط)</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ملاحظة تحذيرية */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700">
              <p className="font-medium mb-1">ملاحظة مهمة</p>
              <p>
                يتم طلب الصلاحيات فقط عند تفعيل الربط. لا يتم أي وصول تلقائي أو في الخلفية.
                يمكنك إيقاف الربط في أي وقت من هذه الإعدادات.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
