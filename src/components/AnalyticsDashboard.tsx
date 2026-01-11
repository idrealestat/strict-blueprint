/**
 * AnalyticsDashboard.tsx
 * لوحة التحليلات - 6 مؤشرات ورسوم بيانية مع قسم منصتي
 * تستخدم البيانات الحقيقية من جدول events
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Building, Eye, Flame, Globe, MapPin, FileBarChart, Loader2, FileText, Send, DollarSign, CheckCircle, Clock, XCircle, Inbox, Package } from 'lucide-react';
import VisitorsHeatMap from './analytics/VisitorsHeatMap';
import ViewsLogPage from './analytics/ViewsLogPage';
import PublicPagesStats from './analytics/PublicPagesStats';
import { useAnalyticsStats } from '@/hooks/useAnalyticsStats';

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
  const [activeTab, setActiveTab] = useState<'market' | 'platform'>('market');
  const { platformStats, loading } = useAnalyticsStats();
  
  // إحصائيات المستندات المستلمة
  const [requestsStats, setRequestsStats] = useState<DocumentStats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
  const [offersStats, setOffersStats] = useState<DocumentStats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
  const [quotesStats, setQuotesStats] = useState<DocumentStats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
  
  // تحميل إحصائيات المستندات من localStorage
  useEffect(() => {
    const loadDocumentStats = () => {
      try {
        // جلب المستندات المستلمة
        const receivedDocs = JSON.parse(localStorage.getItem('received_documents') || '[]');
        // جلب مستندات العملاء
        const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
        
        // جمع كل المستندات
        const allDocs: any[] = [...receivedDocs];
        customers.forEach((customer: any) => {
          if (customer.documents) {
            allDocs.push(...customer.documents);
          }
        });

        // تصنيف المستندات
        const requests = allDocs.filter(d => d.type === 'property_request' || d.type === 'request');
        const offers = allDocs.filter(d => d.type === 'property_offer' || d.type === 'offer');
        const quotes = allDocs.filter(d => d.type === 'quotation_request' || d.type === 'quotation' || d.type === 'receipt');

        // حساب إحصائيات الطلبات
        setRequestsStats({
          total: requests.length,
          pending: requests.filter(d => !d.status || d.status === 'pending').length,
          approved: requests.filter(d => d.status === 'approved').length,
          rejected: requests.filter(d => d.status === 'rejected').length,
          totalAmount: requests.reduce((sum, d) => sum + (d.total || d.budget || 0), 0)
        });

        // حساب إحصائيات العروض
        setOffersStats({
          total: offers.length,
          pending: offers.filter(d => !d.status || d.status === 'pending').length,
          approved: offers.filter(d => d.status === 'approved').length,
          rejected: offers.filter(d => d.status === 'rejected').length,
          totalAmount: offers.reduce((sum, d) => sum + (d.total || d.price || 0), 0)
        });

        // حساب إحصائيات عروض الأسعار
        setQuotesStats({
          total: quotes.length,
          pending: quotes.filter(d => !d.status || d.status === 'pending').length,
          approved: quotes.filter(d => d.status === 'approved').length,
          rejected: quotes.filter(d => d.status === 'rejected').length,
          totalAmount: quotes.reduce((sum, d) => sum + (d.total || 0), 0)
        });
      } catch (error) {
        console.error('Error loading document stats:', error);
      }
    };

    loadDocumentStats();
    
    // الاستماع لتحديثات المستندات
    const handleUpdate = () => loadDocumentStats();
    window.addEventListener('customersUpdated', handleUpdate);
    window.addEventListener('documentsUpdated', handleUpdate);
    window.addEventListener('receivedDocumentFromPublic', handleUpdate);
    
    return () => {
      window.removeEventListener('customersUpdated', handleUpdate);
      window.removeEventListener('documentsUpdated', handleUpdate);
      window.removeEventListener('receivedDocumentFromPublic', handleUpdate);
    };
  }, []);
  
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
        <TabsList className="grid grid-cols-3 w-full max-w-lg bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="market" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-2">
            <TrendingUp className="w-4 h-4" />
            تحليلات السوق
          </TabsTrigger>
          <TabsTrigger value="public-pages" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-2">
            <FileBarChart className="w-4 h-4" />
            الصفحات العامة
          </TabsTrigger>
          <TabsTrigger value="platform" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white gap-2">
            <Building className="w-4 h-4" />
            منصتي
          </TabsTrigger>
        </TabsList>

        {/* تبويب تحليلات السوق */}
        <TabsContent value="market" className="space-y-6 mt-6">
          {/* المؤشرات السريعة */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl">{metric.icon}</div>
                  <div className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${metric.change.startsWith('+') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {metric.change}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {metric.title}
                </div>
              </div>
            ))}
          </div>
          
          {/* الرسم البياني */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">الأداء السنوي</h4>
                <p className="text-gray-600 dark:text-gray-300">مقارنة بين الإيرادات وعدد العملاء</p>
              </div>
              <div className="flex items-center gap-2">
                <select className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 text-sm border-none focus:ring-2 focus:ring-blue-500">
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                </select>
                <button className="px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">
                  تصدير
                </button>
              </div>
            </div>
            
            {/* رسم بياني مبسط */}
            <div className="relative h-64">
              <div className="absolute inset-0 flex items-end gap-1">
                {chartData.revenue.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ height: `${(value / maxRevenue) * 100}%` }}
                      title={`${chartData.labels[index]}: $${value.toLocaleString()}`}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2 hidden md:block">
                      {chartData.labels[index].slice(0, 3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* وسيلة الإيضاح */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">الإيرادات</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">العملاء</span>
              </div>
            </div>
          </div>
          
          {/* إحصائيات الطلبات والعروض وعروض الأسعار المستلمة */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* إحصائيات الطلبات المستلمة */}
            <Card className="border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="w-5 h-5" />
                  الطلبات المستلمة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الإجمالي</span>
                  <span className="text-2xl font-bold text-blue-600">{requestsStats.total}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
                    <Clock className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">معلقة</span>
                    <p className="font-bold text-orange-600">{requestsStats.pending}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">مقبولة</span>
                    <p className="font-bold text-green-600">{requestsStats.approved}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                    <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">مرفوضة</span>
                    <p className="font-bold text-red-600">{requestsStats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات العروض المستلمة */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  العروض المستلمة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الإجمالي</span>
                  <span className="text-2xl font-bold text-purple-600">{offersStats.total}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
                    <Clock className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">معلقة</span>
                    <p className="font-bold text-orange-600">{offersStats.pending}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">مقبولة</span>
                    <p className="font-bold text-green-600">{offersStats.approved}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                    <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">مرفوضة</span>
                    <p className="font-bold text-red-600">{offersStats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات عروض الأسعار المستلمة */}
            <Card className="border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5" />
                  عروض الأسعار المستلمة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الإجمالي</span>
                  <span className="text-2xl font-bold text-amber-600">{quotesStats.total}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
                    <Clock className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">معلقة</span>
                    <p className="font-bold text-orange-600">{quotesStats.pending}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">مقبولة</span>
                    <p className="font-bold text-green-600">{quotesStats.approved}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                    <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">مرفوضة</span>
                    <p className="font-bold text-red-600">{quotesStats.rejected}</p>
                  </div>
                </div>
                {quotesStats.totalAmount > 0 && (
                  <div className="pt-2 border-t border-dashed">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">إجمالي المبالغ</span>
                      <span className="font-bold text-green-600">{quotesStats.totalAmount.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* الجدول */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white">أفضل 5 عملاء</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-right py-3 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">العميل</th>
                    <th className="text-right py-3 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">الصفقات</th>
                    <th className="text-right py-3 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">القيمة</th>
                    <th className="text-right py-3 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">الحالة</th>
                    <th className="text-right py-3 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((client, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm">
                            {client.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white">{client.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span className="font-medium text-gray-800 dark:text-white">{client.deals}</span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span className="font-bold text-green-600 dark:text-green-400">{client.value}</span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                          عرض التفاصيل ←
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
