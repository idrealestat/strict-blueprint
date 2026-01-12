/**
 * Owner Guard for Edge Functions
 * 
 * This guard restricts access to Owner Panel endpoints.
 * Only users with role='owner' can access protected endpoints.
 * 
 * SECURITY: This is server-side protection - NOT just UI hiding.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// الأدوار المعتمدة:
// owner = مالك النظام (شخص واحد)
// admin = مدير مكتب (صلاحيات داخل حسابه فقط)
// member = عضو فريق
export type AppRole = 'owner' | 'admin' | 'member';

export interface OwnerAuthResult {
  userId: string;
  role: AppRole;
}

export interface OwnerAuthError {
  error: Response;
}

export type OwnerGuardResult = { success: OwnerAuthResult } | { error: Response };

/**
 * Owner Guard - Restricts access to owner-only endpoints
 * 
 * Returns:
 * - 401 if no valid token
 * - 403 if user is not an owner
 * - { userId, role } if authorized
 */
export async function ownerGuard(req: Request): Promise<OwnerGuardResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? '';
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

  // Step 1: Extract and validate authorization header
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('Owner Guard: No authorization header provided');
    return {
      error: new Response(
        JSON.stringify({ 
          error: "غير مصرح - يرجى تسجيل الدخول", 
          code: "UNAUTHORIZED" 
        }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    };
  }

  // Step 2: Authenticate user
  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  
  let userId: string;
  try {
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
    
    if (authError || !claimsData?.claims?.sub) {
      console.error('Owner Guard: Auth error:', authError?.message || 'invalid claim: missing sub claim');
      return {
        error: new Response(
          JSON.stringify({ 
            error: "جلسة غير صالحة - يرجى تسجيل الدخول مرة أخرى", 
            code: "INVALID_SESSION" 
          }), 
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      };
    }
    
    userId = claimsData.claims.sub;
  } catch (jwtError) {
    console.error('Owner Guard: JWT validation error:', jwtError);
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

  // Step 3: Check user role from database
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role', { _user_id: userId });

    if (roleError) {
      console.error('Owner Guard: Error fetching role:', roleError);
      // Fallback to direct query
      const { data: directRoleData, error: directError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (directError || !directRoleData) {
        console.error('Owner Guard: Direct role query failed:', directError);
        return {
          error: new Response(
            JSON.stringify({ 
              error: "غير مصرح بالوصول - لا يوجد دور محدد",
              code: "NO_ROLE" 
            }), 
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          )
        };
      }
      
      const userRole = directRoleData.role as AppRole;
      
      if (userRole !== 'owner') {
        console.log(`Owner Guard: Access denied for user ${userId} with role ${userRole}`);
        return {
          error: new Response(
            JSON.stringify({ 
              error: "غير مصرح بالوصول - هذه اللوحة مخصصة لمالك التطبيق فقط",
              code: "FORBIDDEN",
              role: userRole
            }), 
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          )
        };
      }
      
      console.log(`Owner Guard: Access granted for owner ${userId}`);
      return { success: { userId, role: 'owner' } };
    }

    const userRole = roleData as AppRole;
    
    // Step 4: Verify owner role
    if (userRole !== 'owner') {
      console.log(`Owner Guard: Access denied for user ${userId} with role ${userRole}`);
      return {
        error: new Response(
          JSON.stringify({ 
            error: "غير مصرح بالوصول - هذه اللوحة مخصصة لمالك التطبيق فقط",
            code: "FORBIDDEN",
            yourRole: userRole
          }), 
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      };
    }

    console.log(`Owner Guard: Access granted for owner ${userId}`);
    return { success: { userId, role: 'owner' } };

  } catch (err) {
    console.error('Owner Guard: Exception:', err);
    return {
      error: new Response(
        JSON.stringify({ 
          error: "خطأ في التحقق من الصلاحيات",
          code: "INTERNAL_ERROR" 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    };
  }
}

/**
 * Quick helper to check if result is an error
 */
export function isOwnerGuardError(result: OwnerGuardResult): result is { error: Response } {
  return 'error' in result;
}
