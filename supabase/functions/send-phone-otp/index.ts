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

// Rate limiting: track requests per phone number
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_HOUR = 5;

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(phone);
  
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + 3600000 }); // 1 hour
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

    if (!supabaseUrl || !supabaseKey) {
      console.error("OTP_SAVE_ERROR", {
        reason: "MISSING_SUPABASE_ENV",
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!supabaseKey,
      });
      return new Response(
        JSON.stringify({ error: "إعدادات النظام غير مكتملة (SUPABASE)" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { phone, userId }: SendOtpRequest = await req.json();

    console.log('OTP request for phone:', phone, 'userId:', userId);

    // التحقق من صحة البيانات
    if (!phone || !userId) {
      return new Response(
        JSON.stringify({ error: "رقم الجوال ومعرف المستخدم مطلوبان" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // التحقق من صيغة معرف المستخدم (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ error: "معرف المستخدم غير صالح" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // التحقق من صيغة رقم الجوال السعودي
    const phoneRegex = /^(\+966|966|05|5)\d{8}$/;
    const cleanPhone = phone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "صيغة رقم الجوال غير صحيحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(cleanPhone)) {
      console.error('Rate limit exceeded for phone:', cleanPhone);
      return new Response(
        JSON.stringify({ error: "تم تجاوز الحد المسموح للطلبات، يرجى المحاولة لاحقاً" }),
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

    // إنشاء رمز OTP عشوائي من 6 أرقام
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // صالح لمدة 10 دقائق

    // الاتصال بـ Supabase with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // حذف الرموز القديمة
    const { error: deleteError } = await supabase
      .from("verification_codes")
      .delete()
      .eq("user_id", userId)
      .eq("type", "phone");

    if (deleteError) {
      console.error("OTP_SAVE_ERROR", { step: "delete_old", deleteError });
      return new Response(
        JSON.stringify({
          error: "خطأ في حذف رمز تحقق سابق",
          details: deleteError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // حفظ رمز التحقق في قاعدة البيانات
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
      console.error("OTP_SAVE_ERROR", { step: "insert", insertError });
      return new Response(
        JSON.stringify({
          error: "خطأ في حفظ رمز التحقق",
          details: insertError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // إرسال الرسالة النصية عبر Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "خدمة الرسائل النصية غير متوفرة" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const message = `رمز تفعيل وساطة: ${otp}\nصالح لمدة 10 دقائق`;

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);
      return new Response(
        JSON.stringify({ error: "خطأ في إرسال الرسالة النصية" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Phone OTP sent successfully:", twilioResult.sid);

    return new Response(
      JSON.stringify({ success: true, message: "تم إرسال رمز التحقق بنجاح" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-phone-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);