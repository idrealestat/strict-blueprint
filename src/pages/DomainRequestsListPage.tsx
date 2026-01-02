/**
 * DomainRequestsListPage.tsx
 * صفحة قائمة طلبات النطاقات للمستخدم
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Plus, Clock, Check, X, Crown, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DomainRequest {
  id: string;
  requested_title: string;
  status: string;
  rejection_reason: string | null;
  priority_revoked: boolean | null;
  price: number | null;
  price_enabled: boolean | null;
  created_at: string;
  reviewed_at: string | null;
}

const DomainRequestsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('domain_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast.error('حدث خطأ في جلب الطلبات');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const getStatusBadge = (request: DomainRequest) => {
    if (request.priority_revoked) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-300">⚠️ تم سحب الأولوية</Badge>;
    }
    switch (request.status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">✅ مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">❌ مرفوض</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">⏳ قيد المراجعة</Badge>;
      default:
        return <Badge variant="secondary">{request.status}</Badge>;
    }
  };

  const getStatusIcon = (request: DomainRequest) => {
    if (request.priority_revoked) {
      return <Crown className="w-5 h-5 text-amber-500" />;
    }
    switch (request.status) {
      case 'approved':
        return <Check className="w-5 h-5 text-emerald-500" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Globe className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const needsAction = (request: DomainRequest) => {
    return request.status === 'rejected' || request.priority_revoked;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">طلبات النطاقات</h1>
              <p className="text-muted-foreground text-sm">إدارة طلبات النطاقات الخاصة بك</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {requests.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">لا توجد طلبات</h2>
              <p className="text-muted-foreground mb-4">لم تقم بإرسال أي طلبات نطاقات بعد</p>
              <Button onClick={() => navigate('/business-card-edit')}>
                <Plus className="w-4 h-4 ml-2" />
                اختيار نطاق
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {requests.map((request) => (
            <Card 
              key={request.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                needsAction(request) ? 'border-2 border-amber-400' : ''
              }`}
              onClick={() => navigate(`/domain-requests/${request.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      request.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      request.status === 'rejected' || request.priority_revoked ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {getStatusIcon(request)}
                    </div>
                    <div>
                      <p className="font-bold text-lg" dir="ltr">WasataAI.com/{request.requested_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), 'dd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(request)}
                    {request.price && request.price_enabled && (
                      <span className="text-sm text-amber-600 font-medium">{request.price} ريال</span>
                    )}
                  </div>
                </div>

                {/* Action Needed */}
                {needsAction(request) && (
                  <div className="mt-3 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      {request.priority_revoked 
                        ? 'تم سحب الأولوية - يرجى اختيار نطاق بديل'
                        : 'تم رفض الطلب - يمكنك اختيار نطاق بديل'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DomainRequestsListPage;
