import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  userId: string;
  code: string;
  type: "email" | "phone";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, code, type }: VerifyOtpRequest = await req.json();

    // التحقق من صحة البيانات
    if (!userId || !code || !type) {
      return new Response(
        JSON.stringify({ error: "جميع الحقول مطلوبة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // التحقق من صحة الرمز (6 أرقام)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "صيغة الرمز غير صحيحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // الاتصال بـ Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // البحث عن رمز التحقق
    const { data: verificationCode, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("code", code)
      .eq("verified", false)
      .single();

    if (fetchError || !verificationCode) {
      return new Response(
        JSON.stringify({ error: "رمز التحقق غير صحيح" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // التحقق من انتهاء صلاحية الرمز
    if (new Date(verificationCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "انتهت صلاحية رمز التحقق" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // تحديث حالة التحقق
    await supabase
      .from("verification_codes")
      .update({ verified: true })
      .eq("id", verificationCode.id);

    // تحديث ملف المستخدم
    const updateField = type === "email" ? "email_verified" : "phone_verified";
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [updateField]: true })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "خطأ في تحديث الملف الشخصي" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // حذف الرمز المستخدم
    await supabase
      .from("verification_codes")
      .delete()
      .eq("id", verificationCode.id);

    return new Response(
      JSON.stringify({ success: true, message: "تم التحقق بنجاح" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
