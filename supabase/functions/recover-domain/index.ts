import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RecoverDomainRequest {
  cardId: string;
  verificationMethod: 'email' | 'phone';
  identityMethod: 'fal_license' | 'national_id';
  email?: string;
  phone?: string;
  falLicense?: string;
  nationalId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RecoverDomainRequest = await req.json();
    const { cardId, verificationMethod, identityMethod, email, phone, falLicense, nationalId } = body;

    // التحقق من البيانات المطلوبة
    if (!cardId) {
      return new Response(
        JSON.stringify({ success: false, error: "معرف البطاقة مطلوب" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const verificationValue = verificationMethod === 'email' ? email : phone;
    const identityValue = identityMethod === 'fal_license' ? falLicense : nationalId;

    if (!verificationValue || !identityValue) {
      return new Response(
        JSON.stringify({ success: false, error: "بيانات التحقق غير مكتملة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // الاتصال بـ Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. التحقق من وجود البطاقة ومطابقة البيانات
    const { data: card, error: cardError } = await supabase
      .from("business_cards")
      .select("*")
      .eq("id", cardId)
      .maybeSingle();

    if (cardError || !card) {
      console.error("Card fetch error:", cardError);
      return new Response(
        JSON.stringify({ success: false, error: "البطاقة غير موجودة" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. التحقق من مطابقة بيانات الهوية
    let identityMatch = false;
    if (identityMethod === 'fal_license' && card.fal_license_number === falLicense) {
      identityMatch = true;
    } else if (identityMethod === 'national_id') {
      const { data: priv } = await supabase
        .from("business_card_private")
        .select("national_id")
        .eq("user_id", card.user_id)
        .maybeSingle();
      if (priv?.national_id && priv.national_id === nationalId) {
        identityMatch = true;
      }
    }

    if (!identityMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "بيانات الهوية غير متطابقة" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 3. التحقق من مطابقة طريقة التحقق
    let verificationMatch = false;
    if (verificationMethod === 'email' && card.email === email) {
      verificationMatch = true;
    } else if (verificationMethod === 'phone' && card.phone === phone) {
      verificationMatch = true;
    }

    if (!verificationMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "بيانات التواصل غير متطابقة" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 4. التحقق من أن OTP تم التحقق منه (نبحث عن سجل verified)
    const { data: verificationRecord, error: verifyError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("identifier", verificationValue)
      .eq("type", verificationMethod)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifyError) {
      console.error("Verification check error:", verifyError);
    }

    // التحقق من رمز OTP إجباري لمنع اختطاف البطاقات
    if (!verificationRecord) {
      return new Response(
        JSON.stringify({ success: false, error: "يجب التحقق من رمز OTP أولاً" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (verificationRecord.expires_at && new Date(verificationRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 5. البحث عن مستخدم موجود بنفس البريد/الجوال أو إنشاء رابط استرداد
    let targetUserId: string | null = null;

    // البحث في جدول auth.users عبر profiles
    if (verificationMethod === 'email' && email) {
      // البحث عن مستخدم بنفس البريد
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === email);
      if (existingUser) {
        targetUserId = existingUser.id;
      }
    } else if (verificationMethod === 'phone' && phone) {
      // البحث في profiles بنفس رقم الجوال
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", phone)
        .maybeSingle();
      
      if (profile) {
        targetUserId = profile.user_id;
      }
    }

    // 6. تحديث البطاقة لربطها بالمستخدم الجديد (إن وجد)
    if (targetUserId && targetUserId !== card.user_id) {
      const { error: updateError } = await supabase
        .from("business_cards")
        .update({ user_id: targetUserId })
        .eq("id", cardId);

      if (updateError) {
        console.error("Card update error:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "فشل تحديث البطاقة" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`Card ${cardId} transferred from ${card.user_id} to ${targetUserId}`);
    }

    // 7. إرجاع النجاح مع معلومات الاسترداد
    return new Response(
      JSON.stringify({
        success: true,
        message: targetUserId 
          ? "تم ربط النطاق بحسابك بنجاح" 
          : "تم التحقق من ملكيتك للنطاق. يرجى تسجيل الدخول أو إنشاء حساب جديد.",
        slug: card.slug,
        linkedToExistingUser: !!targetUserId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in recover-domain function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
