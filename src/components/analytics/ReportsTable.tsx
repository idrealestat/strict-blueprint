'use client';

import { Download, Eye, Trash2, Clock, CheckCircle, XCircle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface Report {
  id: string;
  title: string;
  reportType: string;
  format: string;
  status: string;
  totalRecords: number | null;
  createdAt: string;
}

interface Props {
  reports: Report[];
  onDelete: (id: string) => void;
}

export function ReportsTable({ reports, onDelete }: Props) {
  const handleDownload = (id: string) => {
    toast.success('جاري تحميل التقرير...');
    // TODO: Implement actual download
  };

  const handleView = (id: string) => {
    toast.info('جاري فتح التقرير...');
    // TODO: Implement view functionality
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
      onDelete(id);
      toast.success('تم حذف التقرير');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: typeof Clock }> = {
      pending: { 
        label: 'قيد الانتظار', 
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: Clock 
      },
      generating: { 
        label: 'جاري الإنشاء', 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse',
        icon: RefreshCw 
      },
      completed: { 
        label: 'مكتمل', 
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle 
      },
      failed: { 
        label: 'فشل', 
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle 
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <Badge className={badge.className}>
        <Icon className="h-3 w-3 ml-1" />
        {badge.label}
      </Badge>
    );
  };

  const getFormatBadge = (format: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-100 text-red-800 border-red-200',
      csv: 'bg-green-100 text-green-800 border-green-200',
      excel: 'bg-blue-100 text-blue-800 border-blue-200',
      json: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    return (
      <Badge className={colors[format] || 'bg-gray-100 text-gray-800'}>
        {format.toUpperCase()}
      </Badge>
    );
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sales: 'المبيعات',
      finance: 'المالية',
      properties: 'العقارات',
      customers: 'العملاء',
      calendar: 'المواعيد',
      commissions: 'العمولات',
      analytics: 'التحليلات',
    };
    return labels[type] || type;
  };

  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-medium text-lg">لا توجد تقارير</h3>
        <p className="text-sm text-muted-foreground mt-1">
          اضغط على "إنشاء تقرير" لإنشاء تقرير جديد
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#01411C]" />
          التقارير
          <Badge variant="outline">{reports.length}</Badge>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="text-right font-semibold">العنوان</TableHead>
              <TableHead className="text-right font-semibold">النوع</TableHead>
              <TableHead className="text-right font-semibold">الصيغة</TableHead>
              <TableHead className="text-right font-semibold">الحالة</TableHead>
              <TableHead className="text-right font-semibold">السجلات</TableHead>
              <TableHead className="text-right font-semibold">التاريخ</TableHead>
              <TableHead className="text-right font-semibold">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getReportTypeLabel(report.reportType)}</Badge>
                </TableCell>
                <TableCell>{getFormatBadge(report.format)}</TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>
                  {report.totalRecords !== null ? (
                    <span className="font-medium">{report.totalRecords.toLocaleString('ar-SA')}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(report.createdAt), 'dd MMM yyyy', {
                    locale: ar,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {report.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(report.id)}
                        className="hover:bg-green-50 hover:text-green-600"
                        title="تحميل"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(report.id)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                      title="عرض"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
