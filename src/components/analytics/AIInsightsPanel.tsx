'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Lightbulb, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Insight {
  id: string;
  insightType: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  confidenceScore: string;
  impactScore: string;
  suggestedActions?: string;
  expectedOutcome?: string;
}

interface Props {
  insights: Insight[];
  onDismiss: (id: string) => void;
  onRefresh: () => void;
}

export function AIInsightsPanel({ insights, onDismiss, onRefresh }: Props) {
  const handleDismiss = (id: string) => {
    onDismiss(id);
    toast.success('تم تجاهل الرؤية');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'prediction':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      recommendation: 'توصية',
      warning: 'تحذير',
      opportunity: 'فرصة',
      prediction: 'توقع',
    };
    return labels[type] || type;
  };

  const getInsightTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      recommendation: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      warning: 'bg-red-100 text-red-800 border-red-200',
      opportunity: 'bg-green-100 text-green-800 border-green-200',
      prediction: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      low: { label: 'منخفض', className: 'bg-gray-100 text-gray-600' },
      medium: { label: 'متوسط', className: 'bg-yellow-100 text-yellow-700' },
      high: { label: 'عالي', className: 'bg-orange-100 text-orange-700' },
      critical: { label: 'حرج', className: 'bg-red-100 text-red-700' },
    };

    const { label, className } = config[priority] || config.low;
    return <Badge className={className}>{label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      sales: 'المبيعات',
      customers: 'العملاء',
      properties: 'العقارات',
      marketing: 'التسويق',
      finance: 'المالية',
    };
    return labels[category] || category;
  };

  return (
    <Card className="p-6 sticky top-6 border-t-4 border-t-[#D4AF37]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
          رؤى ذكية
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#01411C] text-[#01411C]">
            {insights.length} رؤية
          </Badge>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {insights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 border-r-4 border-r-[#01411C] hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getInsightIcon(insight.insightType)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{insight.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge className={getInsightTypeBadgeColor(insight.insightType)}>
                            {getInsightTypeLabel(insight.insightType)}
                          </Badge>
                          {getPriorityBadge(insight.priority)}
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(insight.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(insight.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>

                  {/* Metrics */}
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">الثقة:</span>
                      <span className="font-medium text-[#01411C]">{insight.confidenceScore}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">التأثير:</span>
                      <span className="font-medium text-[#D4AF37]">{insight.impactScore}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {insight.suggestedActions && (
                    <div className="space-y-1 pt-2 border-t border-dashed">
                      <p className="text-xs font-semibold text-muted-foreground">الإجراءات المقترحة:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {JSON.parse(insight.suggestedActions).map((action: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#01411C] mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expected Outcome */}
                  {insight.expectedOutcome && (
                    <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                      <p className="text-xs font-semibold text-green-800">النتيجة المتوقعة:</p>
                      <p className="text-xs text-green-700">{insight.expectedOutcome}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {insights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-medium">لا توجد رؤى جديدة</p>
            <p className="text-sm mt-1">اضغط على "توليد رؤى جديدة" للحصول على تحليلات</p>
          </div>
        )}
      </div>
    </Card>
  );
}
