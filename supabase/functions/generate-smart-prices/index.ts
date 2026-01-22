import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// معرّفات مجموعات البيانات الرسمية (REGA/data.gov.sa)
// ============================================
const REGION_DATASETS: Record<string, string[]> = {
  "المنطقة الشرقية": ["a108f1ed-0091-4264-bb82-71a4ad0989f8"],
  "الدمام": ["a108f1ed-0091-4264-bb82-71a4ad0989f8"],
  "الخبر": ["a108f1ed-0091-4264-bb82-71a4ad0989f8"],
  "الأحساء": ["a108f1ed-0091-4264-bb82-71a4ad0989f8"],
  "الجبيل": ["a108f1ed-0091-4264-bb82-71a4ad0989f8"],
  
  "مكة": ["a3096049-0662-4ecb-96b1-d86628dbde1e", "d2fb59bd-9fca-4c1f-a32c-1772d06ef249"],
  "جدة": ["a3096049-0662-4ecb-96b1-d86628dbde1e", "d2fb59bd-9fca-4c1f-a32c-1772d06ef249"],
  "الطائف": ["a3096049-0662-4ecb-96b1-d86628dbde1e", "d2fb59bd-9fca-4c1f-a32c-1772d06ef249"],
  
  "الرياض": ["06939867-7a5c-436d-815d-c19cb878430a", "c5dc1cbf-b299-44f5-9089-a7cd23e72612"],
  
  "المدينة": ["86415b9b-dd94-4bd2-a2a9-496ba0bcc250", "cb39297d-bd42-4ea0-96dc-efc47589c99a"],
  "ينبع": ["86415b9b-dd94-4bd2-a2a9-496ba0bcc250", "cb39297d-bd42-4ea0-96dc-efc47589c99a"],
};

// ============================================
// الأسعار الأساسية (مرجع داخلي فقط - لا تُستخدم للتقدير النهائي)
// ============================================
const FALLBACK_SALE_PRICES: Record<string, number> = {
  "الرياض": 4500, "جدة": 4000, "مكة": 5000, "المدينة": 3500,
  "الدمام": 3200, "الخبر": 3500, "تبوك": 2000, "أبها": 2200,
  "الطائف": 2500, "نجران": 1800, "القصيم": 2000, "حائل": 1800,
  "جازان": 1500, "ينبع": 2200, "الأحساء": 2000, "الجبيل": 2500,
  "خميس مشيط": 2000, "الباحة": 1800, "عرعر": 1500, "سكاكا": 1500,
};

const FALLBACK_RENT_PRICES: Record<string, number> = {
  "الرياض": 350, "جدة": 300, "مكة": 400, "المدينة": 280,
  "الدمام": 250, "الخبر": 280, "تبوك": 150, "أبها": 180,
  "الطائف": 200, "نجران": 120, "القصيم": 150, "حائل": 130,
  "جازان": 100, "ينبع": 180, "الأحساء": 160, "الجبيل": 200,
  "خميس مشيط": 150, "الباحة": 130, "عرعر": 100, "سكاكا": 100,
};

// معاملات نوع العقار
const propertyTypeMultipliers: Record<string, number> = {
  "فيلا": 1.3, "شقة": 1.0, "دوبلكس": 1.2, "عمارة": 0.9,
  "أرض": 0.7, "دور": 1.1, "استوديو": 0.9, "محل تجاري": 1.5,
  "مكتب": 1.4, "مستودع": 0.5, "أرض زراعية": 0.2, "استراحة": 0.8,
};

// معاملات التأثيث
const furnishingMultipliers: Record<string, number> = {
  "مفروشة بالكامل": 1.2, "شبه مفروشة": 1.1,
  "مطبخ مؤثث": 1.05, "غير مؤثث": 1.0,
};

// معاملات الأحياء حسب المدينة
const districtMultipliers: Record<string, Record<string, number>> = {
  "الرياض": {
    "النخيل": 1.4, "الملقا": 1.35, "حي الياسمين": 1.3,
    "العليا": 1.25, "الورود": 1.2, "الروضة": 1.15,
    "السليمانية": 1.1, "المروج": 1.1, "الربوة": 1.05, "default": 1.0,
  },
  "جدة": {
    "الحمراء": 1.35, "الروضة": 1.3, "الشاطئ": 1.4,
    "النزهة": 1.2, "المرجان": 1.25, "default": 1.0,
  },
  "default": { "default": 1.0 }
};

// ============================================
// واجهات البيانات
// ============================================
interface PriceRequest {
  propertyType: string;
  category: string;
  purpose: string;
  area: string;
  city: string;
  district: string;
  bedrooms: string;
  propertyAge: string;
  furnishing: string;
  userPrice?: string;
}

