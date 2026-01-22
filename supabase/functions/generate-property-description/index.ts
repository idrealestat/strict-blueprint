import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { entitlementsGuard, corsHeaders } from '../_shared/entitlementsGuard.ts';

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
  floorNumber: string; // رقم الدور (للشقق)
  cornerType: string; // زاوية / بطن
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
  warehouses: string; // مستودعات
  curtains: string; // ستائر
  hasExtraKitchen: boolean; // مطبخ إضافي
  extraKitchenAppliances: string; // أجهزة المطبخ
  hasLaundryRoom: boolean; // غرفة غسيل
  price: string; // السعر
}

function validateAndSanitizePropertyData(raw: unknown): PropertyData {
  const data = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  
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
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ ENTITLEMENTS GUARD ============
    const guardResult = await entitlementsGuard(req, 'ai_assistant_basic');
    if ('error' in guardResult) {
      return guardResult.error;
    }
    const userId = guardResult.userId;
    // ============ END ENTITLEMENTS GUARD ============

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

    // بناء معلومات العقار - جميع الحقول
    const propertyInfo = `
معلومات العقار:
- نوع العقار: ${propertyData.propertyType || 'غير محدد'}
- الفئة: ${propertyData.category || 'غير محدد'}
- الغرض: ${propertyData.purpose || 'غير محدد'}
- المساحة: ${propertyData.area ? `${propertyData.area} متر مربع` : 'غير محدد'}
- المدينة: ${propertyData.city || 'غير محدد'}
- الحي: ${propertyData.district || 'غير محدد'}
${propertyData.price ? `- السعر: ${propertyData.price} ريال` : ''}
${propertyData.bedrooms ? `- غرف النوم: ${propertyData.bedrooms}` : ''}
${propertyData.bathrooms ? `- دورات المياه: ${propertyData.bathrooms}` : ''}
${propertyData.livingRooms ? `- الصالات: ${propertyData.livingRooms}` : ''}
${propertyData.councils ? `- المجالس: ${propertyData.councils}` : ''}
${propertyData.floors ? `- الأدوار: ${propertyData.floors}` : ''}
${propertyData.floorNumber ? `- رقم الدور: ${propertyData.floorNumber}` : ''}
${propertyData.cornerType ? `- الموقع: ${propertyData.cornerType}` : ''}
${propertyData.furnishing ? `- التأثيث: ${propertyData.furnishing}` : ''}
${propertyData.propertyAge ? `- عمر العقار: ${propertyData.propertyAge} سنوات` : ''}
${propertyData.streetWidth ? `- عرض الشارع: ${propertyData.streetWidth} متر` : ''}
${propertyData.facade ? `- الواجهة: ${propertyData.facade}` : ''}
${propertyData.acUnits ? `- عدد المكيفات: ${propertyData.acUnits}` : ''}
${propertyData.balconies ? `- عدد البلكونات: ${propertyData.balconies}` : ''}
${propertyData.entrances ? `- المداخل: ${propertyData.entrances}` : ''}
${propertyData.warehouses ? `- المستودعات: ${propertyData.warehouses}` : ''}
${propertyData.curtains ? `- الستائر: ${propertyData.curtains}` : ''}
${propertyData.hasLaundryRoom ? `- غرفة غسيل: نعم` : ''}
${propertyData.hasExtraKitchen ? `- مطبخ إضافي: نعم${propertyData.extraKitchenAppliances ? ` (${propertyData.extraKitchenAppliances})` : ''}` : ''}
${propertyData.features && propertyData.features.length > 0 ? `- المميزات: ${propertyData.features.join('، ')}` : ''}
${propertyData.warranties && propertyData.warranties.length > 0 ? `- الضمانات: ${propertyData.warranties.map(w => `${w.type} (${w.duration})`).join('، ')}` : ''}
    `.trim();

    // تحديد إذا كانت هناك ضمانات
    const hasWarranties = propertyData.warranties && propertyData.warranties.length > 0;
    
    const systemPrompt = `أنت خبير في كتابة الإعلانات العقارية في السعودية. 
${stylePrompt}
${lengthPrompt}
${languagePrompt}

يجب أن يكون الوصف بالتنسيق التالي بالضبط (بدون كتابة عناوين الأقسام):

1. ابدأ مباشرة بسطر العنوان: "${propertyData.purpose} ${propertyData.propertyType}" ثم الموقع (بدون كتابة "العنوان الرئيسي:")

2. ثم اكتب فقرة تسويقية قصيرة مباشرة (سطر ونصف إلى سطرين) تركز على القيمة المضافة (بدون كتابة "النص التسويقي:" أو "الوصف التسويقي:")

3. ثم اكتب **المواصفات**: قائمة منسقة بالشكل التالي (كل مواصفة في سطر منفصل):
• المساحة: [القيمة] م²
• غرف النوم: [العدد]
• دورات المياه: [العدد]
• الصالات: [العدد]
• المجالس: [العدد]
• الأدوار: [العدد]
• التأثيث: [الحالة]
• عمر العقار: [السنوات]
• الواجهة: [الاتجاه]
• عرض الشارع: [العرض] م

4. ثم اكتب **الخدمات**: قائمة نقطية بالمميزات والخدمات الإضافية

${hasWarranties ? `5. ثم اكتب **الضمانات**: قائمة بالضمانات المتوفرة` : ''}

${propertyData.adLicense || propertyData.brokerPhone ? `6. **معلومات التواصل**: ${propertyData.adLicense ? `ترخيص إعلاني: ${propertyData.adLicense}` : ''} ${propertyData.brokerPhone ? `| للتواصل: ${propertyData.brokerPhone}` : ''}` : ''}

مهم جداً:
- لا تكتب "العنوان الرئيسي:" أو "الوصف التسويقي:" أو "النص التسويقي:" - فقط اكتب المحتوى مباشرة
- كل قسم يجب أن يكون في أسطر منفصلة
- استخدم النقاط (•) للقوائم
- لا تضع كل المعلومات في سطر واحد
- اجعل التنسيق واضح ومقروء
- لا تضف معلومات غير موجودة في البيانات
${!hasWarranties ? '- لا تضف قسم الضمانات لأنه لا توجد ضمانات مسجلة' : ''}

⚠️ تعليمات التوافق النظامي (إلزامية):
- لا تستخدم أبداً: "أفضل"، "أرخص"، "فرصة لن تتكرر"، "مضمون"، "استثمار مؤكد"
- لا تذكر عوائد استثمارية غير موثقة
- لا تبالغ في وصف الخصائص (لا "أسطوري"، "خيالي"، "لا يصدق")
- كل ما تكتبه يجب أن يكون قابلاً للتحقق من البيانات المدخلة
- هذا الوصف اقتراحي وسيخضع لمراجعة المستخدم قبل النشر`;

    console.log('Processing property description request for user:', userId);

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

    // إضافة إفصاح التوافق النظامي
    return new Response(JSON.stringify({ 
      description,
      isAiGenerated: true,
      disclaimer: {
        ar: "⚠️ هذا الوصف مُولَّد بالذكاء الاصطناعي. يُرجى مراجعته والتأكد من دقته قبل النشر.",
        en: "⚠️ This description was AI-generated. Please review it for accuracy before publishing.",
      },
      modelUsed: "google/gemini-2.5-flash",
    }), {
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
