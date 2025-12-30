/**
 * useViewingNotifications.ts
 * نظام إشعارات مواعيد المعاينة قبل ساعة مع نغمة خاصة
 */

import { useCallback, useEffect, useRef } from 'react';

export interface ViewingAppointment {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  location?: string;
  type: string;
  notes?: string;
  status: string;
}

// Viewing Appointment Sound Manager - نغمة خاصة لمواعيد المعاينة
class ViewingSoundManager {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async playViewingSound() {
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // نغمة خاصة لمواعيد المعاينة - ثلاث نغمات متصاعدة
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
      
      // ثلاث نغمات متصاعدة
      playNote(523.25, now, 0.3);        // C5
      playNote(659.25, now + 0.35, 0.3); // E5
      playNote(783.99, now + 0.7, 0.4);  // G5
      
      // تكرار النغمة بعد فترة
      setTimeout(() => {
        if (!this.audioContext) return;
        const now2 = this.audioContext.currentTime;
        playNote(523.25, now2, 0.3);
        playNote(659.25, now2 + 0.35, 0.3);
        playNote(783.99, now2 + 0.7, 0.4);
      }, 1500);

    } catch (error) {
      console.error('Error playing viewing sound:', error);
    }
  }
}

const viewingSoundManager = new ViewingSoundManager();

export interface ViewingNotification {
  id: string;
  appointmentId: string;
  type: 'viewing_reminder';
  title: string;
  message: string;
  appointment: ViewingAppointment;
  isRead: boolean;
  isPulsing: boolean;
  createdAt: string;
  actions: {
    accept: () => void;
    reject: () => void;
    call: () => void;
  };
}

