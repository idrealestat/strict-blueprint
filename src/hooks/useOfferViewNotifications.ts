/**
 * useOfferViewNotifications.ts
 * نظام إشعارات فورية عند مشاهدة العروض مع بيانات الموقع والجهاز
 * يستخدم قاعدة البيانات للإحصائيات بدلاً من localStorage
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { showPushNotification } from './usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

export interface ViewerInfo {
  ip?: string;
  city?: string;
  country?: string;
  device: string;
  browser: string;
  os: string;
  screenSize: string;
  timestamp: string;
  offerId: string;
  offerTitle?: string;
}

export interface OfferViewNotification {
  id: string;
  type: 'offer_view';
  offerId: string;
  offerTitle: string;
  viewerInfo: ViewerInfo;
  isRead: boolean;
  createdAt: string;
}

export interface ViewStats {
  current: number; // المشاهدون الآن
  today: number;
  thisMonth: number;
  thisYear: number;
  totalInteractions: number;
  history: { date: string; views: number; interactions: number }[];
}

// مدير صوت الإشعارات
class ViewNotificationSoundManager {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async playSound() {
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // نغمة إشعار قصيرة
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }
}

const soundManager = new ViewNotificationSoundManager();

// استخراج معلومات الجهاز
export function getDeviceInfo(): Partial<ViewerInfo> {
  const ua = navigator.userAgent;
  
  // استخراج المتصفح
  let browser = 'غير معروف';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // استخراج نظام التشغيل
  let os = 'غير معروف';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // استخراج نوع الجهاز
  let device = 'كمبيوتر';
  if (/iPhone|iPad|iPod/.test(ua)) device = 'iPhone/iPad';
  else if (/Android/.test(ua)) {
    device = /Mobile/.test(ua) ? 'هاتف أندرويد' : 'تابلت أندرويد';
  } else if (/Tablet|PlayBook/.test(ua)) device = 'تابلت';
  
  return {
    browser,
    os,
    device,
    screenSize: `${window.screen.width}x${window.screen.height}`,
  };
}

// الحصول على الموقع التقريبي
export async function getLocationInfo(): Promise<{ city?: string; country?: string; ip?: string }> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip,
        city: data.city,
        country: data.country_name,
      };
    }
  } catch (error) {
    console.log('Could not get location info');
  }
  return {};
}

// Hook رئيسي
export function useOfferViewNotifications() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<OfferViewNotification[]>([]);
  const [stats, setStats] = useState<ViewStats>({
    current: 0,
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    totalInteractions: 0,
    history: [],
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const liveViewersRef = useRef<Set<string>>(new Set());

  // تحميل الإعدادات والإشعارات المحفوظة
  useEffect(() => {
    const savedSettings = localStorage.getItem('offer_view_notification_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setNotificationsEnabled(settings.enabled ?? true);
      setSoundEnabled(settings.sound ?? true);
    }

    const savedNotifications = localStorage.getItem('offer_view_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications).slice(0, 100));
    }

    loadStats();
  }, [user]);

  // حفظ الإعدادات
  const saveSettings = useCallback((enabled: boolean, sound: boolean) => {
    localStorage.setItem('offer_view_notification_settings', JSON.stringify({
      enabled,
      sound,
    }));
    setNotificationsEnabled(enabled);
    setSoundEnabled(sound);
  }, []);

  // تحميل الإحصائيات من قاعدة البيانات
  const loadStats = useCallback(async () => {
    if (!user) {
      // فولباك للـ localStorage للمستخدمين غير المسجلين
      const viewsLog = JSON.parse(localStorage.getItem('offer_views_log') || '[]');
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const thisYear = now.getFullYear().toString();

      let todayViews = 0;
      let monthViews = 0;
      let yearViews = 0;
      let totalInteractions = 0;

      viewsLog.forEach((log: any) => {
        const logDate = log.timestamp?.split('T')[0] || '';
        const logMonth = logDate.substring(0, 7);
        const logYear = logDate.substring(0, 4);

        if (logDate === today) todayViews++;
        if (logMonth === thisMonth) monthViews++;
        if (logYear === thisYear) yearViews++;
        if (log.interaction) totalInteractions++;
      });

      setStats({
        current: liveViewersRef.current.size,
        today: todayViews,
        thisMonth: monthViews,
        thisYear: yearViews,
        totalInteractions,
        history: [],
      });
      return;
    }

    try {
      // جلب الإحصائيات من قاعدة البيانات
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // جلب المشاهدات من قاعدة البيانات
      const { data: allLogs, error } = await supabase
        .from('offer_views_log')
        .select('created_at, offer_id, offer_title, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) {
        console.error('[useOfferViewNotifications] Error fetching stats:', error);
        return;
      }

      const logs = allLogs || [];
      let todayViews = 0;
      let monthViews = 0;
      let yearViews = 0;
      let totalInteractions = 0;

      const dailyStats: { [key: string]: { views: number; interactions: number } } = {};

      logs.forEach((log: any) => {
        const logDate = new Date(log.created_at);
        const dateStr = logDate.toISOString().split('T')[0];

        if (logDate >= today) todayViews++;
        if (logDate >= startOfMonth) monthViews++;
        if (logDate >= startOfYear) yearViews++;
        if ((log.metadata as any)?.interaction) totalInteractions++;

        if (!dailyStats[dateStr]) {
          dailyStats[dateStr] = { views: 0, interactions: 0 };
        }
        dailyStats[dateStr].views++;
        if ((log.metadata as any)?.interaction) dailyStats[dateStr].interactions++;
      });

      // آخر 30 يوم
      const history: { date: string; views: number; interactions: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        history.push({
          date: dateStr,
          views: dailyStats[dateStr]?.views || 0,
          interactions: dailyStats[dateStr]?.interactions || 0,
        });
      }

      setStats({
        current: liveViewersRef.current.size,
        today: todayViews,
        thisMonth: monthViews,
        thisYear: yearViews,
        totalInteractions,
        history,
      });
    } catch (e) {
      console.error('[useOfferViewNotifications] Stats load error:', e);
    }
  }, [user]);

  // إضافة مشاهدة جديدة
  const recordView = useCallback((offerId: string, offerTitle: string, viewerInfo: ViewerInfo) => {
    const viewLog = {
      ...viewerInfo,
      offerId,
      offerTitle,
      timestamp: new Date().toISOString(),
    };

    // حفظ في السجل
    const viewsLog = JSON.parse(localStorage.getItem('offer_views_log') || '[]');
    viewsLog.unshift(viewLog);
    localStorage.setItem('offer_views_log', JSON.stringify(viewsLog.slice(0, 10000)));

    // إنشاء إشعار
    if (notificationsEnabled) {
      const notification: OfferViewNotification = {
        id: `view_${Date.now()}`,
        type: 'offer_view',
        offerId,
        offerTitle,
        viewerInfo,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications(prev => {
        const updated = [notification, ...prev].slice(0, 100);
        localStorage.setItem('offer_view_notifications', JSON.stringify(updated));
        return updated;
      });

      // تشغيل الصوت
      if (soundEnabled) {
        soundManager.playSound();
      }

      // إرسال Push notification
      showPushNotification(
        `👁️ مشاهدة جديدة: ${offerTitle}`,
        `${viewerInfo.device} • ${viewerInfo.city || 'موقع غير معروف'}`,
        { offerId, offerTitle, viewerInfo }
      );

      // عرض toast
      toast.info(`👁️ مشاهدة جديدة: ${offerTitle}`, {
        description: `${viewerInfo.device} • ${viewerInfo.city || 'موقع غير معروف'}`,
        duration: 4000,
      });
    }

    // تحديث الإحصائيات
    loadStats();
  }, [notificationsEnabled, soundEnabled, loadStats]);

  // تسجيل تفاعل
  const recordInteraction = useCallback((offerId: string, interactionType: string) => {
    const viewsLog = JSON.parse(localStorage.getItem('offer_views_log') || '[]');
    viewsLog.unshift({
      offerId,
      interaction: true,
      interactionType,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('offer_views_log', JSON.stringify(viewsLog.slice(0, 10000)));
    loadStats();
  }, [loadStats]);

  // إضافة/إزالة مشاهد مباشر
  const addLiveViewer = useCallback((viewerId: string) => {
    liveViewersRef.current.add(viewerId);
    setStats(prev => ({ ...prev, current: liveViewersRef.current.size }));
  }, []);

  const removeLiveViewer = useCallback((viewerId: string) => {
    liveViewersRef.current.delete(viewerId);
    setStats(prev => ({ ...prev, current: liveViewersRef.current.size }));
  }, []);

  // تحديد الإشعار كمقروء
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      localStorage.setItem('offer_view_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // مسح جميع الإشعارات
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.setItem('offer_view_notifications', '[]');
  }, []);

  // الاستماع لأحداث المشاهدة
  useEffect(() => {
    const handleOfferViewed = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { offerId, offerTitle, viewerInfo } = customEvent.detail;
      
      if (viewerInfo) {
        recordView(offerId, offerTitle || 'عرض', viewerInfo);
      }
    };

    window.addEventListener('offerViewedWithDetails', handleOfferViewed);
    return () => window.removeEventListener('offerViewedWithDetails', handleOfferViewed);
  }, [recordView]);

  // اشتراك Realtime على offer_views_log لتشغيل النغمة عند مشاهدات من أجهزة أخرى
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`offer-views-log-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offer_views_log',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const title = payload?.new?.offer_title || 'عرض';
          if (soundEnabled) {
            soundManager.playSound();
          }
          if (notificationsEnabled) {
            toast.info(`👁️ مشاهدة جديدة: ${title}`, { duration: 4000 });
          }
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, soundEnabled, notificationsEnabled, loadStats]);

  return {
    notifications,
    stats,
    notificationsEnabled,
    soundEnabled,
    saveSettings,
    recordView,
    recordInteraction,
    addLiveViewer,
    removeLiveViewer,
    markAsRead,
    clearNotifications,
    loadStats,
  };
}
