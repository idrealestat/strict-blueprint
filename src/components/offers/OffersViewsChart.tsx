/**
 * OffersViewsChart.tsx
 * رسوم بيانية لإحصائيات المشاهدات والتفاعلات
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Activity, Calendar } from 'lucide-react';

interface ViewData {
  date: string;
  views: number;
  interactions: number;
}

interface OffersViewsChartProps {
  data: ViewData[];
}

const chartConfig = {
  views: {
    label: 'المشاهدات',
    color: 'hsl(var(--primary))',
  },
  interactions: {
    label: 'التفاعلات',
    color: 'hsl(var(--chart-2))',
  },
};

const OffersViewsChart: React.FC<OffersViewsChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  const displayData = period === '7d' ? data.slice(-7) : data;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  };

  const totalViews = displayData.reduce((sum, d) => sum + d.views, 0);
  const totalInteractions = displayData.reduce((sum, d) => sum + d.interactions, 0);
  const avgViews = Math.round(totalViews / displayData.length) || 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-bold text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-2 border-gray-100 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#01411C]" />
              إحصائيات المشاهدات
            </CardTitle>

            <div className="flex items-center gap-3">
              {/* اختيار الفترة */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={period === '7d' ? 'default' : 'ghost'}
                  onClick={() => setPeriod('7d')}
                  className={`h-7 text-xs ${period === '7d' ? 'bg-[#01411C] text-white' : ''}`}
                >
                  7 أيام
                </Button>
                <Button
                  size="sm"
                  variant={period === '30d' ? 'default' : 'ghost'}
                  onClick={() => setPeriod('30d')}
                  className={`h-7 text-xs ${period === '30d' ? 'bg-[#01411C] text-white' : ''}`}
                >
                  30 يوم
                </Button>
              </div>

              {/* اختيار نوع الرسم */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={chartType === 'area' ? 'default' : 'ghost'}
                  onClick={() => setChartType('area')}
                  className={`h-7 px-2 ${chartType === 'area' ? 'bg-[#01411C] text-white' : ''}`}
                >
                  <Activity className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={chartType === 'bar' ? 'default' : 'ghost'}
                  onClick={() => setChartType('bar')}
                  className={`h-7 px-2 ${chartType === 'bar' ? 'bg-[#01411C] text-white' : ''}`}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* ملخص سريع */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#01411C]" />
              <span className="text-gray-600">إجمالي المشاهدات:</span>
              <span className="font-bold text-gray-900">{totalViews.toLocaleString('ar-SA')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-gray-600">التفاعلات:</span>
              <span className="font-bold text-gray-900">{totalInteractions.toLocaleString('ar-SA')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">متوسط يومي:</span>
              <span className="font-bold text-gray-900">{avgViews}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            {chartType === 'area' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#01411C" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#01411C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="interactionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={30}
                    formatter={(value) => (
                      <span className="text-sm text-gray-700">
                        {value === 'views' ? 'المشاهدات' : 'التفاعلات'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="views"
                    stroke="#01411C"
                    strokeWidth={2}
                    fill="url(#viewsGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interactions"
                    name="interactions"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill="url(#interactionsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={30}
                    formatter={(value) => (
                      <span className="text-sm text-gray-700">
                        {value === 'views' ? 'المشاهدات' : 'التفاعلات'}
                      </span>
                    )}
                  />
                  <Bar 
                    dataKey="views" 
                    name="views" 
                    fill="#01411C" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="interactions" 
                    name="interactions" 
                    fill="#F59E0B" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OffersViewsChart;
