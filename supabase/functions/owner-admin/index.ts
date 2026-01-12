import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ownerGuard, isOwnerGuardError, corsHeaders } from "../_shared/ownerGuard.ts";

/**
 * Owner Admin Edge Function
 * 
 * This endpoint provides owner-only administrative operations.
 * Protected by ownerGuard - returns 403 for non-owner users.
 * 
 * Supported Actions:
 * - GET: Health check / info
 * - POST with action: "get_stats" | "update_settings" | "manage_plans"
 */
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // =====================================================
    // OWNER GUARD - Server-side role verification
    // =====================================================
    const guardResult = await ownerGuard(req);
    
    if (isOwnerGuardError(guardResult)) {
      return guardResult.error;
    }

    const { userId, role } = guardResult.success;

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // =====================================================
    // HANDLE DIFFERENT HTTP METHODS
    // =====================================================

    if (req.method === 'GET') {
      // Simple health check / info endpoint
      return new Response(
        JSON.stringify({
          ok: true,
          message: "لوحة تحكم المالك - مرحباً بك",
          userId,
          role,
          timestamp: new Date().toISOString(),
          availableActions: [
            "get_stats",
            "update_global_defaults",
            "update_user_override",
            "update_business_rules",
            "manage_entitlements"
          ]
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = body;

      switch (action) {
        // =====================================================
        // GET SYSTEM STATS
        // =====================================================
        case 'get_stats': {
          const [usersCount, cardsCount, listingsCount, entitlementsStats] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('business_cards').select('*', { count: 'exact', head: true }),
            supabase.from('platform_listings').select('*', { count: 'exact', head: true }),
            supabase.from('user_entitlements').select('plan_code, status')
          ]);

          const planDistribution: Record<string, number> = {};
          const statusDistribution: Record<string, number> = {};
          
          if (entitlementsStats.data) {
            entitlementsStats.data.forEach((e: any) => {
              const plan = e.plan_code || 'none';
              const status = e.status || 'unknown';
              planDistribution[plan] = (planDistribution[plan] || 0) + 1;
              statusDistribution[status] = (statusDistribution[status] || 0) + 1;
            });
          }

          return new Response(
            JSON.stringify({
              ok: true,
              stats: {
                totalUsers: usersCount.count || 0,
                totalBusinessCards: cardsCount.count || 0,
                totalListings: listingsCount.count || 0,
                planDistribution,
                statusDistribution
              }
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // =====================================================
        // UPDATE GLOBAL FEATURE DEFAULTS
        // =====================================================
        case 'update_global_defaults': {
          const { featureKey, enabled } = payload || {};
          
          if (!featureKey || typeof enabled !== 'boolean') {
            return new Response(
              JSON.stringify({ error: "featureKey و enabled مطلوبان" }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { error } = await supabase
            .from('global_feature_defaults')
            .update({ [featureKey]: enabled })
            .not('id', 'is', null);

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Log the change
          await supabase.from('settings_change_log').insert({
            changed_by_user_id: userId,
            change_type: 'global_default',
            feature_key: featureKey,
            new_value: enabled,
            notes: `تم تحديث الإعداد العام بواسطة المالك`
          });

          return new Response(
            JSON.stringify({ ok: true, message: "تم تحديث الإعداد العام بنجاح" }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // =====================================================
        // UPDATE USER PLAN/ENTITLEMENT
        // =====================================================
        case 'manage_entitlements': {
          const { targetUserId, planCode, status: newStatus } = payload || {};
          
          if (!targetUserId) {
            return new Response(
              JSON.stringify({ error: "targetUserId مطلوب" }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const updateData: any = {};
          if (planCode !== undefined) updateData.plan_code = planCode;
          if (newStatus !== undefined) updateData.status = newStatus;

          if (Object.keys(updateData).length === 0) {
            return new Response(
              JSON.stringify({ error: "لم يتم تحديد أي تغييرات" }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { error } = await supabase
            .from('user_entitlements')
            .update(updateData)
            .eq('user_id', targetUserId);

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Log the change
          await supabase.from('settings_change_log').insert({
            changed_by_user_id: userId,
            change_type: 'entitlement_update',
            feature_key: 'plan_code',
            new_value: planCode !== undefined,
            target_user_id: targetUserId,
            notes: `تم تحديث الباقة إلى ${planCode || 'null'} والحالة إلى ${newStatus || 'unchanged'}`
          });

          return new Response(
            JSON.stringify({ ok: true, message: "تم تحديث الباقة بنجاح" }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // =====================================================
        // UPDATE SYSTEM SETTINGS
        // =====================================================
        case 'update_system_settings': {
          const { settingKey, settingValue } = payload || {};
          
          if (!settingKey) {
            return new Response(
              JSON.stringify({ error: "settingKey مطلوب" }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { error } = await supabase
            .from('system_settings')
            .upsert({ 
              setting_key: settingKey, 
              setting_value: settingValue,
              updated_at: new Date().toISOString()
            }, { onConflict: 'setting_key' });

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, message: "تم تحديث الإعداد بنجاح" }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ 
              error: "عملية غير معروفة",
              availableActions: ["get_stats", "update_global_defaults", "manage_entitlements", "update_system_settings"]
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    return new Response(
      JSON.stringify({ error: "طريقة HTTP غير مدعومة" }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Owner Admin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'خطأ في لوحة التحكم',
        details: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
