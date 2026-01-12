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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Trash2,
  History,
  Sparkles
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import { MessagesLog } from './MessagesLog';
import FloatingBubbleSettings from './FloatingBubbleSettings';
import SmartOpportunitiesSettings from './SmartOpportunitiesSettings';
import { SettingsTabContent } from './SettingsTabContent';

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

    // الاستماع للتغييرات في الوقت الفعلي
    const channel = supabase
      .channel('scheduled-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scheduled_messages'
        },
        (payload) => {
          const newStatus = payload.new.status;
          const phone = payload.new.phone;
          
          if (newStatus === 'sent') {
            toast.success(`تم إرسال الرسالة المجدولة بنجاح إلى ${phone}`, {
              duration: 5000,
              icon: '✅'
            });
            // تشغيل صوت نجاح
            playNotificationSound('success');
          } else if (newStatus === 'failed') {
            toast.error(`فشل إرسال الرسالة إلى ${phone}: ${payload.new.error_message || 'خطأ غير معروف'}`, {
              duration: 8000,
              icon: '❌'
            });
            // تشغيل صوت خطأ
            playNotificationSound('error');
          } else if (newStatus === 'whatsapp_pending') {
            toast.info(`رسالة واتساب جاهزة للإرسال إلى ${phone}`, {
              duration: 5000,
              icon: '📱'
            });
          }
          
          // تحديث القائمة
          loadScheduledMessagesFromDB();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [loadScheduledMessagesFromDB]);

  // تشغيل صوت الإشعار
  const playNotificationSound = (type: 'success' | 'error') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'success') {
        // صوت نجاح (نغمة صاعدة)
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
      } else {
        // صوت خطأ (نغمة هابطة)
        oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 0.15); // E4
      }
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('Could not play notification sound');
    }
  };

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
      // استخدام توكن الجلسة بدلاً من publishable key للأمان
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('يرجى تسجيل الدخول أولاً');
        setTestingSMS(false);
        return;
      }
      
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        toast.error('لم يتم تكوين خدمة الرسائل');
        setTestingSMS(false);
        return;
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="smart-opportunities" className="gap-2">
            <Sparkles className="w-4 h-4" />
            الفرص الذكية
          </TabsTrigger>
          <TabsTrigger value="floating-bubble" className="gap-2">
            <Smartphone className="w-4 h-4" />
            الفقاعة العائمة
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="w-4 h-4" />
            سجل الرسائل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTabContent
            preferences={preferences}
            updatePreference={updatePreference}
            savePreferences={savePreferences}
            isSaving={isSaving}
            messageStats={messageStats}
            exportStatsPDF={exportStatsPDF}
            exportingPDF={exportingPDF}
            testSound={testSound}
            testSMS={testSMS}
            testingSMS={testingSMS}
            testPhone={testPhone}
            setTestPhone={setTestPhone}
            addTestAppointment={addTestAppointment}
            editingTemplate={editingTemplate}
            setEditingTemplate={setEditingTemplate}
            previewTemplate={previewTemplate}
            setPreviewTemplate={setPreviewTemplate}
            updateTemplate={updateTemplate}
            resetTemplate={resetTemplate}
            getPreviewMessage={getPreviewMessage}
            templateLabels={templateLabels}
            sampleData={sampleData}
            scheduledMessages={scheduledMessages}
            newScheduledMessage={newScheduledMessage}
            setNewScheduledMessage={setNewScheduledMessage}
            scheduleMessage={scheduleMessage}
            deleteScheduledMessage={deleteScheduledMessage}
          />
        </TabsContent>

        <TabsContent value="smart-opportunities">
          <SmartOpportunitiesSettings />
        </TabsContent>

        <TabsContent value="floating-bubble">
          <FloatingBubbleSettings />
        </TabsContent>

        <TabsContent value="logs">
          <MessagesLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
