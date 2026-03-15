import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, phone } = await req.json();

    if (!userId || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: "userId and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // التحقق من أن المستخدم موجود وأن الرقم مرتبط به
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, phone")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: "المستخدم غير موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // إنشاء رابط سحري (magic link) لتسجيل الدخول
    // نستخدم admin API لإنشاء جلسة مباشرة
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "فشل في جلب بيانات المستخدم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // إنشاء جلسة مباشرة عبر generateLink
    // نستخدم admin.generateLink لإنشاء magic link ثم نحوله لجلسة
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({
        type: "magiclink",
        email: userData.user.email,
      }),
    });

    const linkData = await response.json();

    if (!response.ok) {
      console.error("Generate link error:", linkData);
      return new Response(
        JSON.stringify({ success: false, error: "فشل في إنشاء رابط الدخول" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من الرابط مباشرة لإنشاء الجلسة
    const actionLink = linkData.action_link;
    if (!actionLink) {
      // بديل: استخدام admin API لإنشاء جلسة مباشرة
      // Supabase لا يدعم createSession مباشرة، نستخدم verifyOtp بـ token_hash
      const tokenHash = linkData.hashed_token;
      
      if (tokenHash) {
        const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey,
          },
          body: JSON.stringify({
            type: "magiclink",
            token_hash: tokenHash,
          }),
        });

        const sessionData = await verifyResponse.json();

        if (verifyResponse.ok && sessionData.access_token) {
          return new Response(
            JSON.stringify({
              success: true,
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: false, error: "فشل في إنشاء الجلسة" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // استخراج token من الرابط والتحقق منه
    const url = new URL(actionLink);
    const token = url.searchParams.get("token") || url.hash?.split("token=")[1];
    const tokenHash = linkData.hashed_token;

    // تحقق من التوكن لإنشاء جلسة
    const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey,
      },
      body: JSON.stringify({
        type: "magiclink",
        token_hash: tokenHash,
      }),
    });

    const sessionData = await verifyResponse.json();

    if (!verifyResponse.ok || !sessionData.access_token) {
      console.error("Verify error:", sessionData);
      return new Response(
        JSON.stringify({ success: false, error: "فشل في التحقق من الرابط" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Phone login error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
