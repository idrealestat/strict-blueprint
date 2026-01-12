/**
 * SmartOpportunitiesSettings.tsx
 * إعدادات إشعارات الفرص الذكية
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Bell, 
  BellOff, 
  Target, 
  TrendingUp,
  Building2,
  Home,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export interface SmartOpportunitiesPreferences {
  // تفعيل الإشعارات
  notificationsEnabled: boolean;
  
  // الحد الأدنى لنسبة التطابق
  minMatchScore: number;
  
  // أنواع الفرص المفعلة
  enableListingMatches: boolean; // تطابق عروضي مع طلبات الآخرين
  enableRequestMatches: boolean; // تطابق طلباتي مع عروض الآخرين
  
  // إشعارات حسب النوع
  notifyForSale: boolean;
  notifyForRent: boolean;
  notifyForResidential: boolean;
  notifyForCommercial: boolean;
  
  // صوت الإشعارات
  soundEnabled: boolean;
}

const defaultPreferences: SmartOpportunitiesPreferences = {
  notificationsEnabled: true,
  minMatchScore: 80,
  enableListingMatches: true,
  enableRequestMatches: true,
  notifyForSale: true,
  notifyForRent: true,
  notifyForResidential: true,
  notifyForCommercial: true,
  soundEnabled: true,
};

const STORAGE_KEY = 'smart_opportunities_preferences';

export function getSmartOpportunitiesPreferences(): SmartOpportunitiesPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading smart opportunities preferences:', e);
  }
  return defaultPreferences;
}

export default function SmartOpportunitiesSettings() {
  const [preferences, setPreferences] = useState<SmartOpportunitiesPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = getSmartOpportunitiesPreferences();
    setPreferences(saved);
  }, []);

  const handleChange = <K extends keyof SmartOpportunitiesPreferences>(
    key: K,
    value: SmartOpportunitiesPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setHasChanges(false);
      toast.success('تم حفظ إعدادات الفرص الذكية');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    toast.info('تم إعادة الإعدادات الافتراضية');
  };

  return (
    <div className="space-y-6">
      {/* البطاقة الرئيسية */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">إشعارات الفرص الذكية</CardTitle>
                <CardDescription>
                  تخصيص متى وكيف تصلك إشعارات الفرص المتطابقة
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={preferences.notificationsEnabled ? 'default' : 'secondary'}
              className={preferences.notificationsEnabled ? 'bg-green-500' : ''}
            >
              {preferences.notificationsEnabled ? 'مفعّلة' : 'معطّلة'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* تفعيل الإشعارات الرئيسي */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {preferences.notificationsEnabled ? (
                <Bell className="w-5 h-5 text-green-500" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-base font-medium">تفعيل الإشعارات</Label>
                <p className="text-sm text-muted-foreground">
                  استلام إشعارات عند وجود فرص متطابقة جديدة
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.notificationsEnabled}
              onCheckedChange={(checked) => handleChange('notificationsEnabled', checked)}
            />
          </div>

          {/* الحد الأدنى لنسبة التطابق */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <Label className="text-base font-medium">الحد الأدنى لنسبة التطابق</Label>
              <Badge variant="outline" className="mr-auto">
                {preferences.minMatchScore}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              لن تصلك إشعارات للفرص التي نسبة تطابقها أقل من هذه النسبة
            </p>
            <Slider
              value={[preferences.minMatchScore]}
              onValueChange={([value]) => handleChange('minMatchScore', value)}
              min={50}
              max={100}
              step={5}
              disabled={!preferences.notificationsEnabled}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <Separator />

          {/* أنواع التطابق */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <Label className="text-base font-medium">أنواع التطابق</Label>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>تطابق عروضي مع طلبات الآخرين</Label>
                  <p className="text-xs text-muted-foreground">
                    إشعار عند وجود طلب يطابق أحد عروضك
                  </p>
                </div>
                <Switch
                  checked={preferences.enableListingMatches}
                  onCheckedChange={(checked) => handleChange('enableListingMatches', checked)}
                  disabled={!preferences.notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>تطابق طلباتي مع عروض الآخرين</Label>
                  <p className="text-xs text-muted-foreground">
                    إشعار عند وجود عرض يطابق أحد طلباتك
                  </p>
                </div>
                <Switch
                  checked={preferences.enableRequestMatches}
                  onCheckedChange={(checked) => handleChange('enableRequestMatches', checked)}
                  disabled={!preferences.notificationsEnabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* فلترة حسب نوع العقار */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <Label className="text-base font-medium">نوع الصفقة</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label>البيع</Label>
                <Switch
                  checked={preferences.notifyForSale}
                  onCheckedChange={(checked) => handleChange('notifyForSale', checked)}
                  disabled={!preferences.notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label>الإيجار</Label>
                <Switch
                  checked={preferences.notifyForRent}
                  onCheckedChange={(checked) => handleChange('notifyForRent', checked)}
                  disabled={!preferences.notificationsEnabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* فلترة حسب التصنيف */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              <Label className="text-base font-medium">تصنيف العقار</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label>سكني</Label>
                <Switch
                  checked={preferences.notifyForResidential}
                  onCheckedChange={(checked) => handleChange('notifyForResidential', checked)}
                  disabled={!preferences.notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label>تجاري</Label>
                <Switch
                  checked={preferences.notifyForCommercial}
                  onCheckedChange={(checked) => handleChange('notifyForCommercial', checked)}
                  disabled={!preferences.notificationsEnabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* صوت الإشعارات */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">صوت الإشعارات</Label>
                <p className="text-sm text-muted-foreground">
                  تشغيل صوت عند وصول فرصة جديدة
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => handleChange('soundEnabled', checked)}
              disabled={!preferences.notificationsEnabled}
            />
          </div>

          {/* أزرار الحفظ */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة الافتراضي
            </Button>
            <Button
              onClick={savePreferences}
              disabled={isSaving || !hasChanges}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