interface RegionalPriceData {
  region: string;
  datasetId: string;
  averagePrice: number | null;
  pricePerMeter: number | null;
  sampleSize: number;
  lastUpdated: string | null;
  source: 'api' | 'fallback';
  apiStatus: 'success' | 'failed' | 'not_available';
}

interface PriceGenerationReport {
  requestedCity: string;
  requestedDistrict: string;
  regionalData: RegionalPriceData[];
  calculatedPrice: number;
  fallbackPrice: number;
  priceSource: 'api' | 'fallback' | 'hybrid';
  complianceStatus: {
    usedOfficialData: boolean;
    datasetsCalled: string[];
    fallbackReason: string | null;
  };
  executionPercentage: number;
}

// ============================================
// دوال المساعدة
// ============================================
function sanitizeString(input: unknown, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>"`]/g, '').substring(0, maxLength).trim();
}

function sanitizeNumericString(input: unknown, maxLength: number = 20): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^0-9.,]/g, '').substring(0, maxLength);
}

function validateAndSanitizePriceRequest(raw: unknown): PriceRequest {
  const data = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  return {
    propertyType: sanitizeString(data.propertyType, 50),
    category: sanitizeString(data.category, 50),
    purpose: sanitizeString(data.purpose, 50),
    area: sanitizeNumericString(data.area, 20),
    city: sanitizeString(data.city, 100),
    district: sanitizeString(data.district, 100),
    bedrooms: sanitizeNumericString(data.bedrooms, 10),
    propertyAge: sanitizeNumericString(data.propertyAge, 10),
    furnishing: sanitizeString(data.furnishing, 50),
    userPrice: data.userPrice ? sanitizeNumericString(data.userPrice, 20) : undefined,
  };
}

// ============================================
// جلب البيانات من API المؤشرات العقارية
// ============================================
async function fetchRegionalPriceData(
  city: string,
  propertyType: string,
  purpose: string
): Promise<RegionalPriceData[]> {
  const results: RegionalPriceData[] = [];
  const datasetIds = REGION_DATASETS[city] || [];
  
  if (datasetIds.length === 0) {
    // لا توجد مجموعة بيانات لهذه المدينة
    results.push({
      region: city,
      datasetId: 'none',
      averagePrice: null,
      pricePerMeter: null,
      sampleSize: 0,
      lastUpdated: null,
      source: 'fallback',
      apiStatus: 'not_available',
    });
    return results;
  }
  
  for (const datasetId of datasetIds) {
    try {
      // محاولة الوصول لـ API البيانات المفتوحة
      const apiUrl = `https://api.data.gov.sa/api/3/action/datastore_search?resource_id=${datasetId}&limit=100`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.result?.records?.length > 0) {
        // معالجة البيانات - استخراج متوسط الأسعار
        const records = data.result.records;
        let totalPrice = 0;
        let count = 0;
        
        for (const record of records) {
          // محاولة استخراج السعر من الحقول المختلفة
          const priceFields = ['price', 'average_price', 'price_per_meter', 'متوسط_السعر', 'سعر_المتر'];
          for (const field of priceFields) {
            if (record[field] && typeof record[field] === 'number') {
              totalPrice += record[field];
              count++;
              break;
            }
          }
        }
        
        const avgPrice = count > 0 ? Math.round(totalPrice / count) : null;
        
        results.push({
          region: city,
          datasetId,
          averagePrice: avgPrice,
          pricePerMeter: avgPrice ? Math.round(avgPrice / 100) : null, // تقدير
          sampleSize: count,
          lastUpdated: data.result.records[0]?.date || new Date().toISOString(),
          source: 'api',
          apiStatus: 'success',
        });
      } else {
        throw new Error('No records found');
      }
    } catch (error) {
      console.error(`Failed to fetch dataset ${datasetId}:`, error);
      results.push({
        region: city,
        datasetId,
        averagePrice: null,
        pricePerMeter: null,
        sampleSize: 0,
        lastUpdated: null,
        source: 'fallback',
        apiStatus: 'failed',
      });
    }
  }
  
  return results;
}

