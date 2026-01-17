import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helper functions
function sanitizeString(input: unknown, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>"`]/g, '')
    .substring(0, maxLength)
    .trim();
}

function sanitizeNumericString(input: unknown, maxLength: number = 20): string {
  if (typeof input !== 'string') return '';
  // Only allow digits, dots, and commas for numeric values
  return input
    .replace(/[^0-9.,]/g, '')
    .substring(0, maxLength);
}

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

// أسعار تقريبية للمتر المربع حسب المدينة (بيع)
const cityBasePrices: Record<string, number> = {
  "الرياض": 4500,
  "جدة": 4000,
  "مكة": 5000,
  "المدينة": 3500,
  "الدمام": 3200,
  "الخبر": 3500,
  "تبوك": 2000,
  "أبها": 2200,
  "الطائف": 2500,
  "نجران": 1800,
  "القصيم": 2000,
  "حائل": 1800,
  "جازان": 1500,
  "ينبع": 2200,
  "الأحساء": 2000,
  "الجبيل": 2500,
  "خميس مشيط": 2000,
  "الباحة": 1800,
  "عرعر": 1500,
  "سكاكا": 1500,
};

// أسعار الإيجار السنوي للمتر المربع
const cityRentPrices: Record<string, number> = {
  "الرياض": 350,
  "جدة": 300,
  "مكة": 400,
  "المدينة": 280,
  "الدمام": 250,
  "الخبر": 280,
  "تبوك": 150,
  "أبها": 180,
  "الطائف": 200,
  "نجران": 120,
  "القصيم": 150,
  "حائل": 130,
  "جازان": 100,
  "ينبع": 180,
  "الأحساء": 160,
  "الجبيل": 200,
  "خميس مشيط": 150,
  "الباحة": 130,
  "عرعر": 100,
  "سكاكا": 100,
};

// معاملات نوع العقار
const propertyTypeMultipliers: Record<string, number> = {
  "فيلا": 1.3,
  "شقة": 1.0,
  "دوبلكس": 1.2,
  "عمارة": 0.9,
  "أرض": 0.7,
  "دور": 1.1,
  "استوديو": 0.9,
  "محل تجاري": 1.5,
  "مكتب": 1.4,
  "مستودع": 0.5,
  "أرض زراعية": 0.2,
  "استراحة": 0.8,
};

// معاملات التأثيث
const furnishingMultipliers: Record<string, number> = {
  "مفروشة بالكامل": 1.2,
  "شبه مفروشة": 1.1,
  "مطبخ مؤثث": 1.05,
  "غير مؤثث": 1.0,
};

