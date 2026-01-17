/**
 * useAppointmentReminders.ts
 * نظام التذكير بالمواعيد قبل الوقت المحدد في الإعدادات
 * يعمل مع calendar_appointments من قاعدة البيانات
 */

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import { getFullUrl } from '@/utils/slugify';

interface CalendarSettings {
  brokerReminderEnabled: boolean;
  brokerReminderMinutes: number;
  brokerReminderType: 'auto' | 'manual';
  clientReminderEnabled: boolean;
  clientReminderMinutes: number;
  clientReminderType: 'auto' | 'manual';
  sendMethod: 'sms' | 'whatsapp' | 'both';
  soundEnabled: boolean;
  soundOnAccept: boolean;
  soundOnReject: boolean;
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
  confirmationMessage: 'السلام عليكم {customerName}، لديك موعد معاينة بعد ساعة. يرجى تأكيد حضورك: {link}',
  apologyMessage: 'السلام عليكم {customerName}، نعتذر عن الموعد لأسباب طارئة. نرجو تحديد موعد آخر: {link}',
};

// Sound Manager للتذكيرات
class ReminderSoundManager {
  private audioContext: AudioContext | null = null;

  async playReminderSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = this.audioContext.currentTime;
      // ثلاث نغمات تصاعدية
      playNote(523.25, now, 0.3);
      playNote(659.25, now + 0.35, 0.3);
      playNote(783.99, now + 0.7, 0.4);
      
      // تكرار بعد 1.5 ثانية
      setTimeout(() => {
        if (!this.audioContext) return;
        const now2 = this.audioContext.currentTime;
        playNote(523.25, now2, 0.3);
        playNote(659.25, now2 + 0.35, 0.3);
        playNote(783.99, now2 + 0.7, 0.4);
      }, 1500);
    } catch (e) {
      console.error('Error playing reminder sound:', e);
    }
  }
}

const soundManager = new ReminderSoundManager();

