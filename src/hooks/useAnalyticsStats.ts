/**
 * useAnalyticsStats.ts
 * Hook لجلب الإحصائيات الحقيقية من جدول events
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

interface PageStats {
  pageName: string;
  pageKey: string;
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  uniqueVisitors: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface PlatformStats {
  totalViews: number;
  todayViews: number;
  uniqueCities: number;
  uniqueVisitors: number;
}

interface OfferStats {
  offerId: string;
  totalViews: number;
  calls: number;
  whatsappClicks: number;
  shares: number;
  quoteRequests: number;
}

export function useAnalyticsStats() {
  const { user } = useAuthContext();
  const [pagesStats, setPagesStats] = useState<PageStats[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalViews: 0,
    todayViews: 0,
    uniqueCities: 0,
    uniqueVisitors: 0,
  });
  const [loading, setLoading] = useState(true);

  // حساب بداية اليوم والأسبوع والشهر
  const getTimeRanges = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    
    return { todayStart, weekStart, monthStart, yesterdayStart };
  }, []);

  // جلب إحصائيات الصفحات
  const fetchPagesStats = useCallback(async () => {
    if (!user) return;

    try {
      const { todayStart, weekStart, monthStart, yesterdayStart } = getTimeRanges();
      
      const pageTypes = [
        { key: 'platform', name: 'المنصة العامة' },
        { key: 'business_card', name: 'بطاقة الأعمال' },
        { key: 'calendar', name: 'حجز المواعيد' },
        { key: 'offer', name: 'صفحة العرض' },
        { key: 'request', name: 'نموذج الطلبات' },
        { key: 'quote', name: 'عروض الأسعار' },
      ];

      const stats: PageStats[] = [];

      for (const page of pageTypes) {
        // إجمالي المشاهدات
        const { count: totalViews } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', page.key)
          .eq('event_name', 'page_view')
          .eq('channel', 'public_web');

        // مشاهدات اليوم
        const { count: todayViews } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', page.key)
          .eq('event_name', 'page_view')
          .eq('channel', 'public_web')
          .gte('created_at', todayStart);

        // مشاهدات الأسبوع
        const { count: weekViews } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', page.key)
          .eq('event_name', 'page_view')
          .eq('channel', 'public_web')
          .gte('created_at', weekStart);

        // مشاهدات الشهر
        const { count: monthViews } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', page.key)
          .eq('event_name', 'page_view')
          .eq('channel', 'public_web')
          .gte('created_at', monthStart);

        // مشاهدات الأمس
        const { count: yesterdayViews } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', page.key)
          .eq('event_name', 'page_view')
          .eq('channel', 'public_web')
          .gte('created_at', yesterdayStart)
          .lt('created_at', todayStart);

        // زوار فريدين
        const { data: uniqueData } = await supabase
          .from('events')
          .select('viewer_id')
          .eq('user_id', user.id)
          .eq('entity_type', page.key)
          .eq('event_name', 'page_view')
          .eq('channel', 'public_web')
          .not('viewer_id', 'is', null);

        const uniqueSet = new Set(uniqueData?.map(e => e.viewer_id) || []);

        // حساب الاتجاه
        const trendValue = (todayViews || 0) - (yesterdayViews || 0);
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (trendValue > 0) trend = 'up';
        if (trendValue < 0) trend = 'down';

        stats.push({
          pageName: page.name,
          pageKey: page.key,
          totalViews: totalViews || 0,
          todayViews: todayViews || 0,
          weekViews: weekViews || 0,
          monthViews: monthViews || 0,
          uniqueVisitors: uniqueSet.size,
          trend,
          trendValue: Math.abs(trendValue),
        });
      }

      setPagesStats(stats);
    } catch (error) {
      console.error('[Analytics] Error fetching pages stats:', error);
    }
  }, [user, getTimeRanges]);

  // جلب إحصائيات المنصة
  const fetchPlatformStats = useCallback(async () => {
    if (!user) return;

    try {
      const { todayStart } = getTimeRanges();

      // إجمالي المشاهدات
      const { count: totalViews } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('channel', 'public_web');

      // مشاهدات اليوم
      const { count: todayViews } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('channel', 'public_web')
        .gte('created_at', todayStart);

      // المدن الفريدة
      const { data: cityData } = await supabase
        .from('events')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('channel', 'public_web')
        .not('metadata', 'is', null);

      const cities = new Set<string>();
      cityData?.forEach((e: any) => {
        if (e.metadata?.city) {
          cities.add(e.metadata.city);
        }
      });

      // زوار فريدين
      const { data: uniqueData } = await supabase
        .from('events')
        .select('viewer_id')
        .eq('user_id', user.id)
        .eq('channel', 'public_web')
        .not('viewer_id', 'is', null);

      const uniqueSet = new Set(uniqueData?.map(e => e.viewer_id) || []);

      setPlatformStats({
        totalViews: totalViews || 0,
        todayViews: todayViews || 0,
        uniqueCities: cities.size,
        uniqueVisitors: uniqueSet.size,
      });
    } catch (error) {
      console.error('[Analytics] Error fetching platform stats:', error);
    }
  }, [user, getTimeRanges]);

  // جلب إحصائيات عرض محدد
  const getOfferStats = useCallback(async (offerId: string): Promise<OfferStats> => {
    try {
      const [
        { count: totalViews },
        { count: calls },
        { count: whatsappClicks },
        { count: shares },
        { count: quoteRequests },
      ] = await Promise.all([
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'offer')
          .eq('entity_id', offerId)
          .eq('event_name', 'offer_view'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'offer')
          .eq('entity_id', offerId)
          .eq('event_name', 'offer_call'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'offer')
          .eq('entity_id', offerId)
          .eq('event_name', 'offer_whatsapp'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'offer')
          .eq('entity_id', offerId)
          .eq('event_name', 'offer_share'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'offer')
          .eq('entity_id', offerId)
          .eq('event_name', 'offer_quote_request'),
      ]);

      return {
        offerId,
        totalViews: totalViews || 0,
        calls: calls || 0,
        whatsappClicks: whatsappClicks || 0,
        shares: shares || 0,
        quoteRequests: quoteRequests || 0,
      };
    } catch (error) {
      console.error('[Analytics] Error fetching offer stats:', error);
      return {
        offerId,
        totalViews: 0,
        calls: 0,
        whatsappClicks: 0,
        shares: 0,
        quoteRequests: 0,
      };
    }
  }, []);

  // تحميل البيانات
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchPagesStats(), fetchPlatformStats()])
        .finally(() => setLoading(false));
    }
  }, [user, fetchPagesStats, fetchPlatformStats]);

  // تحديث تلقائي كل دقيقة
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchPagesStats();
      fetchPlatformStats();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, fetchPagesStats, fetchPlatformStats]);

  return {
    pagesStats,
    platformStats,
    loading,
    getOfferStats,
    refetch: () => {
      fetchPagesStats();
      fetchPlatformStats();
    },
  };
}
