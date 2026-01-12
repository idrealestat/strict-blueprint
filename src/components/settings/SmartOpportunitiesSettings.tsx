/**
 * SmartOpportunitiesSettings.tsx
 * إعدادات إشعارات الفرص الذكية مع تخصيص الصوت
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  RotateCcw,
  Smartphone,
  Check,
  X,
  Volume2,
  VolumeX,
  Play,
  Music
} from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { playNotificationSoundByName } from '@/utils/notificationSounds';

// أصوات متاحة للإشعارات
export const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'الافتراضي', description: 'نغمة بسيطة' },
  { id: 'bell', name: 'جرس', description: 'صوت جرس واضح' },
  { id: 'chime', name: 'رنة', description: 'نغمة موسيقية' },
  { id: 'success', name: 'نجاح', description: 'صوت إيجابي' },
  { id: 'alert', name: 'تنبيه', description: 'صوت تنبيه قوي' },
  { id: 'opportunity', name: 'فرصة', description: 'نغمة مميزة للفرص' },
];

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
  selectedSound: string;
  soundVolume: number;
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
  selectedSound: 'default',
  soundVolume: 80,
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

// دالة لتشغيل صوت الإشعار
export async function playNotificationSound(preferences?: SmartOpportunitiesPreferences) {
  const prefs = preferences || getSmartOpportunitiesPreferences();
  if (!prefs.soundEnabled) return;
  
  await playNotificationSoundByName(prefs.selectedSound, prefs.soundVolume);
}

export default function SmartOpportunitiesSettings() {
  const [preferences, setPreferences] = useState<SmartOpportunitiesPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { isSupported, permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    const saved = getSmartOpportunitiesPreferences();
    setPreferences(saved);
  }, []);

  const handleEnablePushNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('تم تفعيل إشعارات Push للجوال');
    }
  };

  const handleChange = <K extends keyof SmartOpportunitiesPreferences>(
    key: K,
    value: SmartOpportunitiesPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // معاينة الصوت
  const previewSound = async (soundId: string) => {
    if (isPlaying === soundId) {
      setIsPlaying(null);
      return;
    }

    setIsPlaying(soundId);
    await playNotificationSoundByName(soundId, preferences.soundVolume);
    setIsPlaying(null);
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

          {/* تخصيص الصوت */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <Label className="text-base font-medium">صوت الإشعارات</Label>
              </div>
              <Switch
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => handleChange('soundEnabled', checked)}
                disabled={!preferences.notificationsEnabled}
              />
            </div>

            {preferences.soundEnabled && preferences.notificationsEnabled && (
              <>
                {/* اختيار الصوت */}
                <div className="space-y-3 p-4 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">اختر الصوت</Label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {NOTIFICATION_SOUNDS.map((sound) => (
                      <div
                        key={sound.id}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                          preferences.selectedSound === sound.id
                            ? 'border-primary bg-primary/10'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleChange('selectedSound', sound.id)}
                      >
                        <div className="flex items-center gap-2">
                          {preferences.selectedSound === sound.id && (
                            <Check className="w-3 h-3 text-primary" />
                          )}
                          <span className="text-sm">{sound.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewSound(sound.id);
                          }}
                        >
                          <Play className={`w-3 h-3 ${isPlaying === sound.id ? 'text-primary animate-pulse' : ''}`} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* مستوى الصوت */}
                <div className="space-y-3 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">مستوى الصوت</Label>
                    <Badge variant="outline">{preferences.soundVolume}%</Badge>
                  </div>
                  <Slider
                    value={[preferences.soundVolume]}
                    onValueChange={([value]) => handleChange('soundVolume', value)}
                    min={10}
                    max={100}
                    step={10}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>منخفض</span>
                    <span>متوسط</span>
                    <span>عالي</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* إشعارات Push للجوال */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-base font-medium">إشعارات Push للجوال</Label>
                  <p className="text-sm text-muted-foreground">
                    استلام إشعارات حتى عندما يكون التطبيق مغلقاً
                  </p>
                </div>
              </div>
              <Badge 
                variant={permission === 'granted' ? 'default' : 'secondary'}
                className={permission === 'granted' ? 'bg-green-500 gap-1' : 'gap-1'}
              >
                {permission === 'granted' ? (
                  <>
                    <Check className="w-3 h-3" />
                    مفعّلة
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" />
                    غير مفعّلة
                  </>
                )}
              </Badge>
            </div>

            {!isSupported ? (
              <Alert>
                <AlertDescription>
                  المتصفح الحالي لا يدعم إشعارات Push. جرب استخدام متصفح Chrome أو Safari.
                </AlertDescription>
              </Alert>
            ) : permission !== 'granted' ? (
              <Button
                variant="outline"
                onClick={handleEnablePushNotifications}
                className="w-full gap-2"
                disabled={!preferences.notificationsEnabled}
              >
                <Bell className="w-4 h-4" />
                تفعيل إشعارات Push
              </Button>
            ) : (
              <Alert className="border-green-500/50 bg-green-500/10">
                <Check className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  إشعارات Push مفعلة! ستصلك إشعارات الفرص الذكية على جوالك.
                </AlertDescription>
              </Alert>
            )}
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
