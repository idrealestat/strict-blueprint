/**
 * Entitlements Guard for Edge Functions
 * 
 * This guard checks if a user can use a specific feature based on their plan and entitlement status.
 * It integrates with the can_use_feature database function.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Feature keys that match the database can_use_feature function
 */
export type FeatureKey = 
  | 'business_card'
  | 'crm'
  | 'requests_forms'
  | 'offers_requests'
  | 'publish_listings'
  | 'analytics_basic'
  | 'ai_assistant_basic'
  | 'ai_assistant_advanced'
  | 'team_management'
  | 'central_publishing';

export interface AuthResult {
  userId: string;
  error?: never;
}

export interface AuthError {
  userId?: never;
  error: Response;
}

export type AuthCheckResult = AuthResult | AuthError;

/**
 * Authenticate user from Authorization header
 */
export async function authenticateUser(
  req: Request,
  supabaseUrl: string,
  supabaseAnon: string
): Promise<AuthCheckResult> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('No authorization header provided');
    return {
      error: new Response(
        JSON.stringify({ error: "غير مصرح - يرجى تسجيل الدخول", code: "UNAUTHORIZED" }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    };
  }

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
    
    if (authError || !claimsData?.claims?.sub) {
      console.error('Auth error:', authError?.message || 'invalid claim: missing sub claim');
      return {
        error: new Response(
          JSON.stringify({ error: "جلسة غير صالحة - يرجى تسجيل الدخول مرة أخرى", code: "INVALID_SESSION" }), 
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      };
    }
    
    return { userId: claimsData.claims.sub };
  } catch (jwtError) {
    console.error('JWT validation error:', jwtError);
    const errorMessage = jwtError instanceof Error ? jwtError.message : 'Unknown JWT error';
    const isExpired = errorMessage.toLowerCase().includes('expired');
    
    return {
      error: new Response(
        JSON.stringify({ 
          error: isExpired ? "انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى" : "جلسة غير صالحة",
          code: isExpired ? "SESSION_EXPIRED" : "INVALID_SESSION"
        }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    };
  }
}

/**
 * Check if user can use a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: FeatureKey,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ allowed: boolean; error?: Response }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase.rpc('can_use_feature', {
      p_user_id: userId,
      p_feature: featureKey
    });

    if (error) {
      console.error(`Error checking feature access for ${featureKey}:`, error);
      // On error, we allow access to avoid blocking users due to technical issues
      // But log it for debugging
      return { allowed: true };
    }

    if (!data) {
      console.log(`Feature ${featureKey} not allowed for user ${userId}`);
      return {
        allowed: false,
        error: new Response(
          JSON.stringify({
            error: "هذه الميزة غير متاحة في باقتك الحالية",
            code: "FEATURE_NOT_ALLOWED",
            feature: featureKey,
            message: `الميزة "${getFeatureDisplayName(featureKey)}" تتطلب ترقية الباقة`
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error(`Exception checking feature access:`, err);
    // On exception, we allow access to avoid blocking users due to technical issues
    return { allowed: true };
  }
}

/**
 * Full guard that checks both authentication and feature access
 */
export async function entitlementsGuard(
  req: Request,
  featureKey: FeatureKey
): Promise<{ userId: string } | { error: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? '';
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

  // Step 1: Authenticate user
  const authResult = await authenticateUser(req, supabaseUrl, supabaseAnon);
  
  if ('error' in authResult) {
    return authResult;
  }

  const { userId } = authResult;

  // Step 2: Check feature access
  const featureResult = await checkFeatureAccess(userId, featureKey, supabaseUrl, supabaseServiceKey);
  
  if (!featureResult.allowed && featureResult.error) {
    return { error: featureResult.error };
  }

  console.log(`User ${userId} authorized for feature ${featureKey}`);
  return { userId };
}

/**
 * Get display name for feature key (for user-facing messages)
 */
function getFeatureDisplayName(featureKey: FeatureKey): string {
  const displayNames: Record<FeatureKey, string> = {
    'business_card': 'البطاقة الرقمية',
    'crm': 'إدارة العملاء',
    'requests_forms': 'نماذج الطلبات',
    'offers_requests': 'العروض والطلبات',
    'publish_listings': 'نشر العقارات',
    'analytics_basic': 'التحليلات الأساسية',
    'ai_assistant_basic': 'المساعد الذكي الأساسي',
    'ai_assistant_advanced': 'المساعد الذكي المتقدم',
    'team_management': 'إدارة الفريق',
    'central_publishing': 'النشر المركزي',
  };
  
  return displayNames[featureKey] || featureKey;
}
