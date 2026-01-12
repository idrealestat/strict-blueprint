/**
 * FloatingBubbleSettings.tsx
 * إعدادات الفقاعة العائمة للمساعد الذكي
 */

import { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { FloatingBubble } from '@/utils/floatingBubble';
import { toast } from 'sonner';

export default function FloatingBubbleSettings() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    
    const available = FloatingBubble.isAvailable();
    setIsAvailable(available);
    
    if (available) {
      const permission = await FloatingBubble.checkPermission();
      setHasPermission(permission);
      
      const active = await FloatingBubble.isActive();
      setIsActive(active);
    }
    
    setIsLoading(false);
  };

  const handleRequestPermission = async () => {
    const opened = await FloatingBubble.requestPermission();
    if (opened) {
      toast.info('يرجى تفعيل الصلاحية من الإعدادات ثم العودة للتطبيق');
    }
  };

  const handleToggleBubble = async () => {
    if (!hasPermission) {
      toast.error('يجب منح صلاحية العرض فوق التطبيقات أولاً');
      return;
    }

    const result = await FloatingBubble.toggle();
    
    if (result.success) {
      setIsActive(result.isActive);
      toast.success(result.message);
    } else if (result.needsPermission) {
      handleRequestPermission();
    } else {
      toast.error(result.message);
    }
  };

  // إذا لم تكن الميزة متاحة (ليس Android)
  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            الفقاعة العائمة
          </CardTitle>
          <CardDescription>
            اجعل المساعد الذكي متاحاً خارج التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              هذه الميزة متاحة فقط على تطبيق Android الأصلي.
              {Capacitor.getPlatform() === 'ios' && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Apple لا تسمح بالعناصر العائمة خارج التطبيق لأسباب أمنية.
                </span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
              اجعل المساعد الذكي متاحاً خارج التطبيق
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
              onClick={handleRequestPermission}
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
            <Label htmlFor="bubble-toggle" className="cursor-pointer">
              <p className="text-sm font-medium">عرض الفقاعة العائمة</p>
              <p className="text-xs text-muted-foreground">
                تظهر فوق جميع التطبيقات
              </p>
            </Label>
          </div>
          <Switch
            id="bubble-toggle"
            checked={isActive}
            onCheckedChange={handleToggleBubble}
            disabled={!hasPermission || isLoading}
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
