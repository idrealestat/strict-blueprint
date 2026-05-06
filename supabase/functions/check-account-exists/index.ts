import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, email } = await req.json();
    if (!phone && !email) {
      return json({ success: false, error: "phone or email required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let userId: string | null = null;
    let foundEmail: string | null = null;

    // 1) ابحث في profiles بالجوال
    if (phone) {
      const { data } = await admin
        .from("profiles")
        .select("user_id")
        .eq("phone", phone)
        .maybeSingle();
      if (data?.user_id) userId = data.user_id;
    }
    // 2) ابحث في owner_profiles بالجوال
    if (!userId && phone) {
      const { data } = await admin
        .from("owner_profiles")
        .select("user_id")
        .eq("phone", phone)
        .maybeSingle();
      if (data?.user_id) userId = data.user_id;
    }
    // 3) ابحث بالبريد عبر admin auth
    if (!userId && email) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const u = list?.users?.find((x: any) => (x.email || "").toLowerCase() === email.toLowerCase());
      if (u) { userId = u.id; foundEmail = u.email ?? null; }
    }

    if (!userId) {
      return json({ success: true, exists: false, has_owner_profile: false, has_business_card: false });
    }

    if (!foundEmail) {
      const { data: u } = await admin.auth.admin.getUserById(userId);
      foundEmail = u?.user?.email ?? null;
    }

    const [{ count: ownerCount }, { count: cardCount }] = await Promise.all([
      admin.from("owner_profiles").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("business_cards").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    return json({
      success: true,
      exists: true,
      user_id: userId,
      email: foundEmail,
      has_owner_profile: (ownerCount ?? 0) > 0,
      has_business_card: (cardCount ?? 0) > 0,
    });
  } catch (e: any) {
    console.error("check-account-exists error:", e);
    return json({ success: false, error: e.message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}