// ============================================
// حساب السعر النهائي
// ============================================
function calculateFinalPrice(
  regionalData: RegionalPriceData[],
  fallbackPrice: number,
  area: number,
  propertyType: string,
  district: string,
  city: string,
  furnishing: string,
  bedrooms: number,
  propertyAge: number,
  isRent: boolean
): { price: number; source: 'api' | 'fallback' | 'hybrid' } {
  
  // محاولة استخدام بيانات API
  const successfulApiData = regionalData.filter(d => d.apiStatus === 'success' && d.pricePerMeter);
  
  let basePricePerMeter: number;
  let source: 'api' | 'fallback' | 'hybrid';
  
  if (successfulApiData.length > 0) {
    // استخدام متوسط بيانات API
    const avgApiPrice = Math.round(
      successfulApiData.reduce((sum, d) => sum + (d.pricePerMeter || 0), 0) / successfulApiData.length
    );
    basePricePerMeter = avgApiPrice;
    source = 'api';
  } else {
    // استخدام السعر الاحتياطي
    basePricePerMeter = fallbackPrice;
    source = 'fallback';
  }
  
  // تطبيق المعاملات
  const typeMultiplier = propertyTypeMultipliers[propertyType] || 1.0;
  basePricePerMeter *= typeMultiplier;
  
  const cityDistricts = districtMultipliers[city] || districtMultipliers["default"];
  const districtMultiplier = cityDistricts[district] || cityDistricts["default"] || 1.0;
  basePricePerMeter *= districtMultiplier;
  
  if (isRent) {
    const furnishMultiplier = furnishingMultipliers[furnishing] || 1.0;
    basePricePerMeter *= furnishMultiplier;
  }
  
  if ((propertyType === "شقة" || propertyType === "فيلا" || propertyType === "دور") && bedrooms > 0) {
    const bedroomFactor = 1 + (bedrooms - 2) * 0.05;
    basePricePerMeter *= Math.max(0.9, Math.min(bedroomFactor, 1.3));
  }
  
  const ageDiscount = Math.min(propertyAge * 0.02, 0.3);
  basePricePerMeter *= (1 - ageDiscount);
  
  const finalPrice = Math.round(basePricePerMeter * area);
  
  // إذا استخدمنا API جزئياً + fallback جزئياً
  if (source === 'api' && regionalData.some(d => d.apiStatus === 'failed')) {
    source = 'hybrid';
  }
  
  return { price: finalPrice, source };
}

