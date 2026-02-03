/**
 * AnalyticsSummaryDashboard.tsx
 * ملخص شامل لجميع أقسام التحليلات
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, Users, Eye, Calendar, FileText, DollarSign, 
  TrendingUp, BarChart3, Globe, Package, MessageSquare,
  CheckCircle, XCircle, Clock, Loader2, Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SectionSummary {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  stats: { label: string; value: number | string }[];
}

export default function AnalyticsSummaryDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionSummary[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const [
          listings,
          customers,
          appointments,
          viewsLog,
          receivedDocs,
          notifications,
          teamMembers
        ] = await Promise.all([
          supabase.from('platform_listings').select('id, views, status, price', { count: 'exact' }).eq('user_id', user.id).is('deleted_at', null),
          supabase.from('crm_customers').select('id, status, tags', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('calendar_appointments').select('id, status, appointment_type', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('offer_views_log').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('received_documents').select('id, document_type, status', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('notifications').select('id, is_read', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('organization_members').select('id, status', { count: 'exact' }).eq('organization_user_id', user.id)
        ]);

        // حساب الإحصائيات
        const totalViews = listings.data?.reduce((sum, l) => sum + (l.views || 0), 0) || 0;
        const activeListings = listings.data?.filter(l => l.status === 'active').length || 0;
        const totalValue = listings.data?.reduce((sum, l) => sum + (l.price || 0), 0) || 0;

        const confirmedAppointments = appointments.data?.filter(a => a.status === 'confirmed').length || 0;
        const pendingAppointments = appointments.data?.filter(a => a.status === 'pending').length || 0;

        const offers = receivedDocs.data?.filter(d => d.document_type === 'offer' || d.document_type === 'property_offer').length || 0;
        const requests = receivedDocs.data?.filter(d => d.document_type === 'request' || d.document_type === 'property_request').length || 0;
        const quotes = receivedDocs.data?.filter(d => d.document_type === 'quotation' || d.document_type === 'quotation_request').length || 0;

        const unreadNotifications = notifications.data?.filter(n => !n.is_read).length || 0;
        const activeMembers = teamMembers.data?.filter(m => m.status === 'active').length || 0;

        setSections([
          {
            id: 'platform',
            title: 'منصة النشر',
            icon: <Building className="w-5 h-5" />,
            color: 'border-t-[#01411C]',
            stats: [
              { label: 'العروض النشطة', value: activeListings },
              { label: 'إجمالي المشاهدات', value: totalViews },
              { label: 'قيمة المحفظة', value: `${(totalValue / 1000000).toFixed(1)} م` }
            ]
          },
          {
            id: 'crm',
            title: 'إدارة العملاء',
            icon: <Users className="w-5 h-5" />,
            color: 'border-t-blue-500',
            stats: [
              { label: 'إجمالي العملاء', value: customers.count || 0 },
              { label: 'العروض المستلمة', value: offers },
              { label: 'الطلبات المستلمة', value: requests }
            ]
          },
          {
            id: 'calendar',
            title: 'التقويم والمواعيد',
            icon: <Calendar className="w-5 h-5" />,
            color: 'border-t-purple-500',
            stats: [
              { label: 'إجمالي المواعيد', value: appointments.count || 0 },
              { label: 'مؤكدة', value: confirmedAppointments },
              { label: 'معلقة', value: pendingAppointments }
            ]
          },
          {
            id: 'documents',
            title: 'المستندات',
            icon: <FileText className="w-5 h-5" />,
            color: 'border-t-amber-500',
            stats: [
              { label: 'العروض', value: offers },
              { label: 'الطلبات', value: requests },
              { label: 'عروض الأسعار', value: quotes }
            ]
          },
          {
            id: 'engagement',
            title: 'التفاعل',
            icon: <Eye className="w-5 h-5" />,
            color: 'border-t-red-500',
            stats: [
              { label: 'سجل المشاهدات', value: viewsLog.count || 0 },
              { label: 'إشعارات غير مقروءة', value: unreadNotifications },
              { label: 'إجمالي الإشعارات', value: notifications.count || 0 }
            ]
          },
          {
            id: 'team',
            title: 'الفريق',
            icon: <Layers className="w-5 h-5" />,
            color: 'border-t-cyan-500',
            stats: [
              { label: 'أعضاء الفريق', value: teamMembers.count || 0 },
              { label: 'أعضاء نشطين', value: activeMembers },
              { label: 'دعوات معلقة', value: (teamMembers.count || 0) - activeMembers }
            ]
          }
        ]);
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">جاري تحميل الملخص...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-[#01411C]" />
        <h2 className="text-xl font-bold text-foreground">ملخص شامل لجميع الأقسام</h2>
        <Badge className="bg-gradient-to-r from-[#01411C] to-green-600 text-white">تجميعي</Badge>
      </div>

      {/* شبكة الأقسام */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Card key={section.id} className={`border-t-4 ${section.color} hover:shadow-lg transition-shadow`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {section.icon}
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.stats.map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="font-bold text-foreground">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">أقسام نشطة</p>
            <p className="text-3xl font-bold text-green-600">{sections.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">إجمالي المؤشرات</p>
            <p className="text-3xl font-bold text-blue-600">
              {sections.reduce((sum, s) => sum + s.stats.length, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
          <CardContent className="p-4 text-center">
            <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">بيانات محدثة</p>
            <p className="text-lg font-bold text-purple-600">الآن</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200">
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">حالة النظام</p>
            <p className="text-lg font-bold text-amber-600">ممتاز</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
