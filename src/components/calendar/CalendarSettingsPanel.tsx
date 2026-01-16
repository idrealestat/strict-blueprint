/**
 * CalendarSettingsPanel.tsx
 * إعدادات التقويم - أوقات الإرسال ونوع الإشعارات
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Clock, MessageSquare, Send, User, Users, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarSettings {
  // إعدادات تذكير الوسيط
  brokerReminderEnabled: boolean;
  brokerReminderMinutes: number; // قبل كم دقيقة
  brokerReminderType: 'auto' | 'manual'; // تلقائي أو يدوي
  
  // إعدادات تذكير العميل
  clientReminderEnabled: boolean;
  clientReminderMinutes: number;
  clientReminderType: 'auto' | 'manual';
  
  // طريقة الإرسال
  sendMethod: 'sms' | 'whatsapp' | 'both';
  
  // إعدادات الصوت
  soundEnabled: boolean;
  soundOnAccept: boolean;
  soundOnReject: boolean;
  
  // نص الرسائل
  confirmationMessage: string;
  apologyMessage: string;
}

const defaultSettings: CalendarSettings = {
  brokerReminderEnabled: true,
  brokerReminderMinutes: 30,
  brokerReminderType: 'auto',
  clientReminderEnabled: true,
  clientReminderMinutes: 60,
  clientReminderType: 'auto',
  sendMethod: 'both',
  soundEnabled: true,
  soundOnAccept: true,
  soundOnReject: true,
  confirmationMessage: 'السلام عليكم {customerName}، لديك موعد معاينة بعد ساعة. يرجى تأكيد حضورك من خلال الرابط: {link}',
  apologyMessage: 'السلام عليكم {customerName}، نعتذر عن الموعد المحدد لأسباب طارئة. نرجو تحديد موعد آخر: {link}',
};

interface CalendarSettingsPanelProps {
  onClose?: () => void;
}

export default function CalendarSettingsPanel({ onClose }: CalendarSettingsPanelProps) {
  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('calendar_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Error loading calendar settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('calendar_settings', JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('calendarSettingsChanged', { detail: settings }));
      toast.success('تم حفظ الإعدادات بنجاح');
      onClose?.();
    } catch (e) {
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof CalendarSettings>(key: K, value: CalendarSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="w-4 h-4" />
            التذكيرات
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            الرسائل
          </TabsTrigger>
          <TabsTrigger value="sound" className="gap-2">
            <Volume2 className="w-4 h-4" />
            الصوت
          </TabsTrigger>
        </TabsList>

        {/* تبويب التذكيرات */}
        <TabsContent value="reminders" className="space-y-4 mt-4">
          {/* تذكير الوسيط */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                تذكير الوسيط
              </CardTitle>
              <CardDescription>
                إرسال تذكير لك قبل الموعد لتأكيد حضورك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>تفعيل التذكير</Label>
                <Switch
                  checked={settings.brokerReminderEnabled}
                  onCheckedChange={(v) => updateSetting('brokerReminderEnabled', v)}
                />
              </div>
              
              {settings.brokerReminderEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>قبل الموعد بـ</Label>
                      <Select
                        value={settings.brokerReminderMinutes.toString()}
                        onValueChange={(v) => updateSetting('brokerReminderMinutes', parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 دقيقة</SelectItem>
                          <SelectItem value="30">30 دقيقة</SelectItem>
                          <SelectItem value="60">ساعة</SelectItem>
                          <SelectItem value="120">ساعتين</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>نوع الإرسال</Label>
                      <Select
                        value={settings.brokerReminderType}
                        onValueChange={(v) => updateSetting('brokerReminderType', v as 'auto' | 'manual')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">تلقائي</SelectItem>
                          <SelectItem value="manual">يدوي (تنبيه فقط)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* تذكير العميل */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                تذكير العميل
              </CardTitle>
              <CardDescription>
                إرسال رابط تأكيد الحضور للعميل قبل الموعد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>تفعيل التذكير</Label>
                <Switch
                  checked={settings.clientReminderEnabled}
                  onCheckedChange={(v) => updateSetting('clientReminderEnabled', v)}
                />
              </div>
              
              {settings.clientReminderEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>قبل الموعد بـ</Label>
                      <Select
                        value={settings.clientReminderMinutes.toString()}
                        onValueChange={(v) => updateSetting('clientReminderMinutes', parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 دقيقة</SelectItem>
                          <SelectItem value="60">ساعة</SelectItem>
                          <SelectItem value="120">ساعتين</SelectItem>
                          <SelectItem value="1440">يوم</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>نوع الإرسال</Label>
                      <Select
                        value={settings.clientReminderType}
                        onValueChange={(v) => updateSetting('clientReminderType', v as 'auto' | 'manual')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">تلقائي</SelectItem>
                          <SelectItem value="manual">يدوي (تنبيه فقط)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>طريقة الإرسال</Label>
                    <Select
                      value={settings.sendMethod}
                      onValueChange={(v) => updateSetting('sendMethod', v as 'sms' | 'whatsapp' | 'both')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS فقط</SelectItem>
                        <SelectItem value="whatsapp">واتساب فقط</SelectItem>
                        <SelectItem value="both">SMS + واتساب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الرسائل */}
        <TabsContent value="messages" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">رسالة تأكيد الموعد</CardTitle>
              <CardDescription>
                الرسالة التي ترسل للعميل لتأكيد حضوره. استخدم {'{customerName}'} و {'{link}'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-32 p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.confirmationMessage}
                onChange={(e) => updateSetting('confirmationMessage', e.target.value)}
                dir="rtl"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">رسالة الاعتذار</CardTitle>
              <CardDescription>
                الرسالة التي ترسل للعميل عند إلغاء الموعد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-32 p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.apologyMessage}
                onChange={(e) => updateSetting('apologyMessage', e.target.value)}
                dir="rtl"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الصوت */}
        <TabsContent value="sound" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-500" />
                إعدادات الصوت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>تفعيل التنبيهات الصوتية</Label>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(v) => updateSetting('soundEnabled', v)}
                />
              </div>
              
              {settings.soundEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>صوت عند قبول العميل</Label>
                    <Switch
                      checked={settings.soundOnAccept}
                      onCheckedChange={(v) => updateSetting('soundOnAccept', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>صوت عند رفض العميل</Label>
                    <Switch
                      checked={settings.soundOnReject}
                      onCheckedChange={(v) => updateSetting('soundOnReject', v)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Send className="w-4 h-4 ml-2" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}
