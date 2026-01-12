/**
 * SettingsTabContent.tsx
 * محتوى تبويب الإعدادات - استخراج من NotificationSettings لتحسين البنية
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Clock, 
  TestTube2,
  Phone,
  Smartphone,
  ArrowRight,
  FileText,
  BarChart3,
  Edit3,
  RotateCcw,
  Eye,
  Calendar,
  Send,
  Download,
  Trash2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface MessageTemplates {
  appointmentReminder: string;
  priceQuoteAccepted: string;
  priceQuoteRejected: string;
  viewingConfirmation: string;
}

interface NotificationPreferences {
  soundEnabled: boolean;
  soundVolume: number;
  taskNotifications: boolean;
  appointmentNotifications: boolean;
  customerNotifications: boolean;
  systemNotifications: boolean;
  appointmentReminderMinutes: number;
  taskReminderMinutes: number;
  smsEnabled: boolean;
  smsForAppointments: boolean;
  smsForPriceQuotes: boolean;
  smsForReminders: boolean;
  whatsappEnabled: boolean;
  whatsappForAppointments: boolean;
  whatsappForPriceQuotes: boolean;
  defaultSenderPhone: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  templates: MessageTemplates;
}

interface MessageStats {
  smsCount: number;
  whatsappCount: number;
  month: string;
  dailyStats?: { day: string; sms: number; whatsapp: number }[];
}

interface ScheduledMessage {
  id: string;
  phone: string;
  message: string;
  scheduledTime: string;
  type: 'sms' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
}

interface SettingsTabContentProps {
  preferences: NotificationPreferences;
  updatePreference: <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => void;
  savePreferences: () => void;
  isSaving: boolean;
  messageStats: MessageStats;
  exportStatsPDF: () => void;
  exportingPDF: boolean;
  testSound: () => void;
  testSMS: () => void;
  testingSMS: boolean;
  testPhone: string;
  setTestPhone: (phone: string) => void;
  addTestAppointment: () => void;
  editingTemplate: keyof MessageTemplates | null;
  setEditingTemplate: (key: keyof MessageTemplates | null) => void;
  previewTemplate: keyof MessageTemplates | null;
  setPreviewTemplate: (key: keyof MessageTemplates | null) => void;
  updateTemplate: (key: keyof MessageTemplates, value: string) => void;
  resetTemplate: (key: keyof MessageTemplates) => void;
  getPreviewMessage: (template: string) => string;
  templateLabels: Record<keyof MessageTemplates, { title: string; description: string }>;
  sampleData: Record<string, string>;
  scheduledMessages: ScheduledMessage[];
  newScheduledMessage: { phone: string; message: string; scheduledTime: string; type: 'sms' | 'whatsapp' };
  setNewScheduledMessage: React.Dispatch<React.SetStateAction<{ phone: string; message: string; scheduledTime: string; type: 'sms' | 'whatsapp' }>>;
  scheduleMessage: () => void;
  deleteScheduledMessage: (id: string) => void;
}

export function SettingsTabContent({
  preferences,
  updatePreference,
  savePreferences,
  isSaving,
  messageStats,
  exportStatsPDF,
  exportingPDF,
  testSound,
  testSMS,
  testingSMS,
  testPhone,
  setTestPhone,
  addTestAppointment,
  editingTemplate,
  setEditingTemplate,
  previewTemplate,
  setPreviewTemplate,
  updateTemplate,
  resetTemplate,
  getPreviewMessage,
  templateLabels,
  sampleData,
  scheduledMessages,
  newScheduledMessage,
  setNewScheduledMessage,
  scheduleMessage,
  deleteScheduledMessage,
}: SettingsTabContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>

      {/* إحصائيات الرسائل الشهرية */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                إحصائيات الرسائل الشهرية
              </CardTitle>
              <CardDescription>عدد الرسائل المرسلة خلال {messageStats.month || 'الشهر الحالي'}</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportStatsPDF}
              disabled={exportingPDF}
            >
              <Download className="h-4 w-4 ml-2" />
              {exportingPDF ? 'جاري التصدير...' : 'تصدير PDF'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-background rounded-lg p-4 text-center border">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold text-foreground">{messageStats.smsCount}</div>
              <div className="text-sm text-muted-foreground">رسائل SMS</div>
            </div>
            <div className="bg-background rounded-lg p-4 text-center border">
              <Phone className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-3xl font-bold text-foreground">{messageStats.whatsappCount}</div>
              <div className="text-sm text-muted-foreground">رسائل واتساب</div>
            </div>
          </div>
          
          {(messageStats.smsCount > 0 || messageStats.whatsappCount > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="text-sm font-medium mb-2 text-center">توزيع الرسائل</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'SMS', value: messageStats.smsCount, color: '#3b82f6' },
                        { name: 'WhatsApp', value: messageStats.whatsappCount, color: '#22c55e' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="text-sm font-medium mb-2 text-center">آخر 7 أيام</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={messageStats.dailyStats?.slice(-7) || []}>
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="sms" fill="#3b82f6" name="SMS" />
                    <Bar dataKey="whatsapp" fill="#22c55e" name="WhatsApp" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Badge variant="outline" className="text-xs">
              إجمالي: {messageStats.smsCount + messageStats.whatsappCount} رسالة
            </Badge>
          </div>
        </CardContent>
      </Card>

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

      {/* قوالب الرسائل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قوالب الرسائل
          </CardTitle>
          <CardDescription>خصص نصوص الرسائل المرسلة للعملاء. استخدم المتغيرات: {'{clientName}'}, {'{propertyLocation}'}, {'{date}'}, {'{time}'}, {'{amount}'}, {'{minPrice}'}, {'{clientPhone}'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(templateLabels) as Array<keyof MessageTemplates>).map((key) => (
            <div key={key} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">{templateLabels[key].title}</Label>
                  <p className="text-xs text-muted-foreground">{templateLabels[key].description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewTemplate(previewTemplate === key ? null : key)}
                    title="معاينة"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(editingTemplate === key ? null : key)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetTemplate(key)}
                    title="إعادة تعيين للافتراضي"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {editingTemplate === key ? (
                <Textarea
                  value={preferences.templates[key]}
                  onChange={(e) => updateTemplate(key, e.target.value)}
                  className="min-h-[100px] text-sm"
                  dir="rtl"
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {preferences.templates[key]}
                </div>
              )}
              
              {previewTemplate === key && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">معاينة الرسالة</span>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                    {getPreviewMessage(preferences.templates[key])}
                  </p>
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      البيانات التجريبية: {sampleData.clientName} | {sampleData.propertyLocation} | {sampleData.date} | {sampleData.time}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* جدولة الرسائل */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            جدولة الرسائل
          </CardTitle>
          <CardDescription>أضف رسائل لإرسالها في وقت محدد</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={newScheduledMessage.phone}
                onChange={(e) => setNewScheduledMessage(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="05XXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>وقت الإرسال</Label>
              <Input
                type="datetime-local"
                value={newScheduledMessage.scheduledTime}
                onChange={(e) => setNewScheduledMessage(prev => ({ ...prev, scheduledTime: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>نص الرسالة</Label>
            <Textarea
              value={newScheduledMessage.message}
              onChange={(e) => setNewScheduledMessage(prev => ({ ...prev, message: e.target.value }))}
              placeholder="اكتب نص الرسالة هنا..."
              className="min-h-[80px]"
              dir="rtl"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>نوع الرسالة:</Label>
              <div className="flex gap-2">
                <Button
                  variant={newScheduledMessage.type === 'sms' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewScheduledMessage(prev => ({ ...prev, type: 'sms' }))}
                >
                  <MessageSquare className="h-4 w-4 ml-1" />
                  SMS
                </Button>
                <Button
                  variant={newScheduledMessage.type === 'whatsapp' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewScheduledMessage(prev => ({ ...prev, type: 'whatsapp' }))}
                >
                  <Phone className="h-4 w-4 ml-1" />
                  WhatsApp
                </Button>
              </div>
            </div>
            <Button onClick={scheduleMessage} className="mr-auto">
              <Send className="h-4 w-4 ml-2" />
              جدولة الرسالة
            </Button>
          </div>
          
          {scheduledMessages.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">الرسائل المجدولة ({scheduledMessages.length})</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {scheduledMessages.map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {msg.type === 'sms' ? (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Phone className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm font-medium">{msg.phone}</span>
                        <Badge variant={msg.status === 'pending' ? 'outline' : msg.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                          {msg.status === 'pending' ? 'قيد الانتظار' : msg.status === 'sent' ? 'تم الإرسال' : 'فشل'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">{msg.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.scheduledTime).toLocaleString('ar-SA')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScheduledMessage(msg.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
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
