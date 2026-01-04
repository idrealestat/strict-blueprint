import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input sanitization
function sanitizeString(input: unknown, maxLength: number = 200): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').substring(0, maxLength).trim();
}

function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email = input.trim().toLowerCase().substring(0, 254);
  return emailRegex.test(email) ? email : '';
}

interface RentalNotificationRequest {
  ownerEmail: string;
  ownerName: string;
  propertyTitle: string;
  contractEndDate: string;
  daysRemaining: number;
  notificationType: 'two_months' | 'one_month' | 'expired';
  propertyLocation: string;
  tenantName?: string;
}

const getEmailContent = (data: {
  ownerName: string;
  propertyTitle: string;
  contractEndDate: string;
  daysRemaining: number;
  notificationType: string;
  propertyLocation: string;
  tenantName?: string;
}) => {
  const { ownerName, propertyTitle, contractEndDate, daysRemaining, notificationType, propertyLocation, tenantName } = data;
  
  if (notificationType === 'two_months') {
    return {
      subject: `تنبيه: عقد التأجير سينتهي خلال شهرين - ${propertyTitle}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: #01411C; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">وساطه AI Wasata</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #01411C; margin-bottom: 20px;">السلام عليكم ${ownerName}</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.8;">
              نود إعلامكم بأن عقد التأجير للعقار التالي سينتهي خلال <strong style="color: #D4AF37;">شهرين</strong>:
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #D4AF37;">
              <p style="margin: 5px 0;"><strong>العقار:</strong> ${propertyTitle}</p>
              <p style="margin: 5px 0;"><strong>الموقع:</strong> ${propertyLocation}</p>
              ${tenantName ? `<p style="margin: 5px 0;"><strong>المستأجر:</strong> ${tenantName}</p>` : ''}
              <p style="margin: 5px 0;"><strong>تاريخ انتهاء العقد:</strong> ${contractEndDate}</p>
              <p style="margin: 5px 0;"><strong>المتبقي:</strong> ${daysRemaining} يوم</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              يرجى التواصل مع المستأجر لترتيب التجديد أو الإخلاء.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>تم الإرسال من منصة وساطه AI</p>
          </div>
        </div>
      `
    };
  } else if (notificationType === 'one_month') {
    return {
      subject: `تنبيه عاجل: عقد التأجير سينتهي خلال شهر - ${propertyTitle}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: #01411C; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">وساطه AI Wasata</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ تنبيه عاجل - ${ownerName}</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.8;">
              عقد التأجير للعقار التالي سينتهي خلال <strong style="color: #dc2626;">شهر واحد فقط</strong>:
            </p>
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;">
              <p style="margin: 5px 0;"><strong>العقار:</strong> ${propertyTitle}</p>
              <p style="margin: 5px 0;"><strong>الموقع:</strong> ${propertyLocation}</p>
              ${tenantName ? `<p style="margin: 5px 0;"><strong>المستأجر:</strong> ${tenantName}</p>` : ''}
              <p style="margin: 5px 0;"><strong>تاريخ انتهاء العقد:</strong> ${contractEndDate}</p>
              <p style="margin: 5px 0;"><strong>المتبقي:</strong> ${daysRemaining} يوم</p>
            </div>
            <p style="font-size: 14px; color: #dc2626; font-weight: bold;">
              يرجى اتخاذ الإجراءات اللازمة فوراً!
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>تم الإرسال من منصة وساطه AI</p>
          </div>
        </div>
      `
    };
  } else {
    return {
      subject: `انتهى عقد التأجير - ${propertyTitle}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">وساطه AI Wasata</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-bottom: 20px;">🔴 انتهى عقد التأجير - ${ownerName}</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.8;">
              نود إعلامكم بأن عقد التأجير للعقار التالي قد <strong style="color: #dc2626;">انتهى اليوم</strong>:
            </p>
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;">
              <p style="margin: 5px 0;"><strong>العقار:</strong> ${propertyTitle}</p>
              <p style="margin: 5px 0;"><strong>الموقع:</strong> ${propertyLocation}</p>
              ${tenantName ? `<p style="margin: 5px 0;"><strong>المستأجر:</strong> ${tenantName}</p>` : ''}
              <p style="margin: 5px 0;"><strong>تاريخ انتهاء العقد:</strong> ${contractEndDate}</p>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">الخيارات المتاحة:</p>
              <ul style="margin: 0; padding-right: 20px;">
                <li style="margin: 5px 0;">تجديد العقد</li>
                <li style="margin: 5px 0;">إخلاء العقار</li>
                <li style="margin: 5px 0;">طلب مهلة إضافية</li>
              </ul>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>تم الإرسال من منصة وساطه AI</p>
          </div>
        </div>
      `
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-rental-notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ success: false, error: "غير مصرح - يرجى تسجيل الدخول" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ success: false, error: "جلسة غير صالحة - يرجى إعادة تسجيل الدخول" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Authenticated user:", user.id);

    const rawData: RentalNotificationRequest = await req.json();
    
    // Sanitize input
    const sanitizedEmail = sanitizeEmail(rawData.ownerEmail);
    if (!sanitizedEmail) {
      return new Response(JSON.stringify({ success: false, error: "البريد الإلكتروني غير صالح" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = {
      ownerEmail: sanitizedEmail,
      ownerName: sanitizeString(rawData.ownerName, 100),
      propertyTitle: sanitizeString(rawData.propertyTitle, 200),
      contractEndDate: sanitizeString(rawData.contractEndDate, 20),
      daysRemaining: Math.min(Math.max(Number(rawData.daysRemaining) || 0, 0), 365),
      notificationType: ['two_months', 'one_month', 'expired'].includes(rawData.notificationType) 
        ? rawData.notificationType : 'two_months',
      propertyLocation: sanitizeString(rawData.propertyLocation, 200),
      tenantName: rawData.tenantName ? sanitizeString(rawData.tenantName, 100) : undefined,
    };

    console.log("Notification data:", data);

    const emailContent = getEmailContent(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "وساطه AI <onboarding@resend.dev>",
        to: [data.ownerEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(error);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-rental-notification function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
