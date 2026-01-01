import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertyEmailRequest {
  recipientEmail: string;
  property: {
    propertyType?: string;
    category?: string;
    purpose?: string;
    area?: string;
    price?: string;
    locationDetails?: {
      city?: string;
      district?: string;
      street?: string;
    };
    bedrooms?: string;
    bathrooms?: string;
    floors?: string;
    ownerName?: string;
    ownerPhone?: string;
    features?: string[];
    aiDescription?: string;
    brokerPhone?: string;
  };
  selectedSections: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, property, selectedSections }: PropertyEmailRequest = await req.json();

    console.log("Sending property email to:", recipientEmail);
    console.log("Selected sections:", selectedSections);

    // Build email HTML content
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #01411C 0%, #02521f 100%);
            color: #D4AF37;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            color: white;
          }
          .content {
            padding: 30px;
          }
          .property-title {
            font-size: 22px;
            color: #01411C;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #D4AF37;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            color: #01411C;
            font-weight: bold;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-content {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 10px;
            border-right: 4px solid #D4AF37;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
          }
          .info-label {
            color: #666;
          }
          .info-value {
            font-weight: bold;
            color: #333;
          }
          .price {
            color: #D4AF37 !important;
            font-size: 18px !important;
          }
          .features {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .feature-badge {
            background: #e8f5e9;
            color: #01411C;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
          }
          .description {
            line-height: 1.8;
            color: #555;
          }
          .footer {
            background: #f0f0f0;
            padding: 20px;
            text-align: center;
            color: #888;
            font-size: 12px;
          }
          .contact-btn {
            display: inline-block;
            background: #25D366;
            color: white;
            padding: 12px 25px;
            border-radius: 25px;
            text-decoration: none;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 وساطة العقارية</h1>
            <p>تفاصيل العقار</p>
          </div>
          <div class="content">
            <h2 class="property-title">${property.purpose || ''} ${property.propertyType || ''}</h2>
    `;

    // Basic Info Section
    if (selectedSections.includes('basic')) {
      htmlContent += `
        <div class="section">
          <div class="section-title">📋 المعلومات الأساسية</div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">نوع العقار:</span>
                <span class="info-value">${property.propertyType || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">التصنيف:</span>
                <span class="info-value">${property.category || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">الغرض:</span>
                <span class="info-value">${property.purpose || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">المساحة:</span>
                <span class="info-value">${property.area ? `${property.area} م²` : '-'}</span>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                <span class="info-label">السعر:</span>
                <span class="info-value price">${property.price ? `${parseInt(property.price).toLocaleString()} ريال` : 'اتصل للسعر'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Location Section
    if (selectedSections.includes('location')) {
      htmlContent += `
        <div class="section">
          <div class="section-title">📍 معلومات الموقع</div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">المدينة:</span>
                <span class="info-value">${property.locationDetails?.city || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">الحي:</span>
                <span class="info-value">${property.locationDetails?.district || '-'}</span>
              </div>
              ${property.locationDetails?.street ? `
              <div class="info-item" style="grid-column: span 2;">
                <span class="info-label">الشارع:</span>
                <span class="info-value">${property.locationDetails.street}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // Specs Section
    if (selectedSections.includes('specs')) {
      const specs = [];
      if (property.bedrooms) specs.push(`🛏️ ${property.bedrooms} غرف`);
      if (property.bathrooms) specs.push(`🚿 ${property.bathrooms} حمام`);
      if (property.floors) specs.push(`🏢 ${property.floors} أدوار`);

      if (specs.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">📐 المواصفات</div>
            <div class="section-content">
              <div class="features">
                ${specs.map(s => `<span class="feature-badge">${s}</span>`).join('')}
              </div>
            </div>
          </div>
        `;
      }
    }

    // Features Section
    if (selectedSections.includes('features') && property.features && property.features.length > 0) {
      htmlContent += `
        <div class="section">
          <div class="section-title">✨ المميزات</div>
          <div class="section-content">
            <div class="features">
              ${property.features.map(f => `<span class="feature-badge">✓ ${f}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Description Section
    if (selectedSections.includes('description') && property.aiDescription) {
      htmlContent += `
        <div class="section">
          <div class="section-title">📝 الوصف</div>
          <div class="section-content">
            <p class="description">${property.aiDescription}</p>
          </div>
        </div>
      `;
    }

    // Owner Section
    if (selectedSections.includes('owner')) {
      const contactPhone = property.brokerPhone || property.ownerPhone;
      htmlContent += `
        <div class="section">
          <div class="section-title">📞 معلومات التواصل</div>
          <div class="section-content" style="text-align: center;">
            ${property.ownerName ? `<p><strong>الاسم:</strong> ${property.ownerName}</p>` : ''}
            ${contactPhone ? `
              <p><strong>الجوال:</strong> <span dir="ltr">${contactPhone}</span></p>
              <a href="https://wa.me/${contactPhone.replace(/\D/g, '')}" class="contact-btn">
                💬 تواصل عبر واتساب
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }

    htmlContent += `
          </div>
          <div class="footer">
            <p>تم الإرسال بواسطة منصة وساطة العقارية</p>
            <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Wasata <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `🏠 تفاصيل عقار: ${property.purpose || ''} ${property.propertyType || ''} - ${property.locationDetails?.city || ''}`,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-property-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
