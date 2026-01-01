import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    const message = sanitizeString(body.message, 1000);
    const appointmentId = sanitizeString(body.appointmentId, 50);

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

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Twilio credentials not configured");
      return new Response(JSON.stringify({ 
        error: "خدمة SMS غير متاحة حالياً",
        details: "يرجى التأكد من إعداد مفاتيح Twilio" 
      }), {
        status: 503,
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

    return new Response(JSON.stringify({ 
      success: true,
      messageId: result.sid,
      status: result.status,
      to: formattedPhone,
      appointmentId: appointmentId || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending SMS:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
