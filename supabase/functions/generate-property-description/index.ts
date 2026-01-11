import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

// Input validation helper functions
function sanitizeString(input: unknown, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>"`]/g, '') // Remove potentially dangerous chars for prompt injection
    .substring(0, maxLength)
    .trim();
}

function sanitizeArray(input: unknown, maxItems: number = 50, maxItemLength: number = 100): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === 'string')
    .map(item => sanitizeString(item, maxItemLength));
}

interface Warranty {
  type: string;
  duration: string;
}

function sanitizeWarranties(input: unknown, maxItems: number = 20): Warranty[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, maxItems)
    .filter((item): item is { type: unknown; duration: unknown } => 
      typeof item === 'object' && item !== null && 'type' in item && 'duration' in item
    )
    .map(item => ({
      type: sanitizeString(item.type, 100),
      duration: sanitizeString(item.duration, 50)
    }));
}

interface PropertyData {
  propertyType: string;
  category: string;
  purpose: string;
  area: string;
  city: string;
  district: string;
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  councils: string;
  floors: string;
  floorNumber: string;
  cornerType: string;
  furnishing: string;
  propertyAge: string;
  features: string[];
  warranties: Warranty[];
  adLicense: string;
  brokerPhone: string;
  descriptionStyle: string;
  descriptionLength: string;
  descriptionLanguage: string;
  streetWidth: string;
  facade: string;
  acUnits: string;
  balconies: string;
  entrances: string;
  warehouses: string;
  curtains: string;
  hasExtraKitchen: boolean;
  extraKitchenAppliances: string;
  hasLaundryRoom: boolean;
  price: string;
  // خيارات الدفع للإيجار
  paymentOption: string;
  paymentPrices: {
    monthly?: string;
    quarterly?: string;
    semiAnnual?: string;
    yearly?: string;
  };
}

