/**
 * مكون عرض تقرير توليد الأسعار
 * يعرض مقارنة قبل/بعد التوليد لكل منطقة
 * 
 * التوافق: البند 5 من التعليمات الصارمة
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Database,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

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

interface PriceComparison {
  beforeGeneration: number;
  afterGeneration: number;
  differencePercentage: number;
}

interface PriceGenerationReportDisplayProps {
  report: PriceGenerationReport;
  priceComparison?: PriceComparison;
  className?: string;
}

export function PriceGenerationReportDisplay({
  report,
  priceComparison,
  className = '',
}: PriceGenerationReportDisplayProps) {
  const getStatusIcon = (status: 'success' | 'failed' | 'not_available') => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'not_available':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSourceBadge = (source: 'api' | 'fallback' | 'hybrid') => {
    switch (source) {
      case 'api':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">بيانات رسمية</Badge>;
      case 'fallback':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">تقدير داخلي</Badge>;
      case 'hybrid':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">مختلط</Badge>;
    }
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (percentage < -5) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-blue-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 ${className}`}
      dir="rtl"
    >
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-primary" />
            تقرير توليد السعر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* معلومات الموقع */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الموقع:</span>
            <span className="font-medium">
              {report.requestedCity}
              {report.requestedDistrict && ` - ${report.requestedDistrict}`}
            </span>
          </div>

          <Separator />

          {/* نسبة التنفيذ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">نسبة تنفيذ التوليد:</span>
              <span className="font-bold text-lg">{report.executionPercentage}%</span>
            </div>
            <Progress 
              value={report.executionPercentage} 
              className="h-2"
            />
          </div>

          <Separator />

          {/* مصدر البيانات */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">مصدر السعر:</span>
            {getSourceBadge(report.priceSource)}
          </div>

          {/* حالة الامتثال */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">حالة الامتثال</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {report.complianceStatus.usedOfficialData ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-amber-500" />
                )}
                <span>
                  {report.complianceStatus.usedOfficialData 
                    ? 'تم استخدام بيانات رسمية' 
                    : 'تم استخدام تقدير داخلي'}
                </span>
              </div>
              {report.complianceStatus.fallbackReason && (
                <div className="flex items-start gap-2 mt-1">
                  <Info className="w-3 h-3 text-amber-500 mt-0.5" />
                  <span>{report.complianceStatus.fallbackReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* مقارنة الأسعار */}
          {priceComparison && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {getTrendIcon(priceComparison.differencePercentage)}
                  <span>مقارنة السعر قبل/بعد التوليد</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded bg-muted/30 text-center">
                    <div className="text-xs text-muted-foreground mb-1">قبل</div>
                    <div className="font-bold">
                      {priceComparison.beforeGeneration.toLocaleString()} ريال
                    </div>
                  </div>
                  <div className="p-2 rounded bg-primary/10 text-center">
                    <div className="text-xs text-muted-foreground mb-1">بعد</div>
                    <div className="font-bold text-primary">
                      {priceComparison.afterGeneration.toLocaleString()} ريال
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  الفرق: {priceComparison.differencePercentage > 0 ? '+' : ''}
                  {priceComparison.differencePercentage}%
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* البيانات الإقليمية */}
          <div className="space-y-2">
            <div className="text-sm font-medium">مصادر البيانات ({report.regionalData.length})</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {report.regionalData.map((data, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.apiStatus)}
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {data.datasetId.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="text-left">
                    {data.pricePerMeter ? (
                      <span className="font-medium">{data.pricePerMeter} ر/م²</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* تحذير */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium mb-1">تنبيه مهم</p>
                <p>
                  السعر المولَّد اقتراحي فقط ولا يُطبَّق تلقائياً على الخطة الأصلية.
                  القرار النهائي يعود للمستخدم.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default PriceGenerationReportDisplay;
