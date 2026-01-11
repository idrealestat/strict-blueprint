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

// Enhanced analytics interfaces
interface OfferRanking {
  offerId: string;
  offerTitle: string;
  views: number;
  city?: string;
  district?: string;
}

interface DailyViewTrend {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface FunnelStats {
  offerViews: number;
  ctaClicks: number;
  requestsSubmitted: number;
  conversionRate: number;
}

interface CityBreakdown {
  city: string;
  views: number;
  percentage: number;
}

interface BusinessCardEngagement {
  totalViews: number;
  calls: number;
  whatsappClicks: number;
  shares: number;
  emails: number;
  saveContacts: number;
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

  // جلب أعلى وأقل العروض مشاهدة (آخر 7 أيام)
  const getTopAndLowestOffers = useCallback(async (): Promise<{ top: OfferRanking[]; lowest: OfferRanking[] }> => {
    if (!user) return { top: [], lowest: [] };

    try {
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // جلب جميع أحداث offer_view للأسبوع
      const { data: viewEvents } = await supabase
        .from('events')
        .select('entity_id, metadata')
        .eq('user_id', user.id)
        .eq('event_name', 'offer_view')
        .eq('channel', 'public_web')
        .gte('created_at', weekStart);

      // تجميع حسب العرض
      const offerCounts: { [key: string]: { views: number; title: string; city?: string; district?: string } } = {};
      viewEvents?.forEach((e: any) => {
        const offerId = e.entity_id;
        if (!offerId) return;
        if (!offerCounts[offerId]) {
          offerCounts[offerId] = { 
            views: 0, 
            title: e.metadata?.offerTitle || 'عرض',
            city: e.metadata?.city,
            district: e.metadata?.district
          };
        }
        offerCounts[offerId].views++;
      });

      const rankings: OfferRanking[] = Object.entries(offerCounts).map(([offerId, data]) => ({
        offerId,
        offerTitle: data.title,
        views: data.views,
        city: data.city,
        district: data.district
      }));

      // ترتيب تنازلي للأعلى
      const sorted = [...rankings].sort((a, b) => b.views - a.views);
      const top = sorted.slice(0, 5);
      const lowest = sorted.length > 5 ? sorted.slice(-5).reverse() : [];

      return { top, lowest };
    } catch (error) {
      console.error('[Analytics] Error fetching top/lowest offers:', error);
      return { top: [], lowest: [] };
    }
  }, [user]);

