/**
 * PublicPagesStats.tsx
 * إحصائيات تفصيلية للزيارات والمشاهدات لكل صفحة من الصفحات العامة
 * تستخدم البيانات الحقيقية من جدول events
 */

import React from 'react';
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
  Loader2
} from 'lucide-react';
import { useAnalyticsStats } from '@/hooks/useAnalyticsStats';

// Map page keys to icons
const pageIcons: Record<string, React.ReactNode> = {
  platform: <Building2 className="w-5 h-5" />,
  business_card: <CreditCard className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  offer: <FileText className="w-5 h-5" />,
  request: <Send className="w-5 h-5" />,
  quote: <DollarSign className="w-5 h-5" />,
};

const PublicPagesStats: React.FC = () => {
  const { pagesStats, loading } = useAnalyticsStats();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">جاري تحميل الإحصائيات...</span>
      </div>
    );
  }

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
                          {pageIcons[page.pageKey] || <FileText className="w-5 h-5" />}
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
