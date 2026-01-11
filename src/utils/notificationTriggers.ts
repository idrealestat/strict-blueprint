/**
 * notificationTriggers.ts
 * آليات إنشاء الإشعارات التلقائية من الأحداث
 * 
 * Event → Rule → Insert Notification
 */

import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  notificationType: 'request' | 'crm' | 'offer' | 'calendar' | 'insight' | 'publishing' | 'system';
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * إنشاء إشعار في قاعدة البيانات
 */
export async function createNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        notification_type: payload.notificationType,
        category: payload.category || null,
        priority: payload.priority || 'normal',
        related_entity_type: payload.relatedEntityType || null,
        related_entity_id: payload.relatedEntityId || null,
        action_url: payload.actionUrl || null,
        metadata: payload.metadata || {},
      });

    if (error) {
      console.error('[NotificationTrigger] Error:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('[NotificationTrigger] Exception:', e);
    return false;
  }
}

// ==================== Trigger Functions ====================

/**
 * إشعار استلام طلب جديد
 */
export async function triggerRequestNotification(
  userId: string,
  requestData: { clientName: string; propertyType?: string; city?: string }
): Promise<void> {
  await createNotification({
    userId,
    title: '📋 طلب جديد',
    message: `استلمت طلب من ${requestData.clientName}${requestData.propertyType ? ` - ${requestData.propertyType}` : ''}${requestData.city ? ` في ${requestData.city}` : ''}`,
    notificationType: 'request',
    category: 'incoming',
    priority: 'high',
    relatedEntityType: 'request',
    metadata: requestData,
  });
}

/**
 * إشعار عرض جديد مُستلَم
 */
export async function triggerOfferNotification(
  userId: string,
  offerData: { ownerName: string; propertyType?: string; city?: string }
): Promise<void> {
  await createNotification({
    userId,
    title: '🏠 عرض عقاري جديد',
    message: `استلمت عرض من ${offerData.ownerName}${offerData.propertyType ? ` - ${offerData.propertyType}` : ''}`,
    notificationType: 'offer',
    category: 'incoming',
    priority: 'high',
    relatedEntityType: 'offer_form',
    metadata: offerData,
  });
}

/**
 * إشعار طلب عرض سعر
 */
export async function triggerQuoteNotification(
  userId: string,
  quoteData: { clientName: string; propertyType?: string }
): Promise<void> {
  await createNotification({
    userId,
    title: '💰 طلب عرض سعر',
    message: `${quoteData.clientName} يطلب عرض سعر${quoteData.propertyType ? ` لـ ${quoteData.propertyType}` : ''}`,
    notificationType: 'offer',
    category: 'quote',
    priority: 'normal',
    relatedEntityType: 'quote_form',
    metadata: quoteData,
  });
}

/**
 * إشعار حجز موعد جديد
 */
export async function triggerCalendarNotification(
  userId: string,
  appointmentData: { customerName: string; date: string; time: string; type?: string }
): Promise<void> {
  await createNotification({
    userId,
    title: '📅 موعد جديد',
    message: `${appointmentData.customerName} حجز موعد ${appointmentData.type || 'معاينة'} - ${appointmentData.date} ${appointmentData.time}`,
    notificationType: 'calendar',
    category: 'appointment',
    priority: 'high',
    relatedEntityType: 'calendar',
    actionUrl: '/app/calendar',
    metadata: appointmentData,
  });
}

/**
 * إشعار تغيير CRM
 */
export async function triggerCRMNotification(
  userId: string,
  crmData: { customerName: string; action: 'new' | 'updated' | 'moved'; column?: string }
): Promise<void> {
  const actionText = {
    new: 'تم إضافة عميل جديد',
    updated: 'تم تحديث بيانات عميل',
    moved: `تم نقل عميل إلى ${crmData.column || 'عمود جديد'}`,
  };

  await createNotification({
    userId,
    title: '👤 تحديث CRM',
    message: `${actionText[crmData.action]}: ${crmData.customerName}`,
    notificationType: 'crm',
    category: 'update',
    priority: 'low',
    relatedEntityType: 'customer',
    metadata: crmData,
  });
}

/**
 * إشعار نشر عقار
 */
export async function triggerPublishingNotification(
  userId: string,
  publishData: { title: string; status: 'published' | 'updated' | 'deleted' }
): Promise<void> {
  const statusText = {
    published: '✅ تم نشر العقار',
    updated: '🔄 تم تحديث العقار',
    deleted: '🗑️ تم حذف العقار',
  };

  await createNotification({
    userId,
    title: statusText[publishData.status],
    message: publishData.title,
    notificationType: 'publishing',
    category: publishData.status,
    priority: 'normal',
    relatedEntityType: 'listing',
    metadata: publishData,
  });
}

/**
 * إشعار تفاعل مع العرض (مشاهدة، اتصال، واتساب)
 */
export async function triggerOfferInteractionNotification(
  userId: string,
  interactionData: { 
    offerTitle: string; 
    interactionType: 'view' | 'call' | 'whatsapp' | 'share' | 'quote_request';
    viewerInfo?: string;
  }
): Promise<void> {
  const typeText: Record<string, { title: string; emoji: string }> = {
    view: { title: 'مشاهدة جديدة', emoji: '👁️' },
    call: { title: 'اتصال جديد', emoji: '📞' },
    whatsapp: { title: 'رسالة واتساب', emoji: '💬' },
    share: { title: 'تم مشاركة العرض', emoji: '🔗' },
    quote_request: { title: 'طلب عرض سعر', emoji: '💰' },
  };

  const info = typeText[interactionData.interactionType] || { title: 'تفاعل', emoji: '📌' };

  await createNotification({
    userId,
    title: `${info.emoji} ${info.title}`,
    message: `${interactionData.offerTitle}${interactionData.viewerInfo ? ` - ${interactionData.viewerInfo}` : ''}`,
    notificationType: 'offer',
    category: interactionData.interactionType,
    priority: interactionData.interactionType === 'call' ? 'high' : 'normal',
    relatedEntityType: 'offer',
    metadata: interactionData,
  });
}

/**
 * إشعار رؤية ذكية (Insight)
 */
export async function triggerInsightNotification(
  userId: string,
  insightData: { title: string; description: string; type?: string }
): Promise<void> {
  await createNotification({
    userId,
    title: `💡 ${insightData.title}`,
    message: insightData.description,
    notificationType: 'insight',
    category: insightData.type || 'general',
    priority: 'low',
    relatedEntityType: 'insight',
    metadata: insightData,
  });
}
