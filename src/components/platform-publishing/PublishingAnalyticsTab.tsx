/**
 * PublishingAnalyticsTab.tsx
 * تبويب تحليلات النشر
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  MousePointer,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Award,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PublishingAnalytics, PlatformStats, AVAILABLE_PLATFORMS } from './types';

interface PublishingAnalyticsTabProps {
  analytics: PublishingAnalytics;
}

export default function PublishingAnalyticsTab({ analytics }: PublishingAnalyticsTabProps) {
  // حساب الإحصائيات
  const stats = useMemo(() => {
    const avgCTR = analytics.totalViews > 0 
      ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1) 
      : '0';
    const conversionRate = analytics.totalClicks > 0 
      ? ((analytics.totalLeads / analytics.totalClicks) * 100).toFixed(1) 
      : '0';
    
    return { avgCTR, conversionRate };
  }, [analytics]);

  // ألوان المنصات
  const getPlatformColor = (platformId: string) => {
    const platform = AVAILABLE_PLATFORMS.find(p => p.id === platformId);
    return platform?.color || '#6B7280';
  };

  const getPlatformName = (platformId: string) => {
    const platform = AVAILABLE_PLATFORMS.find(p => p.id === platformId);
    return platform?.nameAr || platformId;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">تحليلات النشر</h2>
            <p className="text-sm text-muted-foreground">أداء إعلاناتك على المنصات</p>
          </div>
          <Badge variant="outline" className="border-[hsl(var(--gold))] text-[hsl(var(--gold))]">
            <Clock className="w-3 h-3 ml-1" />
            آخر 30 يوم
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <Badge className="bg-blue-200 text-blue-700 text-xs">
                    <TrendingUp className="w-3 h-3 ml-1" />
                    +12%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-xs text-blue-700">إجمالي المشاهدات</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <MousePointer className="w-5 h-5 text-green-600" />
                  <Badge className="bg-green-200 text-green-700 text-xs">
                    <TrendingUp className="w-3 h-3 ml-1" />
                    +8%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-green-900">{analytics.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-green-700">إجمالي النقرات</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <Badge className="bg-amber-200 text-amber-700 text-xs">
                    <TrendingUp className="w-3 h-3 ml-1" />
                    +15%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-amber-900">{analytics.totalLeads}</p>
                <p className="text-xs text-amber-700">العملاء المحتملين</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <Badge className="bg-purple-200 text-purple-700 text-xs">
                    CTR
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-purple-900">{stats.avgCTR}%</p>
                <p className="text-xs text-purple-700">معدل النقر</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Conversion Rate */}
        <Card className="border-2 border-[hsl(var(--gold))]/30 bg-gradient-to-br from-[hsl(var(--gold))]/5 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[hsl(var(--gold))]" />
                <span className="font-semibold text-[hsl(var(--foreground))]">معدل التحويل</span>
              </div>
              <span className="text-2xl font-bold text-[hsl(var(--gold))]">{stats.conversionRate}%</span>
            </div>
            <Progress value={parseFloat(stats.conversionRate)} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              من النقرات إلى عملاء محتملين
            </p>
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[hsl(var(--gold))]" />
              أداء المنصات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.platformStats.length > 0 ? (
              analytics.platformStats.map((stat, index) => (
                <motion.div
                  key={stat.platformId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${getPlatformColor(stat.platformId)}20` }}
                  >
                    {AVAILABLE_PLATFORMS.find(p => p.id === stat.platformId)?.logo || '🏠'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getPlatformName(stat.platformId)}</span>
                      <span className="text-sm text-muted-foreground">{stat.totalPublished} إعلان</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {stat.totalViews}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointer className="w-3 h-3" />
                        {stat.totalClicks}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {stat.totalLeads}
                      </span>
                      <span 
                        className="font-medium"
                        style={{ color: getPlatformColor(stat.platformId) }}
                      >
                        CTR: {stat.avgCTR.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد بيانات حتى الآن</p>
                <p className="text-sm">ابدأ النشر على المنصات لرؤية التحليلات</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Offers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-[hsl(var(--gold))]" />
              الإعلانات الأكثر أداءً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.topPerformingOffers.length > 0 ? (
              analytics.topPerformingOffers.map((offer, index) => (
                <motion.div
                  key={offer.offerId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-1">{offer.title}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{offer.views} مشاهدة</span>
                      <span>{offer.clicks} نقرة</span>
                      <span>{offer.leads} عميل</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">لا توجد إعلانات منشورة حتى الآن</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
