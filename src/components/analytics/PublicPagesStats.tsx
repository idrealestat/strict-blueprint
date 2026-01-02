/**
 * PublicPagesStats.tsx
 * إحصائيات تفصيلية للزيارات والمشاهدات لكل صفحة من الصفحات العامة
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CreditCard, 
  Calendar, 
  FileText, 
  Send, 
  DollarSign,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Clock
} from 'lucide-react';

interface PageStats {
  pageName: string;
  pageKey: string;
  icon: React.ReactNode;
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: string;
  bounceRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface ViewLog {
  pageType: string;
  timestamp: string;
  city?: string;
  device?: string;
  browser?: string;
  viewerId?: string;
}

const PublicPagesStats: React.FC = () => {
  const [pagesStats, setPagesStats] = useState<PageStats[]>([]);

  useEffect(() => {
    loadStats();
    
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    try {
      // جلب سجل المشاهدات من localStorage
      const viewsLog: ViewLog[] = JSON.parse(localStorage.getItem('public_pages_views_log') || '[]');
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000);
      const monthStart = todayStart - (30 * 24 * 60 * 60 * 1000);

      const pageTypes = [
        { key: 'platform', name: 'المنصة العامة', icon: <Building2 className="w-5 h-5" /> },
        { key: 'businesscard', name: 'بطاقة الأعمال', icon: <CreditCard className="w-5 h-5" /> },
        { key: 'calendar', name: 'حجز المواعيد', icon: <Calendar className="w-5 h-5" /> },
        { key: 'offer', name: 'نموذج العروض', icon: <FileText className="w-5 h-5" /> },
        { key: 'request', name: 'نموذج الطلبات', icon: <Send className="w-5 h-5" /> },
        { key: 'quote', name: 'عروض الأسعار', icon: <DollarSign className="w-5 h-5" /> },
      ];

      const stats: PageStats[] = pageTypes.map(page => {
        const pageViews = viewsLog.filter(v => v.pageType === page.key);
        const todayViews = pageViews.filter(v => new Date(v.timestamp).getTime() >= todayStart);
        const weekViews = pageViews.filter(v => new Date(v.timestamp).getTime() >= weekStart);
        const monthViews = pageViews.filter(v => new Date(v.timestamp).getTime() >= monthStart);
        
        // حساب الزوار الفريدين
        const uniqueIds = new Set(pageViews.map(v => v.viewerId || v.timestamp));
        
        // حساب الاتجاه (مقارنة اليوم بالأمس)
        const yesterdayStart = todayStart - (24 * 60 * 60 * 1000);
        const yesterdayViews = pageViews.filter(v => {
          const time = new Date(v.timestamp).getTime();
          return time >= yesterdayStart && time < todayStart;
        });
        
        const trendValue = todayViews.length - yesterdayViews.length;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (trendValue > 0) trend = 'up';
        if (trendValue < 0) trend = 'down';

        return {
          pageName: page.name,
          pageKey: page.key,
          icon: page.icon,
          totalViews: pageViews.length,
          todayViews: todayViews.length,
          weekViews: weekViews.length,
          monthViews: monthViews.length,
          uniqueVisitors: uniqueIds.size,
          avgTimeOnPage: '2:30', // يمكن حسابها لاحقاً
          bounceRate: Math.random() * 30 + 20, // نسبة تقريبية
          trend,
          trendValue: Math.abs(trendValue),
        };
      });

      setPagesStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4 text-gray-400">—</span>;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (trend === 'down') return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
  };

  // إجمالي الإحصائيات
  const totalStats = {
    totalViews: pagesStats.reduce((sum, p) => sum + p.totalViews, 0),
    todayViews: pagesStats.reduce((sum, p) => sum + p.todayViews, 0),
    uniqueVisitors: pagesStats.reduce((sum, p) => sum + p.uniqueVisitors, 0),
  };

  return (
    <div className="space-y-6">
      {/* ملخص إجمالي */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
                <p className="text-3xl font-bold text-blue-600">{totalStats.totalViews}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مشاهدات اليوم</p>
                <p className="text-3xl font-bold text-green-600">{totalStats.todayViews}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">زوار فريدين</p>
                <p className="text-3xl font-bold text-purple-600">{totalStats.uniqueVisitors}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول إحصائيات الصفحات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" />
            إحصائيات الصفحات العامة
            <Badge className="bg-primary text-primary-foreground mr-2">تحديث مباشر</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الصفحة</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">اليوم</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">الأسبوع</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">الشهر</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">الإجمالي</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">زوار فريدين</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">الاتجاه</th>
                </tr>
              </thead>
              <tbody>
                {pagesStats.map((page, index) => (
                  <tr 
                    key={page.pageKey}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {page.icon}
                        </div>
                        <span className="font-medium">{page.pageName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-green-600">{page.todayViews}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{page.weekViews}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{page.monthViews}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-primary">{page.totalViews}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-muted-foreground">{page.uniqueVisitors}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(page.trend)}`}>
                        {getTrendIcon(page.trend)}
                        {page.trendValue > 0 && (
                          <span>{page.trend === 'up' ? '+' : '-'}{page.trendValue}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicPagesStats;
