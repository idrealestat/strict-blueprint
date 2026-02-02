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

  // ===================== Normalization =====================
  // تطبيع عربي خفيف للمفاتيح (بدون تغيير ما يُعرض للمستخدم)
  const normalizeKeyPart = (value?: string): string => {
    if (!value) return '';
    return value
      .toString()
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // تشكيل
      .replace(/\u0640/g, '') // تطويل
      .replace(/\s+/g, ' ') // توحيد المسافات
      .trim();
  };

  // تطبيع اسم الحي (إزالة "حي " من البداية للتطابق)
  const normalizeDistrictName = (name: string): string => {
    const cleaned = normalizeKeyPart(name);
    if (!cleaned) return '';
    return cleaned.replace(/^حي\s+/i, '').trim();
  };

  // حساب العدادات من الزوار الحاليين
  const recalculateCounts = useCallback(() => {
    const offers: Record<string, number> = {};
    const districts: Record<string, number> = {};
    const cities: Record<string, number> = {};

    viewersMapRef.current.forEach((viewer) => {
      const cityKey = normalizeKeyPart(viewer.city);
      const districtRaw = normalizeKeyPart(viewer.district);

      // عداد العرض
      if (viewer.offerId) {
        offers[viewer.offerId] = (offers[viewer.offerId] || 0) + 1;
      }
      // عداد الحي - نطبّع الاسم للتطابق
      if (cityKey && districtRaw) {
        const normalizedDistrict = normalizeDistrictName(districtRaw);
        const districtKey = `${cityKey}_${normalizedDistrict}`;
        districts[districtKey] = (districts[districtKey] || 0) + 1;
        
        // أيضاً نضيف مفتاح بـ "حي " للتوافق مع لوحة التحكم
        const districtKeyWithPrefix = `${cityKey}_حي ${normalizedDistrict}`;
        districts[districtKeyWithPrefix] = (districts[districtKeyWithPrefix] || 0) + 1;
      }
      // عداد المدينة
      if (cityKey) {
        cities[cityKey] = (cities[cityKey] || 0) + 1;
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
    const cityKey = normalizeKeyPart(city);
    const districtKeyRaw = normalizeKeyPart(district);

    // نجرب المفتاح كما هو أولاً
    const key = `${cityKey}_${districtKeyRaw}`;
    if (liveViewers.districts[key]) {
      return liveViewers.districts[key];
    }
    
    // نجرب بدون "حي "
    const normalizedDistrict = districtKeyRaw.replace(/^حي\s+/i, '').trim();
    const keyNormalized = `${cityKey}_${normalizedDistrict}`;
    if (liveViewers.districts[keyNormalized]) {
      return liveViewers.districts[keyNormalized];
    }
    
    // نجرب مع "حي "
    const keyWithPrefix = `${cityKey}_حي ${normalizedDistrict}`;
    return liveViewers.districts[keyWithPrefix] || 0;
  }, [liveViewers.districts]);

  const getCityViewers = useCallback((city: string): number => {
    const cityKey = normalizeKeyPart(city);
    return liveViewers.cities[cityKey] || 0;
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
  const deviceRef = useRef<string | undefined>(undefined);
  const browserRef = useRef<string | undefined>(undefined);

  // ===== keep latest payload in refs to avoid resubscribe churn =====
  const latestRef = useRef<{ offerId?: string; city?: string; district?: string }>({
    offerId,
    city,
    district,
  });

  useEffect(() => {
    latestRef.current = { offerId, city, district };
  }, [offerId, city, district]);

  const normalizePublicValue = (value?: string) => {
    if (!value) return undefined;
    const cleaned = value
      .toString()
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/\u0640/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || undefined;
  };

  const isCanonicalOfferId = (id?: string) => {
    if (!id) return false;
    // UUIDs غالباً تحتوي على '-' وطولها 32+
    return id.includes('-') && id.length >= 32;
  };

  const trackNow = useCallback(async () => {
    const ch = channelRef.current;
    if (!ch) return;

    const payload = latestRef.current;

    const normalizedCity = normalizePublicValue(payload.city);
    const normalizedDistrict = normalizePublicValue(payload.district);
    const normalizedOfferId = normalizePublicValue(payload.offerId);

    // نضمن أن الحي لا يُرسل فارغاً إذا توفر لاحقاً
    const trackPayload: any = {
      viewerId: viewerIdRef.current,
      joinedAt: new Date().toISOString(),
      device: deviceRef.current,
      browser: browserRef.current,
      city: normalizedCity,
      district: normalizedDistrict,
    };

    if (isCanonicalOfferId(normalizedOfferId)) {
      trackPayload.offerId = normalizedOfferId;
    }

    await ch.track(trackPayload);
    hasTrackedRef.current = true;
  }, []);

  useEffect(() => {
    if (!platformSlug) return;

    const channelName = `live-viewers-${platformSlug}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: viewerIdRef.current,
        },
      },
    });

    channelRef.current = channel;

    // جمع معلومات الجهاز مرة واحدة
    const ua = navigator.userAgent;
    let device = 'Desktop';
    if (/Mobile|Android|iPhone/.test(ua)) device = 'Mobile';
    if (/Tablet|iPad/.test(ua)) device = 'Tablet';

    let browser = 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    deviceRef.current = device;
    browserRef.current = browser;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // نرسل البيانات الأحدث (offer/city/district) مع معلومات الجهاز
        await trackNow();
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      hasTrackedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformSlug]);

  // إعادة تحديث Presence عند تغيّر offerId/city/district بدون إعادة اشتراك
  useEffect(() => {
    if (!platformSlug) return;
    if (!channelRef.current) return;
    // لا ننتظر اكتمال المدينة/الحي: لو صار التحديث متاح لاحقاً نسجله فوراً
    trackNow().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId, city, district, platformSlug]);

  return viewerIdRef.current;
}
