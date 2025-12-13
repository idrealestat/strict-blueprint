'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface AnalyticsDataPoint {
  date: string;
  totalSales: number;
  salesCount: number;
  totalRevenue: number;
  totalCommissions: number;
  newCustomers: number;
}

interface Props {
  data: AnalyticsDataPoint[];
}

type ChartType = 'area' | 'bar' | 'line';

export function AnalyticsChart({ data }: Props) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'sales' | 'customers'>('revenue');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}م`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}ك`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg" dir="rtl">
          <p className="text-sm font-medium text-gray-600 mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-500">{entry.name}:</span>
              <span className="font-semibold">
                {entry.name.includes('ريال') || entry.name.includes('الإيرادات') || entry.name.includes('العمولات')
                  ? `${entry.value.toLocaleString('ar-SA')} ريال`
                  : entry.value.toLocaleString('ar-SA')
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartData = data.map(d => ({
    ...d,
    formattedDate: formatDate(d.date),
  }));

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatValue}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetric === 'revenue' && (
              <>
                <Bar dataKey="totalRevenue" name="الإيرادات" fill="#01411C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalCommissions" name="العمولات" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </>
            )}
            {selectedMetric === 'sales' && (
              <>
                <Bar dataKey="totalSales" name="المبيعات (ريال)" fill="#01411C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salesCount" name="عدد الصفقات" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </>
            )}
            {selectedMetric === 'customers' && (
              <Bar dataKey="newCustomers" name="العملاء الجدد" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatValue}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetric === 'revenue' && (
              <>
                <Line type="monotone" dataKey="totalRevenue" name="الإيرادات" stroke="#01411C" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="totalCommissions" name="العمولات" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
              </>
            )}
            {selectedMetric === 'sales' && (
              <>
                <Line type="monotone" dataKey="totalSales" name="المبيعات (ريال)" stroke="#01411C" strokeWidth={2} dot={{ r: 3 }} />
              </>
            )}
            {selectedMetric === 'customers' && (
              <Line type="monotone" dataKey="newCustomers" name="العملاء الجدد" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            )}
          </LineChart>
        );
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#01411C" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#01411C" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCommissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatValue}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetric === 'revenue' && (
              <>
                <Area 
                  type="monotone" 
                  dataKey="totalRevenue" 
                  name="الإيرادات" 
                  stroke="#01411C" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="totalCommissions" 
                  name="العمولات" 
                  stroke="#D4AF37" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCommissions)" 
                />
              </>
            )}
            {selectedMetric === 'sales' && (
              <Area 
                type="monotone" 
                dataKey="totalSales" 
                name="المبيعات (ريال)" 
                stroke="#01411C" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            )}
            {selectedMetric === 'customers' && (
              <Area 
                type="monotone" 
                dataKey="newCustomers" 
                name="العملاء الجدد" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCustomers)" 
              />
            )}
          </AreaChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Chart Type */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          <Button
            variant={chartType === 'area' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('area')}
            className={chartType === 'area' ? 'bg-[#01411C]' : ''}
          >
            <Activity className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('bar')}
            className={chartType === 'bar' ? 'bg-[#01411C]' : ''}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChartType('line')}
            className={chartType === 'line' ? 'bg-[#01411C]' : ''}
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMetric('revenue')}
            className={selectedMetric === 'revenue' ? 'bg-[#01411C]' : ''}
          >
            الإيرادات
          </Button>
          <Button
            variant={selectedMetric === 'sales' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMetric('sales')}
            className={selectedMetric === 'sales' ? 'bg-[#01411C]' : ''}
          >
            المبيعات
          </Button>
          <Button
            variant={selectedMetric === 'customers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMetric('customers')}
            className={selectedMetric === 'customers' ? 'bg-[#01411C]' : ''}
          >
            العملاء
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
