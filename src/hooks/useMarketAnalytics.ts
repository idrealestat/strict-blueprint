/**
 * useMarketAnalytics.ts
 * Hook شامل لجلب تحليلات السوق من جميع أقسام التطبيق
 * يتضمن: منصة النشر، بطاقة الأعمال، الفورمات العامة، إدارة العملاء، الفرص الذكية، التقويم، النشر على المنصات
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

// ==================== INTERFACES ====================

// إحصائيات منصة النشر العامة
export interface PublicPlatformStats {
  liveViewers: number;
  totalOfferViews: number;
  todayOfferViews: number;
  buttonClicks: {
    whatsapp: number;
    scheduleViewing: number;
    downloadPdf: number;
    payDeposit: number;
    sendPriceQuote: number;
    submitForms: number;
  };
  topViewedOffers: Array<{ id: string; title: string; views: number; city?: string; district?: string }>;
  lowestViewedOffers: Array<{ id: string; title: string; views: number; city?: string; district?: string }>;
}

// إحصائيات بطاقة الأعمال الرقمية
export interface BusinessCardStats {
  totalViews: number;
  liveViewers: number;
  avgViewDuration: number;
  buttonClicks: {
    call: number;
    whatsapp: number;
    email: number;
    location: number;
    saveContact: number;
    share: number;
  };
}

// إحصائيات الفورمات العامة
export interface PublicFormsStats {
  sendOffer: { visits: number; submissions: number; repeatSubmissions: number };
  sendRequest: { visits: number; submissions: number; repeatSubmissions: number };
  priceQuote: { visits: number; submissions: number; repeatSubmissions: number };
  scheduleAppointment: { visits: number; submissions: number; repeatSubmissions: number };
  financingCalculation: { visits: number; submissions: number; repeatSubmissions: number };
  propertyValuation: { visits: number; submissions: number; repeatSubmissions: number };
}

// إحصائيات إدارة العملاء
export interface CRMStats {
  totalAdded: number;
  totalDeleted: number;
  currentTotal: number;
  byType: {
    buyers: number;
    sellers: number;
    renters: number;
    landlords: number;
    investors: number;
    brokers: number;
  };
  cardDetails: {
    publishedOffers: number;
    receivedOffers: number;
    receivedRequests: number;
    publishedRequests: number;
    rentedProperties: number;
    soldOrRented: number;
    priceQuotesReceived: number;
    receiptsCreated: number;
    pdfDownloads: number;
  };
}

// إحصائيات النشر على المنصات
export interface PlatformPublishingStats {
  totalPublishes: number;
  successfulPublishes: number;
  failedPublishes: number;
  connectedPlatforms: Array<{ name: string; published: boolean; error?: string }>;
  publishedRequestsCount: number;
}

// إحصائيات الفرص الذكية
export interface SmartOpportunitiesStats {
  rejectedCards: number;
  acceptedCards: number;
  contactedFromOffers: number;
  contactedFromRequests: number;
}

// إحصائيات التقويم والمواعيد
export interface CalendarStats {
  brokerRejections: number;
  brokerConfirmations: number;
  customerRejections: number;
  customerReschedules: number;
  apologyMessages: number;
  totalAppointments: number;
  appointmentsByType: {
    meetings: number;
    propertyViewings: number;
    callbacks: number;
    other: number;
  };
}

// الإحصائيات الشاملة
export interface MarketAnalyticsData {
  publicPlatform: PublicPlatformStats;
  businessCard: BusinessCardStats;
  publicForms: PublicFormsStats;
  crm: CRMStats;
  platformPublishing: PlatformPublishingStats;
  smartOpportunities: SmartOpportunitiesStats;
  calendar: CalendarStats;
}

// ==================== HOOK ====================

export function useMarketAnalytics() {
  const { user } = useAuthContext();
  const [data, setData] = useState<MarketAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب إحصائيات منصة النشر العامة
  const fetchPublicPlatformStats = useCallback(async (): Promise<PublicPlatformStats> => {
    if (!user) return getDefaultPublicPlatformStats();

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // جلب جميع الأحداث ذات الصلة
      const { data: events } = await supabase
        .from('events')
        .select('event_name, entity_id, metadata, created_at')
        .eq('user_id', user.id)
        .eq('channel', 'public_web');

      const offerViews = events?.filter(e => e.event_name === 'offer_view') || [];
      const todayViews = offerViews.filter(e => new Date(e.created_at) >= todayStart);

      // تجميع النقرات على الأزرار
      const whatsappClicks = events?.filter(e => 
        ['offer_whatsapp', 'click_whatsapp'].includes(e.event_name)
      ).length || 0;

      const scheduleViewingClicks = events?.filter(e => 
        ['click_schedule_viewing', 'appointment_create', 'schedule_viewing'].includes(e.event_name)
      ).length || 0;

      const pdfDownloads = events?.filter(e => 
        ['download', 'click_download_pdf', 'offer_pdf_download'].includes(e.event_name)
      ).length || 0;

      const depositClicks = events?.filter(e => 
        ['offer_deposit', 'click_pay_deposit', 'pay_deposit'].includes(e.event_name)
      ).length || 0;

      const quoteClicks = events?.filter(e => 
        ['offer_quote_request', 'click_price_quote', 'quote_submit'].includes(e.event_name)
      ).length || 0;

      const formSubmits = events?.filter(e => 
        ['request_submit', 'quote_submit', 'property_offer_submit', 'form_submit'].includes(e.event_name)
      ).length || 0;

      // أعلى وأقل العروض مشاهدة
      const offerViewCounts: Record<string, { count: number; title: string; city?: string; district?: string }> = {};
      offerViews.forEach((e: any) => {
        const id = e.entity_id;
        if (!id) return;
        if (!offerViewCounts[id]) {
          offerViewCounts[id] = { 
            count: 0, 
            title: e.metadata?.offerTitle || 'عرض',
            city: e.metadata?.city,
            district: e.metadata?.district
          };
        }
        offerViewCounts[id].count++;
      });

      const sortedOffers = Object.entries(offerViewCounts)
        .map(([id, data]) => ({ id, title: data.title, views: data.count, city: data.city, district: data.district }))
        .sort((a, b) => b.views - a.views);

      return {
        liveViewers: 0, // سيتم تحديثه عبر Realtime
        totalOfferViews: offerViews.length,
        todayOfferViews: todayViews.length,
        buttonClicks: {
          whatsapp: whatsappClicks,
          scheduleViewing: scheduleViewingClicks,
          downloadPdf: pdfDownloads,
          payDeposit: depositClicks,
          sendPriceQuote: quoteClicks,
          submitForms: formSubmits,
        },
        topViewedOffers: sortedOffers.slice(0, 5),
        lowestViewedOffers: sortedOffers.length > 5 ? sortedOffers.slice(-5).reverse() : [],
      };
    } catch (err) {
      console.error('[MarketAnalytics] Public platform stats error:', err);
      return getDefaultPublicPlatformStats();
    }
  }, [user]);

  // جلب إحصائيات بطاقة الأعمال
  const fetchBusinessCardStats = useCallback(async (): Promise<BusinessCardStats> => {
    if (!user) return getDefaultBusinessCardStats();

    try {
      const { data: events } = await supabase
        .from('events')
        .select('event_name, metadata')
        .eq('user_id', user.id)
        .eq('entity_type', 'business_card')
        .eq('channel', 'public_web');

      const views = events?.filter(e => e.event_name === 'card_view') || [];
      const calls = events?.filter(e => e.event_name === 'card_call').length || 0;
      const whatsapp = events?.filter(e => e.event_name === 'card_whatsapp').length || 0;
      const email = events?.filter(e => e.event_name === 'card_email').length || 0;
      const location = events?.filter(e => e.event_name === 'card_location').length || 0;
      const saveContact = events?.filter(e => e.event_name === 'card_save_contact').length || 0;
      const share = events?.filter(e => e.event_name === 'card_share').length || 0;

      // حساب متوسط مدة المشاهدة
      const durations = views
        .map((e: any) => e.metadata?.duration || 0)
        .filter((d: number) => d > 0);
      const avgDuration = durations.length > 0 
        ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length 
        : 0;

      return {
        totalViews: views.length,
        liveViewers: 0,
        avgViewDuration: Math.round(avgDuration),
        buttonClicks: { call: calls, whatsapp, email, location, saveContact, share },
      };
    } catch (err) {
      console.error('[MarketAnalytics] Business card stats error:', err);
      return getDefaultBusinessCardStats();
    }
  }, [user]);

  // جلب إحصائيات الفورمات العامة
  const fetchPublicFormsStats = useCallback(async (): Promise<PublicFormsStats> => {
    if (!user) return getDefaultPublicFormsStats();

    try {
      const { data: events } = await supabase
        .from('events')
        .select('event_name, entity_type, metadata')
        .eq('user_id', user.id)
        .eq('channel', 'public_web');

      // جلب المستندات المستلمة
      const { data: documents } = await supabase
        .from('received_documents')
        .select('document_type, customer_phone')
        .eq('user_id', user.id);

      // حساب التكرار من نفس رقم الجوال
      const phoneSubmissions: Record<string, Record<string, number>> = {};
      documents?.forEach((doc: any) => {
        const type = doc.document_type;
        const phone = doc.customer_phone || 'unknown';
        if (!phoneSubmissions[type]) phoneSubmissions[type] = {};
        phoneSubmissions[type][phone] = (phoneSubmissions[type][phone] || 0) + 1;
      });

      const countRepeatSubmissions = (type: string) => {
        const phones = phoneSubmissions[type] || {};
        return Object.values(phones).filter(count => count > 1).length;
      };

      // زيارات الصفحات
      const pageViews = events?.filter(e => e.event_name === 'page_view') || [];
      const offerFormVisits = pageViews.filter((e: any) => 
        e.metadata?.page === 'offer_form' || e.entity_type === 'offer_form'
      ).length;
      const requestFormVisits = pageViews.filter((e: any) => 
        e.metadata?.page === 'request_form' || e.entity_type === 'request_form'
      ).length;
      const quoteFormVisits = pageViews.filter((e: any) => 
        e.metadata?.page === 'quote_form' || e.entity_type === 'quote'
      ).length;
      const appointmentFormVisits = pageViews.filter((e: any) => 
        e.metadata?.page === 'appointment_form' || e.entity_type === 'calendar'
      ).length;

      // عدد الإرسالات
      const offerSubmissions = documents?.filter(d => 
        ['property_offer', 'offer'].includes(d.document_type)
      ).length || 0;
      const requestSubmissions = documents?.filter(d => 
        ['property_request', 'request'].includes(d.document_type)
      ).length || 0;
      const quoteSubmissions = documents?.filter(d => 
        ['quotation_request', 'quotation', 'quote'].includes(d.document_type)
      ).length || 0;

      // المواعيد من العامة
      const { count: appointmentSubmissions } = await supabase
        .from('calendar_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        sendOffer: {
          visits: offerFormVisits,
          submissions: offerSubmissions,
          repeatSubmissions: countRepeatSubmissions('property_offer') + countRepeatSubmissions('offer'),
        },
        sendRequest: {
          visits: requestFormVisits,
          submissions: requestSubmissions,
          repeatSubmissions: countRepeatSubmissions('property_request') + countRepeatSubmissions('request'),
        },
        priceQuote: {
          visits: quoteFormVisits,
          submissions: quoteSubmissions,
          repeatSubmissions: countRepeatSubmissions('quotation_request') + countRepeatSubmissions('quotation'),
        },
        scheduleAppointment: {
          visits: appointmentFormVisits,
          submissions: appointmentSubmissions || 0,
          repeatSubmissions: 0,
        },
        financingCalculation: { visits: 0, submissions: 0, repeatSubmissions: 0 },
        propertyValuation: { visits: 0, submissions: 0, repeatSubmissions: 0 },
      };
    } catch (err) {
      console.error('[MarketAnalytics] Public forms stats error:', err);
      return getDefaultPublicFormsStats();
    }
  }, [user]);

  // جلب إحصائيات إدارة العملاء
  const fetchCRMStats = useCallback(async (): Promise<CRMStats> => {
    if (!user) return getDefaultCRMStats();

    try {
      // جلب العملاء الحاليين
      const { data: customers, count: totalCustomers } = await supabase
        .from('crm_customers')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // حساب أنواع العملاء من tags أو status
      const customersList = customers || [];
      let buyers = 0, sellers = 0, renters = 0, landlords = 0, investors = 0, brokers = 0;

      customersList.forEach((c: any) => {
        const tags = c.tags || [];
        const status = c.status || '';
        const combined = [...tags, status].join(' ').toLowerCase();

        if (combined.includes('مشتري') || combined.includes('شراء')) buyers++;
        if (combined.includes('بائع') || combined.includes('بيع')) sellers++;
        if (combined.includes('مستأجر') || combined.includes('إيجار')) renters++;
        if (combined.includes('مؤجر') || combined.includes('تأجير')) landlords++;
        if (combined.includes('مستثمر') || combined.includes('استثمار')) investors++;
        if (combined.includes('وسيط') || combined.includes('broker')) brokers++;
      });

      // جلب المستندات المستلمة
      const { data: docs } = await supabase
        .from('received_documents')
        .select('document_type, status')
        .eq('user_id', user.id);

      const receivedOffers = docs?.filter(d => 
        ['property_offer', 'offer'].includes(d.document_type)
      ).length || 0;
      const receivedRequests = docs?.filter(d => 
        ['property_request', 'request'].includes(d.document_type)
      ).length || 0;
      const priceQuotesReceived = docs?.filter(d => 
        ['quotation_request', 'quotation', 'quote'].includes(d.document_type)
      ).length || 0;
      const receiptsCreated = docs?.filter(d => d.document_type === 'receipt').length || 0;

      // جلب العروض المنشورة
      const { count: publishedOffers } = await supabase
        .from('platform_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'published');

      // العروض المباعة أو المؤجرة
      const { count: soldOrRented } = await supabase
        .from('platform_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['sold', 'rented', 'تم البيع', 'تم التأجير']);

      // العقارات المؤجرة حالياً
      const { count: rentedProperties } = await supabase
        .from('platform_listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_currently_rented', true);

      // عدد تحميلات PDF
      const { count: pdfDownloads } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('event_name', ['download', 'click_download_pdf', 'offer_pdf_download', 'pdf_download']);

      // إحصائيات الحذف (من الأحداث)
      const { count: totalDeleted } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('entity_type', 'customer')
        .in('event_name', ['customer_delete', 'delete']);

      const { count: totalAdded } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('entity_type', 'customer')
        .eq('event_name', 'customer_create');

      return {
        totalAdded: totalAdded || 0,
        totalDeleted: totalDeleted || 0,
        currentTotal: totalCustomers || 0,
        byType: { buyers, sellers, renters, landlords, investors, brokers },
        cardDetails: {
          publishedOffers: publishedOffers || 0,
          receivedOffers,
          receivedRequests,
          publishedRequests: 0, // سيتم تحديثه لاحقاً
          rentedProperties: rentedProperties || 0,
          soldOrRented: soldOrRented || 0,
          priceQuotesReceived,
          receiptsCreated,
          pdfDownloads: pdfDownloads || 0,
        },
      };
    } catch (err) {
      console.error('[MarketAnalytics] CRM stats error:', err);
      return getDefaultCRMStats();
    }
  }, [user]);

  // جلب إحصائيات النشر على المنصات
  const fetchPlatformPublishingStats = useCallback(async (): Promise<PlatformPublishingStats> => {
    if (!user) return getDefaultPlatformPublishingStats();

    try {
      // جلب أحداث النشر
      const { data: publishEvents } = await supabase
        .from('events')
        .select('event_name, metadata')
        .eq('user_id', user.id)
        .in('event_name', ['offer_publish', 'platform_publish', 'publish_success', 'publish_error']);

      const totalPublishes = publishEvents?.filter(e => 
        ['offer_publish', 'platform_publish'].includes(e.event_name)
      ).length || 0;

      const successfulPublishes = publishEvents?.filter(e => 
        e.event_name === 'publish_success' || (e.metadata as any)?.success === true
      ).length || 0;

      const failedPublishes = publishEvents?.filter(e => 
        e.event_name === 'publish_error' || (e.metadata as any)?.success === false
      ).length || 0;

      // المنصات المتصلة (من localStorage أو metadata)
      const connectedPlatforms: Array<{ name: string; published: boolean; error?: string }> = [
        { name: 'عقار', published: true },
        { name: 'بيوت', published: true },
        { name: 'حراج', published: false, error: 'لم يتم الربط' },
      ];

      // عدد الطلبات المنشورة
      const { count: publishedRequestsCount } = await supabase
        .from('received_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('document_type', 'request')
        .eq('status', 'published');

      return {
        totalPublishes,
        successfulPublishes,
        failedPublishes,
        connectedPlatforms,
        publishedRequestsCount: publishedRequestsCount || 0,
      };
    } catch (err) {
      console.error('[MarketAnalytics] Platform publishing stats error:', err);
      return getDefaultPlatformPublishingStats();
    }
  }, [user]);

  // جلب إحصائيات الفرص الذكية
  const fetchSmartOpportunitiesStats = useCallback(async (): Promise<SmartOpportunitiesStats> => {
    if (!user) return getDefaultSmartOpportunitiesStats();

    try {
      // الفرص المقبولة
      const { count: acceptedCards } = await supabase
        .from('smart_opportunity_acceptances')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', user.id)
        .eq('status', 'accepted');

      // الفرص المرفوضة (مجموع rejection_count >= 2)
      const { data: rejections } = await supabase
        .from('smart_opportunity_rejections')
        .select('rejection_count')
        .eq('user_id', user.id);

      const rejectedCards = rejections?.filter(r => r.rejection_count >= 2).length || 0;

      // التواصل من العروض والطلبات
      const { count: contactedFromOffers } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_name', 'smart_opportunity_contact')
        .eq('channel', 'in_app_admin');

      return {
        rejectedCards,
        acceptedCards: acceptedCards || 0,
        contactedFromOffers: contactedFromOffers || 0,
        contactedFromRequests: 0,
      };
    } catch (err) {
      console.error('[MarketAnalytics] Smart opportunities stats error:', err);
      return getDefaultSmartOpportunitiesStats();
    }
  }, [user]);

  // جلب إحصائيات التقويم والمواعيد
  const fetchCalendarStats = useCallback(async (): Promise<CalendarStats> => {
    if (!user) return getDefaultCalendarStats();

    try {
      // جلب المواعيد
      const { data: appointments } = await supabase
        .from('calendar_appointments')
        .select('*')
        .eq('user_id', user.id);

      const appointmentsList = appointments || [];
      const totalAppointments = appointmentsList.length;

      // تصنيف المواعيد حسب النوع
      const meetings = appointmentsList.filter(a => 
        a.appointment_type === 'meeting' || a.appointment_type === 'اجتماع'
      ).length;
      const propertyViewings = appointmentsList.filter(a => 
        a.appointment_type === 'viewing' || a.appointment_type === 'معاينة'
      ).length;
      const callbacks = appointmentsList.filter(a => 
        a.appointment_type === 'callback' || a.appointment_type === 'اعادة اتصال'
      ).length;
      const other = totalAppointments - meetings - propertyViewings - callbacks;

      // جلب الأحداث المتعلقة بالمواعيد
      const { data: calendarEvents } = await supabase
        .from('events')
        .select('event_name, metadata')
        .eq('user_id', user.id)
        .eq('entity_type', 'calendar');

      const brokerRejections = calendarEvents?.filter(e => 
        e.event_name === 'appointment_cancel' && (e.metadata as any)?.by === 'broker'
      ).length || 0;

      const brokerConfirmations = calendarEvents?.filter(e => 
        e.event_name === 'appointment_confirm' || 
        (e.event_name === 'appointment_update' && (e.metadata as any)?.status === 'confirmed')
      ).length || 0;

      const customerRejections = calendarEvents?.filter(e => 
        e.event_name === 'appointment_cancel' && (e.metadata as any)?.by === 'customer'
      ).length || 0;

      const customerReschedules = calendarEvents?.filter(e => 
        e.event_name === 'appointment_reschedule' && (e.metadata as any)?.by === 'customer'
      ).length || 0;

      const apologyMessages = calendarEvents?.filter(e => 
        e.event_name === 'apology_sent' || (e.metadata as any)?.apology === true
      ).length || 0;

      return {
        brokerRejections,
        brokerConfirmations,
        customerRejections,
        customerReschedules,
        apologyMessages,
        totalAppointments,
        appointmentsByType: { meetings, propertyViewings, callbacks, other },
      };
    } catch (err) {
      console.error('[MarketAnalytics] Calendar stats error:', err);
      return getDefaultCalendarStats();
    }
  }, [user]);

  // جلب جميع الإحصائيات
  const fetchAllStats = useCallback(async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        publicPlatform,
        businessCard,
        publicForms,
        crm,
        platformPublishing,
        smartOpportunities,
        calendar,
      ] = await Promise.all([
        fetchPublicPlatformStats(),
        fetchBusinessCardStats(),
        fetchPublicFormsStats(),
        fetchCRMStats(),
        fetchPlatformPublishingStats(),
        fetchSmartOpportunitiesStats(),
        fetchCalendarStats(),
      ]);

      setData({
        publicPlatform,
        businessCard,
        publicForms,
        crm,
        platformPublishing,
        smartOpportunities,
        calendar,
      });
    } catch (err: any) {
      console.error('[MarketAnalytics] Error fetching all stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    fetchPublicPlatformStats,
    fetchBusinessCardStats,
    fetchPublicFormsStats,
    fetchCRMStats,
    fetchPlatformPublishingStats,
    fetchSmartOpportunitiesStats,
    fetchCalendarStats,
  ]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  return {
    data,
    loading,
    error,
    refetch: fetchAllStats,
  };
}

// ==================== DEFAULT VALUES ====================

function getDefaultPublicPlatformStats(): PublicPlatformStats {
  return {
    liveViewers: 0,
    totalOfferViews: 0,
    todayOfferViews: 0,
    buttonClicks: {
      whatsapp: 0,
      scheduleViewing: 0,
      downloadPdf: 0,
      payDeposit: 0,
      sendPriceQuote: 0,
      submitForms: 0,
    },
    topViewedOffers: [],
    lowestViewedOffers: [],
  };
}

function getDefaultBusinessCardStats(): BusinessCardStats {
  return {
    totalViews: 0,
    liveViewers: 0,
    avgViewDuration: 0,
    buttonClicks: { call: 0, whatsapp: 0, email: 0, location: 0, saveContact: 0, share: 0 },
  };
}

function getDefaultPublicFormsStats(): PublicFormsStats {
  return {
    sendOffer: { visits: 0, submissions: 0, repeatSubmissions: 0 },
    sendRequest: { visits: 0, submissions: 0, repeatSubmissions: 0 },
    priceQuote: { visits: 0, submissions: 0, repeatSubmissions: 0 },
    scheduleAppointment: { visits: 0, submissions: 0, repeatSubmissions: 0 },
    financingCalculation: { visits: 0, submissions: 0, repeatSubmissions: 0 },
    propertyValuation: { visits: 0, submissions: 0, repeatSubmissions: 0 },
  };
}

function getDefaultCRMStats(): CRMStats {
  return {
    totalAdded: 0,
    totalDeleted: 0,
    currentTotal: 0,
    byType: { buyers: 0, sellers: 0, renters: 0, landlords: 0, investors: 0, brokers: 0 },
    cardDetails: {
      publishedOffers: 0,
      receivedOffers: 0,
      receivedRequests: 0,
      publishedRequests: 0,
      rentedProperties: 0,
      soldOrRented: 0,
      priceQuotesReceived: 0,
      receiptsCreated: 0,
      pdfDownloads: 0,
    },
  };
}

function getDefaultPlatformPublishingStats(): PlatformPublishingStats {
  return {
    totalPublishes: 0,
    successfulPublishes: 0,
    failedPublishes: 0,
    connectedPlatforms: [],
    publishedRequestsCount: 0,
  };
}

function getDefaultSmartOpportunitiesStats(): SmartOpportunitiesStats {
  return {
    rejectedCards: 0,
    acceptedCards: 0,
    contactedFromOffers: 0,
    contactedFromRequests: 0,
  };
}

function getDefaultCalendarStats(): CalendarStats {
  return {
    brokerRejections: 0,
    brokerConfirmations: 0,
    customerRejections: 0,
    customerReschedules: 0,
    apologyMessages: 0,
    totalAppointments: 0,
    appointmentsByType: { meetings: 0, propertyViewings: 0, callbacks: 0, other: 0 },
  };
}
