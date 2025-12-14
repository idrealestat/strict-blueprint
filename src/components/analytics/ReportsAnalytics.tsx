'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, FileText, Lightbulb, Download, Plus, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { KPIGrid } from './KPIGrid';
import { AnalyticsChart } from './AnalyticsChart';
import { AIInsightsPanel } from './AIInsightsPanel';
import { ReportsTable } from './ReportsTable';
import { CreateReportDialog } from './CreateReportDialog';
import AnalyticsDashboard from '../AnalyticsDashboard';

// Mock data for KPIs
const mockKPIs: Array<{
  id: string;
  name: string;
  category: string;
  currentValue: string;
  previousValue: string;
  changePercentage: string;
  targetValue?: string;
  displayFormat: 'currency' | 'number' | 'percentage';
}> = [
  {
    id: '1',
    name: 'إجمالي المبيعات',
    category: 'sales',
    currentValue: '2500000',
    previousValue: '2100000',
    changePercentage: '19.05',
    targetValue: '3000000',
    displayFormat: 'currency',
  },
  {
    id: '2',
    name: 'عدد الصفقات',
    category: 'sales',
    currentValue: '45',
    previousValue: '38',
    changePercentage: '18.42',
    targetValue: '50',
    displayFormat: 'number',
  },
  {
    id: '3',
    name: 'متوسط قيمة الصفقة',
    category: 'sales',
    currentValue: '55555',
    previousValue: '55263',
    changePercentage: '0.53',
    displayFormat: 'currency',
  },
  {
    id: '4',
    name: 'إجمالي العمولات',
    category: 'finance',
    currentValue: '65000',
    previousValue: '55000',
    changePercentage: '18.18',
    targetValue: '75000',
    displayFormat: 'currency',
  },
  {
    id: '5',
    name: 'معدل التحويل',
    category: 'sales',
    currentValue: '25.5',
    previousValue: '22.3',
    changePercentage: '14.35',
    targetValue: '30',
    displayFormat: 'percentage',
  },
  {
    id: '6',
    name: 'رضا العملاء',
    category: 'customers',
    currentValue: '4.6',
    previousValue: '4.4',
    changePercentage: '4.55',
    targetValue: '4.8',
    displayFormat: 'number',
  },
];

// Mock AI Insights
const mockInsights = [
  {
    id: '1',
    insightType: 'recommendation',
    category: 'sales',
    title: 'فرصة لزيادة المبيعات',
    description: 'حي النخيل يشهد ارتفاع في الطلب بنسبة 35%. ننصح بالتركيز على عقارات هذا الحي.',
    priority: 'high',
    confidenceScore: '85',
    impactScore: '90',
    suggestedActions: JSON.stringify([
      'إضافة المزيد من العقارات في حي النخيل',
      'التواصل مع الملاك في المنطقة',
      'تكثيف التسويق للحي',
    ]),
    expectedOutcome: 'زيادة متوقعة 20-30% في المبيعات',
  },
  {
    id: '2',
    insightType: 'warning',
    category: 'customers',
    title: 'عملاء بحاجة للمتابعة',
    description: 'لديك 12 عميل لم يتم التواصل معهم منذ أكثر من 30 يوم.',
    priority: 'medium',
    confidenceScore: '95',
    impactScore: '70',
    suggestedActions: JSON.stringify([
      'إنشاء حملة متابعة',
      'جدولة مكالمات',
      'إرسال عروض جديدة',
    ]),
  },
  {
    id: '3',
    insightType: 'opportunity',
    category: 'properties',
    title: 'عقارات تحتاج تحديث السعر',
    description: 'العقارات في حي الورود أقل بـ 15% من متوسط السوق. فرصة لزيادة الأسعار.',
    priority: 'high',
    confidenceScore: '88',
    impactScore: '85',
    suggestedActions: JSON.stringify([
      'مراجعة أسعار العقارات',
      'تحديث التسعير',
      'التواصل مع الملاك',
    ]),
    expectedOutcome: 'زيادة متوقعة في العمولات بنسبة 15%',
  },
  {
    id: '4',
    insightType: 'prediction',
    category: 'sales',
    title: 'توقعات المبيعات للشهر القادم',
    description: 'بناءً على الاتجاهات الحالية، من المتوقع إتمام 25-30 صفقة الشهر القادم.',
    priority: 'medium',
    confidenceScore: '78',
    impactScore: '60',
  },
  {
    id: '5',
    insightType: 'recommendation',
    category: 'marketing',
    title: 'أفضل وقت للنشر',
    description: 'معظم العملاء يتفاعلون مع العقارات بين 8-10 مساءً. ننصح بالنشر في هذا الوقت.',
    priority: 'low',
    confidenceScore: '82',
    impactScore: '55',
    suggestedActions: JSON.stringify([
      'جدولة المنشورات في المساء',
      'تحسين المحتوى التسويقي',
    ]),
  },
];

