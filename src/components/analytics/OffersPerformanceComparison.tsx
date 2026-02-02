/**
 * OffersPerformanceComparison.tsx
 * مقارنة أداء العروض مع رسوم بيانية تفاعلية
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer } from '@/components/ui/chart';
import { TrendingUp, BarChart3, Activity, Eye, Phone, MessageSquare, Share2, Filter, CheckSquare, Trophy, Medal, Award, Loader2 } from 'lucide-react';

interface OfferPerformance {
  id: string;
  title: string;
  city: string;
  district?: string;
  views: number;
  calls: number;
  whatsapp: number;
  shares: number;
  favorites: number;
  conversionRate: number;
  avgTimeOnPage: number; // seconds
  liveViewers?: number; // ✅ المشاهدين المباشرين الآن
  history?: { date: string; views: number; interactions: number }[];
}

interface OffersPerformanceComparisonProps {
  offers: OfferPerformance[];
  mode?: 'top5' | 'manual' | 'all';
  onModeChange?: (mode: 'top5' | 'manual' | 'all') => void;
}

const COLORS = ['#01411C', '#D4AF37', '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899'];

const chartConfig = {
  views: { label: 'المشاهدات', color: '#01411C' },
  liveViewers: { label: 'مباشر الآن', color: '#EF4444' }, // ✅ عمود المباشر
  calls: { label: 'المكالمات', color: '#3B82F6' },
  whatsapp: { label: 'واتساب', color: '#10B981' },
  shares: { label: 'المشاركات', color: '#F59E0B' },
  favorites: { label: 'المفضلة', color: '#EC4899' },
};

const OffersPerformanceComparison: React.FC<OffersPerformanceComparisonProps> = ({
  offers,
  mode: initialMode = 'top5',
  onModeChange,
}) => {
  const [mode, setMode] = useState<'top5' | 'manual' | 'all'>(initialMode);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'radar' | 'line'>('bar');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // استخراج المدن الفريدة
  const uniqueCities = useMemo(() => {
    const cities = new Set(offers.map((o) => o.city));
    return ['all', ...Array.from(cities)];
  }, [offers]);

  // فلترة العروض
  const filteredOffers = useMemo(() => {
    let result = offers;
    if (cityFilter !== 'all') {
      result = result.filter((o) => o.city === cityFilter);
    }
    return result;
  }, [offers, cityFilter]);

  // العروض المعروضة حسب الوضع
  const displayedOffers = useMemo(() => {
    switch (mode) {
      case 'top5':
        return [...filteredOffers].sort((a, b) => b.views - a.views).slice(0, 5);
      case 'manual':
        return filteredOffers.filter((o) => selectedOfferIds.includes(o.id));
      case 'all':
        return filteredOffers;
    }
  }, [mode, filteredOffers, selectedOfferIds]);

  const handleModeChange = (newMode: 'top5' | 'manual' | 'all') => {
    setMode(newMode);
    onModeChange?.(newMode);
    if (newMode !== 'manual') {
      setSelectedOfferIds([]);
    }
  };

  const toggleOfferSelection = (id: string) => {
    setSelectedOfferIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  // تحضير بيانات الرسم البياني
  const barChartData = displayedOffers.map((o, idx) => ({
    name: o.title.length > 20 ? o.title.substring(0, 20) + '...' : o.title,
    fullTitle: o.title,
    views: o.views,
    liveViewers: o.liveViewers || 0, // ✅ المباشر الآن
    calls: o.calls,
    whatsapp: o.whatsapp,
    shares: o.shares,
    favorites: o.favorites,
    fill: COLORS[idx % COLORS.length],
  }));

  const radarChartData = [
    { metric: 'المشاهدات', ...Object.fromEntries(displayedOffers.map((o, i) => [`offer${i}`, Math.min(o.views / 100, 100)])) },
    { metric: 'المكالمات', ...Object.fromEntries(displayedOffers.map((o, i) => [`offer${i}`, Math.min(o.calls * 5, 100)])) },
    { metric: 'واتساب', ...Object.fromEntries(displayedOffers.map((o, i) => [`offer${i}`, Math.min(o.whatsapp * 5, 100)])) },
    { metric: 'المشاركات', ...Object.fromEntries(displayedOffers.map((o, i) => [`offer${i}`, Math.min(o.shares * 10, 100)])) },
    { metric: 'التحويل %', ...Object.fromEntries(displayedOffers.map((o, i) => [`offer${i}`, o.conversionRate])) },
  ];

  // ترتيب العروض
  const rankedOffers = [...displayedOffers].sort((a, b) => b.views - a.views);
  const getRankIcon = (idx: number) => {
    if (idx === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (idx === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (idx === 2) return <Award className="w-5 h-5 text-orange-500" />;
    return <span className="text-sm font-bold text-gray-500">#{idx + 1}</span>;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200 text-right" dir="rtl">
          <p className="font-bold text-gray-900 mb-2">{item?.fullTitle || label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-gray-600">{chartConfig[entry.dataKey as keyof typeof chartConfig]?.label || entry.name}:</span>
              <span className="font-bold text-gray-900">{entry.value?.toLocaleString('ar-SA')}</span>
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
      className="space-y-6"
      dir="rtl"
    >
      {/* Header & Controls */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold text-[#01411C] flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              مقارنة أداء العروض
            </CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter by city */}
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city === 'all' ? 'كل المدن' : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mode Selection */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={mode === 'top5' ? 'default' : 'ghost'}
                  onClick={() => handleModeChange('top5')}
                  className={`h-7 text-xs ${mode === 'top5' ? 'bg-[#01411C] text-white' : ''}`}
                >
                  Top 5
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'manual' ? 'default' : 'ghost'}
                  onClick={() => handleModeChange('manual')}
                  className={`h-7 text-xs ${mode === 'manual' ? 'bg-[#01411C] text-white' : ''}`}
                >
                  اختيار يدوي
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'all' ? 'default' : 'ghost'}
                  onClick={() => handleModeChange('all')}
                  className={`h-7 text-xs ${mode === 'all' ? 'bg-[#01411C] text-white' : ''}`}
                >
                  الكل
                </Button>
              </div>

              {/* Chart Type */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={chartType === 'bar' ? 'default' : 'ghost'}
                  onClick={() => setChartType('bar')}
                  className={`h-7 px-2 ${chartType === 'bar' ? 'bg-[#01411C] text-white' : ''}`}
                  title="أعمدة"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={chartType === 'radar' ? 'default' : 'ghost'}
                  onClick={() => setChartType('radar')}
                  className={`h-7 px-2 ${chartType === 'radar' ? 'bg-[#01411C] text-white' : ''}`}
                  title="رادار"
                >
                  <Activity className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={chartType === 'line' ? 'default' : 'ghost'}
                  onClick={() => setChartType('line')}
                  className={`h-7 px-2 ${chartType === 'line' ? 'bg-[#01411C] text-white' : ''}`}
                  title="خطي"
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Manual Selection */}
        {mode === 'manual' && (
          <CardContent className="pt-0 border-t border-gray-100 mt-2">
            <p className="text-sm text-gray-500 mb-3">اختر حتى 5 عروض للمقارنة:</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedOfferIds.includes(offer.id)
                      ? 'bg-[#01411C]/10 border-[#01411C]'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleOfferSelection(offer.id)}
                >
                  <Checkbox checked={selectedOfferIds.includes(offer.id)} />
                  <span className="text-sm">{offer.title.length > 25 ? offer.title.substring(0, 25) + '...' : offer.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Charts */}
      {displayedOffers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                {chartType === 'bar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="views" name="المشاهدات" fill="#01411C" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="liveViewers" name="مباشر الآن" fill="#EF4444" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="calls" name="المكالمات" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="whatsapp" name="واتساب" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : chartType === 'radar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      {displayedOffers.slice(0, 5).map((o, i) => (
                        <Radar
                          key={o.id}
                          name={o.title.length > 15 ? o.title.substring(0, 15) + '...' : o.title}
                          dataKey={`offer${i}`}
                          stroke={COLORS[i]}
                          fill={COLORS[i]}
                          fillOpacity={0.3}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="views" name="المشاهدات" stroke="#01411C" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="calls" name="المكالمات" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="whatsapp" name="واتساب" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Ranking */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                ترتيب العروض
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {rankedOffers.slice(0, 10).map((offer, idx) => (
                  <div
                    key={offer.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 flex justify-center">{getRankIcon(idx)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{offer.title}</p>
                      <p className="text-xs text-gray-500">{offer.city}</p>
                    </div>
                    {/* ✅ عمود المشاهدين المباشرين */}
                    <div className="text-center">
                      {(offer.liveViewers || 0) > 0 ? (
                        <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs animate-pulse">
                          <Eye className="w-3 h-3" />
                          <span>{offer.liveViewers}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#01411C]">{offer.views.toLocaleString('ar-SA')}</p>
                      <p className="text-xs text-gray-400">مشاهدة</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>لا توجد عروض لعرضها</p>
            {mode === 'manual' && <p className="text-sm mt-2">اختر عروضاً من القائمة أعلاه</p>}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default OffersPerformanceComparison;
