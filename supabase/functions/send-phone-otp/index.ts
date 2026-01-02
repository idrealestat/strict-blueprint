import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  phone: string;
  userId: string;
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
    const ALLOW_DEV_OTP = Deno.env.get("ALLOW_DEV_OTP") === "true";

    console.log("ENV_CHECK", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseKey,
      hasTwilioSid: !!TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!TWILIO_PHONE_NUMBER,
      allowDevOtp: ALLOW_DEV_OTP,
    });

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "إعدادات النظام غير مكتملة (SUPABASE)" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { phone, userId }: SendOtpRequest = await req.json();

    console.log("OTP_REQUEST", { phone, userId });

    if (!phone || !userId) {
      return new Response(
        JSON.stringify({ error: "رقم الجوال ومعرف المستخدم مطلوبان" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // التحقق من صيغة UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ error: "معرف المستخدم غير صالح" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const phoneRegex = /^(\+966|966|05|5)\d{8}$/;
    const cleanPhone = phone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "صيغة رقم الجوال غير صحيحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!checkRateLimit(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "تم تجاوز الحد المسموح للطلبات" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
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

    // إنشاء رمز OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // حذف الرموز القديمة
    await supabase
      .from("verification_codes")
      .delete()
      .eq("user_id", userId)
      .eq("type", "phone");

    // حفظ رمز التحقق
    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        user_id: userId,
        phone: formattedPhone,
        code: otp,
        type: "phone",
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (insertError) {
      console.error("OTP_SAVE_ERROR", insertError);
      return new Response(
        JSON.stringify({ error: "خطأ في حفظ رمز التحقق", details: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("OTP_SAVED", { phone: formattedPhone, otp: ALLOW_DEV_OTP ? otp : "***" });

    // محاولة إرسال SMS عبر Twilio
    let smsSent = false;
    let smsError: string | null = null;

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
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

        if (twilioResponse.ok) {
          smsSent = true;
          console.log("SMS_SENT", { sid: twilioResult.sid });
        } else {
          smsError = twilioResult.message || twilioResult.error_message || "Twilio error";
          console.error("TWILIO_ERROR", twilioResult);
        }
      } catch (err: any) {
        smsError = err.message;
        console.error("TWILIO_EXCEPTION", err);
      }
    } else {
      smsError = "Twilio credentials not configured";
      console.warn("TWILIO_NOT_CONFIGURED");
    }

    // Dev Fallback: إذا فشل الإرسال وفي وضع التطوير → نرجع الكود مباشرة
    if (!smsSent && ALLOW_DEV_OTP) {
      console.log("DEV_FALLBACK_ENABLED", { otp });
      return new Response(
        JSON.stringify({
          success: true,
          message: "تم حفظ رمز التحقق (وضع التطوير)",
          devCode: otp,
          devMode: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // إذا فشل الإرسال ولا يوجد dev fallback
    if (!smsSent) {
      return new Response(
        JSON.stringify({
          error: "خطأ في إرسال الرسالة النصية",
          details: smsError,
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