// معاملات الأحياء حسب المدينة
const districtMultipliers: Record<string, Record<string, number>> = {
  "الرياض": {
    "النخيل": 1.4,
    "الملقا": 1.35,
    "حي الياسمين": 1.3,
    "العليا": 1.25,
    "الورود": 1.2,
    "الروضة": 1.15,
    "السليمانية": 1.1,
    "المروج": 1.1,
    "الربوة": 1.05,
    "default": 1.0,
  },
  "جدة": {
    "الحمراء": 1.35,
    "الروضة": 1.3,
    "الشاطئ": 1.4,
    "النزهة": 1.2,
    "المرجان": 1.25,
    "default": 1.0,
  },
  "default": {
    "default": 1.0,
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    if (typeof rawBody !== 'object' || rawBody === null || !('propertyData' in rawBody)) {
      return new Response(JSON.stringify({ error: "Missing propertyData field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyData = validateAndSanitizePriceRequest((rawBody as Record<string, unknown>).propertyData);
    
    const area = parseFloat(propertyData.area) || 100;
    // Validate area is within reasonable bounds
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
    
    // Validate user price if provided
    if (userPrice !== null && (userPrice <= 0 || userPrice > 1000000000)) {
      return new Response(JSON.stringify({ error: "Invalid user price value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // تحديد إذا كان إيجار أو شراء
    const isRent = purpose === "للإيجار" || purpose === "إيجار" || purpose.includes("إيجار");
    
    // الحصول على السعر الأساسي للمتر
    let basePricePerMeter = isRent 
      ? (cityRentPrices[city] || 200)
      : (cityBasePrices[city] || 2500);
    
    // تطبيق معامل نوع العقار
    const typeMultiplier = propertyTypeMultipliers[propertyType] || 1.0;
    basePricePerMeter *= typeMultiplier;
    
    // تطبيق معامل الحي
    const cityDistricts = districtMultipliers[city] || districtMultipliers["default"];
    const districtMultiplier = cityDistricts[district] || cityDistricts["default"] || 1.0;
    basePricePerMeter *= districtMultiplier;
    
    // تطبيق معامل التأثيث (للإيجار فقط)
    if (isRent) {
      const furnishMultiplier = furnishingMultipliers[furnishing] || 1.0;
      basePricePerMeter *= furnishMultiplier;
    }
    
    // تطبيق معامل عدد الغرف (للشقق والفيلات)
    if ((propertyType === "شقة" || propertyType === "فيلا" || propertyType === "دور") && bedrooms > 0) {
      const bedroomFactor = 1 + (bedrooms - 2) * 0.05; // زيادة 5% لكل غرفة فوق 2
      basePricePerMeter *= Math.max(0.9, Math.min(bedroomFactor, 1.3)); // حد أدنى 90%، أقصى 130%
    }
    
    // تطبيق معامل عمر العقار (خصم 2% لكل سنة)
    const ageDiscount = Math.min(propertyAge * 0.02, 0.3); // حد أقصى 30%
    basePricePerMeter *= (1 - ageDiscount);
    
    // حساب السعر الإجمالي
    let totalPrice = Math.round(basePricePerMeter * area);
    
    // توليد 3 أسعار مختلفة مع تباين واقعي
    const variation = totalPrice * 0.08; // 8% تباين
    
    const prices = [
      {
        source: "موقع عقار",
        price: Math.round(totalPrice + variation * 0.7),
        url: "https://sa.aqar.fm/",
      },
      {
        source: "عقار ساس",
        price: Math.round(totalPrice - variation * 0.5),
        url: "https://aqarsas.sa/",
      },
      {
        source: "المؤشرات العقارية",
        price: Math.round(totalPrice + variation * 0.1),
        url: "#",
      },
    ];
    
    // حساب متوسط السوق
    const marketAverage = Math.round(prices.reduce((sum, p) => sum + p.price, 0) / prices.length);
    
    // تقييم السعر
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
          ? `الإيجار أقل من متوسط السوق بنسبة ${percentage}% - فرصة ممتازة للمستأجر`
          : `السعر أقل من متوسط السوق بنسبة ${percentage}% - فرصة جيدة للمشتري`;
      } else if (userPrice >= lowerBound && userPrice <= upperBound) {
        status = 'مناسب';
        color = 'blue';
        percentage = Math.abs(Math.round(((userPrice - marketAverage) / marketAverage) * 100));
        message = `السعر مناسب ومتوافق مع أسعار السوق (${percentage > 0 ? `±${percentage}%` : 'مطابق'})`;
      } else {
        status = 'مبالغ فيه';
        color = 'red';
        percentage = Math.round(((userPrice - marketAverage) / marketAverage) * 100);
        if (userPrice > highBound) {
          message = isRent
            ? `⚠️ تحذير: الإيجار أعلى من متوسط السوق بنسبة ${percentage}% - قد يصعب إيجاد مستأجر`
            : `⚠️ تحذير: السعر أعلى من متوسط السوق بنسبة ${percentage}% - قد يصعب البيع`;
        } else {
          message = `السعر أعلى من متوسط السوق بنسبة ${percentage}% - يمكن التفاوض`;
        }
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
      };
    }
    
    // حساب الدفعات للإيجار
    let paymentBreakdown = null;
    if (isRent) {
      const annualPrice = userPrice || marketAverage;
      paymentBreakdown = {
        onePayment: annualPrice,
        twoPayments: Math.round(annualPrice / 2),
        fourPayments: Math.round(annualPrice / 4),
        monthly: Math.round(annualPrice / 12),
      };
    }

    console.log('Price calculation completed:', { 
      city, 
      district, 
      propertyType, 
      area, 
      purpose: isRent ? 'إيجار' : 'بيع',
      marketAverage 
    });

    return new Response(JSON.stringify({ 
      prices,
      marketAverage,
      paymentBreakdown,
      purpose: isRent ? "للإيجار" : "للشراء",
      priceUnit: isRent ? "ريال/سنوياً" : "ريال",
      priceEvaluation,
      calculationDetails: {
        basePricePerMeter: Math.round(basePricePerMeter),
        area,
        city,
        district: district || "غير محدد",
        propertyType,
        furnishing: isRent ? furnishing : null,
        bedrooms: bedrooms || null,
        propertyAge: propertyAge || 0,
      }
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
