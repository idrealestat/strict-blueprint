/**
 * useNotificationSystem.ts
 * نظام الإشعارات مع التذكير بالمهام المتأخرة والمواعيد القادمة
 * مع صوت تنبيه و Realtime من قاعدة البيانات و Push Notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showPushNotification } from './usePushNotifications';
import { markAsNew } from './usePublishedAdsManager';

// Types
export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'appointment' | 'reminder';
  read: boolean;
  category: 'task' | 'appointment' | 'system' | 'customer' | 'incoming';
  actionType?: 'task_overdue' | 'task_due_soon' | 'appointment_upcoming' | 'appointment_now' | 'offer' | 'request' | 'calendar';
  relatedId?: string;
  createdAt: Date;
  actionUrl?: string;
  metadata?: {
    customerId?: string;
    formType?: string;
    customerName?: string;
    customerPhone?: string;
    [key: string]: any;
  };
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  linkedCustomer?: { id: string; name: string; phone: string };
}

export interface Appointment {
  id: string;
  title: string;
  customerName: string;
  date: Date;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reminder: boolean;
  reminderTime: number;
}

// Notification Sound Manager
class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  async playNotificationSound(type: 'default' | 'urgent' | 'reminder' = 'default') {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (browser policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sounds for different notification types
      switch (type) {
        case 'urgent':
          // Double beep for urgent
          oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
          gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.15);

          // Second beep
          setTimeout(() => {
            if (!this.audioContext) return;
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(this.audioContext.destination);
            osc2.frequency.setValueAtTime(880, this.audioContext.currentTime);
            gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            osc2.start(this.audioContext.currentTime);
            osc2.stop(this.audioContext.currentTime + 0.15);
          }, 200);
          break;

        case 'reminder':
          // Gentle chime for reminders
          oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
          gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.4);
          break;

        default:
          // Standard notification sound
          oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime); // E5
          gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
}

// Create singleton instance
const soundManager = new NotificationSoundManager();

// Hook
export function useNotificationSystem() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const notifiedAppointmentsRef = useRef<Set<string>>(new Set());

  // Add notification
  const addNotification = useCallback((notification: Omit<SystemNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Play sound based on notification type
    if (soundEnabled) {
      if (notification.type === 'error' || notification.actionType === 'task_overdue') {
        soundManager.playNotificationSound('urgent');
      } else if (notification.type === 'reminder' || notification.actionType?.includes('upcoming')) {
        soundManager.playNotificationSound('reminder');
      } else {
        soundManager.playNotificationSound('default');
      }
    }

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('newNotification', { detail: newNotification }));

    return newNotification;
  }, [soundEnabled]);

  // Mark as read - with database sync
  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    
    // تحديث في قاعدة البيانات
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }, []);

  // Mark all as read - with database sync
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // تحديث في قاعدة البيانات
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  }, []);

  // Delete notification - with database sync
  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // حذف من قاعدة البيانات
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  }, []);

  // Delete all notifications - with database sync
  const deleteAllNotifications = useCallback(async () => {
    setNotifications([]);
    
    // حذف من قاعدة البيانات
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.error('Error deleting all notifications:', e);
    }
  }, []);

  // Check for overdue tasks
  const checkOverdueTasks = useCallback(() => {
    // Get tasks from localStorage (simulated)
    const storedTasks = localStorage.getItem('tasks');
    if (!storedTasks) return;

    try {
      const tasks: Task[] = JSON.parse(storedTasks);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      tasks.forEach(task => {
        if (task.status === 'completed') return;

        const taskKey = `task_${task.id}_${task.dueDate}`;
        
        // Check if task is overdue
        if (task.dueDate < today && !notifiedTasksRef.current.has(`${taskKey}_overdue`)) {
          notifiedTasksRef.current.add(`${taskKey}_overdue`);
          addNotification({
            title: '⚠️ مهمة متأخرة',
            message: `المهمة "${task.title}" متأخرة عن موعدها!`,
            time: 'الآن',
            type: 'error',
            category: 'task',
            actionType: 'task_overdue',
            relatedId: task.id,
          });
        }

        // Check if task is due today
        if (task.dueDate === today && task.dueTime) {
          const [taskHour, taskMinute] = task.dueTime.split(':').map(Number);
          const minutesUntilDue = (taskHour * 60 + taskMinute) - (currentHour * 60 + currentMinute);

          // Notify 30 minutes before
          if (minutesUntilDue <= 30 && minutesUntilDue > 0 && !notifiedTasksRef.current.has(`${taskKey}_soon`)) {
            notifiedTasksRef.current.add(`${taskKey}_soon`);
            addNotification({
              title: '⏰ مهمة قادمة',
              message: `المهمة "${task.title}" ستحل بعد ${minutesUntilDue} دقيقة`,
              time: 'الآن',
              type: 'warning',
              category: 'task',
              actionType: 'task_due_soon',
              relatedId: task.id,
            });
          }
        }
      });
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }, [addNotification]);

  // Send SMS notification for appointment
  const sendAppointmentSMS = useCallback(async (apt: any, minutesUntil: number) => {
    const message = minutesUntil > 0
      ? `تذكير: لديك موعد معاينة "${apt.title || apt.propertyTitle}" بعد ${minutesUntil} دقيقة في ${apt.location || apt.propertyLocation || 'الموقع المحدد'}. - وساطة`
      : `حان الآن موعد معاينة "${apt.title || apt.propertyTitle}" في ${apt.location || apt.propertyLocation || 'الموقع المحدد'}. - وساطة`;
    
    const customerPhone = apt.customerPhone || apt.clientPhone;
    if (!customerPhone) return;
    
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      if (!supabaseUrl) return;
      
      // استخدام supabase.functions.invoke للاستفادة من توكن الجلسة تلقائياً
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: customerPhone,
          message,
          messageType: 'appointment_reminder',
          appointmentId: apt.id,
        },
      });
      
      if (error) {
        console.error('SMS error:', error);
      }
      console.log('Appointment SMS sent successfully');
    } catch (error) {
      console.error('Failed to send appointment SMS:', error);
    }
  }, []);

  // Check for upcoming appointments
  const checkUpcomingAppointments = useCallback(() => {
    // التحقق من إعدادات الإشعارات
    const prefsStr = localStorage.getItem('notification_preferences');
    let prefs = { appointmentNotifications: true, smsForAppointments: true, appointmentReminderMinutes: 30 };
    if (prefsStr) {
      try {
        const saved = JSON.parse(prefsStr);
        prefs = { ...prefs, ...saved };
      } catch (e) {}
    }
    
    if (!prefs.appointmentNotifications) return;
    
    // Get appointments from localStorage
    const storedAppointments = localStorage.getItem('appointments');
    const viewingAppointments = localStorage.getItem('calendar_appointments');
    
    let allAppointments: any[] = [];
    
    if (storedAppointments) {
      try {
        allAppointments = [...allAppointments, ...JSON.parse(storedAppointments)];
      } catch (e) {}
    }
    
    if (viewingAppointments) {
      try {
        const viewings = JSON.parse(viewingAppointments).map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
          customerName: apt.clientName,
          customerPhone: apt.clientPhone,
          reminder: true,
          reminderTime: apt.reminderTime || prefs.appointmentReminderMinutes,
        }));
        allAppointments = [...allAppointments, ...viewings];
      } catch (e) {}
    }
    
    if (allAppointments.length === 0) return;

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      allAppointments.forEach(apt => {
        if (apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'مكتمل' || apt.status === 'ملغي') return;
        if (apt.reminder === false) return;

        const aptDate = new Date(apt.date);
        const isToday = aptDate.toDateString() === now.toDateString();
        
        if (!isToday) return;

        // Parse time - handle both formats
        let aptHour = 0, aptMinute = 0;
        const timeStr = apt.time || '';
        if (timeStr.includes('ص') || timeStr.includes('م')) {
          const parts = timeStr.replace(' ص', '').replace(' م', '').split(':');
          aptHour = parseInt(parts[0]) || 0;
          aptMinute = parseInt(parts[1]) || 0;
          if (timeStr.includes('م') && aptHour < 12) aptHour += 12;
        } else {
          const parts = timeStr.split(':');
          aptHour = parseInt(parts[0]) || 0;
          aptMinute = parseInt(parts[1]) || 0;
        }
        
        const minutesUntilApt = (aptHour * 60 + aptMinute) - (currentHour * 60 + currentMinute);
        const aptKey = `apt_${apt.id}_${aptDate.toDateString()}`;
        const reminderTime = apt.reminderTime || prefs.appointmentReminderMinutes || 30;

        // Notify at reminder time (default 30 min)
        if (minutesUntilApt <= reminderTime && minutesUntilApt > 0 && !notifiedAppointmentsRef.current.has(`${aptKey}_upcoming`)) {
          notifiedAppointmentsRef.current.add(`${aptKey}_upcoming`);
          
          // إضافة إشعار داخلي
          addNotification({
            title: '📅 موعد معاينة قادم',
            message: `موعد "${apt.title || apt.propertyTitle}" مع ${apt.customerName || apt.clientName} بعد ${minutesUntilApt} دقيقة`,
            time: 'الآن',
            type: 'reminder',
            category: 'appointment',
            actionType: 'appointment_upcoming',
            relatedId: apt.id,
          });
          
          // إرسال SMS إذا مفعّل
          if (prefs.smsForAppointments) {
            sendAppointmentSMS(apt, minutesUntilApt);
          }
        }

        // Notify when appointment is now
        if (minutesUntilApt <= 5 && minutesUntilApt >= -5 && !notifiedAppointmentsRef.current.has(`${aptKey}_now`)) {
          notifiedAppointmentsRef.current.add(`${aptKey}_now`);
          
          addNotification({
            title: '🔔 موعد المعاينة الآن!',
            message: `حان موعد "${apt.title || apt.propertyTitle}" مع ${apt.customerName || apt.clientName}`,
            time: 'الآن',
            type: 'warning',
            category: 'appointment',
            actionType: 'appointment_now',
            relatedId: apt.id,
          });
          
          // إرسال SMS عند حلول الموعد
          if (prefs.smsForAppointments) {
            sendAppointmentSMS(apt, 0);
          }
        }
      });
    } catch (error) {
      console.error('Error checking upcoming appointments:', error);
    }
  }, [addNotification, sendAppointmentSMS]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundManager.setEnabled(newState);
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(newState));
  }, [soundEnabled]);

  // Test notification sound
  const testSound = useCallback(() => {
    soundManager.playNotificationSound('default');
  }, []);

  // Initialize - load preferences and fetch notifications from database
  useEffect(() => {
    // Load sound preference
    const savedPref = localStorage.getItem('notificationSoundEnabled');
    if (savedPref !== null) {
      const enabled = JSON.parse(savedPref);
      setSoundEnabled(enabled);
      soundManager.setEnabled(enabled);
    }

    // جلب الإشعارات من قاعدة البيانات
    const fetchNotificationsFromDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // إذا لم يكن هناك مستخدم، جلب من localStorage كاحتياط
        const savedNotifications = localStorage.getItem('systemNotifications');
        if (savedNotifications) {
          try {
            const parsed = JSON.parse(savedNotifications);
            setNotifications(parsed.map((n: any) => ({
              ...n,
              createdAt: new Date(n.createdAt),
            })));
          } catch (e) {
            console.error('Error loading notifications:', e);
          }
        }
        return;
      }

      try {
        const { data: dbNotifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        if (dbNotifications && dbNotifications.length > 0) {
          const mappedNotifs: SystemNotification[] = dbNotifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: formatTimeAgo(new Date(n.created_at)),
            type: mapPriorityToTypeStatic(n.priority),
            category: mapCategoryToSystemStatic(n.category),
            read: n.is_read || false,
            createdAt: new Date(n.created_at),
            relatedId: n.related_entity_id,
            actionType: n.notification_type,
            actionUrl: n.action_url,
            metadata: n.metadata,
          }));

          setNotifications(mappedNotifs);
          console.log('[NotificationSystem] Loaded', mappedNotifs.length, 'notifications from DB');
        }
      } catch (e) {
        console.error('Error fetching notifications:', e);
      }
    };

    fetchNotificationsFromDB();
  }, []);

  // دوال مساعدة ثابتة (خارج useCallback)
  function mapPriorityToTypeStatic(priority: string): SystemNotification['type'] {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'low': return 'info';
      default: return 'success';
    }
  }

  function mapCategoryToSystemStatic(category: string): SystemNotification['category'] {
    if (category?.includes('customer') || category?.includes('crm')) return 'customer';
    if (category?.includes('appointment') || category?.includes('calendar')) return 'appointment';
    if (category?.includes('task')) return 'task';
    return 'system';
  }

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  }

  // ==================== REALTIME SUBSCRIPTION ====================
  // الاشتراك في الوقت الفعلي لجدول notifications
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('db-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[NotificationSystem] New DB notification:', payload);
            const newNotif = payload.new as any;
            
            // إضافة الإشعار للقائمة
            const systemNotif: SystemNotification = {
              id: newNotif.id,
              title: newNotif.title,
              message: newNotif.message,
              time: 'الآن',
              type: mapPriorityToType(newNotif.priority),
              category: mapCategoryToSystem(newNotif.category),
              read: false,
              createdAt: new Date(newNotif.created_at),
              relatedId: newNotif.related_entity_id,
              actionType: newNotif.notification_type,
              actionUrl: newNotif.action_url,
              metadata: newNotif.metadata,
            };

            setNotifications(prev => [systemNotif, ...prev]);

            // تشغيل الصوت
            if (soundEnabledRef.current) {
              if (newNotif.priority === 'high' || newNotif.priority === 'urgent') {
                soundManager.playNotificationSound('urgent');
              } else {
                soundManager.playNotificationSound('default');
              }
            }

            // إرسال Push Notification للجوال
            showPushNotification(newNotif.title, newNotif.message, {
              type: newNotif.notification_type,
              actionUrl: newNotif.action_url,
            });

            // تحديث الدوائر النابضة
            const metadata = newNotif.metadata as Record<string, any> || {};
            if (metadata.customerId) {
              markAsNew('customer', metadata.customerId);
            }
            if (newNotif.related_entity_id) {
              markAsNew('offer', newNotif.related_entity_id);
            }
            if (metadata.isPulsing) {
              if (newNotif.notification_type === 'offer') {
                markAsNew('tab', 'property-offer');
              } else if (newNotif.notification_type === 'request') {
                markAsNew('tab', 'property-request');
              }
            }

            // إطلاق حدث للمكونات الأخرى
            window.dispatchEvent(new CustomEvent('dbNotificationReceived', { 
              detail: { notification: newNotif } 
            }));
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Ref لتتبع حالة الصوت
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // دوال مساعدة لتحويل الأنواع
  function mapPriorityToType(priority: string): SystemNotification['type'] {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'low': return 'info';
      default: return 'success';
    }
  }

  function mapCategoryToSystem(category: string): SystemNotification['category'] {
    if (category?.includes('customer') || category?.includes('crm')) return 'customer';
    if (category?.includes('appointment') || category?.includes('calendar')) return 'appointment';
    if (category?.includes('task')) return 'task';
    return 'system';
  }

  // Separate effect for interval - use refs to avoid recreating interval
  const checkOverdueTasksRef = useRef(checkOverdueTasks);
  const checkUpcomingAppointmentsRef = useRef(checkUpcomingAppointments);
  
  useEffect(() => {
    checkOverdueTasksRef.current = checkOverdueTasks;
    checkUpcomingAppointmentsRef.current = checkUpcomingAppointments;
  });

  useEffect(() => {
    // Initial check
    checkOverdueTasksRef.current();
    checkUpcomingAppointmentsRef.current();

    // Check every minute
    checkIntervalRef.current = setInterval(() => {
      checkOverdueTasksRef.current();
      checkUpcomingAppointmentsRef.current();
    }, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('systemNotifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen for external notification events
  useEffect(() => {
    const handleExternalNotification = (event: CustomEvent) => {
      const { title, message, type = 'info', category = 'system', soundType, priority } = event.detail;
      
      // إضافة الإشعار
      addNotification({
        title,
        message,
        time: 'الآن',
        type,
        category,
      });

      // تشغيل صوت خاص إذا تم تحديده
      if (soundEnabled && soundType) {
        if (soundType === 'urgent' || priority === 'high') {
          soundManager.playNotificationSound('urgent');
        } else if (soundType === 'reminder') {
          soundManager.playNotificationSound('reminder');
        }
        // الصوت العادي يتم تشغيله تلقائياً من addNotification
      }
    };

    // الاستماع لحدث استلام مستند من الصفحة العامة
    const handleReceivedDocument = (event: CustomEvent) => {
      const document = event.detail;
      if (document) {
        // حفظ المستند المستلم في localStorage
        const receivedDocs = JSON.parse(localStorage.getItem('received_documents') || '[]');
        receivedDocs.unshift(document);
        localStorage.setItem('received_documents', JSON.stringify(receivedDocs));
        
        // البحث عن العميل بالجوال أو إنشاء عميل جديد
        const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
        const existingCustomerIndex = customers.findIndex(
          (c: any) => c.phone === document.customerPhone
        );
        
        if (existingCustomerIndex !== -1) {
          // العميل موجود - إضافة المستند لملفه
          if (!customers[existingCustomerIndex].documents) {
            customers[existingCustomerIndex].documents = [];
          }
          customers[existingCustomerIndex].documents.push(document);
          localStorage.setItem('crm_customers', JSON.stringify(customers));
          console.log('[NotificationSystem] Document added to existing customer:', customers[existingCustomerIndex].name);
        } else {
          // العميل غير موجود - إنشاء بطاقة جديدة
          const newCustomer = {
            id: `customer_${Date.now()}`,
            name: document.customerName || 'عميل جديد',
            phone: document.customerPhone,
            email: document.customerEmail || '',
            type: 'buyer',
            status: 'جديد',
            columnId: 'new',
            interestLevel: 'interested',
            source: 'quote_form',
            notes: document.notes || '',
            propertyType: document.propertyType || '',
            location: document.city || '',
            documents: [document],
            createdAt: new Date().toISOString(),
            lastContact: new Date().toISOString(),
          };
          customers.unshift(newCustomer);
          localStorage.setItem('crm_customers', JSON.stringify(customers));
          
          // إطلاق إشعار إضافة عميل جديد
          window.dispatchEvent(new CustomEvent('addNotification', {
            detail: {
              title: '👤 عميل جديد تلقائي',
              message: `تم إنشاء بطاقة للعميل ${document.customerName} من طلب عرض السعر`,
              type: 'success',
              category: 'crm',
            }
          }));
          
          console.log('[NotificationSystem] New customer created:', newCustomer.name);
        }
        
        // إطلاق حدث تحديث العملاء
        window.dispatchEvent(new CustomEvent('customersUpdated'));
        
        console.log('[NotificationSystem] Received document saved:', document.id);
      }
    };

    window.addEventListener('addNotification' as any, handleExternalNotification);
    window.addEventListener('receivedDocumentFromPublic' as any, handleReceivedDocument);
    
    return () => {
      window.removeEventListener('addNotification' as any, handleExternalNotification);
      window.removeEventListener('receivedDocumentFromPublic' as any, handleReceivedDocument);
    };
  }, [addNotification, soundEnabled]);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    soundEnabled,
    toggleSound,
    testSound,
    checkOverdueTasks,
    checkUpcomingAppointments,
  };
}

// Helper to trigger notification from anywhere
export function triggerNotification(data: {
  title: string;
  message: string;
  type?: SystemNotification['type'];
  category?: SystemNotification['category'];
}) {
  window.dispatchEvent(new CustomEvent('addNotification', { detail: data }));
}
