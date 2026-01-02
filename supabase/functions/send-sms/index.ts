import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function sanitizeString(input: unknown, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  return input.substring(0, maxLength).trim();
}

function sanitizePhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  // Only allow digits and + sign
  return input.replace(/[^\d+]/g, '').substring(0, 20);
}

interface SMSRequest {
  to: string;
  message: string;
  appointmentId?: string;
  messageType?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // ============ AUTHENTICATION CHECK ============
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('No authorization header provided');
    return new Response(JSON.stringify({ error: "غير مصرح - يرجى تسجيل الدخول" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create client with user's auth token to verify identity
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? '';
  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    console.error('Auth error:', authError?.message || 'No user found');
    return new Response(JSON.stringify({ error: "جلسة غير صالحة - يرجى تسجيل الدخول مرة أخرى" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log('Authenticated user:', user.id);
  // ============ END AUTHENTICATION CHECK ============

  let logId: string | null = null;

  try {
    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof rawBody !== 'object' || rawBody === null) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = rawBody as Record<string, unknown>;
    const to = sanitizePhone(body.to);
    const message = sanitizeString(body.message, 1600); // SMS limit is 1600 chars for concatenated
    const appointmentId = sanitizeString(body.appointmentId, 100);
    const messageType = sanitizeString(body.messageType, 50) || 'appointment_reminder';

    if (!to) {
      return new Response(JSON.stringify({ error: "رقم الهاتف مطلوب" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ error: "نص الرسالة مطلوب" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone number for Saudi Arabia
    let formattedPhone = to;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+966' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('966')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+966' + formattedPhone;
      }
    }

    // Log the SMS attempt to database with user_id
    const { data: logData, error: logError } = await supabase
      .from('sms_logs')
      .insert({
        recipient_phone: formattedPhone,
        message_content: message,
        message_type: messageType,
        appointment_id: appointmentId || null,
        status: 'pending',
        user_id: user.id, // Track which user sent this SMS
      })
      .select('id')
      .single();

    if (logData) {
      logId = logData.id;
      console.log('SMS log created:', logId);
    } else if (logError) {
      console.error('Failed to create SMS log:', logError);
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Twilio credentials not configured");
      
      // Update log with error
      if (logId) {
        await supabase
          .from('sms_logs')
          .update({ 
            status: 'failed', 
            error_message: 'Twilio credentials not configured' 
          })
          .eq('id', logId);
      }
      
      return new Response(JSON.stringify({ 
        error: "خدمة SMS غير متاحة حالياً",
        details: "يرجى التأكد من إعداد مفاتيح Twilio" 
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending SMS to: ${formattedPhone}`);
    console.log(`Message length: ${message.length}`);
    console.log(`Appointment ID: ${appointmentId || 'N/A'}`);

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', twilioPhone);
    formData.append('Body', message);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Twilio error:', result);
      
      // Update log with error
      if (logId) {
        await supabase
          .from('sms_logs')
          .update({ 
            status: 'failed', 
            error_message: result.message || `Twilio error: ${result.code}` 
          })
          .eq('id', logId);
      }
      
      // Handle specific Twilio errors
      if (result.code === 21211) {
        return new Response(JSON.stringify({ 
          error: "رقم الهاتف غير صالح",
          twilioCode: result.code 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (result.code === 21608) {
        return new Response(JSON.stringify({ 
          error: "رقم الهاتف غير قابل للاستلام",
          twilioCode: result.code 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        error: "فشل في إرسال الرسالة",
        twilioError: result.message || "Unknown error",
        twilioCode: result.code 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('SMS sent successfully:', result.sid);

    // Update log with success
    if (logId) {
      await supabase
        .from('sms_logs')
        .update({ 
          status: 'sent', 
          twilio_message_sid: result.sid,
          sent_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      messageId: result.sid,
      status: result.status,
      to: formattedPhone,
      appointmentId: appointmentId || null,
      logId: logId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending SMS:", error);
    
    // Update log with error if we have a log ID
    if (logId) {
      await supabase
        .from('sms_logs')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', logId);
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});