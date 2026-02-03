/**
 * PersonalKPIsDashboard.tsx
 * مؤشرات الأداء الشخصية للمستخدم مع مقارنة بمتوسط المستخدمين
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Minus, Users, Building, Eye, 
  DollarSign, Target, Award, BarChart3, ArrowUpRight, ArrowDownRight,
  FileText, Calendar, MessageSquare, Phone, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PersonalKPI {
  id: string;
  name: string;
  icon: React.ReactNode;
  userValue: number;
  avgValue: number;
  format: 'number' | 'currency' | 'percentage';
  category: 'sales' | 'customers' | 'properties' | 'engagement';
  description: string;
}

export default function PersonalKPIsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<PersonalKPI[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchKPIs = async () => {
      setLoading(true);
      try {
        // إحصائيات المستخدم الشخصية
        const [
          userListings,
          userCustomers,
          userAppointments,
          userViews,
          allListings,
          allCustomers,
          allAppointments,
          allViews,
          totalUsers
        ] = await Promise.all([
          // بيانات المستخدم
          supabase.from('platform_listings').select('id, views, price', { count: 'exact' }).eq('user_id', user.id).is('deleted_at', null),
          supabase.from('crm_customers').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('calendar_appointments').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('offer_views_log').select('id', { count: 'exact' }).eq('user_id', user.id),
          // بيانات جميع المستخدمين للمقارنة
          supabase.from('platform_listings').select('id, views, price, user_id', { count: 'exact' }).is('deleted_at', null),
          supabase.from('crm_customers').select('id, user_id', { count: 'exact' }),
          supabase.from('calendar_appointments').select('id, user_id', { count: 'exact' }),
          supabase.from('offer_views_log').select('id, user_id', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' })
        ]);

        // حساب المتوسطات
        const numUsers = totalUsers.count || 1;
        
        const userListingsCount = userListings.count || 0;
        const avgListingsCount = Math.round((allListings.count || 0) / numUsers);
        
        const userCustomersCount = userCustomers.count || 0;
        const avgCustomersCount = Math.round((allCustomers.count || 0) / numUsers);
        
        const userAppointmentsCount = userAppointments.count || 0;
        const avgAppointmentsCount = Math.round((allAppointments.count || 0) / numUsers);
        
        const userViewsCount = userViews.count || 0;
        const avgViewsCount = Math.round((allViews.count || 0) / numUsers);
        
        // حساب إجمالي المشاهدات من العقارات
        const userTotalPropertyViews = userListings.data?.reduce((sum, l) => sum + (l.views || 0), 0) || 0;
        const allTotalPropertyViews = allListings.data?.reduce((sum, l) => sum + (l.views || 0), 0) || 0;
        const avgPropertyViews = Math.round(allTotalPropertyViews / numUsers);
        
        // حساب قيمة العروض
        const userTotalValue = userListings.data?.reduce((sum, l) => sum + (l.price || 0), 0) || 0;
        const allTotalValue = allListings.data?.reduce((sum, l) => sum + (l.price || 0), 0) || 0;
        const avgTotalValue = Math.round(allTotalValue / numUsers);

        setKpis([
          {
            id: 'listings',
            name: 'العروض المنشورة',
            icon: <Building className="w-5 h-5" />,
            userValue: userListingsCount,
            avgValue: avgListingsCount,
            format: 'number',
            category: 'properties',
            description: 'عدد العقارات المنشورة على المنصة'
          },
          {
            id: 'customers',
            name: 'العملاء',
            icon: <Users className="w-5 h-5" />,
            userValue: userCustomersCount,
            avgValue: avgCustomersCount,
            format: 'number',
            category: 'customers',
            description: 'إجمالي عدد العملاء المسجلين'
          },
          {
            id: 'views',
            name: 'المشاهدات',
            icon: <Eye className="w-5 h-5" />,
            userValue: userTotalPropertyViews,
            avgValue: avgPropertyViews,
            format: 'number',
            category: 'engagement',
            description: 'إجمالي مشاهدات العروض'
          },
          {
            id: 'appointments',
            name: 'المواعيد',
            icon: <Calendar className="w-5 h-5" />,
            userValue: userAppointmentsCount,
            avgValue: avgAppointmentsCount,
            format: 'number',
            category: 'engagement',
            description: 'عدد المواعيد المجدولة'
          },
          {
            id: 'portfolio_value',
            name: 'قيمة المحفظة',
            icon: <DollarSign className="w-5 h-5" />,
            userValue: userTotalValue,
            avgValue: avgTotalValue,
            format: 'currency',
            category: 'sales',
            description: 'إجمالي قيمة العروض المنشورة'
          },
          {
            id: 'engagement_rate',
            name: 'معدل التفاعل',
            icon: <BarChart3 className="w-5 h-5" />,
            userValue: userListingsCount > 0 ? Math.round((userTotalPropertyViews / userListingsCount) * 100) / 100 : 0,
            avgValue: avgListingsCount > 0 ? Math.round((avgPropertyViews / avgListingsCount) * 100) / 100 : 0,
            format: 'number',
            category: 'engagement',
            description: 'متوسط المشاهدات لكل عرض'
          }
        ]);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [user?.id]);

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)} مليون ر.س`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)} ألف ر.س`;
      }
      return `${value.toLocaleString('ar-SA')} ر.س`;
    } else if (format === 'percentage') {
      return `${value}%`;
    }
    return value.toLocaleString('ar-SA');
  };

  const getComparisonStatus = (userValue: number, avgValue: number) => {
    if (avgValue === 0) return { status: 'equal', percentage: 0 };
    const percentage = Math.round(((userValue - avgValue) / avgValue) * 100);
    if (percentage > 10) return { status: 'above', percentage };
    if (percentage < -10) return { status: 'below', percentage };
    return { status: 'equal', percentage };
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sales: 'border-t-[#01411C]',
      customers: 'border-t-blue-500',
      properties: 'border-t-purple-500',
      engagement: 'border-t-amber-500'
    };
    return colors[category] || 'border-t-gray-400';
  };

  const getCategoryBg = (category: string) => {
    const colors: Record<string, string> = {
      sales: 'bg-[#01411C]/10',
      customers: 'bg-blue-500/10',
      properties: 'bg-purple-500/10',
      engagement: 'bg-amber-500/10'
    };
    return colors[category] || 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">جاري تحميل المؤشرات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* القسم العلوي: مؤشرات الأداء الشخصية */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#01411C]" />
          <h3 className="text-lg font-bold text-foreground">مؤشرات أدائي الشخصية</h3>
          <Badge className="bg-[#01411C] text-white">بياناتك</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => {
            const comparison = getComparisonStatus(kpi.userValue, kpi.avgValue);
            
            return (
              <Card 
                key={kpi.id} 
                className={`border-t-4 ${getCategoryColor(kpi.category)} hover:shadow-lg transition-all duration-300`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getCategoryBg(kpi.category)}`}>
                      {kpi.icon}
                    </div>
                    {comparison.status === 'above' && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +{comparison.percentage}%
                      </Badge>
                    )}
                    {comparison.status === 'below' && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1">
                        <ArrowDownRight className="w-3 h-3" />
                        {comparison.percentage}%
                      </Badge>
                    )}
                    {comparison.status === 'equal' && (
                      <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 gap-1">
                        <Minus className="w-3 h-3" />
                        متساوي
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1">{kpi.name}</p>
                  <p className="text-2xl font-bold text-foreground mb-2">
                    {formatValue(kpi.userValue, kpi.format)}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* القسم السفلي: المقارنة مع المتوسط العام */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-bold text-foreground">مقارنة مع متوسط المستخدمين</h3>
          <Badge variant="outline">جميع المستخدمين</Badge>
        </div>
        
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="space-y-6">
              {kpis.map((kpi) => {
                const comparison = getComparisonStatus(kpi.userValue, kpi.avgValue);
                const maxValue = Math.max(kpi.userValue, kpi.avgValue);
                const userPercentage = maxValue > 0 ? (kpi.userValue / maxValue) * 100 : 0;
                const avgPercentage = maxValue > 0 ? (kpi.avgValue / maxValue) * 100 : 0;
                
                return (
                  <div key={kpi.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {kpi.icon}
                        <span className="font-medium text-foreground">{kpi.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[#01411C] font-bold">
                          أنت: {formatValue(kpi.userValue, kpi.format)}
                        </span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-blue-600">
                          المتوسط: {formatValue(kpi.avgValue, kpi.format)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      {/* شريط المستخدم */}
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                        <div 
                          className="h-full bg-gradient-to-r from-[#01411C] to-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${userPercentage}%` }}
                        />
                      </div>
                      {/* شريط المتوسط */}
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${avgPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#01411C] rounded-full"></div>
                        <span className="text-muted-foreground">أدائك</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-muted-foreground">المتوسط العام</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ملخص الأداء */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">أفضل من المتوسط في</p>
            <p className="text-2xl font-bold text-green-600">
              {kpis.filter(k => getComparisonStatus(k.userValue, k.avgValue).status === 'above').length}
            </p>
            <p className="text-xs text-muted-foreground">مؤشرات</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">مساوي للمتوسط في</p>
            <p className="text-2xl font-bold text-gray-600">
              {kpis.filter(k => getComparisonStatus(k.userValue, k.avgValue).status === 'equal').length}
            </p>
            <p className="text-xs text-muted-foreground">مؤشرات</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">أقل من المتوسط في</p>
            <p className="text-2xl font-bold text-red-600">
              {kpis.filter(k => getComparisonStatus(k.userValue, k.avgValue).status === 'below').length}
            </p>
            <p className="text-xs text-muted-foreground">مؤشرات</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
