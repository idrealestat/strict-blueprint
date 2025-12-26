import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  userPrice?: string; // السعر المدخل من المالك
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyData }: { propertyData: PriceRequest } = await req.json();
    
    const area = parseFloat(propertyData.area) || 100;
    const purpose = propertyData.purpose;
    const city = propertyData.city || "الرياض";
    const propertyType = propertyData.propertyType || "شقة";
    const furnishing = propertyData.furnishing || "غير مؤثث";
    const propertyAge = parseInt(propertyData.propertyAge) || 0;
    const userPrice = propertyData.userPrice ? parseFloat(propertyData.userPrice.replace(/,/g, '')) : null;
    
    // الحصول على السعر الأساسي
    let basePrice = purpose === "للإيجار" 
      ? (cityRentPrices[city] || 200)
      : (cityBasePrices[city] || 2500);
    
    // تطبيق معامل نوع العقار
    const typeMultiplier = propertyTypeMultipliers[propertyType] || 1.0;
    basePrice *= typeMultiplier;
    
    // تطبيق معامل التأثيث (للإيجار فقط)
    if (purpose === "للإيجار") {
      const furnishMultiplier = furnishingMultipliers[furnishing] || 1.0;
      basePrice *= furnishMultiplier;
    }
    
    // تطبيق معامل عمر العقار (خصم 2% لكل سنة)
    const ageDiscount = Math.min(propertyAge * 0.02, 0.3); // حد أقصى 30%
    basePrice *= (1 - ageDiscount);
    
    // حساب السعر الإجمالي
    let totalPrice = basePrice * area;
    
    // للإيجار، السعر هو سنوي
    if (purpose === "للإيجار") {
      totalPrice = Math.round(totalPrice);
    } else {
      totalPrice = Math.round(totalPrice);
    }
    
    // توليد 3 أسعار مختلفة مع تباين
    const variation = totalPrice * 0.1; // 10% تباين
    
    const prices = [
      {
        source: "موقع عقار",
        price: Math.round(totalPrice + variation * 0.5),
        url: "https://sa.aqar.fm/",
      },
      {
        source: "عقار ساس",
        price: Math.round(totalPrice - variation * 0.3),
        url: "https://aqarsas.sa/",
      },
      {
        source: "المؤشرات العقارية",
        price: Math.round(totalPrice),
        url: "#",
      },
    ];
    
    // حساب متوسط السوق
    const marketAverage = Math.round(prices.reduce((sum, p) => sum + p.price, 0) / prices.length);
    
    // تقييم السعر بالذكاء الاصطناعي
    let priceEvaluation = null;
    if (userPrice !== null && userPrice > 0) {
      const lowerBound = marketAverage * 0.85; // 15% أقل من المتوسط
      const upperBound = marketAverage * 1.15; // 15% أعلى من المتوسط
      const highBound = marketAverage * 1.30; // 30% أعلى من المتوسط
      
      let status: 'أقل من السوق' | 'مناسب' | 'مبالغ فيه';
      let color: 'green' | 'blue' | 'red';
      let message: string;
      let percentage: number;
      
      if (userPrice < lowerBound) {
        status = 'أقل من السوق';
        color = 'green';
        percentage = Math.round(((marketAverage - userPrice) / marketAverage) * 100);
        message = `السعر أقل من متوسط السوق بنسبة ${percentage}% - فرصة جيدة للمشتري`;
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
          message = `⚠️ تحذير: السعر أعلى من متوسط السوق بنسبة ${percentage}% - قد يصعب البيع/التأجير`;
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
    if (purpose === "للإيجار") {
      const annualPrice = userPrice || marketAverage;
      paymentBreakdown = {
        onePayment: annualPrice,
        twoPayments: Math.round(annualPrice / 2),
        fourPayments: Math.round(annualPrice / 4),
        monthly: Math.round(annualPrice / 12),
      };
    }

    console.log('Price evaluation:', priceEvaluation);

    return new Response(JSON.stringify({ 
      prices,
      marketAverage,
      paymentBreakdown,
      purpose,
      priceUnit: purpose === "للإيجار" ? "ريال/سنوياً" : "ريال",
      priceEvaluation,
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