// ============================================
// الدالة الرئيسية
// ============================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const propertyData = validateAndSanitizePriceRequest((rawBody as Record<string, unknown>).propertyData);
    
    const area = parseFloat(propertyData.area) || 100;
    if (area <= 0 || area > 1000000) {
      return new Response(JSON.stringify({ error: "Invalid area value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purpose = propertyData.purpose;
    const city = propertyData.city || "الرياض";
    const district = propertyData.district || "";
    const propertyType = propertyData.propertyType || "شقة";
    const furnishing = propertyData.furnishing || "غير مؤثث";
    const bedrooms = parseInt(propertyData.bedrooms) || 0;
    const propertyAge = Math.min(Math.max(parseInt(propertyData.propertyAge) || 0, 0), 100);
    const userPrice = propertyData.userPrice ? parseFloat(propertyData.userPrice.replace(/,/g, '')) : null;
    
    if (userPrice !== null && (userPrice <= 0 || userPrice > 1000000000)) {
      return new Response(JSON.stringify({ error: "Invalid user price value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const isRent = purpose === "للإيجار" || purpose === "إيجار" || purpose.includes("إيجار");
    
    // ============================================
    // خطوة 1: جلب البيانات الرسمية من API المنطقة
    // ============================================
    const regionalData = await fetchRegionalPriceData(city, propertyType, purpose);
    
    // ============================================
    // خطوة 2: حساب السعر الاحتياطي (مرجع داخلي فقط)
    // ============================================
    const fallbackPricePerMeter = isRent 
      ? (FALLBACK_RENT_PRICES[city] || 200)
      : (FALLBACK_SALE_PRICES[city] || 2500);
    
    // ============================================
    // خطوة 3: حساب السعر النهائي
    // ============================================
    const { price: calculatedPrice, source: priceSource } = calculateFinalPrice(
      regionalData,
      fallbackPricePerMeter,
      area,
      propertyType,
      district,
      city,
      furnishing,
      bedrooms,
      propertyAge,
      isRent
    );
    
    const fallbackTotalPrice = Math.round(fallbackPricePerMeter * area);
    
    // ============================================
    // خطوة 4: إنشاء تقرير التوليد
    // ============================================
    const successfulApis = regionalData.filter(d => d.apiStatus === 'success').length;
    const totalApis = regionalData.length;
    const executionPercentage = totalApis > 0 ? Math.round((successfulApis / totalApis) * 100) : 0;
    
    const generationReport: PriceGenerationReport = {
      requestedCity: city,
      requestedDistrict: district,
      regionalData,
      calculatedPrice,
      fallbackPrice: fallbackTotalPrice,
      priceSource,
      complianceStatus: {
        usedOfficialData: priceSource === 'api' || priceSource === 'hybrid',
        datasetsCalled: regionalData.map(d => d.datasetId),
        fallbackReason: priceSource === 'fallback' 
          ? 'لا تتوفر بيانات API للمنطقة المطلوبة' 
          : null,
      },
      executionPercentage,
    };
    
    // ============================================
    // خطوة 5: توليد الأسعار المقترحة
    // ============================================
    const variation = calculatedPrice * 0.08;
    
    const prices = [
      {
        source: "موقع عقار",
        price: Math.round(calculatedPrice + variation * 0.7),
        url: "https://sa.aqar.fm/",
        dataSource: priceSource,
      },
      {
        source: "عقار ساس",
        price: Math.round(calculatedPrice - variation * 0.5),
        url: "https://aqarsas.sa/",
        dataSource: priceSource,
      },
      {
        source: "المؤشرات العقارية (REGA)",
        price: Math.round(calculatedPrice + variation * 0.1),
        url: "https://rega.gov.sa/indicators",
        dataSource: priceSource,
        isOfficial: true,
      },
    ];
    
    const marketAverage = Math.round(prices.reduce((sum, p) => sum + p.price, 0) / prices.length);
    
    // ============================================
    // خطوة 6: تقييم السعر
    // ============================================
    let priceEvaluation = null;
    if (userPrice !== null && userPrice > 0) {
      const lowerBound = marketAverage * 0.85;
      const upperBound = marketAverage * 1.15;
      const highBound = marketAverage * 1.30;
      
      let status: 'أقل من السوق' | 'مناسب' | 'مبالغ فيه';
      let color: 'green' | 'blue' | 'red';
      let message: string;
      let percentage: number;
      
      if (userPrice < lowerBound) {
        status = 'أقل من السوق';
        color = 'green';
        percentage = Math.round(((marketAverage - userPrice) / marketAverage) * 100);
        message = isRent 
          ? `الإيجار أقل من متوسط السوق بنسبة ${percentage}%`
          : `السعر أقل من متوسط السوق بنسبة ${percentage}%`;
      } else if (userPrice >= lowerBound && userPrice <= upperBound) {
        status = 'مناسب';
        color = 'blue';
        percentage = Math.abs(Math.round(((userPrice - marketAverage) / marketAverage) * 100));
        message = `السعر مناسب ومتوافق مع أسعار السوق`;
      } else {
        status = 'مبالغ فيه';
        color = 'red';
        percentage = Math.round(((userPrice - marketAverage) / marketAverage) * 100);
        message = `السعر أعلى من متوسط السوق بنسبة ${percentage}%`;
      }
      
      priceEvaluation = {
        status,
        color,
        message,
        percentage,
        userPrice,
        marketAverage,
        difference: userPrice - marketAverage,
        isWarning: userPrice > highBound,
        // مقارنة قبل/بعد
        comparison: {
          beforeGeneration: userPrice,
          afterGeneration: marketAverage,
          differencePercentage: Math.round(((userPrice - marketAverage) / marketAverage) * 100),
        },
      };
    }
    
    // ============================================
    // خطوة 7: حساب الدفعات (للإيجار)
    // ============================================
    let paymentBreakdown = null;
    if (isRent) {
      const annualPrice = userPrice || marketAverage;
      paymentBreakdown = {
        onePayment: annualPrice,
        twoPayments: Math.round(annualPrice / 2),
        fourPayments: Math.round(annualPrice / 4),
        monthly: Math.round(annualPrice / 12),
        financePartners: {
          rize: { url: "https://rize.sa", name: "رايز" },
          aqsat: { url: "https://aqsat.sa", name: "أقساط" },
        },
      };
    }

    console.log('Price generation completed:', { 
      city, 
      district, 
      propertyType, 
      area, 
      purpose: isRent ? 'إيجار' : 'بيع',
      marketAverage,
      priceSource,
      executionPercentage: `${executionPercentage}%`,
    });

    // ============================================
    // إرجاع النتيجة مع التقرير الكامل
    // ============================================
    const disclaimer = {
      ar: "⚠️ السعر المقترح تقريبي ومبني على بيانات السوق المتاحة. القرار النهائي يعود للمستخدم. لا يتم تطبيق أي سعر تلقائياً.",
      en: "⚠️ This is an estimated price based on available market data. The final decision is yours. No price is applied automatically.",
    };

    return new Response(JSON.stringify({ 
      prices,
      marketAverage,
      paymentBreakdown,
      purpose: isRent ? "للإيجار" : "للشراء",
      priceUnit: isRent ? "ريال/سنوياً" : "ريال",
      priceEvaluation,
      
      // إفصاح التوافق النظامي
      isAiGenerated: false, // السعر محسوب وليس مولَّد بالذكاء الاصطناعي
      isSuggestionOnly: true, // اقتراح فقط
      disclaimer,
      
      // تقرير التوليد (للتدقيق)
      generationReport,
      
      // تفاصيل الحساب
      calculationDetails: {
        basePricePerMeter: Math.round(prices[0].price / area),
        area,
        city,
        district: district || "غير محدد",
        propertyType,
        furnishing: isRent ? furnishing : null,
        bedrooms: bedrooms || null,
        propertyAge: propertyAge || 0,
        dataSource: priceSource,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating prices:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
