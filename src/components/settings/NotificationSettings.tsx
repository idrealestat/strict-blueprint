/**
 * NotificationSettings.tsx
 * صفحة إعدادات الإشعارات والرسائل النصية
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Clock, 
  Settings, 
  TestTube2,
  Phone,
  Mail,
  Smartphone,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  // إعدادات الصوت
  soundEnabled: boolean;
  soundVolume: number;
  
  // إعدادات الإشعارات الداخلية
  taskNotifications: boolean;
  appointmentNotifications: boolean;
  customerNotifications: boolean;
  systemNotifications: boolean;
  
  // أوقات التذكير
  appointmentReminderMinutes: number;
  taskReminderMinutes: number;
  
  // إعدادات الرسائل النصية SMS
  smsEnabled: boolean;
  smsForAppointments: boolean;
  smsForPriceQuotes: boolean;
  smsForReminders: boolean;
  
  // إعدادات واتساب
  whatsappEnabled: boolean;
  whatsappForAppointments: boolean;
  whatsappForPriceQuotes: boolean;
  
  // رقم الإرسال الافتراضي
  defaultSenderPhone: string;
  
  // ساعات العمل (لتجنب الإزعاج)
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const defaultPreferences: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 70,
  taskNotifications: true,
  appointmentNotifications: true,
  customerNotifications: true,
  systemNotifications: true,
  appointmentReminderMinutes: 30,
  taskReminderMinutes: 30,
  smsEnabled: true,
  smsForAppointments: true,
  smsForPriceQuotes: true,
  smsForReminders: true,
  whatsappEnabled: true,
  whatsappForAppointments: true,
  whatsappForPriceQuotes: true,
  defaultSenderPhone: '',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  // تحميل الإعدادات المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
  }, []);

  // حفظ الإعدادات
  const savePreferences = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
      localStorage.setItem('notificationSoundEnabled', JSON.stringify(preferences.soundEnabled));
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (e) {
      toast.error('فشل في حفظ الإعدادات');
    }
    setIsSaving(false);
  };

  // تحديث إعداد معين
  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K, 
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // اختبار الصوت
  const testSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      gainNode.gain.setValueAtTime(preferences.soundVolume / 100 * 0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      toast.success('تم تشغيل صوت الإشعار');
    } catch (e) {
      toast.error('فشل في تشغيل الصوت');
    }
  };

  // اختبار SMS
  const testSMS = async () => {
    if (!testPhone) {
      toast.error('أدخل رقم الهاتف للاختبار');
      return;
    }
    
    setTestingSMS(true);
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        toast.error('لم يتم تكوين خدمة الرسائل');
        setTestingSMS(false);
        return;
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: testPhone,
          message: 'هذه رسالة اختبار من نظام وساطة للإشعارات. إذا وصلتك هذه الرسالة، فإن الإعدادات صحيحة!',
          messageType: 'test',
        }),
      });
      
      if (response.ok) {
        toast.success('تم إرسال رسالة الاختبار بنجاح');
      } else {
        const data = await response.json();
        toast.error(data.error || 'فشل في إرسال الرسالة');
      }
    } catch (error: any) {
      toast.error('فشل في إرسال الرسالة: ' + error.message);
    }
    setTestingSMS(false);
  };

  // إضافة موعد اختبار قريب
  const addTestAppointment = () => {
    const now = new Date();
    const testTime = new Date(now.getTime() + 2 * 60000); // بعد دقيقتين
    
    const testAppointment = {
      id: `test_apt_${Date.now()}`,
      title: 'موعد معاينة اختباري',
      propertyTitle: 'شقة للاختبار - حي النرجس',
      propertyLocation: 'الرياض - حي النرجس',
      clientName: 'عميل اختباري',
      clientPhone: testPhone || '0501234567',
      date: testTime.toISOString(),
      time: `${testTime.getHours().toString().padStart(2, '0')}:${testTime.getMinutes().toString().padStart(2, '0')}`,
      status: 'confirmed',
      reminder: true,
      reminderTime: 1, // دقيقة واحدة
    };
    
    // حفظ في localStorage
    const existing = localStorage.getItem('calendar_appointments');
    const appointments = existing ? JSON.parse(existing) : [];
    appointments.push(testAppointment);
    localStorage.setItem('calendar_appointments', JSON.stringify(appointments));
    
    toast.success(`تم إضافة موعد اختباري في ${testAppointment.time}. ستصلك إشعار خلال دقيقة!`, {
      duration: 5000,
    });
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إعدادات الإشعارات</h1>
          <p className="text-muted-foreground">تحكم في طريقة استلام الإشعارات والرسائل</p>
        </div>
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>

      {/* إعدادات الصوت */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            إعدادات الصوت
          </CardTitle>
          <CardDescription>التحكم في أصوات الإشعارات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="soundEnabled" className="flex items-center gap-2">
              {preferences.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              تفعيل صوت الإشعارات
            </Label>
            <Switch
              id="soundEnabled"
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
            />
          </div>
          
          {preferences.soundEnabled && (
            <>
              <div className="space-y-2">
                <Label>مستوى الصوت: {preferences.soundVolume}%</Label>
                <Slider
                  value={[preferences.soundVolume]}
                  onValueChange={([value]) => updatePreference('soundVolume', value)}
                  max={100}
                  step={5}
                />
              </div>
              
              <Button variant="outline" onClick={testSound} className="w-full">
                <TestTube2 className="h-4 w-4 ml-2" />
                اختبار الصوت
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* أنواع الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            أنواع الإشعارات
          </CardTitle>
          <CardDescription>اختر الإشعارات التي تريد استلامها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="taskNotifications">إشعارات المهام المتأخرة</Label>
            <Switch
              id="taskNotifications"
              checked={preferences.taskNotifications}
              onCheckedChange={(checked) => updatePreference('taskNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="appointmentNotifications">إشعارات المواعيد القادمة</Label>
            <Switch
              id="appointmentNotifications"
              checked={preferences.appointmentNotifications}
              onCheckedChange={(checked) => updatePreference('appointmentNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="customerNotifications">إشعارات العملاء</Label>
            <Switch
              id="customerNotifications"
              checked={preferences.customerNotifications}
              onCheckedChange={(checked) => updatePreference('customerNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="systemNotifications">إشعارات النظام</Label>
            <Switch
              id="systemNotifications"
              checked={preferences.systemNotifications}
              onCheckedChange={(checked) => updatePreference('systemNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* أوقات التذكير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            أوقات التذكير
          </CardTitle>
          <CardDescription>متى تريد أن نذكرك قبل الموعد؟</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>التذكير قبل الموعد بـ: {preferences.appointmentReminderMinutes} دقيقة</Label>
            <Slider
              value={[preferences.appointmentReminderMinutes]}
              onValueChange={([value]) => updatePreference('appointmentReminderMinutes', value)}
              min={5}
              max={120}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 دقائق</span>
              <span>ساعتين</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>التذكير قبل المهمة بـ: {preferences.taskReminderMinutes} دقيقة</Label>
            <Slider
              value={[preferences.taskReminderMinutes]}
              onValueChange={([value]) => updatePreference('taskReminderMinutes', value)}
              min={5}
              max={120}
              step={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الرسائل النصية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            إعدادات الرسائل النصية SMS
          </CardTitle>
          <CardDescription>تحكم في إرسال الرسائل النصية للعملاء</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="smsEnabled" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              تفعيل الرسائل النصية
            </Label>
            <Switch
              id="smsEnabled"
              checked={preferences.smsEnabled}
              onCheckedChange={(checked) => updatePreference('smsEnabled', checked)}
            />
          </div>
          
          {preferences.smsEnabled && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">إرسال SMS عند:</Label>
                
                <div className="flex items-center justify-between pr-4">
                  <Label htmlFor="smsForAppointments" className="text-sm">
                    تذكير بالمواعيد
                  </Label>
                  <Switch
                    id="smsForAppointments"
                    checked={preferences.smsForAppointments}
                    onCheckedChange={(checked) => updatePreference('smsForAppointments', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between pr-4">
                  <Label htmlFor="smsForPriceQuotes" className="text-sm">
                    قبول/رفض عرض السعر
                  </Label>
                  <Switch
                    id="smsForPriceQuotes"
                    checked={preferences.smsForPriceQuotes}
                    onCheckedChange={(checked) => updatePreference('smsForPriceQuotes', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between pr-4">
                  <Label htmlFor="smsForReminders" className="text-sm">
                    تذكيرات عامة
                  </Label>
                  <Switch
                    id="smsForReminders"
                    checked={preferences.smsForReminders}
                    onCheckedChange={(checked) => updatePreference('smsForReminders', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>رقم هاتف الاختبار</Label>
                <div className="flex gap-2">
                  <Input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={testSMS}
                    disabled={testingSMS}
                  >
                    {testingSMS ? 'جاري الإرسال...' : 'اختبار SMS'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* إعدادات واتساب */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-500" />
            إعدادات واتساب
          </CardTitle>
          <CardDescription>تحكم في إرسال رسائل واتساب للعملاء</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsappEnabled">تفعيل رسائل واتساب</Label>
            <Switch
              id="whatsappEnabled"
              checked={preferences.whatsappEnabled}
              onCheckedChange={(checked) => updatePreference('whatsappEnabled', checked)}
            />
          </div>
          
          {preferences.whatsappEnabled && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">إرسال واتساب عند:</Label>
                
                <div className="flex items-center justify-between pr-4">
                  <Label htmlFor="whatsappForAppointments" className="text-sm">
                    تذكير بالمواعيد
                  </Label>
                  <Switch
                    id="whatsappForAppointments"
                    checked={preferences.whatsappForAppointments}
                    onCheckedChange={(checked) => updatePreference('whatsappForAppointments', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between pr-4">
                  <Label htmlFor="whatsappForPriceQuotes" className="text-sm">
                    قبول/رفض عرض السعر
                  </Label>
                  <Switch
                    id="whatsappForPriceQuotes"
                    checked={preferences.whatsappForPriceQuotes}
                    onCheckedChange={(checked) => updatePreference('whatsappForPriceQuotes', checked)}
                  />
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  💡 رسائل واتساب تفتح تطبيق واتساب مباشرة مع الرسالة جاهزة للإرسال
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ساعات الهدوء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ساعات الهدوء
          </CardTitle>
          <CardDescription>تجنب الإشعارات في أوقات معينة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quietHoursEnabled">تفعيل ساعات الهدوء</Label>
            <Switch
              id="quietHoursEnabled"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
            />
          </div>
          
          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من الساعة</Label>
                <Input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>إلى الساعة</Label>
                <Input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* اختبار النظام */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5 text-primary" />
            اختبار نظام الإشعارات
          </CardTitle>
          <CardDescription>تأكد من عمل الإشعارات بشكل صحيح</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button 
              variant="outline" 
              onClick={addTestAppointment}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                إضافة موعد اختباري (بعد دقيقتين)
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testSound}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                اختبار صوت الإشعار
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            {preferences.smsEnabled && testPhone && (
              <Button 
                variant="outline" 
                onClick={testSMS}
                disabled={testingSMS}
                className="justify-between"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  إرسال رسالة اختبار SMS
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            سيتم إضافة موعد معاينة اختباري وستصلك إشعار خلال دقيقة واحدة
          </div>
        </CardContent>
      </Card>

      {/* حفظ الإعدادات */}
      <div className="flex justify-center pb-8">
        <Button size="lg" onClick={savePreferences} disabled={isSaving} className="px-8">
          {isSaving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
        </Button>
      </div>
    </div>
  );
}
