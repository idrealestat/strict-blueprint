/**
 * Hook لاستخدام مولد الأسعار الذكي مع دعم API المؤشرات العقارية
 * 
 * التوافق:
 * - البند 1: عدم تغيير الخطة الأساسية
 * - البند 2: التوافق كنظام داخلي فقط
 * - البند 3-4: استخدام البيانات الواقعية من API
 * - البند 5: إنتاج تقرير مقارنة
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// واجهات البيانات
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

interface PriceSource {
  source: string;
  price: number;
  url: string;
  dataSource?: 'api' | 'fallback' | 'hybrid';
  isOfficial?: boolean;
}

interface PriceEvaluation {
  status: 'أقل من السوق' | 'مناسب' | 'مبالغ فيه';
  color: 'green' | 'blue' | 'red';
  message: string;
  percentage: number;
  userPrice: number;
  marketAverage: number;
  difference: number;
  isWarning: boolean;
  comparison?: {
    beforeGeneration: number;
    afterGeneration: number;
    differencePercentage: number;
  };
}

interface PaymentBreakdown {
  onePayment: number;
  twoPayments: number;
  fourPayments: number;
  monthly: number;
  financePartners?: {
    rize: { url: string; name: string };
    aqsat: { url: string; name: string };
  };
}

interface SmartPriceResult {
  prices: PriceSource[];
  marketAverage: number;
  paymentBreakdown: PaymentBreakdown | null;
  purpose: string;
  priceUnit: string;
  priceEvaluation: PriceEvaluation | null;
  isAiGenerated: boolean;
  isSuggestionOnly: boolean;
  disclaimer: { ar: string; en: string };
  generationReport: PriceGenerationReport;
  calculationDetails: {
    basePricePerMeter: number;
    area: number;
    city: string;
    district: string;
    propertyType: string;
    furnishing: string | null;
    bedrooms: number | null;
    propertyAge: number;
    dataSource: 'api' | 'fallback' | 'hybrid';
  };
}

interface PropertyData {
  propertyType: string;
  category?: string;
  purpose: string;
  area: number | string;
  city: string;
  district?: string;
  bedrooms?: number | string;
  propertyAge?: number | string;
  furnishing?: string;
  userPrice?: number | string;
}

export function useSmartPriceGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SmartPriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * توليد الأسعار الذكية
   * ⚠️ هذا لا يغير الخطة الأساسية - السعر اقتراحي فقط
   */
  const generatePrices = useCallback(async (propertyData: PropertyData): Promise<SmartPriceResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('يرجى تسجيل الدخول أولاً');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-smart-prices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ propertyData }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في توليد الأسعار');
      }

      const data: SmartPriceResult = await response.json();
      setResult(data);

      // عرض رسالة تتضمن مصدر البيانات
      const sourceText = data.generationReport.priceSource === 'api' 
        ? 'من بيانات رسمية' 
        : data.generationReport.priceSource === 'hybrid'
          ? 'من بيانات مختلطة'
          : 'من تقدير داخلي';
      
      toast.success(`تم توليد الأسعار ${sourceText} (${data.generationReport.executionPercentage}% تنفيذ)`);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * الحصول على تقرير المقارنة
   */
  const getComparisonReport = useCallback(() => {
    if (!result) return null;

    return {
      city: result.generationReport.requestedCity,
      district: result.generationReport.requestedDistrict,
      
      // مقارنة السعر
      priceComparison: result.priceEvaluation?.comparison || null,
      
      // حالة التوليد
      executionPercentage: result.generationReport.executionPercentage,
      priceSource: result.generationReport.priceSource,
      
      // النواقص
      gaps: {
        noApiData: result.generationReport.priceSource === 'fallback',
        partialData: result.generationReport.priceSource === 'hybrid',
        reason: result.generationReport.complianceStatus.fallbackReason,
      },
      
      // البيانات الإقليمية
      regionalBreakdown: result.generationReport.regionalData.map(r => ({
        datasetId: r.datasetId,
        status: r.apiStatus,
        pricePerMeter: r.pricePerMeter,
      })),
    };
  }, [result]);

  /**
   * إعادة تعيين النتائج
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    loading,
    result,
    error,
    generatePrices,
    getComparisonReport,
    reset,
    
    // اختصارات مفيدة
    marketAverage: result?.marketAverage || null,
    priceEvaluation: result?.priceEvaluation || null,
    generationReport: result?.generationReport || null,
    isSuggestionOnly: result?.isSuggestionOnly ?? true,
  };
}
