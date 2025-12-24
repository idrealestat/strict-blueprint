import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  furnishing: string;
  propertyAge: string;
  features: string[];
  warranties: { type: string; duration: string }[];
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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyData }: { propertyData: PropertyData } = await req.json();
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

    // بناء معلومات العقار
    const propertyInfo = `
معلومات العقار:
- نوع العقار: ${propertyData.propertyType || 'غير محدد'}
- الفئة: ${propertyData.category || 'غير محدد'}
- الغرض: ${propertyData.purpose || 'غير محدد'}
- المساحة: ${propertyData.area ? `${propertyData.area} متر مربع` : 'غير محدد'}
- المدينة: ${propertyData.city || 'غير محدد'}
- الحي: ${propertyData.district || 'غير محدد'}
${propertyData.bedrooms ? `- غرف النوم: ${propertyData.bedrooms}` : ''}
${propertyData.bathrooms ? `- دورات المياه: ${propertyData.bathrooms}` : ''}
${propertyData.livingRooms ? `- الصالات: ${propertyData.livingRooms}` : ''}
${propertyData.councils ? `- المجالس: ${propertyData.councils}` : ''}
${propertyData.floors ? `- الأدوار: ${propertyData.floors}` : ''}
${propertyData.furnishing ? `- التأثيث: ${propertyData.furnishing}` : ''}
${propertyData.propertyAge ? `- عمر العقار: ${propertyData.propertyAge} سنوات` : ''}
${propertyData.streetWidth ? `- عرض الشارع: ${propertyData.streetWidth} متر` : ''}
${propertyData.facade ? `- الواجهة: ${propertyData.facade}` : ''}
${propertyData.acUnits ? `- عدد المكيفات: ${propertyData.acUnits}` : ''}
${propertyData.balconies ? `- عدد البلكونات: ${propertyData.balconies}` : ''}
${propertyData.entrances ? `- المداخل: ${propertyData.entrances}` : ''}
${propertyData.features && propertyData.features.length > 0 ? `- المميزات: ${propertyData.features.join('، ')}` : ''}
${propertyData.warranties && propertyData.warranties.length > 0 ? `- الضمانات: ${propertyData.warranties.map(w => `${w.type} (${w.duration})`).join('، ')}` : ''}
    `.trim();

    const systemPrompt = `أنت خبير في كتابة الإعلانات العقارية في السعودية. 
${stylePrompt}
${lengthPrompt}
${languagePrompt}

القواعد:
1. ابدأ العنوان بـ: ${propertyData.purpose} ${propertyData.propertyType} ${propertyData.area ? `${propertyData.area} م²` : ''} في ${propertyData.district ? `حي ${propertyData.district}،` : ''} ${propertyData.city}
2. اذكر جميع المواصفات المتوفرة بشكل جذاب
3. أبرز المميزات والضمانات إن وجدت
4. ${propertyData.adLicense ? `أضف في النهاية: ترخيص إعلاني: ${propertyData.adLicense}` : 'لا تذكر رقم الترخيص الإعلاني'}
5. ${propertyData.brokerPhone ? `أضف في النهاية: للتواصل والاستفسار: ${propertyData.brokerPhone}` : 'لا تذكر رقم التواصل'}
6. لا تضف معلومات غير موجودة في البيانات`;

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
          { role: "user", content: `اكتب وصفاً لهذا العقار:\n\n${propertyInfo}` }
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
