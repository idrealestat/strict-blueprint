import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple jitter to simulate live updates until real SAMA scraping is wired.
// In production, replace with HTML parse of https://www.sama.gov.sa or Firecrawl.
function jitter(value: number, maxPct = 0.5): number {
  const delta = (Math.random() - 0.5) * 2 * (maxPct / 100) * value;
  return Number((value + delta).toFixed(3));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rows, error } = await supabase.from("bank_rates").select("*");
    if (error) throw error;

    const updates = (rows ?? []).map((r: any) => {
      const prev = Number(r.value);
      // Only jitter saibor/mortgage; policy rates stay flat unless changed
      const next = r.category === "policy" ? prev : jitter(prev, 0.8);
      const change_pct = prev > 0 ? Number((((next - prev) / prev) * 100).toFixed(2)) : 0;
      const trend = change_pct > 0 ? "up" : change_pct < 0 ? "down" : "flat";
      return {
        code: r.code,
        name_ar: r.name_ar,
        category: r.category,
        value: next,
        previous_value: prev,
        change_pct,
        trend,
        unit: r.unit,
        source: r.source,
        source_url: r.source_url,
        updated_at: new Date().toISOString(),
      };
    });

    for (const u of updates) {
      await supabase.from("bank_rates").upsert(u, { onConflict: "code" });
    }

    return new Response(
      JSON.stringify({ success: true, updated: updates.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});