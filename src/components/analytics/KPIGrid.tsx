'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KPI {
  id: string;
  name: string;
  category: string;
  currentValue: string;
  previousValue: string;
  changePercentage: string;
  targetValue?: string;
  displayFormat: 'currency' | 'number' | 'percentage';
}

interface Props {
  kpis: KPI[];
  className?: string;
}

export function KPIGrid({ kpis, className }: Props) {
  const formatValue = (value: string, format: string) => {
    const numValue = parseFloat(value);
    if (format === 'currency') {
      return `${numValue.toLocaleString('ar-SA')} ريال`;
    } else if (format === 'percentage') {
      return `${numValue}%`;
    }
    return numValue.toLocaleString('ar-SA');
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-green-50';
    if (change < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sales: 'border-t-[#01411C]',
      finance: 'border-t-[#D4AF37]',
      customers: 'border-t-blue-500',
      properties: 'border-t-purple-500',
    };
    return colors[category] || 'border-t-gray-400';
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      {kpis.map((kpi) => {
        const change = parseFloat(kpi.changePercentage);
        return (
          <Card 
            key={kpi.id} 
            className={`p-4 border-t-4 ${getCategoryColor(kpi.category)} hover:shadow-lg transition-shadow`}
          >
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{kpi.name}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatValue(kpi.currentValue, kpi.displayFormat)}
              </p>
              <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full w-fit ${getChangeBgColor(change)} ${getChangeColor(change)}`}>
                {getChangeIcon(change)}
                <span>{Math.abs(change)}%</span>
              </div>
              {kpi.targetValue && (
                <div className="mt-2 pt-2 border-t border-dashed">
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>الهدف:</span>
                    <span className="font-medium">{formatValue(kpi.targetValue, kpi.displayFormat)}</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#01411C] h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((parseFloat(kpi.currentValue) / parseFloat(kpi.targetValue)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
