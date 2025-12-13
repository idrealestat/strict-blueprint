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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CreditCard, Loader2, Link, User, Briefcase, Building, Phone, Mail, FileText } from 'lucide-react';

const cardSchema = z.object({
  slug: z
    .string()
    .min(3, 'الرابط يجب أن يكون 3 أحرف على الأقل')
    .regex(/^[a-z0-9-]+$/, 'استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(500, 'النبذة يجب ألا تتجاوز 500 حرف').optional(),
  phone: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  template: z.string(),
  layout: z.string(),
});

type CardFormValues = z.infer<typeof cardSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CardFormValues) => void;
}

export function CreateCardDialog({ open, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      slug: '',
      fullName: '',
      jobTitle: '',
      company: '',
      bio: '',
      phone: '',
      email: '',
      template: 'modern',
      layout: 'standard',
    },
  });

  const handleSubmit = async (data: CardFormValues) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تم إنشاء البطاقة بنجاح', {
        description: 'يمكنك الآن مشاركة بطاقتك الرقمية',
      });
      
      onSubmit(data);
      form.reset();
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء البطاقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-[#01411C]" />
            بطاقة أعمال رقمية جديدة
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    رابط البطاقة *
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-r-md border border-l-0">
                        wasata.ai/cards/
                      </span>
                      <Input 
                        placeholder="your-name" 
                        {...field} 
                        className="rounded-r-none border-[#01411C]/30 focus:border-[#01411C]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    الاسم الكامل *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="أحمد محمد" 
                      {...field} 
                      className="border-[#01411C]/30 focus:border-[#01411C]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Title & Company */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      المسمى الوظيفي
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="وسيط عقاري" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      الشركة
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="نوفا العقارية" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    نبذة مختصرة
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="نبذة عن خبرتك وتخصصك..." 
                      {...field}
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-left">
                    {field.value?.length || 0}/500
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الجوال
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+966501234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Template & Layout */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القالب</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        <SelectItem value="modern">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#01411C]" />
                            عصري
                          </span>
                        </SelectItem>
                        <SelectItem value="luxury">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#1a1a1a]" />
                            فاخر
                          </span>
                        </SelectItem>
                        <SelectItem value="minimal">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-400" />
                            بسيط
                          </span>
                        </SelectItem>
                        <SelectItem value="creative">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500" />
                            إبداعي
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="layout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصميم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        <SelectItem value="standard">قياسي</SelectItem>
                        <SelectItem value="creative">إبداعي</SelectItem>
                        <SelectItem value="compact">مدمج</SelectItem>
                      </SelectContent>
                    </Select>
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
                className="bg-[#01411C] hover:bg-[#01411C]/90 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <CreditCard className="ml-2 h-4 w-4" />
                    إنشاء البطاقة
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
