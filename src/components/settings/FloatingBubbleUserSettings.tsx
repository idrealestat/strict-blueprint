/**
 * FloatingBubbleUserSettings.tsx
 * 🔴 إعدادات المستخدم للمساعد الذكي العائم
 * 
 * - يظهر فقط إذا فعّل المالك الخاصية
 * - Android: يطلب صلاحية Overlay عند التفعيل
 * - iOS: زر دائري داخل التطبيق مباشرة
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Smartphone, 
  Shield, 
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Apple
} from 'lucide-react';
import { useFloatingBubblePermission } from '@/hooks/useFloatingBubblePermission';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

export default function FloatingBubbleUserSettings() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const {
    isOwnerEnabled,
    hasPermission,
    isActive,
    isUserEnabled,
    platform,
    isLoading,
    requestPermission,
    enableBubble,
    disableBubble,
    toggleBubble,
  } = useFloatingBubblePermission();

  // إذا الخاصية معطلة من المالك → لا يظهر أي شيء
  if (flagsLoading || isLoading) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            المساعد الذكي العائم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🔴 الخاصية معطلة من لوحة تحكم المالك → لا يظهر الزر نهائياً
  if (!isOwnerEnabled) {
    return null;
  }

  // iOS Implementation
  if (platform === 'ios') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                المساعد الذكي
              </CardTitle>
              <CardDescription className="mt-1">
                زر دائري داخل التطبيق
              </CardDescription>
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
              {isActive ? (
                <>
                  <Check className="w-3 h-3" />
                  مفعّل
                </>
              ) : (
                <>
                  <X className="w-3 h-3" />
                  معطّل
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ملاحظة iOS */}
          <Alert className="bg-blue-50 border-blue-200">
            <Apple className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              في نظام iOS، يظهر المساعد الذكي كزر دائري داخل التطبيق فقط
              <span className="block text-xs mt-1 text-blue-600">
                Apple لا تسمح بالعناصر العائمة خارج التطبيق
              </span>
            </AlertDescription>
          </Alert>

          {/* تفعيل/تعطيل */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#01411C]" />
              <Label htmlFor="ios-bubble-toggle" className="cursor-pointer">
                <p className="text-sm font-medium">إظهار المساعد الذكي</p>
                <p className="text-xs text-muted-foreground">
                  زر عائم داخل التطبيق
                </p>
              </Label>
            </div>
            <Switch
              id="ios-bubble-toggle"
              checked={isActive}
              onCheckedChange={toggleBubble}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Android Implementation
  if (platform === 'android') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                الفقاعة العائمة
              </CardTitle>
              <CardDescription className="mt-1">
                المساعد الذكي فوق جميع التطبيقات
              </CardDescription>
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
              {isActive ? (
                <>
                  <Check className="w-3 h-3" />
                  مفعّلة
                </>
              ) : (
                <>
                  <X className="w-3 h-3" />
                  معطّلة
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* حالة الصلاحية */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${hasPermission ? 'text-green-500' : 'text-amber-500'}`} />
              <div>
                <p className="text-sm font-medium">صلاحية العرض فوق التطبيقات</p>
                <p className="text-xs text-muted-foreground">
                  {hasPermission ? 'الصلاحية مفعّلة' : 'مطلوبة لعرض الفقاعة'}
                </p>
              </div>
            </div>
            {!hasPermission && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={requestPermission}
                className="gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                تفعيل
              </Button>
            )}
          </div>

          {/* تفعيل/تعطيل الفقاعة */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#01411C]" />
              <Label htmlFor="android-bubble-toggle" className="cursor-pointer">
                <p className="text-sm font-medium">عرض الفقاعة العائمة</p>
                <p className="text-xs text-muted-foreground">
                  تظهر فوق جميع التطبيقات
                </p>
              </Label>
            </div>
            <Switch
              id="android-bubble-toggle"
              checked={isActive}
              onCheckedChange={toggleBubble}
              disabled={!hasPermission}
            />
          </div>

          {/* معاينة */}
          <div className="p-4 bg-gradient-to-r from-[#01411C] to-[#065f41] rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#01411C] to-[#065f41] border-3 border-[#D4AF37] flex items-center justify-center shadow-lg relative">
                <MessageCircle className="w-7 h-7 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
              </div>
              <div className="text-white">
                <p className="font-medium">معاينة الفقاعة</p>
                <p className="text-sm text-white/70">
                  هكذا ستظهر الفقاعة على شاشتك
                </p>
              </div>
            </div>
          </div>

          {/* ملاحظة */}
          <p className="text-xs text-muted-foreground text-center">
            💡 يمكنك سحب الفقاعة لأي مكان على الشاشة
          </p>
        </CardContent>
      </Card>
    );
  }

  // Web Implementation
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              المساعد الذكي
            </CardTitle>
            <CardDescription className="mt-1">
              زر عائم داخل التطبيق
            </CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
            {isActive ? (
              <>
                <Check className="w-3 h-3" />
                مفعّل
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                معطّل
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* تفعيل/تعطيل */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[#01411C]" />
            <Label htmlFor="web-bubble-toggle" className="cursor-pointer">
              <p className="text-sm font-medium">إظهار المساعد الذكي</p>
              <p className="text-xs text-muted-foreground">
                زر عائم في أسفل الشاشة
              </p>
            </Label>
          </div>
          <Switch
            id="web-bubble-toggle"
            checked={isActive}
            onCheckedChange={toggleBubble}
          />
        </div>
      </CardContent>
    </Card>
  );
}