// Mock Analytics Data
const mockAnalyticsData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  totalSales: Math.floor(Math.random() * 200000) + 100000,
  salesCount: Math.floor(Math.random() * 10) + 2,
  totalRevenue: Math.floor(Math.random() * 300000) + 150000,
  totalCommissions: Math.floor(Math.random() * 15000) + 5000,
  newCustomers: Math.floor(Math.random() * 8) + 2,
}));

// Mock Reports
const mockReports = [
  {
    id: '1',
    title: 'تقرير المبيعات الشهري - نوفمبر 2025',
    reportType: 'sales',
    format: 'pdf',
    status: 'completed',
    totalRecords: 156,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'تقرير الأداء المالي - الربع الثالث',
    reportType: 'finance',
    format: 'excel',
    status: 'completed',
    totalRecords: 89,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'تقرير العملاء الجدد',
    reportType: 'customers',
    format: 'csv',
    status: 'generating',
    totalRecords: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'تقرير العقارات المباعة',
    reportType: 'properties',
    format: 'pdf',
    status: 'completed',
    totalRecords: 234,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'تقرير المواعيد - أكتوبر',
    reportType: 'calendar',
    format: 'excel',
    status: 'failed',
    totalRecords: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface ReportsAnalyticsProps {
  onBack?: () => void;
}

export function ReportsAnalytics({ onBack }: ReportsAnalyticsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [insights, setInsights] = useState(mockInsights);
  const [reports, setReports] = useState(mockReports);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleGenerateInsights = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleDismissInsight = (id: string) => {
    setInsights(insights.filter(insight => insight.id !== id));
  };

  const handleCreateReport = (data: any) => {
    const newReport = {
      id: String(reports.length + 1),
      title: data.title,
      reportType: data.reportType,
      format: data.format,
      status: 'pending',
      totalRecords: null,
      createdAt: new Date().toISOString(),
    };
    setReports([newReport, ...reports]);
    setShowCreateDialog(false);
  };

  const handleDeleteReport = (id: string) => {
    setReports(reports.filter(report => report.id !== id));
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
                  <RefreshCw className="h-4 w-4 ml-2" />
                  رجوع
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-[#D4AF37]" />
                  التحليلات والتقارير
                </h1>
                <p className="text-white/80 mt-1">
                  رؤى ذكية وتحليلات شاملة
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateInsights}
                disabled={isRefreshing}
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                {isRefreshing ? (
                  <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="ml-2 h-4 w-4" />
                )}
                توليد رؤى جديدة
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/90"
              >
                <FileText className="ml-2 h-4 w-4" />
                إنشاء تقرير
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* برومبت التحليلات الكامل */}
        <AnalyticsDashboard />

        {/* KPIs */}
        <KPIGrid kpis={mockKPIs} className="mb-6" />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-r-4 border-r-[#01411C]">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#01411C]" />
                الإيرادات والمبيعات
              </h2>
              <AnalyticsChart data={mockAnalyticsData} />
            </Card>

            <Tabs defaultValue="reports" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="reports" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                  <FileText className="h-4 w-4 ml-2" />
                  التقارير
                </TabsTrigger>
                <TabsTrigger value="snapshots" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                  <BarChart3 className="h-4 w-4 ml-2" />
                  اللقطات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reports" className="mt-4">
                <ReportsTable 
                  reports={reports} 
                  onDelete={handleDeleteReport}
                />
              </TabsContent>

              <TabsContent value="snapshots" className="mt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">اللقطات التحليلية</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600">آخر 7 أيام</p>
                      <p className="text-2xl font-bold text-green-800">1,250,000 ريال</p>
                      <p className="text-xs text-green-500">+15% من الأسبوع الماضي</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">آخر 30 يوم</p>
                      <p className="text-2xl font-bold text-blue-800">4,500,000 ريال</p>
                      <p className="text-xs text-blue-500">+22% من الشهر الماضي</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-600">آخر 90 يوم</p>
                      <p className="text-2xl font-bold text-purple-800">12,800,000 ريال</p>
                      <p className="text-xs text-purple-500">+8% من الربع الماضي</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Insights */}
          <div>
            <AIInsightsPanel 
              insights={insights} 
              onDismiss={handleDismissInsight}
              onRefresh={handleGenerateInsights}
            />
          </div>
        </div>
      </div>

      {/* Create Report Dialog */}
      <CreateReportDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateReport}
      />
    </div>
  );
}