  // جلب ترند المشاهدات اليومي (آخر 7 أيام)
  const getDailyViewsTrend = useCallback(async (): Promise<DailyViewTrend[]> => {
    if (!user) return [];

    try {
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: viewEvents } = await supabase
        .from('events')
        .select('created_at, viewer_id')
        .eq('user_id', user.id)
        .eq('channel', 'public_web')
        .in('event_name', ['page_view', 'offer_view'])
        .gte('created_at', weekStart);

      // تجميع حسب اليوم
      const dailyCounts: { [key: string]: { views: number; visitors: Set<string> } } = {};
      viewEvents?.forEach((e: any) => {
        const date = new Date(e.created_at).toISOString().split('T')[0];
        if (!dailyCounts[date]) {
          dailyCounts[date] = { views: 0, visitors: new Set() };
        }
        dailyCounts[date].views++;
        if (e.viewer_id) dailyCounts[date].visitors.add(e.viewer_id);
      });

      // تحويل لمصفوفة مرتبة
      return Object.entries(dailyCounts)
        .map(([date, data]) => ({
          date,
          views: data.views,
          uniqueVisitors: data.visitors.size
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('[Analytics] Error fetching daily trend:', error);
      return [];
    }
  }, [user]);

  // جلب إحصائيات القمع (offer_view -> CTA -> request/quote)
  const getFunnelStats = useCallback(async (): Promise<FunnelStats> => {
    if (!user) return { offerViews: 0, ctaClicks: 0, requestsSubmitted: 0, conversionRate: 0 };

    try {
      const [
        { count: offerViews },
        { count: callClicks },
        { count: whatsappClicks },
        { count: shareClicks },
        { count: requests },
        { count: quotes },
        { count: appointments }
      ] = await Promise.all([
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('event_name', 'offer_view')
          .eq('channel', 'public_web'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('event_name', ['offer_call', 'click_call', 'card_call'])
          .eq('channel', 'public_web'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('event_name', ['offer_whatsapp', 'click_whatsapp', 'card_whatsapp'])
          .eq('channel', 'public_web'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('event_name', ['offer_share', 'click_share', 'card_share'])
          .eq('channel', 'public_web'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('event_name', 'request_submit')
          .eq('channel', 'public_web'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('event_name', 'quote_submit')
          .eq('channel', 'public_web'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('event_name', 'calendar_created')
          .eq('channel', 'public_web'),
      ]);

      const totalCTA = (callClicks || 0) + (whatsappClicks || 0) + (shareClicks || 0);
      const totalConversions = (requests || 0) + (quotes || 0) + (appointments || 0);
      const conversionRate = (offerViews || 0) > 0 ? (totalConversions / (offerViews || 1)) * 100 : 0;

      return {
        offerViews: offerViews || 0,
        ctaClicks: totalCTA,
        requestsSubmitted: totalConversions,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('[Analytics] Error fetching funnel stats:', error);
      return { offerViews: 0, ctaClicks: 0, requestsSubmitted: 0, conversionRate: 0 };
    }
  }, [user]);

  // جلب توزيع المدن
  const getCityBreakdown = useCallback(async (): Promise<CityBreakdown[]> => {
    if (!user) return [];

    try {
      const { data: events } = await supabase
        .from('events')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('channel', 'public_web')
        .not('metadata', 'is', null);

      const cityCounts: { [key: string]: number } = {};
      let total = 0;

      events?.forEach((e: any) => {
        const city = e.metadata?.city;
        if (city) {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
          total++;
        }
      });

      return Object.entries(cityCounts)
        .map(([city, views]) => ({
          city,
          views,
          percentage: total > 0 ? Math.round((views / total) * 100) : 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
    } catch (error) {
      console.error('[Analytics] Error fetching city breakdown:', error);
      return [];
    }
  }, [user]);

  // جلب إحصائيات بطاقة الأعمال
  const getBusinessCardEngagement = useCallback(async (): Promise<BusinessCardEngagement> => {
    if (!user) return { totalViews: 0, calls: 0, whatsappClicks: 0, shares: 0, emails: 0, saveContacts: 0 };

    try {
      const [
        { count: views },
        { count: calls },
        { count: whatsapp },
        { count: shares },
        { count: emails },
        { count: saves }
      ] = await Promise.all([
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', 'business_card')
          .in('event_name', ['page_view', 'card_view']),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', 'business_card')
          .eq('event_name', 'card_call'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', 'business_card')
          .eq('event_name', 'card_whatsapp'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', 'business_card')
          .eq('event_name', 'card_share'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', 'business_card')
          .eq('event_name', 'card_email'),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('entity_type', 'business_card')
          .eq('event_name', 'card_save_contact'),
      ]);

      return {
        totalViews: views || 0,
        calls: calls || 0,
        whatsappClicks: whatsapp || 0,
        shares: shares || 0,
        emails: emails || 0,
        saveContacts: saves || 0
      };
    } catch (error) {
      console.error('[Analytics] Error fetching business card engagement:', error);
      return { totalViews: 0, calls: 0, whatsappClicks: 0, shares: 0, emails: 0, saveContacts: 0 };
    }
  }, [user]);

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
    // Enhanced analytics functions
    getTopAndLowestOffers,
    getDailyViewsTrend,
    getFunnelStats,
    getCityBreakdown,
    getBusinessCardEngagement,
    refetch: () => {
      fetchPagesStats();
      fetchPlatformStats();
    },
  };
}