export function useViewingNotifications() {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedViewingsRef = useRef<Set<string>>(new Set());

  // إنشاء رابط تأكيد المعاينة
  const createConfirmationLink = useCallback((appointment: ViewingAppointment, brokerId: string = '1') => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/viewing-confirm/${brokerId}/${appointment.id}`;
  }, []);

  // فتح الواتساب مع رسالة جاهزة
  const openWhatsApp = useCallback((phone: string, message: string) => {
    // تنظيف رقم الجوال
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '966' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('966')) {
      cleanPhone = '966' + cleanPhone;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }, []);

  // إرسال رابط التأكيد للعميل
  const sendConfirmationToClient = useCallback((appointment: ViewingAppointment, type: 'confirmation' | 'apology' = 'confirmation') => {
    const link = createConfirmationLink(appointment);
    
    let message = '';
    if (type === 'confirmation') {
      message = `السلام عليكم ${appointment.customerName}،

لديك موعد معاينة عقار بعد ساعة من الآن:
📅 التاريخ: ${new Date(appointment.date).toLocaleDateString('ar-SA')}
🕐 الوقت: ${appointment.time}
${appointment.location ? `📍 المكان: ${appointment.location}` : ''}

يرجى تأكيد حضورك من خلال الرابط التالي:
${link}

نتطلع لرؤيتك!`;
    } else {
      message = `السلام عليكم ${appointment.customerName}،

نعتذر عن عدم التمكن من الحضور لموعد المعاينة المحدد لأسباب قاهرة وخاصة.

نشكرك مقدماً على تفهمك ونطلب منك تحديد موعد آخر يناسبك من خلال الرابط التالي:
${link}

نعتذر مجدداً عن أي إزعاج.`;
    }

    openWhatsApp(appointment.customerPhone, message);
    return link;
  }, [createConfirmationLink, openWhatsApp]);

  // التحقق من مواعيد المعاينة القادمة
  const checkViewingAppointments = useCallback(() => {
    const storedAppointments = localStorage.getItem('appointments');
    if (!storedAppointments) return;

    try {
      const appointments: ViewingAppointment[] = JSON.parse(storedAppointments);
      const now = new Date();

      appointments.forEach(apt => {
        // فقط مواعيد المعاينة
        if (!apt.type?.includes('معاينة') && apt.type !== 'property_viewing') return;
        if (apt.status === 'completed' || apt.status === 'cancelled') return;

        const aptDate = new Date(apt.date);
        const isToday = aptDate.toDateString() === now.toDateString();
        if (!isToday) return;

        const [aptHour, aptMinute] = apt.time.split(':').map(Number);
        const appointmentTime = new Date(apt.date);
        appointmentTime.setHours(aptHour, aptMinute, 0, 0);
        
        const diffMs = appointmentTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        const aptKey = `viewing_${apt.id}`;

        // إشعار قبل ساعة من الموعد (بين 55-65 دقيقة)
        if (diffMins <= 65 && diffMins >= 55 && !notifiedViewingsRef.current.has(aptKey)) {
          notifiedViewingsRef.current.add(aptKey);
          
          // تشغيل النغمة الخاصة بالمعاينة
          viewingSoundManager.playViewingSound();
          
          // إنشاء إشعار خاص بالمعاينة
          const notification = {
            id: `viewing_notif_${Date.now()}`,
            type: 'viewing_reminder',
            title: '🏠 تذكير بموعد معاينة عقار',
            message: `موعد معاينة ${apt.title} بعد ساعة`,
            appointment: apt,
            appointmentId: apt.id,
            isRead: false,
            isPulsing: true,
            requiresAction: true,
            createdAt: new Date().toISOString(),
            details: {
              customerName: apt.customerName,
              customerPhone: apt.customerPhone,
              date: apt.date,
              time: apt.time,
              location: apt.location,
              notes: apt.notes,
              timeRemaining: 'بقي على الموعد ساعة للقاء العميل',
            },
          };
          
          // حفظ الإشعار
          const notifications = JSON.parse(localStorage.getItem('broker_notifications') || '[]');
          notifications.unshift(notification);
          localStorage.setItem('broker_notifications', JSON.stringify(notifications));

          // إرسال حدث للتطبيق
          window.dispatchEvent(new CustomEvent('viewingReminder', { 
            detail: notification 
          }));
          
          // إرسال رابط التأكيد للعميل عبر الواتساب
          sendConfirmationToClient(apt, 'confirmation');
        }
      });
    } catch (error) {
      console.error('Error checking viewing appointments:', error);
    }
  }, [sendConfirmationToClient]);

  // قبول الحضور
  const acceptViewing = useCallback((appointment: ViewingAppointment) => {
    sendConfirmationToClient(appointment, 'confirmation');
    
    // تحديث حالة الموعد
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = appointments.map((apt: ViewingAppointment) => 
      apt.id === appointment.id 
        ? { ...apt, status: 'broker_confirmed', brokerConfirmedAt: new Date().toISOString() }
        : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updated));

    return true;
  }, [sendConfirmationToClient]);

  // رفض الحضور وإرسال اعتذار
  const rejectViewing = useCallback((appointment: ViewingAppointment) => {
    sendConfirmationToClient(appointment, 'apology');
    
    // تحديث حالة الموعد
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = appointments.map((apt: ViewingAppointment) => 
      apt.id === appointment.id 
        ? { ...apt, status: 'broker_rejected', slotOpen: true, brokerRejectedAt: new Date().toISOString() }
        : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updated));

    return true;
  }, [sendConfirmationToClient]);

  // الاتصال بالعميل
  const callClient = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`;
  }, []);

  useEffect(() => {
    // التحقق فوراً
    checkViewingAppointments();
    
    // التحقق كل دقيقة
    checkIntervalRef.current = setInterval(checkViewingAppointments, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkViewingAppointments]);

  return {
    checkViewingAppointments,
    sendConfirmationToClient,
    acceptViewing,
    rejectViewing,
    callClient,
    createConfirmationLink,
    openWhatsApp,
  };
}

// Helper to trigger viewing notification manually
export function triggerViewingNotification(appointment: ViewingAppointment) {
  window.dispatchEvent(new CustomEvent('viewingReminder', { 
    detail: { appointment } 
  }));
  viewingSoundManager.playViewingSound();
}
