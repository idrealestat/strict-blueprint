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
import { Bell, Clock, MessageSquare, Send, User, Users, Volume2, Copy, Link, CheckCircle2, MessageCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CalendarSettings {
  // إعدادات تذكير الوسيط
  brokerReminderEnabled: boolean;
  brokerReminderMinutes: number;
  brokerReminderType: 'auto' | 'manual';
  
  // إعدادات تذكير العميل
  clientReminderEnabled: boolean;
  clientReminderMinutes: number;
  clientReminderType: 'auto' | 'manual';
  
  // طريقة الإرسال
  sendMethod: 'sms' | 'whatsapp' | 'both';
  sendMethodEnabled: boolean;
  
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
  sendMethodEnabled: true,
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
  const { user } = useAuthContext();
  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [slug, setSlug] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

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

  // جلب الـ slug من بطاقة الأعمال
  useEffect(() => {
    const fetchSlug = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('business_cards')
        .select('slug')
        .eq('user_id', user.id)
        .single();
      
      if (data?.slug) {
        setSlug(data.slug);
      }
    };
    
    fetchSlug();
  }, [user?.id]);

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

  const baseDomain = 'wasataai.com';
  
  const links = [
    {
      id: 'broker',
      label: 'رابط تأكيد الوسيط',
      description: 'أرسله لنفسك لتأكيد حضورك للموعد',
      url: slug ? `${baseDomain}/${slug}/appointmentapproval/broker/{appointmentId}` : '',
      placeholder: 'سيتم توليد الرابط بعد إنشاء الموعد'
    },
    {
      id: 'customer',
      label: 'رابط تأكيد العميل',
      description: 'أرسله للعميل لتأكيد حضوره',
      url: slug ? `${baseDomain}/${slug}/appointmentapproval/customer/{appointmentId}` : '',
      placeholder: 'سيتم توليد الرابط بعد إنشاء الموعد'
    },
    {
      id: 'sorry',
      label: 'رابط صفحة الاعتذار',
      description: 'أرسله للعميل لإعادة جدولة الموعد',
      url: slug ? `${baseDomain}/${slug}/appointmentapproval/sorry` : '',
      placeholder: ''
    }
  ];

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (e) {
      toast.error('فشل في نسخ الرابط');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="send-method" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send-method" className="gap-2">
            <Send className="w-4 h-4" />
            الإرسال
          </TabsTrigger>
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

        {/* تبويب طريقة الإرسال */}
        <TabsContent value="send-method" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                طريقة الإرسال
              </CardTitle>
              <CardDescription>
                اختر طريقة إرسال التذكيرات والإشعارات للعملاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>تفعيل الإرسال التلقائي</Label>
                <Switch
                  checked={settings.sendMethodEnabled}
                  onCheckedChange={(v) => updateSetting('sendMethodEnabled', v)}
                />
              </div>
              
              {settings.sendMethodEnabled && (
                <div className="space-y-3">
                  <Label>اختر طريقة الإرسال</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => updateSetting('sendMethod', 'whatsapp')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.sendMethod === 'whatsapp'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                    >
                      <MessageCircle className={`w-8 h-8 ${settings.sendMethod === 'whatsapp' ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`font-medium ${settings.sendMethod === 'whatsapp' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        واتساب
                      </span>
                      <span className="text-xs text-gray-500">WhatsApp Me</span>
                    </button>
                    
                    <button
                      onClick={() => updateSetting('sendMethod', 'sms')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.sendMethod === 'sms'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <Smartphone className={`w-8 h-8 ${settings.sendMethod === 'sms' ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`font-medium ${settings.sendMethod === 'sms' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        SMS
                      </span>
                      <span className="text-xs text-gray-500">رسالة نصية</span>
                    </button>
                    
                    <button
                      onClick={() => updateSetting('sendMethod', 'both')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        settings.sendMethod === 'both'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex">
                        <MessageCircle className={`w-6 h-6 ${settings.sendMethod === 'both' ? 'text-green-500' : 'text-gray-400'}`} />
                        <Smartphone className={`w-6 h-6 -mr-2 ${settings.sendMethod === 'both' ? 'text-blue-500' : 'text-gray-400'}`} />
                      </div>
                      <span className={`font-medium ${settings.sendMethod === 'both' ? 'text-purple-700 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        الاثنين معاً
                      </span>
                      <span className="text-xs text-gray-500">SMS + واتساب</span>
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* روابط للنسخ اليدوي */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link className="w-5 h-5 text-indigo-500" />
                روابط الإرسال اليدوي
              </CardTitle>
              <CardDescription>
                انسخ هذه الروابط وأرسلها يدوياً للعميل أو لنفسك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!slug ? (
                <div className="text-center py-4 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm">يجب نشر بطاقة الأعمال أولاً للحصول على الروابط</p>
                </div>
              ) : (
                links.map((link) => (
                  <div key={link.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{link.label}</p>
                        <p className="text-xs text-gray-500">{link.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(link.url, link.id)}
                        disabled={!link.url}
                        className="gap-2"
                      >
                        {copiedLink === link.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            نسخ
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                      <code className="text-xs text-gray-600 dark:text-gray-400 break-all" dir="ltr">
                        {link.url || link.placeholder}
                      </code>
                    </div>
                    {link.id !== 'sorry' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ استبدل {'{appointmentId}'} بمعرف الموعد الفعلي
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
