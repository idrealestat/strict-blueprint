import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  userId: string;
}

// Rate limiting: track requests per email
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_HOUR = 5;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(email);
  
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 3600000 }); // 1 hour
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

    const { email, userId }: SendOtpRequest = await req.json();

    console.log('OTP request for email:', email, 'userId:', userId);

    // التحقق من صحة البيانات
    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني ومعرف المستخدم مطلوبان" }),
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

    // التحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "صيغة البريد الإلكتروني غير صحيحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      console.error('Rate limit exceeded for email:', email);
      return new Response(
        JSON.stringify({ error: "تم تجاوز الحد المسموح للطلبات، يرجى المحاولة لاحقاً" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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
      .eq("type", "email");

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
        email: email,
        code: otp,
        type: "email",
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

    // إرسال البريد الإلكتروني عبر Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "وساطة <onboarding@resend.dev>",
        to: [email],
        subject: "رمز تفعيل البريد الإلكتروني - وساطة",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #01411C 0%, #016B30 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">وساطة</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">منصة الوساطة العقارية</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #333; margin-top: 0;">رمز تفعيل البريد الإلكتروني</h2>
              <p style="color: #666; line-height: 1.6;">
                مرحباً بك في وساطة! استخدم الرمز التالي لتفعيل بريدك الإلكتروني:
              </p>
              <div style="background: white; border: 2px dashed #01411C; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #01411C;">${otp}</span>
              </div>
              <p style="color: #999; font-size: 14px;">
                هذا الرمز صالح لمدة 10 دقائق فقط. إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.
              </p>
            </div>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailData);
      return new Response(
        JSON.stringify({ error: "خطأ في إرسال البريد الإلكتروني" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email OTP sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "تم إرسال رمز التحقق بنجاح" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-email-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);