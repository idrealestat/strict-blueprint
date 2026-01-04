import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  phone: string;
  userId?: string; // اختياري - يمكن استخدام identifier بدلاً منه
  identifier?: string; // معرف مؤقت (الجوال نفسه) قبل إنشاء الحساب
  probe?: boolean; // فحص وضع التطوير بدون إرسال فعلي في الإنتاج
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_HOUR = 5;

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(phone);
  
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  
  if (existing.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  existing.count++;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const ALLOW_DEV_OTP_RAW = Deno.env.get("ALLOW_DEV_OTP");
    const ENVIRONMENT = Deno.env.get("ENVIRONMENT") || Deno.env.get("LOVABLE_ENV") || "production";

    // Dev OTP مسموح فقط في بيئة التطوير
    const isDevEnvironment = ENVIRONMENT === "development" || ENVIRONMENT === "dev";
    const ALLOW_DEV_OTP = ALLOW_DEV_OTP_RAW === "true" && isDevEnvironment;

    console.log("ENV_CHECK", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseKey,
      hasTwilioSid: !!TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!TWILIO_PHONE_NUMBER,
      allowDevOtpRaw: ALLOW_DEV_OTP_RAW,
      environment: ENVIRONMENT,
      isDevEnvironment,
      allowDevOtpFinal: ALLOW_DEV_OTP,
    });

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "إعدادات النظام غير مكتملة (SUPABASE)" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { phone, userId, identifier, probe }: SendOtpRequest = await req.json();

    // في الإنتاج: probe=true يعني "اعرف لي فقط هل Dev OTP مفعل" بدون إنشاء كود/Rate limit/إرسال
    if (probe && !ALLOW_DEV_OTP) {
      return new Response(
        JSON.stringify({ success: true, devMode: false, probe: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const phoneRegex = /^(\+966|966|05|5)\d{8}$/;
    const cleanPhone = phone?.replace(/\s/g, "") || "";

    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "صيغة رقم الجوال غير صحيحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // تنسيق رقم الجوال
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith("05")) {
      formattedPhone = "+966" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("5")) {
      formattedPhone = "+966" + formattedPhone;
    } else if (formattedPhone.startsWith("966")) {
      formattedPhone = "+" + formattedPhone;
    }

    // استخدام identifier كبديل عن userId إذا لم يكن متاحاً
    const effectiveIdentifier = userId || identifier || formattedPhone;

    console.log("OTP_REQUEST", { phone: formattedPhone, userId, identifier, effectiveIdentifier, probe: !!probe });

    // إذا كان userId موجوداً، تحقق من صيغة UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const hasValidUserId = userId && uuidRegex.test(userId);

    if (!checkRateLimit(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "تم تجاوز الحد المسموح للطلبات" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // إنشاء رمز OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // حذف الرموز القديمة
    if (hasValidUserId) {
      await supabase
        .from("verification_codes")
        .delete()
        .eq("user_id", userId)
        .eq("type", "phone");
    }
    // حذف بناءً على identifier
    await supabase
      .from("verification_codes")
      .delete()
      .eq("identifier", effectiveIdentifier)
      .eq("type", "phone");

    // حفظ رمز التحقق
    const insertData: Record<string, any> = {
      phone: formattedPhone,
      code: otp,
      type: "phone",
      expires_at: expiresAt.toISOString(),
      verified: false,
      identifier: effectiveIdentifier,
    };

    // إضافة user_id فقط إذا كان UUID صالحاً
    if (hasValidUserId) {
      insertData.user_id = userId;
    }

    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert(insertData);

    if (insertError) {
      console.error("OTP_SAVE_ERROR", insertError);
      return new Response(
        JSON.stringify({ error: "خطأ في حفظ رمز التحقق", details: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("OTP_SAVED", { phone: formattedPhone, identifier: effectiveIdentifier, otp: ALLOW_DEV_OTP ? otp : "***" });

    // ===== وضع التطوير: لا نستدعي Twilio =====
    if (ALLOW_DEV_OTP) {
      // تسجيل واضح عند تفعيل وضع التطوير
      console.log("DEV_OTP_MODE_ENABLED");
      console.log("DEV_MODE_ACTIVE", { otp, skippingTwilio: true, environment: ENVIRONMENT });
      
      // أمان إضافي: لا نُرجع devCode إلا في بيئة التطوير فقط
      const responseData: Record<string, any> = {
        success: true,
        message: "تم حفظ رمز التحقق (وضع التطوير - لم يُرسل SMS)",
        devMode: true,
      };
      
      // devCode يُرجع فقط إذا كانت البيئة development بالفعل
      if (isDevEnvironment) {
        responseData.devCode = otp;
      }
      
      return new Response(
        JSON.stringify(responseData),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ===== وضع الإنتاج: استخدم Twilio =====
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: "إعدادات Twilio غير مكتملة" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const message = `رمز تفعيل وساطة: ${otp}\nصالح لمدة 10 دقائق`;

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      const twilioCode = twilioResult?.code;
      const twilioMessage = twilioResult?.message || twilioResult?.error_message || "Twilio error";

      console.error("TWILIO_ERROR", { code: twilioCode, message: twilioMessage, raw: twilioResult });

      // لا نُسقط واجهة المستخدم بـ 500: نُرجع 200 مع success=false ليتم التعامل معها في الواجهة.
      // Twilio Trial: 21608 = رقم غير مُوثّق
      if (twilioCode === 21608) {
        return new Response(
          JSON.stringify({
            success: false,
            error_code: "TWILIO_UNVERIFIED",
            error: "تعذر إرسال رمز التفعيل عبر SMS لأن الرقم غير مُوثّق لدى مزود الرسائل (حساب تجريبي).",
            details: twilioMessage,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error_code: "TWILIO_ERROR",
          error: "خطأ في إرسال الرسالة النصية. حاول لاحقاً أو فعّل حساب الرسائل.",
          details: twilioMessage,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("SMS_SENT", { sid: twilioResult.sid });
    return new Response(
      JSON.stringify({ success: true, message: "تم إرسال رمز التحقق بنجاح" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("UNHANDLED_ERROR", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);