function validateAndSanitizePropertyData(raw: unknown): PropertyData {
  const data = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  
  // معالجة أسعار الدفع
  const rawPaymentPrices = typeof data.paymentPrices === 'object' && data.paymentPrices !== null 
    ? data.paymentPrices as Record<string, unknown> 
    : {};
  
  return {
    propertyType: sanitizeString(data.propertyType, 50),
    category: sanitizeString(data.category, 50),
    purpose: sanitizeString(data.purpose, 50),
    area: sanitizeString(data.area, 20),
    city: sanitizeString(data.city, 100),
    district: sanitizeString(data.district, 100),
    bedrooms: sanitizeString(data.bedrooms, 10),
    bathrooms: sanitizeString(data.bathrooms, 10),
    livingRooms: sanitizeString(data.livingRooms, 10),
    councils: sanitizeString(data.councils, 10),
    floors: sanitizeString(data.floors, 10),
    floorNumber: sanitizeString(data.floorNumber, 10),
    cornerType: sanitizeString(data.cornerType, 20),
    furnishing: sanitizeString(data.furnishing, 50),
    propertyAge: sanitizeString(data.propertyAge, 10),
    features: sanitizeArray(data.features, 50, 100),
    warranties: sanitizeWarranties(data.warranties, 20),
    adLicense: sanitizeString(data.adLicense, 50),
    brokerPhone: sanitizeString(data.brokerPhone, 20),
    descriptionStyle: sanitizeString(data.descriptionStyle, 30),
    descriptionLength: sanitizeString(data.descriptionLength, 30),
    descriptionLanguage: sanitizeString(data.descriptionLanguage, 30),
    streetWidth: sanitizeString(data.streetWidth, 10),
    facade: sanitizeString(data.facade, 30),
    acUnits: sanitizeString(data.acUnits, 10),
    balconies: sanitizeString(data.balconies, 10),
    entrances: sanitizeString(data.entrances, 20),
    warehouses: sanitizeString(data.warehouses, 10),
    curtains: sanitizeString(data.curtains, 10),
    hasExtraKitchen: data.hasExtraKitchen === true,
    extraKitchenAppliances: sanitizeString(data.extraKitchenAppliances, 200),
    hasLaundryRoom: data.hasLaundryRoom === true,
    price: sanitizeString(data.price, 20),
    paymentOption: sanitizeString(data.paymentOption, 30),
    paymentPrices: {
      monthly: sanitizeString(rawPaymentPrices.monthly, 20),
      quarterly: sanitizeString(rawPaymentPrices.quarterly, 20),
      semiAnnual: sanitizeString(rawPaymentPrices.semiAnnual, 20),
      yearly: sanitizeString(rawPaymentPrices.yearly, 20),
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ error: "غير مصرح - يرجى تسجيل الدخول" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "جلسة غير صالحة - يرجى إعادة تسجيل الدخول" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

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

    if (typeof rawBody !== 'object' || rawBody === null || !('propertyData' in rawBody)) {
      return new Response(JSON.stringify({ error: "Missing propertyData field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyData = validateAndSanitizePropertyData((rawBody as Record<string, unknown>).propertyData);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // بناء البرومبت بناءً على نمط الوصف واللغة
    let stylePrompt = "";
    switch (propertyData.descriptionStyle) {
      case "احترافي":
        stylePrompt = "اكتب وصفاً احترافياً ورسمياً يبرز جودة العقار ومواصفاته بشكل دقيق";
        break;
      case "تسويقي":
        stylePrompt = "اكتب وصفاً تسويقياً جذاباً يثير اهتمام المشترين أو المستأجرين ويبرز المميزات بشكل مغري";
        break;
      case "فاخر":
        stylePrompt = "اكتب وصفاً فاخراً وراقياً يعكس الأناقة والفخامة للعقار الراقي";
        break;
      default:
        stylePrompt = "اكتب وصفاً احترافياً";
    }

    let lengthPrompt = "";
    switch (propertyData.descriptionLength) {
      case "قصير":
        lengthPrompt = "اجعل الوصف مختصراً جداً في 3-4 أسطر فقط";
        break;
      case "متوسط":
        lengthPrompt = "اجعل الوصف متوسط الطول في 6-8 أسطر";
        break;
      case "طويل":
        lengthPrompt = "اكتب وصفاً مفصلاً وشاملاً في 10-15 سطر";
        break;
      default:
        lengthPrompt = "اجعل الوصف متوسط الطول";
    }

    let languagePrompt = "";
    switch (propertyData.descriptionLanguage) {
      case "عربي":
        languagePrompt = "اكتب الوصف باللغة العربية فقط";
        break;
      case "انجليزي":
        languagePrompt = "Write the description in English only";
        break;
      case "عربي انجليزي":
        languagePrompt = "اكتب الوصف بالعربية ثم أضف ترجمة إنجليزية أسفله";
        break;
      default:
        languagePrompt = "اكتب الوصف باللغة العربية";
    }

    // بناء خيارات الدفع للإيجار
    let paymentInfo = '';
    if (propertyData.purpose === 'للإيجار' && propertyData.paymentPrices) {
      const payments: string[] = [];
      if (propertyData.paymentPrices.monthly) payments.push(`شهري: ${propertyData.paymentPrices.monthly} ريال`);
      if (propertyData.paymentPrices.quarterly) payments.push(`ربع سنوي: ${propertyData.paymentPrices.quarterly} ريال`);
      if (propertyData.paymentPrices.semiAnnual) payments.push(`نصف سنوي: ${propertyData.paymentPrices.semiAnnual} ريال`);
      if (propertyData.paymentPrices.yearly) payments.push(`سنوي: ${propertyData.paymentPrices.yearly} ريال`);
      if (payments.length > 0) {
        paymentInfo = `- خيارات الدفع: ${payments.join(' | ')}`;
      }
    }

    // بناء معلومات العقار - فقط الحقول المملوءة
    const propertyInfoParts: string[] = [
      `- نوع العقار: ${propertyData.propertyType || 'غير محدد'}`,
      `- الغرض: ${propertyData.purpose || 'غير محدد'}`,
      `- المدينة: ${propertyData.city || 'غير محدد'}`,
      `- الحي: ${propertyData.district || 'غير محدد'}`,
    ];

    // إضافة الحقول فقط إذا كانت موجودة
    if (propertyData.category) propertyInfoParts.push(`- الفئة: ${propertyData.category}`);
    if (propertyData.area) propertyInfoParts.push(`- المساحة: ${propertyData.area} متر مربع`);
    if (propertyData.price) propertyInfoParts.push(`- السعر: ${propertyData.price} ريال`);
    if (paymentInfo) propertyInfoParts.push(paymentInfo);
    if (propertyData.bedrooms) propertyInfoParts.push(`- غرف النوم: ${propertyData.bedrooms}`);
    if (propertyData.bathrooms) propertyInfoParts.push(`- دورات المياه: ${propertyData.bathrooms}`);
    if (propertyData.livingRooms) propertyInfoParts.push(`- الصالات: ${propertyData.livingRooms}`);
    if (propertyData.councils) propertyInfoParts.push(`- المجالس: ${propertyData.councils}`);
    if (propertyData.floors) propertyInfoParts.push(`- الأدوار: ${propertyData.floors}`);
    if (propertyData.floorNumber) propertyInfoParts.push(`- رقم الدور: ${propertyData.floorNumber}`);
    if (propertyData.cornerType) propertyInfoParts.push(`- الموقع: ${propertyData.cornerType}`);
    if (propertyData.furnishing) propertyInfoParts.push(`- التأثيث: ${propertyData.furnishing}`);
    if (propertyData.propertyAge) propertyInfoParts.push(`- عمر العقار: ${propertyData.propertyAge} سنوات`);
    if (propertyData.streetWidth) propertyInfoParts.push(`- عرض الشارع: ${propertyData.streetWidth} متر`);
    if (propertyData.facade) propertyInfoParts.push(`- الواجهة: ${propertyData.facade}`);
    if (propertyData.acUnits) propertyInfoParts.push(`- عدد المكيفات: ${propertyData.acUnits}`);
    if (propertyData.balconies) propertyInfoParts.push(`- عدد البلكونات: ${propertyData.balconies}`);
    if (propertyData.entrances) propertyInfoParts.push(`- المداخل: ${propertyData.entrances}`);
    if (propertyData.warehouses) propertyInfoParts.push(`- المستودعات: ${propertyData.warehouses}`);
    if (propertyData.curtains) propertyInfoParts.push(`- الستائر: ${propertyData.curtains}`);
    if (propertyData.hasLaundryRoom) propertyInfoParts.push(`- غرفة غسيل: نعم`);
    if (propertyData.hasExtraKitchen) {
      let extraKitchenText = `- مطبخ إضافي: نعم`;
      if (propertyData.extraKitchenAppliances) {
        extraKitchenText += ` (${propertyData.extraKitchenAppliances})`;
      }
      propertyInfoParts.push(extraKitchenText);
    }
    if (propertyData.features && propertyData.features.length > 0) {
      propertyInfoParts.push(`- المميزات: ${propertyData.features.join('، ')}`);
    }
    if (propertyData.warranties && propertyData.warranties.length > 0) {
      propertyInfoParts.push(`- الضمانات: ${propertyData.warranties.map(w => `${w.type} (${w.duration})`).join('، ')}`);
    }

    const propertyInfo = `معلومات العقار:\n${propertyInfoParts.join('\n')}`;

    // تحديد ما إذا كان هناك ضمانات
    const hasWarranties = propertyData.warranties && propertyData.warranties.length > 0;
    const hasFeatures = propertyData.features && propertyData.features.length > 0;

    const systemPrompt = `أنت خبير في كتابة الإعلانات العقارية في السعودية. 
${stylePrompt}
${lengthPrompt}
${languagePrompt}

يجب أن يكون الوصف بالتنسيق التالي:

1. **العنوان الرئيسي**: سطر واحد يبدأ بـ "${propertyData.purpose} ${propertyData.propertyType}" ثم الموقع

2. **النص التسويقي**: فقرة قصيرة (سطر ونصف إلى سطرين) تركز على القيمة المضافة والمميزات الرئيسية بأسلوب جذاب

3. **المواصفات**: قائمة منسقة فقط بالمواصفات المتوفرة (لا تذكر مواصفات غير موجودة في البيانات)

${hasFeatures ? '4. **المميزات**: قائمة نقطية بالمميزات الإضافية' : ''}

${hasWarranties ? '5. **الضمانات**: قائمة بالضمانات المذكورة' : ''}

${propertyData.adLicense || propertyData.brokerPhone ? `6. **معلومات التواصل**: ${propertyData.adLicense ? `ترخيص إعلاني: ${propertyData.adLicense}` : ''} ${propertyData.brokerPhone ? `| للتواصل: ${propertyData.brokerPhone}` : ''}` : ''}

${propertyData.purpose === 'للإيجار' && paymentInfo ? `7. **خيارات الدفع**: اذكر خيارات الدفع المتاحة` : ''}

⚠️ تعليمات صارمة:
- اذكر فقط المعلومات الموجودة في البيانات المقدمة
- لا تكتب "لا توجد ضمانات" أو "لا توجد مميزات" - اتركها فارغة إذا لم تكن موجودة
- لا تضف أقسام فارغة أو عناوين لمعلومات غير موجودة
- كل قسم يجب أن يكون في أسطر منفصلة
- استخدم النقاط (•) للقوائم
- اجعل التنسيق واضح ومقروء`;

    console.log('Processing property description request for user:', user.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `اكتب وصفاً لهذا العقار بالتنسيق المطلوب:\n\n${propertyInfo}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام خدمة الذكاء الاصطناعي" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("فشل في توليد الوصف");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating description:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
