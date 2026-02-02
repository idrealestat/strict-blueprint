/**
 * useLiveViewersRealtime.ts
 * Hook محسن لتتبع المشاهدين المباشرين في الوقت الفعلي
 * يستخدم Supabase Realtime Presence لتتبع الزوار بدقة
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveViewersState {
  offers: Record<string, number>;  // offerId -> count
  districts: Record<string, number>; // "city_district" -> count
  cities: Record<string, number>; // cityName -> count
}

interface ViewerPresence {
  viewerId: string;
  offerId?: string;
  city?: string;
  district?: string;
  joinedAt: string;
  device?: string;
}

/**
 * Hook رئيسي للاستماع لجميع المشاهدات المباشرة من الصفحات العامة
 */
export function useLiveViewersRealtime(platformSlug?: string) {
  const [liveViewers, setLiveViewers] = useState<LiveViewersState>({
    offers: {},
    districts: {},
    cities: {},
  });
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const viewersMapRef = useRef<Map<string, ViewerPresence>>(new Map());

  // تطبيع اسم الحي (إزالة "حي " من البداية للتطابق)
  const normalizeDistrictName = (name: string): string => {
    if (!name) return '';
    return name.replace(/^حي\s+/i, '').trim();
  };

  // حساب العدادات من الزوار الحاليين
  const recalculateCounts = useCallback(() => {
    const offers: Record<string, number> = {};
    const districts: Record<string, number> = {};
    const cities: Record<string, number> = {};

    viewersMapRef.current.forEach((viewer) => {
      // عداد العرض
      if (viewer.offerId) {
        offers[viewer.offerId] = (offers[viewer.offerId] || 0) + 1;
      }
      // عداد الحي - نطبّع الاسم للتطابق
      if (viewer.city && viewer.district) {
        const normalizedDistrict = normalizeDistrictName(viewer.district);
        const districtKey = `${viewer.city}_${normalizedDistrict}`;
        districts[districtKey] = (districts[districtKey] || 0) + 1;
        
        // أيضاً نضيف مفتاح بـ "حي " للتوافق مع لوحة التحكم
        const districtKeyWithPrefix = `${viewer.city}_حي ${normalizedDistrict}`;
        districts[districtKeyWithPrefix] = (districts[districtKeyWithPrefix] || 0) + 1;
      }
      // عداد المدينة
      if (viewer.city) {
        cities[viewer.city] = (cities[viewer.city] || 0) + 1;
      }
    });

    // Debug log للتشخيص
    if (Object.keys(offers).length > 0 || Object.keys(districts).length > 0 || Object.keys(cities).length > 0) {
      console.log('[LiveViewers] State updated:', { offers, districts, cities, totalViewers: viewersMapRef.current.size });
    }

    setLiveViewers({ offers, districts, cities });
  }, []);

  useEffect(() => {
    if (!platformSlug) return;

    const channelName = `live-viewers-${platformSlug}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: `admin_${Date.now()}`,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<ViewerPresence>();
        
        // تحديث خريطة الزوار
        viewersMapRef.current.clear();
        Object.values(state).forEach((presences) => {
          presences.forEach((presence: ViewerPresence) => {
            if (presence.viewerId) {
              viewersMapRef.current.set(presence.viewerId, presence);
            }
          });
        });
        
        recalculateCounts();
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p: any) => {
          const presence = p as ViewerPresence;
          if (presence.viewerId) {
            viewersMapRef.current.set(presence.viewerId, presence);
            
            // إرسال حدث للإشعارات
            window.dispatchEvent(new CustomEvent('liveViewerJoined', {
              detail: {
                offerId: presence.offerId,
                city: presence.city,
                district: presence.district,
                device: presence.device,
              }
            }));
          }
        });
        recalculateCounts();
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p: any) => {
          const presence = p as ViewerPresence;
          if (presence.viewerId) {
            viewersMapRef.current.delete(presence.viewerId);
          }
        });
        recalculateCounts();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [platformSlug, recalculateCounts]);

  // دوال مساعدة للحصول على العدادات
  const getOfferViewers = useCallback((offerId: string): number => {
    return liveViewers.offers[offerId] || 0;
  }, [liveViewers.offers]);

  const getDistrictViewers = useCallback((city: string, district: string): number => {
    // نجرب المفتاح كما هو أولاً
    const key = `${city}_${district}`;
    if (liveViewers.districts[key]) {
      return liveViewers.districts[key];
    }
    
    // نجرب بدون "حي "
    const normalizedDistrict = district.replace(/^حي\s+/i, '').trim();
    const keyNormalized = `${city}_${normalizedDistrict}`;
    if (liveViewers.districts[keyNormalized]) {
      return liveViewers.districts[keyNormalized];
    }
    
    // نجرب مع "حي "
    const keyWithPrefix = `${city}_حي ${normalizedDistrict}`;
    return liveViewers.districts[keyWithPrefix] || 0;
  }, [liveViewers.districts]);

  const getCityViewers = useCallback((city: string): number => {
    return liveViewers.cities[city] || 0;
  }, [liveViewers.cities]);

  const getTotalViewers = useCallback((): number => {
    return viewersMapRef.current.size;
  }, []);

  return {
    liveViewers,
    getOfferViewers,
    getDistrictViewers,
    getCityViewers,
    getTotalViewers,
  };
}

/**
 * Hook للزائر - يُستخدم في الصفحات العامة لتسجيل حضوره
 * يستخدم الـ canonical ID (UUID الكامل) لضمان مطابقة لوحة التحكم
 */
export function useRegisterPublicViewer(
  platformSlug?: string,
  offerId?: string,
  city?: string,
  district?: string
) {
  const viewerIdRef = useRef<string>(`viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // ننتظر حتى يكون لدينا slug صالح
    if (!platformSlug) return;
    
    // إذا كان الـ offerId قصير جداً (أقل من 8 أحرف)، ننتظر التحديث للـ canonical ID
    // هذا يمنع الاشتراك المبكر بـ ID مختصر
    const isValidOfferId = offerId && offerId.length >= 8;
    
    const channelName = `live-viewers-${platformSlug}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: viewerIdRef.current,
        },
      },
    });

    channelRef.current = channel;

    // جمع معلومات الجهاز
    const ua = navigator.userAgent;
    let device = 'Desktop';
    if (/Mobile|Android|iPhone/.test(ua)) device = 'Mobile';
    if (/Tablet|iPad/.test(ua)) device = 'Tablet';

    let browser = 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // نسجل فقط إذا كان لدينا offerId صالح
        if (isValidOfferId) {
          await channel.track({
            viewerId: viewerIdRef.current,
            offerId,
            city,
            district,
            joinedAt: new Date().toISOString(),
            device,
            browser,
          });
          hasTrackedRef.current = true;

          console.log('[LiveViewer] Registered:', { offerId, city, district, slug: platformSlug });

          // إرسال حدث محلي للتتبع
          window.dispatchEvent(new CustomEvent('offerViewedWithDetails', {
            detail: {
              offerId,
              viewerId: viewerIdRef.current,
              city,
              district,
              device,
              browser,
              timestamp: new Date().toISOString(),
            }
          }));
        } else {
          // نسجل بدون offerId (سيتم التحديث لاحقاً)
          await channel.track({
            viewerId: viewerIdRef.current,
            city,
            district,
            joinedAt: new Date().toISOString(),
            device,
            browser,
          });
        }
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      hasTrackedRef.current = false;
    };
  }, [platformSlug, offerId, city, district]);

  return viewerIdRef.current;
}
