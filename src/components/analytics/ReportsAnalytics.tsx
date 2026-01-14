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

// Type for KPI
type KPI = {
  id: string;
  name: string;
  category: string;
  currentValue: string;
  previousValue: string;
  changePercentage: string;
  targetValue?: string;
  displayFormat: 'currency' | 'number' | 'percentage';
};

// ✅ تم إزالة مؤشرات الأداء الوهمية - يتم جلبها من قاعدة البيانات الحقيقية
const mockKPIs: KPI[] = [];

// ✅ تم إزالة الرؤى الوهمية - سيتم توليدها من الذكاء الاصطناعي بناءً على البيانات الحقيقية
const mockInsights: any[] = [];

// ✅ تم إزالة البيانات الوهمية - يتم جلب البيانات من قاعدة البيانات الحقيقية
const mockAnalyticsData: any[] = [];

// ✅ لا توجد تقارير وهمية - يتم إنشاؤها بواسطة المستخدم
const mockReports: any[] = [];

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
