/**
 * FloatingBubbleOwnerControl.tsx
 * 🔴 تحكم المالك في ظهور المساعد الذكي كـ Floating Bubble
 * 
 * - تفعيل/تعطيل الخاصية لجميع المستخدمين
 * - التحديث يعكس مباشرة على أجهزة المستخدمين (Realtime)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Crown,
  Smartphone,
  Shield,
  Users,
  AlertTriangle,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FloatingBubbleOwnerControlProps {
  globalDefaults: any;
  onUpdate: () => void;
}

export default function FloatingBubbleOwnerControl({ 
  globalDefaults, 
  onUpdate 
}: FloatingBubbleOwnerControlProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    globalDefaults?.floating_bubble_enabled ?? true
  );
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsEnabled(globalDefaults?.floating_bubble_enabled ?? true);
  }, [globalDefaults]);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('global_feature_defaults')
        .update({ 
          floating_bubble_enabled: checked,
          updated_at: new Date().toISOString()
        })
        .eq('id', globalDefaults.id);

      if (error) throw error;

      setIsEnabled(checked);
      onUpdate();
      
      // إرسال إشعار للمستخدمين (Realtime)
      window.dispatchEvent(new CustomEvent('floatingBubbleOwnerChanged'));
      
      toast.success(
        checked 
          ? 'تم تفعيل المساعد الذكي العائم لجميع المستخدمين' 
          : 'تم تعطيل المساعد الذكي العائم لجميع المستخدمين'
      );
    } catch (error) {
      console.error('[FloatingBubbleOwnerControl] Error:', error);
      toast.error('حدث خطأ في تحديث الإعدادات');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-2 border-[#D4AF37]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              المساعد الذكي العائم
            </CardTitle>
            <CardDescription className="mt-1">
              التحكم في ظهور المساعد الذكي لجميع المستخدمين
            </CardDescription>
          </div>
          <Badge 
            variant={isEnabled ? 'default' : 'destructive'} 
            className="gap-1"
          >
            {isEnabled ? (
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
        {/* تفعيل/تعطيل عالمي */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#01411C]/10 to-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#01411C] rounded-lg">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <Label htmlFor="owner-bubble-toggle" className="cursor-pointer font-medium">
                تفعيل المساعد الذكي العائم
              </Label>
              <p className="text-xs text-muted-foreground">
                يظهر للمستخدمين في الإعدادات عند التفعيل
              </p>
            </div>
          </div>
          <Switch
            id="owner-bubble-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>

        {/* تفاصيل الأنظمة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">Android</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Floating Bubble Overlay
              <br />
              يتطلب صلاحية SYSTEM_ALERT_WINDOW
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">iOS</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              زر دائري داخل التطبيق
              <br />
              لا يتطلب صلاحيات خاصة
            </p>
          </div>
        </div>

        {/* تحذير عند التعطيل */}
        {!isEnabled && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              عند تعطيل هذه الخاصية:
              <ul className="list-disc list-inside mt-1 text-xs">
                <li>لا يظهر زر "إظهار المساعد الذكي كبابل" في إعدادات المستخدمين</li>
                <li>لا يتم طلب أي صلاحيات من المستخدمين</li>
                <li>المساعد الذكي لا يظهر كفقاعة نهائياً</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* معلومات إضافية */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Users className="w-4 h-4 text-gray-500" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            التغييرات تنعكس مباشرة على جميع أجهزة المستخدمين (Realtime)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
