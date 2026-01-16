import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FormType = 'offer' | 'request' | 'quote' | 'appointment';

interface PublicFormSubmitRequest {
  slug: string;
  formType: FormType;
  data: Record<string, unknown>;
}

function sanitizeString(input: unknown, max = 500): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, max);
}

function sanitizePhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  // keep digits only
  return input.replace(/[^0-9]/g, '').slice(0, 20);
}

function safeJson(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null) return {};
  return input as Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as PublicFormSubmitRequest;
    const slug = sanitizeString(body?.slug, 120);
    const formType = body?.formType as FormType;
    const data = safeJson(body?.data);

    if (!slug || !formType) {
      return new Response(JSON.stringify({ error: 'slug و formType مطلوبان' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Resolve broker user_id from published business card slug
    const { data: card, error: cardError } = await supabase
      .from('business_cards')
      .select('user_id, slug, published')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (cardError) {
      console.error('[public-form-submit] business_cards error', cardError);
      return new Response(JSON.stringify({ error: 'تعذر التحقق من الوسيط' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!card?.user_id) {
      return new Response(JSON.stringify({ error: 'لم يتم العثور على بطاقة منشورة لهذا الرابط' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const brokerUserId = card.user_id as string;

    // 2) Normalize customer identity
    const phoneRaw =
      formType === 'offer'
        ? data.ownerPhone
        : formType === 'request'
          ? data.clientPhone
          : formType === 'quote'
            ? data.clientPhone
            : data.clientPhone;

    const nameRaw =
      formType === 'offer'
        ? data.ownerName
        : formType === 'request'
          ? data.clientName
          : formType === 'quote'
            ? data.clientName
            : data.clientName;

    const customerPhone = sanitizePhone(phoneRaw);
    const customerName = sanitizeString(nameRaw, 200) || 'عميل';

    if (!customerPhone) {
      return new Response(JSON.stringify({ error: 'رقم الجوال مطلوب' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Find or create customer
    const { data: existingCustomer } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('user_id', brokerUserId)
      .or(`phone.eq.${customerPhone},whatsapp.eq.${customerPhone}`)
      .maybeSingle();

    let customerId: string;
    let isNewCustomer = false;

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    // Determine metadata update
    const currentMetadata = (existingCustomer?.metadata as Record<string, unknown>) || {};
    const nextMetadata: Record<string, unknown> = { ...currentMetadata };

    // Create entity id if not supplied
    const entityId = sanitizeString(data.id, 120) || `${formType}_${Date.now()}`;

    if (formType === 'offer') {
      const list = (nextMetadata.property_offers as unknown[]) || [];
      nextMetadata.property_offers = [...list, { ...data, id: entityId, type: 'property_offer', submittedAt: nowIso }];
      nextMetadata.hasUnreadOffer = true;
      nextMetadata.lastOfferAt = nowIso;
    }

    if (formType === 'request') {
      const list = (nextMetadata.property_requests as unknown[]) || [];
      nextMetadata.property_requests = [...list, { ...data, id: entityId, type: 'property_request', submittedAt: nowIso }];
      nextMetadata.hasUnreadRequest = true;
      nextMetadata.lastRequestAt = nowIso;
    }

    if (formType === 'quote') {
      const list = (nextMetadata.price_quotes as unknown[]) || [];
      nextMetadata.price_quotes = [...list, { ...data, id: entityId, type: 'price_quote', submittedAt: nowIso }];
      nextMetadata.hasUnreadQuote = true;
      nextMetadata.lastQuoteAt = nowIso;
    }

    if (formType === 'appointment') {
      const list = (nextMetadata.appointments as unknown[]) || [];
      nextMetadata.appointments = [...list, { ...data, id: entityId, type: 'appointment', submittedAt: nowIso }];
      nextMetadata.hasUnreadAppointment = true;
      nextMetadata.lastAppointmentAt = nowIso;
    }

    if (existingCustomer?.id) {
      customerId = existingCustomer.id as string;
      await supabase
        .from('crm_customers')
        .update({
          name: existingCustomer.name && existingCustomer.name !== 'غير معروف' ? existingCustomer.name : customerName,
          phone: existingCustomer.phone || customerPhone,
          whatsapp: existingCustomer.whatsapp || customerPhone,
          last_contact: today,
          metadata: nextMetadata,
        })
        .eq('id', customerId);
    } else {
      isNewCustomer = true;
      const { data: created, error: createError } = await supabase
        .from('crm_customers')
        .insert({
          user_id: brokerUserId,
          name: customerName,
          phone: customerPhone,
          whatsapp: customerPhone,
          status: 'جديد',
          priority: 'عالي',
          source:
            formType === 'offer'
              ? 'نموذج عرض عقاري'
              : formType === 'request'
                ? 'نموذج طلب عقاري'
                : formType === 'quote'
                  ? 'نموذج عرض سعر'
                  : 'نموذج موعد',
          last_contact: today,
          metadata: { ...nextMetadata, isNewCard: true },
        })
        .select()
        .single();

      if (createError) {
        console.error('[public-form-submit] create customer error', createError);
        return new Response(JSON.stringify({ error: 'تعذر إنشاء العميل' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      customerId = created!.id as string;
    }

    // 4) If appointment: insert calendar_appointments row for main calendar
    let calendarAppointmentId: string | null = null;
    if (formType === 'appointment') {
      const appointmentType = sanitizeString(data.appointmentType, 120);
      const preferredDate = sanitizeString(data.preferredDate, 30);
      const preferredTime = sanitizeString(data.preferredTime, 20);
      const meetingLocation = sanitizeString(data.meetingLocation, 300);
      const notes = sanitizeString(data.notes, 1000);

      if (preferredDate && preferredTime) {
        const { data: aptRow, error: aptError } = await supabase
          .from('calendar_appointments')
          .insert({
            user_id: brokerUserId,
            title: `${appointmentType || 'موعد'} - ${customerName}`,
            customer_name: customerName,
            customer_phone: customerPhone,
            appointment_date: preferredDate,
            appointment_time: preferredTime,
            appointment_type: appointmentType || 'موعد',
            location: meetingLocation || null,
            notes: notes || null,
            status: 'pending',
            reminder: true,
            reminder_time: 30,
          })
          .select('id')
          .single();

        if (aptError) {
          console.error('[public-form-submit] appointment insert error', aptError);
        } else {
          calendarAppointmentId = (aptRow?.id as string) || null;
        }
      }
    }

    // 5) Insert notification (this is what drives bell + sound + push + pulsing dots)
    const notifTitle =
      formType === 'offer'
        ? '🏠 عرض عقاري جديد'
        : formType === 'request'
          ? '🔍 طلب عقاري جديد'
          : formType === 'quote'
            ? '💰 طلب عرض سعر جديد'
            : '📅 موعد جديد';

    const notifMessage =
      formType === 'offer'
        ? `${customerName} أرسل عرض عقاري`
        : formType === 'request'
          ? `${customerName} أرسل طلب عقاري`
          : formType === 'quote'
            ? `${customerName} طلب عرض سعر`
            : `${customerName} طلب موعد`;

    const relatedEntityId =
      formType === 'appointment' ? (calendarAppointmentId || entityId) : entityId;

    const notification_type =
      formType === 'offer' ? 'offer' : formType === 'request' ? 'request' : formType === 'quote' ? 'offer' : 'calendar';

    // إنشاء action_url مع customerId للانتقال المباشر للعميل
    const actionUrl = formType === 'appointment' 
      ? `/app/calendar?customerId=${customerId}` 
      : `/app/crm?customerId=${customerId}&tab=${formType === 'offer' ? 'offers' : formType === 'request' ? 'requests' : 'quotes'}`;

    const { data: insertedNotif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: brokerUserId,
        title: notifTitle,
        message: notifMessage,
        notification_type,
        category: 'incoming',
        priority: 'high',
        related_entity_type: `${formType}_form`,
        related_entity_id: customerId, // استخدام customerId كـ related_entity_id
        action_url: actionUrl,
        metadata: {
          customerId,
          isNewCustomer,
          isPulsing: true,
          formType,
          customerName,
          customerPhone,
          entityId: relatedEntityId,
        },
      })
      .select('id')
      .single();

    if (notifError) {
      console.error('[public-form-submit] notification insert error', notifError);
      // Even if notification fails, still return customerId to avoid losing the submission.
    }

    return new Response(
      JSON.stringify({
        success: true,
        brokerUserId,
        customerId,
        entityId: relatedEntityId,
        notificationId: insertedNotif?.id || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[public-form-submit] exception', e);
    return new Response(JSON.stringify({ error: 'حدث خطأ غير متوقع' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
