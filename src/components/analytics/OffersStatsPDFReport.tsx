/**
 * OffersStatsPDFReport.tsx
 * تصدير تقارير PDF للإحصائيات مع الرسوم البيانية
 */

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, BarChart3, Table, Eye, Calendar, CalendarDays, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OfferStat {
  id: string;
  title: string;
  views: number;
  monthlyViews: number;
  yearlyViews: number;
  interactions: number;
  city?: string;
  district?: string;
  topDevices?: { device: string; count: number }[];
  topCities?: { city: string; count: number }[];
}

interface StatsData {
  currentViews: number;
  monthlyViews: number;
  yearlyViews: number;
  totalInteractions: number;
  history: { date: string; views: number; interactions: number }[];
  offers: OfferStat[];
}

interface OffersStatsPDFReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statsData: StatsData;
  chartsContainerRef?: React.RefObject<HTMLDivElement>;
}

// مكون قابل للتصدير كـ PDF (سيتم عرضه في الـ dialog)
const ReportContent = React.forwardRef<HTMLDivElement, { statsData: StatsData; sections: string[] }>(
  ({ statsData, sections }, ref) => {
    const formatNumber = (n: number) => n.toLocaleString('ar-SA');
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <div ref={ref} className="bg-white p-6 text-right" dir="rtl" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="bg-[#01411C] text-white p-6 rounded-xl mb-6">
          <h1 className="text-2xl font-bold mb-2">تقرير إحصائيات المنصة</h1>
          <p className="text-[#D4AF37]">Wasata Real Estate Analytics Report</p>
          <p className="text-sm text-white/70 mt-2">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        {/* Summary Section */}
        {sections.includes('summary') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#01411C] mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" /> ملخص الإحصائيات
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <Eye className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <p className="text-2xl font-bold text-emerald-700">{formatNumber(statsData.currentViews)}</p>
                <p className="text-sm text-gray-600">المشاهدات الآن</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-700">{formatNumber(statsData.monthlyViews)}</p>
                <p className="text-sm text-gray-600">المشاهدات الشهرية</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <CalendarDays className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-700">{formatNumber(statsData.yearlyViews)}</p>
                <p className="text-sm text-gray-600">المشاهدات السنوية</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <Activity className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                <p className="text-2xl font-bold text-amber-700">{formatNumber(statsData.totalInteractions)}</p>
                <p className="text-sm text-gray-600">التفاعلات</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts placeholder (actual charts will be captured via html2canvas) */}
        {sections.includes('charts') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#01411C] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> الرسوم البيانية
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p>سيتم إضافة الرسوم البيانية من الواجهة</p>
            </div>
          </div>
        )}

        {/* Historical Data Table */}
        {sections.includes('table') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#01411C] mb-4 flex items-center gap-2">
              <Table className="w-5 h-5" /> بيانات المشاهدات والتفاعلات
            </h2>
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-[#01411C] text-white">
                  <th className="border border-gray-200 p-2">التاريخ</th>
                  <th className="border border-gray-200 p-2">المشاهدات</th>
                  <th className="border border-gray-200 p-2">التفاعلات</th>
                </tr>
              </thead>
              <tbody>
                {statsData.history.slice(-30).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-200 p-2">{formatDate(row.date)}</td>
                    <td className="border border-gray-200 p-2 font-medium">{formatNumber(row.views)}</td>
                    <td className="border border-gray-200 p-2 font-medium">{formatNumber(row.interactions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Per-Offer Details */}
        {sections.includes('offers') && statsData.offers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#01411C] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> تفاصيل كل عرض
            </h2>
            <div className="space-y-4">
              {statsData.offers.slice(0, 10).map((offer, idx) => (
                <div key={offer.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{idx + 1}. {offer.title}</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">المشاهدات:</span> <span className="font-bold">{formatNumber(offer.views)}</span></div>
                    <div><span className="text-gray-500">الشهرية:</span> <span className="font-bold">{formatNumber(offer.monthlyViews)}</span></div>
                    <div><span className="text-gray-500">السنوية:</span> <span className="font-bold">{formatNumber(offer.yearlyViews)}</span></div>
                    <div><span className="text-gray-500">التفاعلات:</span> <span className="font-bold">{formatNumber(offer.interactions)}</span></div>
                  </div>
                  {offer.city && (
                    <p className="text-sm text-gray-500 mt-2">الموقع: {offer.city} {offer.district ? ` - ${offer.district}` : ''}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-gray-400">
          <p>تم إنشاء هذا التقرير بواسطة منصة وساطة العقارية</p>
          <p>Wasata Real Estate Platform © {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  }
);

ReportContent.displayName = 'ReportContent';

export const OffersStatsPDFReport: React.FC<OffersStatsPDFReportProps> = ({
  open,
  onOpenChange,
  statsData,
  chartsContainerRef,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<string[]>(['summary', 'charts', 'table', 'offers']);

  const toggleSection = (section: string) => {
    setSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const reportElement = reportRef.current;
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`wasata-stats-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('تم تصدير التقرير بنجاح');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setIsGenerating(false);
    }
  };

  const sectionOptions = [
    { id: 'summary', label: 'ملخص الإحصائيات', icon: <Eye className="w-4 h-4" /> },
    { id: 'charts', label: 'الرسوم البيانية', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'table', label: 'جدول البيانات', icon: <Table className="w-4 h-4" /> },
    { id: 'offers', label: 'تفاصيل العروض', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#01411C]">
            <Download className="w-5 h-5" />
            تصدير تقرير PDF
          </DialogTitle>
          <DialogDescription>
            اختر الأقسام التي تريد تضمينها في التقرير
          </DialogDescription>
        </DialogHeader>

        {/* Section Selection */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sectionOptions.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox
                    id={opt.id}
                    checked={sections.includes(opt.id)}
                    onCheckedChange={() => toggleSection(opt.id)}
                  />
                  <Label htmlFor={opt.id} className="flex items-center gap-1 cursor-pointer text-sm">
                    {opt.icon} {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="border rounded-lg overflow-auto max-h-[400px] bg-gray-100 p-2">
          <div className="transform scale-50 origin-top-right" style={{ width: '200%' }}>
            <ReportContent ref={reportRef} statsData={statsData} sections={sections} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGenerating || sections.length === 0}
            className="bg-[#01411C] hover:bg-[#015f2a] text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 ml-2" />
                تحميل PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OffersStatsPDFReport;
