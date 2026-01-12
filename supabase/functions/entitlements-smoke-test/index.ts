import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { entitlementsGuard, corsHeaders } from "../_shared/entitlementsGuard.ts";

/**
 * Smoke Test Edge Function
 * Tests entitlements guard with ai_assistant_advanced feature
 * This feature is only available for OFFICE plan or during Trial
 */
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test with ai_assistant_advanced - only OFFICE or Trial users should pass
    const guardResult = await entitlementsGuard(req, 'ai_assistant_advanced');
    
    if ('error' in guardResult) {
      return guardResult.error;
    }

    // If we reach here, user has access
    return new Response(
      JSON.stringify({
        ok: true,
        message: "تم التحقق بنجاح - لديك صلاحية ai_assistant_advanced",
        userId: guardResult.userId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Smoke test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'خطأ في الاختبار',
        details: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
