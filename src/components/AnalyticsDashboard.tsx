/**
 * AnalyticsDashboard.tsx
 * لوحة التحليلات - 6 مؤشرات ورسوم بيانية مع قسم منصتي
 * تستخدم البيانات الحقيقية من قاعدة البيانات
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Building, Eye, Flame, Globe, MapPin, FileBarChart, Loader2, FileText, Send, DollarSign, CheckCircle, Clock, XCircle, Inbox, Package, BarChart3, Target, Layers } from 'lucide-react';
import VisitorsHeatMap from './analytics/VisitorsHeatMap';
import ViewsLogPage from './analytics/ViewsLogPage';
import PublicPagesStats from './analytics/PublicPagesStats';
import MarketAnalyticsDashboard from './analytics/MarketAnalyticsDashboard';
import PersonalKPIsDashboard from './analytics/PersonalKPIsDashboard';
import MarketStatsDashboard from './analytics/MarketStatsDashboard';
import AnalyticsSummaryDashboard from './analytics/AnalyticsSummaryDashboard';
import { useAnalyticsStats } from '@/hooks/useAnalyticsStats';
import { useReceivedDocuments } from '@/hooks/useReceivedDocuments';
import { useCRMCustomers } from '@/hooks/useCRMCustomers';

interface Metric {
  title: string;
  value: string;
  change: string;
  color: string;
  icon: string;
}

interface Client {
  name: string;
  deals: number;
  value: string;
  status: string;
}

interface DocumentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
}

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState<'market-analytics' | 'personal-kpis' | 'market-stats' | 'summary' | 'platform' | 'public-pages'>('personal-kpis');
  const { platformStats, loading } = useAnalyticsStats();
  const { documents, loading: docsLoading } = useReceivedDocuments();
  const { customers } = useCRMCustomers();
  
  // إحصائيات المستندات المستلمة
  const [requestsStats, setRequestsStats] = useState<DocumentStats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
  const [offersStats, setOffersStats] = useState<DocumentStats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
  const [quotesStats, setQuotesStats] = useState<DocumentStats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
  
  // تحميل إحصائيات المستندات من قاعدة البيانات
  useEffect(() => {
    if (docsLoading) return;
    
    try {
      // جمع كل المستندات من الـ hook والعملاء
      const allDocs: any[] = [...documents];
      customers.forEach((customer: any) => {
        const metadata = customer.metadata as any;
        if (metadata?.documents) {
          allDocs.push(...metadata.documents);
        }
      });

      // تصنيف المستندات
      const requests = allDocs.filter(d => d.document_type === 'property_request' || d.document_type === 'request');
      const offers = allDocs.filter(d => d.document_type === 'property_offer' || d.document_type === 'offer');
      const quotes = allDocs.filter(d => d.document_type === 'quotation_request' || d.document_type === 'quotation' || d.document_type === 'receipt');

      // حساب إحصائيات الطلبات
      setRequestsStats({
        total: requests.length,
        pending: requests.filter(d => !d.status || d.status === 'pending').length,
        approved: requests.filter(d => d.status === 'approved').length,
        rejected: requests.filter(d => d.status === 'rejected').length,
        totalAmount: requests.reduce((sum, d) => {
          const data = d.data as any;
          return sum + (data?.total || data?.budget || 0);
        }, 0)
      });

      // حساب إحصائيات العروض
      setOffersStats({
        total: offers.length,
        pending: offers.filter(d => !d.status || d.status === 'pending').length,
        approved: offers.filter(d => d.status === 'approved').length,
        rejected: offers.filter(d => d.status === 'rejected').length,
        totalAmount: offers.reduce((sum, d) => {
          const data = d.data as any;
          return sum + (data?.total || data?.price || 0);
        }, 0)
      });

      // حساب إحصائيات عروض الأسعار
      setQuotesStats({
        total: quotes.length,
        pending: quotes.filter(d => !d.status || d.status === 'pending').length,
        approved: quotes.filter(d => d.status === 'approved').length,
        rejected: quotes.filter(d => d.status === 'rejected').length,
        totalAmount: quotes.reduce((sum, d) => {
          const data = d.data as any;
          return sum + (data?.total || 0);
        }, 0)
      });
    } catch (error) {
      console.error('Error loading document stats:', error);
    }
  }, [documents, customers, docsLoading]);
  
  const metrics: Metric[] = [
    { title: 'إجمالي الإيرادات', value: '$245,880', change: '+12.5%', color: 'text-green-600', icon: '📈' },
    { title: 'العملاء الجدد', value: '1,245', change: '+8.2%', color: 'text-blue-600', icon: '👥' },
    { title: 'معدل التحويل', value: '34.7%', change: '+3.1%', color: 'text-purple-600', icon: '🎯' },
    { title: 'متوسط قيمة الطلب', value: '$1,245', change: '+5.8%', color: 'text-amber-600', icon: '💰' },
    { title: 'رضا العملاء', value: '94.2%', change: '+2.3%', color: 'text-emerald-600', icon: '⭐' },
    { title: 'زمن الاستجابة', value: '2.4س', change: '-0.8%', color: 'text-red-600', icon: '⏱️' }
  ];
  
  const chartData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    revenue: [45000, 52000, 48000, 61000, 58000, 72000, 68000, 75000, 82000, 78000, 85000, 92000],
    customers: [320, 380, 410, 450, 480, 520, 510, 580, 620, 590, 640, 700]
  };

  const topClients: Client[] = [
    { name: 'أحمد محمد', deals: 12, value: '$45,800', status: 'نشط' },
    { name: 'شركة التقنية', deals: 8, value: '$38,500', status: 'مميز' },
    { name: 'سارة عبدالله', deals: 15, value: '$32,100', status: 'نشط' },
    { name: 'مؤسسة النور', deals: 6, value: '$28,400', status: 'جديد' },
    { name: 'محمد السعيد', deals: 10, value: '$24,900', status: 'نشط' }
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'مميز': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'جديد': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const maxRevenue = Math.max(...chartData.revenue);

  return (
    <div className="space-y-6">
      {/* تبويبات رئيسية */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <TabsList className="inline-flex min-w-max bg-gray-100 dark:bg-gray-800 gap-1 p-1">
            <TabsTrigger value="personal-kpis" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              مؤشراتي الشخصية
            </TabsTrigger>
            <TabsTrigger value="market-analytics" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              تحليلات الأداء
            </TabsTrigger>
            <TabsTrigger value="market-stats" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              إحصائيات السوق
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ملخص شامل
            </TabsTrigger>
            <TabsTrigger value="public-pages" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <FileBarChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              الصفحات العامة
            </TabsTrigger>
            <TabsTrigger value="platform" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm whitespace-nowrap">
              <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              منصتي
            </TabsTrigger>
          </TabsList>
        </div>

        {/* تبويب مؤشرات الأداء الشخصية */}
        <TabsContent value="personal-kpis" className="space-y-6 mt-6">
          <PersonalKPIsDashboard />
        </TabsContent>

        {/* تبويب تحليلات الأداء الشاملة */}
        <TabsContent value="market-analytics" className="space-y-6 mt-6">
          <MarketAnalyticsDashboard />
        </TabsContent>

        {/* تبويب إحصائيات السوق */}
        <TabsContent value="market-stats" className="space-y-6 mt-6">
          <MarketStatsDashboard />
        </TabsContent>

        {/* تبويب الملخص الشامل */}
        <TabsContent value="summary" className="space-y-6 mt-6">
          <AnalyticsSummaryDashboard />
        </TabsContent>


        {/* تبويب الصفحات العامة */}
        <TabsContent value="public-pages" className="space-y-6 mt-6">
          <PublicPagesStats />
        </TabsContent>

        {/* تبويب منصتي */}
        <TabsContent value="platform" className="space-y-6 mt-6">
          {/* إحصائيات سريعة للمنصة */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="mr-2 text-muted-foreground">جاري تحميل الإحصائيات...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي المشاهدات</p>
                      <p className="text-3xl font-bold text-red-600">{platformStats.totalViews}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">مشاهدات اليوم</p>
                      <p className="text-3xl font-bold text-orange-600">{platformStats.todayViews}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">مدن الزوار</p>
                      <p className="text-3xl font-bold text-blue-600">{platformStats.uniqueCities}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">زوار فريدين</p>
                      <p className="text-3xl font-bold text-purple-600">{platformStats.uniqueVisitors}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* خريطة الزوار الحرارية */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="w-5 h-5 text-red-500" />
                خريطة توزيع الزوار
                <Badge className="bg-[#01411C] text-white mr-2">مباشر</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VisitorsHeatMap />
            </CardContent>
          </Card>

          {/* سجل المشاهدات */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5 text-blue-500" />
                سجل المشاهدات التفصيلي
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ViewsLogPage embedded={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
