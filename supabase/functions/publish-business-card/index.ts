import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { entitlementsGuard, corsHeaders } from '../_shared/entitlementsGuard.ts';

type PublishRequest = {
  slug?: string;
  data?: Record<string, unknown>;
  token?: string;
};

async function sha256Base64(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ ENTITLEMENTS GUARD ============
    const guardResult = await entitlementsGuard(req, 'business_card');
    if ('error' in guardResult) {
      return guardResult.error;
    }
    const userId = guardResult.userId;
    // ============ END ENTITLEMENTS GUARD ============

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!req.headers.get("content-type")?.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as PublishRequest;
    const slug = (body.slug || "").trim();

    if (!slug || slug.length > 80) {
      return new Response(JSON.stringify({ error: "Invalid slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = body.data ?? {};

    // Find existing
    const { data: existing, error: fetchError } = await supabase
      .from("business_cards")
      .select("id, publish_token_hash")
      .eq("slug", slug)
      .maybeSingle();

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token handling
    let token = body.token?.trim();
    if (!token) token = crypto.randomUUID();
    const tokenHash = await sha256Base64(token);

    if (existing?.publish_token_hash && existing.publish_token_hash !== tokenHash) {
      return new Response(JSON.stringify({ error: "Invalid publish token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert - now using authenticated user's ID
    const payload = {
      slug,
      data,
      published: true,
      publish_token_hash: tokenHash,
      user_id: userId,
    };

    const { error: upsertError } = await supabase
      .from("business_cards")
      .upsert(payload, { onConflict: "slug" });

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Business card published for user:", userId, "slug:", slug);
    return new Response(JSON.stringify({ ok: true, slug, token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
