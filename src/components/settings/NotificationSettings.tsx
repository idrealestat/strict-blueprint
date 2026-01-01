/**
 * NotificationSettings.tsx
 * صفحة إعدادات الإشعارات والرسائل النصية
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
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
  ArrowRight,
  FileText,
  BarChart3,
  Edit3,
  RotateCcw,
  Eye,
  Calendar,
  Send,
  Download,
  Trash2
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';

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
  
  // قوالب الرسائل
  templates: MessageTemplates;
}

interface MessageTemplates {
  appointmentReminder: string;
  priceQuoteAccepted: string;
  priceQuoteRejected: string;
  viewingConfirmation: string;
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

const sampleData = {
  clientName: 'أحمد محمد',
  propertyLocation: 'الرياض - حي النرجس',
  date: '2026-01-15',
  time: '10:00',
  amount: '850,000',
  minPrice: '900,000',
  clientPhone: '0501234567'
};

const defaultTemplates: MessageTemplates = {
  appointmentReminder: 'مرحباً {clientName}، نذكرك بموعد معاينة العقار في {propertyLocation} يوم {date} الساعة {time}. نتطلع لرؤيتك!',
  priceQuoteAccepted: 'مرحباً {clientName}، تم قبول عرض السعر الخاص بك بمبلغ {amount} ريال للعقار في {propertyLocation}. سيتم التواصل معك قريباً لإتمام الإجراءات.',
  priceQuoteRejected: 'مرحباً {clientName}، نأسف لإبلاغك بأن عرض السعر المقدم ({amount} ريال) لم يتم قبوله. الحد الأدنى المقبول هو {minPrice} ريال. يسعدنا استقبال عرض جديد منك.',
  viewingConfirmation: 'تم تأكيد موعد معاينة العقار في {propertyLocation} يوم {date} الساعة {time}. العميل: {clientName} - {clientPhone}',
};

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
  templates: defaultTemplates,
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [messageStats, setMessageStats] = useState<MessageStats>({ smsCount: 0, whatsappCount: 0, month: '' });
  const [editingTemplate, setEditingTemplate] = useState<keyof MessageTemplates | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<keyof MessageTemplates | null>(null);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [newScheduledMessage, setNewScheduledMessage] = useState({
    phone: '',
    message: '',
    scheduledTime: '',
    type: 'sms' as 'sms' | 'whatsapp'
  });
  const [exportingPDF, setExportingPDF] = useState(false);

  // تحميل الإعدادات المحفوظة والإحصائيات
  useEffect(() => {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed, templates: { ...defaultTemplates, ...parsed.templates } });
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
    
    // تحميل إحصائيات الرسائل
    loadMessageStats();
  }, []);

  const loadMessageStats = () => {
    const currentMonth = new Date().toLocaleString('ar-SA', { month: 'long', year: 'numeric' });
    const smsLogs = localStorage.getItem('sms_logs');
    const whatsappLogs = localStorage.getItem('whatsapp_logs');
    
    let smsCount = 0;
    let whatsappCount = 0;
    const dailyStats: { day: string; sms: number; whatsapp: number }[] = [];
    
    // إنشاء بيانات الأيام للشهر الحالي
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    for (let i = 1; i <= Math.min(daysInMonth, 31); i++) {
      dailyStats.push({ day: i.toString(), sms: 0, whatsapp: 0 });
    }
    
    if (smsLogs) {
      try {
        const logs = JSON.parse(smsLogs);
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        logs.forEach((log: any) => {
          const logDate = new Date(log.timestamp);
          if (logDate.getMonth() === thisMonth && logDate.getFullYear() === thisYear) {
            smsCount++;
            const day = logDate.getDate();
            if (dailyStats[day - 1]) dailyStats[day - 1].sms++;
          }
        });
      } catch (e) {}
    }
    
    if (whatsappLogs) {
      try {
        const logs = JSON.parse(whatsappLogs);
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        logs.forEach((log: any) => {
          const logDate = new Date(log.timestamp);
          if (logDate.getMonth() === thisMonth && logDate.getFullYear() === thisYear) {
            whatsappCount++;
            const day = logDate.getDate();
            if (dailyStats[day - 1]) dailyStats[day - 1].whatsapp++;
          }
        });
      } catch (e) {}
    }
    
    setMessageStats({ smsCount, whatsappCount, month: currentMonth, dailyStats });
  };

  // معاينة قالب الرسالة مع البيانات التجريبية
  const getPreviewMessage = (template: string) => {
    let preview = template;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return preview;
  };

  // جدولة رسالة جديدة
  const scheduleMessage = async () => {
    if (!newScheduledMessage.phone || !newScheduledMessage.message || !newScheduledMessage.scheduledTime) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    
    try {
      // حفظ في قاعدة البيانات
      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          phone: newScheduledMessage.phone,
          message: newScheduledMessage.message,
          scheduled_time: new Date(newScheduledMessage.scheduledTime).toISOString(),
          message_type: newScheduledMessage.type,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // تحديث القائمة المحلية
      const newMessage: ScheduledMessage = {
        id: data.id,
        phone: data.phone,
        message: data.message,
        scheduledTime: data.scheduled_time,
        type: data.message_type as 'sms' | 'whatsapp',
        status: data.status as 'pending' | 'sent' | 'failed'
      };
      
      setScheduledMessages(prev => [...prev, newMessage]);
      setNewScheduledMessage({ phone: '', message: '', scheduledTime: '', type: 'sms' });
      toast.success('تم جدولة الرسالة بنجاح - سيتم إرسالها تلقائياً في الوقت المحدد');
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast.error('فشل في جدولة الرسالة');
    }
  };

  // حذف رسالة مجدولة
  const deleteScheduledMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScheduledMessages(prev => prev.filter(m => m.id !== id));
      toast.success('تم حذف الرسالة المجدولة');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('فشل في حذف الرسالة');
    }
  };

  // تشغيل معالجة الرسائل المجدولة
  const processScheduledMessages = async () => {
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        toast.error('تعذر الاتصال بخدمة الرسائل');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/process-scheduled-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.sent > 0) {
          toast.success(`تم إرسال ${result.sent} رسالة بنجاح`);
        }
        if (result.failed > 0) {
          toast.error(`فشل في إرسال ${result.failed} رسالة`);
        }
        // إعادة تحميل الرسائل المجدولة
        loadScheduledMessagesFromDB();
      }
    } catch (error) {
      console.error('Error processing messages:', error);
    }
  };

  // تحميل الرسائل المجدولة من قاعدة البيانات
  const loadScheduledMessagesFromDB = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .in('status', ['pending', 'whatsapp_pending'])
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      if (data) {
        setScheduledMessages(data.map(msg => ({
          id: msg.id,
          phone: msg.phone,
          message: msg.message,
          scheduledTime: msg.scheduled_time,
          type: msg.message_type as 'sms' | 'whatsapp',
          status: msg.status as 'pending' | 'sent' | 'failed'
        })));
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
    }
  }, []);

  // تحميل الرسائل عند بدء التشغيل وتشغيل المعالجة كل دقيقة
  useEffect(() => {
    loadScheduledMessagesFromDB();
    
    // معالجة الرسائل كل دقيقة
    const interval = setInterval(() => {
      processScheduledMessages();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadScheduledMessagesFromDB]);

  // تصدير الإحصائيات كـ PDF
  const exportStatsPDF = async () => {
    setExportingPDF(true);
    try {
      const doc = new jsPDF();
      
      // إضافة عنوان
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Monthly Message Statistics Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 105, 30, { align: 'center' });
      doc.text(`Month: ${messageStats.month}`, 105, 38, { align: 'center' });
      
      // إحصائيات عامة
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Summary', 20, 55);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`SMS Messages Sent: ${messageStats.smsCount}`, 25, 65);
      doc.text(`WhatsApp Messages Sent: ${messageStats.whatsappCount}`, 25, 73);
      doc.text(`Total Messages: ${messageStats.smsCount + messageStats.whatsappCount}`, 25, 81);
      
      // رسم بياني بسيط
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Distribution Chart', 20, 100);
      
      const total = messageStats.smsCount + messageStats.whatsappCount || 1;
      const smsPercent = Math.round((messageStats.smsCount / total) * 100);
      const whatsappPercent = 100 - smsPercent;
      
      // رسم شريط SMS
      doc.setFillColor(59, 130, 246);
      doc.rect(25, 110, smsPercent * 1.5, 15, 'F');
      doc.text(`SMS: ${smsPercent}%`, 25 + smsPercent * 1.5 + 5, 120);
      
      // رسم شريط WhatsApp
      doc.setFillColor(34, 197, 94);
      doc.rect(25, 130, whatsappPercent * 1.5, 15, 'F');
      doc.text(`WhatsApp: ${whatsappPercent}%`, 25 + whatsappPercent * 1.5 + 5, 140);
      
      // جدول الإحصائيات اليومية
      if (messageStats.dailyStats && messageStats.dailyStats.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Daily Breakdown (First 15 days)', 20, 165);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        let yPos = 175;
        doc.text('Day', 25, yPos);
        doc.text('SMS', 60, yPos);
        doc.text('WhatsApp', 95, yPos);
        doc.text('Total', 140, yPos);
        
        yPos += 8;
        messageStats.dailyStats.slice(0, 15).forEach((day, index) => {
          doc.text(day.day, 25, yPos);
          doc.text(day.sms.toString(), 60, yPos);
          doc.text(day.whatsapp.toString(), 95, yPos);
          doc.text((day.sms + day.whatsapp).toString(), 140, yPos);
          yPos += 6;
        });
      }
      
      // حفظ الملف
      doc.save(`message-stats-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      toast.error('فشل في تصدير التقرير');
      console.error(error);
    }
    setExportingPDF(false);
  };

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

  // تحديث قالب رسالة
  const updateTemplate = (key: keyof MessageTemplates, value: string) => {
    setPreferences(prev => ({
      ...prev,
      templates: { ...prev.templates, [key]: value }
    }));
  };

  // إعادة تعيين قالب للافتراضي
  const resetTemplate = (key: keyof MessageTemplates) => {
    updateTemplate(key, defaultTemplates[key]);
    toast.success('تم إعادة تعيين القالب للنص الافتراضي');
  };

  const templateLabels: Record<keyof MessageTemplates, { title: string; description: string }> = {
    appointmentReminder: {
      title: 'تذكير الموعد',
      description: 'يُرسل قبل موعد المعاينة'
    },
    priceQuoteAccepted: {
      title: 'قبول عرض السعر',
      description: 'يُرسل عند قبول عرض سعر من العميل'
    },
    priceQuoteRejected: {
      title: 'رفض عرض السعر',
      description: 'يُرسل عند رفض عرض سعر مع ذكر الحد الأدنى'
    },
    viewingConfirmation: {
      title: 'تأكيد المعاينة',
      description: 'يُرسل لتأكيد موعد المعاينة'
    }
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
          
          {/* رسم بياني */}
          {(messageStats.smsCount > 0 || messageStats.whatsappCount > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pie Chart */}
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
              
              {/* Bar Chart */}
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
              
              {/* معاينة الرسالة مع البيانات التجريبية */}
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
          
          {/* قائمة الرسائل المجدولة */}
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
