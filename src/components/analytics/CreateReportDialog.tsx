'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileText, Calendar, Loader2 } from 'lucide-react';

const reportSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  reportType: z.string().min(1, 'يرجى اختيار نوع التقرير'),
  format: z.string().min(1, 'يرجى اختيار الصيغة'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  templateId: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFormValues) => void;
}

const reportTemplates = [
  { id: '1', name: 'تقرير المبيعات الشهري', reportType: 'sales' },
  { id: '2', name: 'تقرير الأداء المالي', reportType: 'finance' },
  { id: '3', name: 'تقرير العملاء', reportType: 'customers' },
  { id: '4', name: 'تقرير العقارات', reportType: 'properties' },
  { id: '5', name: 'تقرير المواعيد', reportType: 'calendar' },
];

export function CreateReportDialog({ open, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      reportType: 'sales',
      format: 'pdf',
      dateFrom: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const handleSubmit = async (data: ReportFormValues) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تم بدء إنشاء التقرير', {
        description: 'سيتم إعلامك عند اكتمال التقرير',
      });
      
      onSubmit(data);
      form.reset();
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      form.setValue('title', template.name);
      form.setValue('reportType', template.reportType);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-[#01411C]" />
            إنشاء تقرير جديد
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Template Selection */}
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>قالب (اختياري)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleTemplateSelect(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="border-dashed">
                        <SelectValue placeholder="اختر قالب جاهز..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان التقرير *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="تقرير المبيعات الشهري..." 
                      {...field} 
                      className="border-[#01411C]/30 focus:border-[#01411C]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Report Type & Format */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع التقرير *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sales">المبيعات</SelectItem>
                        <SelectItem value="finance">المالية</SelectItem>
                        <SelectItem value="properties">العقارات</SelectItem>
                        <SelectItem value="customers">العملاء</SelectItem>
                        <SelectItem value="calendar">المواعيد</SelectItem>
                        <SelectItem value="commissions">العمولات</SelectItem>
                        <SelectItem value="analytics">تحليلات شاملة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الصيغة *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            PDF
                          </span>
                        </SelectItem>
                        <SelectItem value="csv">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            CSV
                          </span>
                        </SelectItem>
                        <SelectItem value="excel">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Excel
                          </span>
                        </SelectItem>
                        <SelectItem value="json">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            JSON
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      من تاريخ
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      إلى تاريخ
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-[#01411C] hover:bg-[#01411C]/90 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <FileText className="ml-2 h-4 w-4" />
                    إنشاء التقرير
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
