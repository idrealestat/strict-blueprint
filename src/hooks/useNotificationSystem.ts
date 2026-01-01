/**
 * useNotificationSystem.ts
 * نظام الإشعارات مع التذكير بالمهام المتأخرة والمواعيد القادمة
 * مع صوت تنبيه
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'appointment' | 'reminder';
  read: boolean;
  category: 'task' | 'appointment' | 'system' | 'customer';
  actionType?: 'task_overdue' | 'task_due_soon' | 'appointment_upcoming' | 'appointment_now';
  relatedId?: string;
  createdAt: Date;
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

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Delete all notifications
  const deleteAllNotifications = useCallback(() => {
    setNotifications([]);
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
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) return;
      
      await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: customerPhone,
          message,
          messageType: 'appointment_reminder',
          appointmentId: apt.id,
        }),
      });
      console.log('Appointment SMS sent successfully');
    } catch (error) {
      console.error('Failed to send appointment SMS:', error);
    }
  }, []);

  // Check for upcoming appointments
  const checkUpcomingAppointments = useCallback(() => {
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
          reminderTime: 30,
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
        const reminderTime = apt.reminderTime || 30;

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
          
          // إرسال SMS
          sendAppointmentSMS(apt, minutesUntilApt);
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
          sendAppointmentSMS(apt, 0);
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

  // Initialize - load preferences and notifications only once
  useEffect(() => {
    // Load sound preference
    const savedPref = localStorage.getItem('notificationSoundEnabled');
    if (savedPref !== null) {
      const enabled = JSON.parse(savedPref);
      setSoundEnabled(enabled);
      soundManager.setEnabled(enabled);
    }

    // Load saved notifications
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
  }, []);

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
      const { title, message, type = 'info', category = 'system' } = event.detail;
      addNotification({
        title,
        message,
        time: 'الآن',
        type,
        category,
      });
    };

    window.addEventListener('addNotification' as any, handleExternalNotification);
    return () => {
      window.removeEventListener('addNotification' as any, handleExternalNotification);
    };
  }, [addNotification]);

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