export function useAppointmentReminders() {
  const { user } = useAuthContext();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedAppointmentsRef = useRef<Set<string>>(new Set());
  const settingsRef = useRef<CalendarSettings>(defaultSettings);

  // تحميل الإعدادات
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('calendar_settings');
      if (saved) {
        try {
          settingsRef.current = { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
      }
    };
    
    loadSettings();
    
    // الاستماع لتغييرات الإعدادات
    const handleSettingsChange = (e: CustomEvent) => {
      settingsRef.current = { ...defaultSettings, ...e.detail };
    };
    
    window.addEventListener('calendarSettingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('calendarSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  // إرسال SMS
  const sendSMS = useCallback(async (phone: string, message: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to: phone, message }
      });
      
      if (error) {
        console.error('SMS error:', error);
        return false;
      }
      return data?.success || false;
    } catch (e) {
      console.error('SMS error:', e);
      return false;
    }
  }, []);

  // فتح واتساب
  const openWhatsApp = useCallback((phone: string, message: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '966' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('966')) {
      cleanPhone = '966' + cleanPhone;
    }
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }, []);

  // إنشاء رابط التأكيد
  const createConfirmLink = useCallback((slug: string, appointmentId: string, type: 'broker' | 'customer') => {
    return getFullUrl(`/${slug}/appointmentapproval/${type}/${appointmentId}`);
  }, []);

  // التحقق من المواعيد وإرسال التذكيرات
  const checkAppointments = useCallback(async () => {
    if (!user) return;
    
    const settings = settingsRef.current;
    const now = new Date();

    try {
      // جلب بطاقة الأعمال للحصول على الـ slug
      const { data: businessCard } = await supabase
        .from('business_cards')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle();

      const slug = businessCard?.slug || 'broker';

      // جلب المواعيد القادمة
      const { data: appointments, error } = await supabase
        .from('calendar_appointments')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['scheduled', 'pending', 'broker_confirmed'])
        .gte('appointment_date', now.toISOString().split('T')[0]);

      if (error || !appointments) return;

      for (const apt of appointments) {
        const aptDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
        const diffMs = aptDateTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        // تذكير الوسيط
        if (settings.brokerReminderEnabled) {
          const brokerKey = `broker_${apt.id}`;
          const targetMins = settings.brokerReminderMinutes;
          
          if (diffMins <= targetMins + 5 && diffMins >= targetMins - 5 && !notifiedAppointmentsRef.current.has(brokerKey)) {
            notifiedAppointmentsRef.current.add(brokerKey);
            
            // تشغيل الصوت
            if (settings.soundEnabled) {
              soundManager.playReminderSound();
            }

            // إنشاء إشعار للوسيط
            await supabase.from('notifications').insert({
              user_id: user.id,
              title: '🔔 تذكير بموعد قادم',
              message: `موعد "${apt.title}" مع ${apt.customer_name} بعد ${targetMins} دقيقة`,
              notification_type: 'appointment_reminder',
              related_entity_id: apt.id,
              related_entity_type: 'appointment',
              priority: 'high',
              action_url: createConfirmLink(slug, apt.id, 'broker'),
              metadata: {
                is_pulsing: true,
                appointment_time: apt.appointment_time,
                customer_phone: apt.customer_phone,
              },
            });

            // إرسال رابط للوسيط (إذا كان تلقائي)
            if (settings.brokerReminderType === 'auto') {
              const brokerLink = createConfirmLink(slug, apt.id, 'broker');
              const brokerMessage = `تذكير: لديك موعد مع ${apt.customer_name} الساعة ${apt.appointment_time}. تأكيد الحضور: ${brokerLink}`;
              
              // يمكن إرسال SMS للوسيط نفسه إذا أراد
              toast.info(`⏰ موعد قادم بعد ${targetMins} دقيقة`, {
                description: `${apt.title} مع ${apt.customer_name}`,
                duration: 10000,
                action: {
                  label: 'تأكيد',
                  onClick: () => window.open(brokerLink, '_blank'),
                },
              });
            } else {
              // تنبيه يدوي فقط
              const brokerLink = createConfirmLink(slug, apt.id, 'broker');
              toast.info(`⏰ موعد قادم بعد ${targetMins} دقيقة`, {
                description: `${apt.title} مع ${apt.customer_name}`,
                duration: 10000,
                action: {
                  label: 'تأكيد الحضور',
                  onClick: () => window.open(brokerLink, '_blank'),
                },
              });
            }
          }
        }

        // تذكير العميل
        if (settings.clientReminderEnabled && apt.customer_phone) {
          const clientKey = `client_${apt.id}`;
          const targetMins = settings.clientReminderMinutes;
          
          if (diffMins <= targetMins + 5 && diffMins >= targetMins - 5 && !notifiedAppointmentsRef.current.has(clientKey)) {
            notifiedAppointmentsRef.current.add(clientKey);
            
            const clientLink = createConfirmLink(slug, apt.id, 'customer');
            
            // تحضير الرسالة
            let message = settings.confirmationMessage
              .replace('{customerName}', apt.customer_name)
              .replace('{link}', clientLink);

            // إرسال حسب الإعداد
            if (settings.clientReminderType === 'auto') {
              if (settings.sendMethod === 'sms' || settings.sendMethod === 'both') {
                const sent = await sendSMS(apt.customer_phone, message);
                if (sent) {
                  toast.success(`تم إرسال تذكير SMS للعميل ${apt.customer_name}`);
                }
              }
              
              if (settings.sendMethod === 'whatsapp' || settings.sendMethod === 'both') {
                setTimeout(() => {
                  openWhatsApp(apt.customer_phone, message);
                }, settings.sendMethod === 'both' ? 2000 : 0);
              }
            } else {
              // يدوي - عرض تنبيه فقط
              toast.info(`📱 حان وقت إرسال تذكير للعميل`, {
                description: `${apt.customer_name} - ${apt.customer_phone}`,
                duration: 15000,
                action: {
                  label: 'إرسال الآن',
                  onClick: () => {
                    if (settings.sendMethod === 'sms' || settings.sendMethod === 'both') {
                      sendSMS(apt.customer_phone, message);
                    }
                    if (settings.sendMethod === 'whatsapp' || settings.sendMethod === 'both') {
                      openWhatsApp(apt.customer_phone, message);
                    }
                  },
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking appointments:', error);
    }
  }, [user, sendSMS, openWhatsApp, createConfirmLink]);

  // بدء الفحص الدوري
  useEffect(() => {
    if (!user) return;

    // فحص فوري
    checkAppointments();
    
    // فحص كل دقيقة
    checkIntervalRef.current = setInterval(checkAppointments, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, checkAppointments]);

  return {
    checkAppointments,
    sendSMS,
    openWhatsApp,
  };
}
