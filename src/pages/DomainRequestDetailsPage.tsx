/**
 * DomainRequestDetailsPage.tsx
 * صفحة تفاصيل طلب النطاق مع إمكانية اختيار نطاق بديل
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Globe, Check, X, Clock, AlertTriangle, Crown, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DomainRequest {
  id: string;
  user_id: string;
  requested_title: string;
  company_name: string | null;
  website_url: string | null;
  account_type: string | null;
  status: string;
  rejection_reason: string | null;
  matched_company: string | null;
  price: number | null;
  price_enabled: boolean | null;
  priority_revoked: boolean | null;
  priority_revoked_at: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const DomainRequestDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  
  const [request, setRequest] = useState<DomainRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [alternativeTitle, setAlternativeTitle] = useState('');
  const [isCheckingAlternative, setIsCheckingAlternative] = useState(false);
  const [alternativeStatus, setAlternativeStatus] = useState<'available' | 'unavailable' | 'pending' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب تفاصيل الطلب
  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('domain_requests')
          .select('*')
          .eq('id', requestId)
          .maybeSingle();

        if (error) throw error;
        setRequest(data);
      } catch (error) {
        console.error('Error fetching request:', error);
        toast.error('حدث خطأ في جلب بيانات الطلب');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  // التحقق من توفر النطاق البديل
  const checkAlternativeAvailability = useCallback(async (title: string) => {
    if (!title || title.length < 3) {
      setAlternativeStatus(null);
      return;
    }

    setIsCheckingAlternative(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-domain', {
        body: {
          userTitle: title,
          companyName: request?.company_name || '',
          websiteUrl: request?.website_url || '',
          accountType: request?.account_type || 'individual'
        }
      });

      if (error) throw error;
      setAlternativeStatus(data.status);
    } catch (error) {
      console.error('Error checking alternative:', error);
      setAlternativeStatus(null);
    } finally {
      setIsCheckingAlternative(false);
    }
  }, [request]);

  // التحقق عند تغيير القيمة (مع debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAlternativeAvailability(alternativeTitle);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [alternativeTitle, checkAlternativeAvailability]);

  // إرسال طلب النطاق البديل
  const submitAlternativeRequest = async () => {
    if (!alternativeTitle || alternativeStatus !== 'available') return;
    
    setIsSubmitting(true);
    try {
      // تحديث الطلب الحالي بالنطاق الجديد
      const { error } = await supabase
        .from('domain_requests')
        .update({
          requested_title: alternativeTitle,
          status: 'pending',
          rejection_reason: null,
          priority_revoked: false,
          priority_revoked_at: null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('تم إرسال طلب النطاق البديل للمراجعة');
      navigate('/domain-requests');
    } catch (error) {
      console.error('Error submitting alternative:', error);
      toast.error('حدث خطأ في إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  // إنشاء طلب جديد بدلاً من تحديث الحالي
  const createNewRequest = async () => {
    if (!alternativeTitle || alternativeStatus !== 'available' || !user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('domain_requests')
        .insert({
          user_id: user.id,
          requested_title: alternativeTitle,
          company_name: request?.company_name || null,
          website_url: request?.website_url || null,
          account_type: request?.account_type || 'individual',
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('لديك طلب سابق لهذا النطاق');
          return;
        }
        throw error;
      }

      toast.success('تم إنشاء طلب جديد للنطاق البديل');
      navigate('/domain-requests');
    } catch (error) {
      console.error('Error creating new request:', error);
      toast.error('حدث خطأ في إنشاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">✅ مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">❌ مرفوض</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">⏳ قيد المراجعة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAlternativeStatusIcon = () => {
    if (isCheckingAlternative) {
      return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
    }
    switch (alternativeStatus) {
      case 'available':
        return <Check className="w-5 h-5 text-emerald-500" />;
      case 'unavailable':
        return <X className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-muted" />;
    }
  };

  const getAlternativeStatusColor = () => {
    switch (alternativeStatus) {
      case 'available':
        return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      case 'unavailable':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'pending':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20';
      default:
        return 'border-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">الطلب غير موجود</h2>
            <p className="text-muted-foreground mb-4">لم يتم العثور على طلب النطاق المطلوب</p>
            <Button onClick={() => navigate('/domain-requests')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للطلبات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/domain-requests')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تفاصيل طلب النطاق</h1>
            <p className="text-muted-foreground text-sm">مراجعة وإدارة طلب النطاق الخاص بك</p>
          </div>
        </div>

        {/* Request Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">WasataAI.com/{request.requested_title}</CardTitle>
                  <CardDescription>
                    {request.created_at && format(new Date(request.created_at), 'dd MMMM yyyy', { locale: ar })}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(request.status || 'pending')}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">نوع الحساب:</span>
                <p className="font-medium">{request.account_type === 'company' ? 'شركة' : 'فرد'}</p>
              </div>
              {request.company_name && (
                <div>
                  <span className="text-muted-foreground">اسم الشركة:</span>
                  <p className="font-medium">{request.company_name}</p>
                </div>
              )}
              {request.website_url && (
                <div>
                  <span className="text-muted-foreground">الموقع الإلكتروني:</span>
                  <p className="font-medium text-primary">{request.website_url}</p>
                </div>
              )}
              {request.price && request.price_enabled && (
                <div>
                  <span className="text-muted-foreground">رسوم النطاق:</span>
                  <p className="font-medium text-amber-600">{request.price} ريال</p>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {request.status === 'rejected' && request.rejection_reason && (
              <Alert className="border-red-300 bg-red-50 dark:bg-red-950/20">
                <X className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  <strong>سبب الرفض:</strong> {request.rejection_reason}
                </AlertDescription>
              </Alert>
            )}

            {/* Priority Revoked */}
            {request.priority_revoked && (
              <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                <Crown className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  <strong>تم سحب الأولوية:</strong> المالك الأصلي للنطاق طالب بحقه. يرجى اختيار نطاق بديل.
                  {request.priority_revoked_at && (
                    <span className="block text-xs mt-1">
                      بتاريخ: {format(new Date(request.priority_revoked_at), 'dd MMMM yyyy', { locale: ar })}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Matched Company */}
            {request.matched_company && (
              <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <strong>ملاحظة:</strong> النطاق مشابه لشركة مسجلة: {request.matched_company}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Alternative Domain Selection - Show only if rejected or revoked */}
        {(request.status === 'rejected' || request.priority_revoked) && (
          <Card className="border-2 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="w-5 h-5 text-primary" />
                اختيار نطاق بديل
              </CardTitle>
              <CardDescription>
                يمكنك اختيار نطاق جديد بدلاً من النطاق المرفوض
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>النطاق البديل</Label>
                <div className="flex items-center gap-2" dir="ltr">
                  {/* دائرة حالة التوفر */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${getAlternativeStatusColor()}`}>
                    {getAlternativeStatusIcon()}
                  </div>
                  
                  <span className="text-primary font-bold text-sm whitespace-nowrap">
                    WasataAI.com/
                  </span>
                  
                  <Input
                    value={alternativeTitle}
                    onChange={(e) => setAlternativeTitle(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, ''))}
                    placeholder="اسمك أو اسم شركتك"
                    className="flex-1"
                    dir="ltr"
                    maxLength={30}
                  />
                </div>
              </div>

              {/* Alternative Status Messages */}
              {alternativeStatus === 'available' && alternativeTitle && (
                <div className="p-3 rounded bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    ✅ النطاق متاح! رابطك الجديد سيكون: WasataAI.com/{alternativeTitle}
                  </p>
                </div>
              )}

              {alternativeStatus === 'unavailable' && (
                <div className="p-3 rounded bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    ❌ هذا النطاق غير متاح، يرجى اختيار نطاق آخر
                  </p>
                </div>
              )}

              {alternativeStatus === 'pending' && (
                <div className="p-3 rounded bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    ⏳ هذا النطاق يحتاج موافقة الإدارة
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={submitAlternativeRequest}
                  disabled={!alternativeTitle || alternativeStatus !== 'available' || isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 ml-2" />
                  )}
                  تحديث الطلب بالنطاق البديل
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Warning */}
        <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/30">
          <Crown className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
            <strong>تنبيه:</strong> أولوية اختيار النطاق دائماً ستكون لمن يملك النطاق الأصلي حتى لو تم اختيارك له قبله أو تم دفع رسوم عليه.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default DomainRequestDetailsPage;
