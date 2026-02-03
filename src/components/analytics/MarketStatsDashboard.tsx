/**
 * MarketStatsDashboard.tsx
 * إحصائيات السوق العامة - بيانات عامة عن سوق العقارات
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Building, DollarSign, MapPin,
  BarChart3, PieChart, Activity, Globe, Loader2, Home,
  Users, Eye, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketStat {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

interface PropertyTypeStats {
  type: string;
  count: number;
  avgPrice: number;
}

interface CityStats {
  city: string;
  listings: number;
  avgPrice: number;
}

export default function MarketStatsDashboard() {
  const [loading, setLoading] = useState(true);
  const [marketStats, setMarketStats] = useState<MarketStat[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeStats[]>([]);
  const [topCities, setTopCities] = useState<CityStats[]>([]);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // جلب جميع العروض النشطة
        const { data: listings, count: totalListings } = await supabase
          .from('platform_listings')
          .select('id, price, property_type, city, views, purpose', { count: 'exact' })
          .is('deleted_at', null)
          .eq('status', 'active');

        // جلب إجمالي المستخدمين
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' });

        // جلب إجمالي المشاهدات
        const { count: totalViews } = await supabase
          .from('offer_views_log')
          .select('id', { count: 'exact' });

        // حساب الإحصائيات
        const totalValue = listings?.reduce((sum, l) => sum + (l.price || 0), 0) || 0;
        const avgPrice = listings && listings.length > 0 ? totalValue / listings.length : 0;
        const totalPropertyViews = listings?.reduce((sum, l) => sum + (l.views || 0), 0) || 0;

        // عروض البيع والإيجار
        const forSale = listings?.filter(l => l.purpose === 'sale' || l.purpose === 'للبيع').length || 0;
        const forRent = listings?.filter(l => l.purpose === 'rent' || l.purpose === 'للإيجار').length || 0;

        setMarketStats([
          {
            id: 'total_listings',
            title: 'إجمالي العروض في السوق',
            value: totalListings || 0,
            icon: <Building className="w-6 h-6" />,
            color: 'bg-blue-500'
          },
          {
            id: 'total_value',
            title: 'إجمالي قيمة السوق',
            value: totalValue >= 1000000000 
              ? `${(totalValue / 1000000000).toFixed(2)} مليار` 
              : `${(totalValue / 1000000).toFixed(1)} مليون`,
            icon: <DollarSign className="w-6 h-6" />,
            color: 'bg-green-500'
          },
          {
            id: 'avg_price',
            title: 'متوسط سعر العقار',
            value: avgPrice >= 1000000 
              ? `${(avgPrice / 1000000).toFixed(2)} مليون` 
              : `${(avgPrice / 1000).toFixed(0)} ألف`,
            icon: <BarChart3 className="w-6 h-6" />,
            color: 'bg-purple-500'
          },
          {
            id: 'total_views',
            title: 'إجمالي المشاهدات',
            value: totalPropertyViews,
            icon: <Eye className="w-6 h-6" />,
            color: 'bg-red-500'
          },
          {
            id: 'total_users',
            title: 'المستخدمين النشطين',
            value: totalUsers || 0,
            icon: <Users className="w-6 h-6" />,
            color: 'bg-amber-500'
          },
          {
            id: 'for_sale',
            title: 'عروض للبيع',
            value: forSale,
            icon: <Home className="w-6 h-6" />,
            color: 'bg-cyan-500'
          }
        ]);

        // إحصائيات أنواع العقارات
        const typeGroups = listings?.reduce((acc, l) => {
          const type = l.property_type || 'غير محدد';
          if (!acc[type]) acc[type] = { count: 0, totalPrice: 0 };
          acc[type].count++;
          acc[type].totalPrice += l.price || 0;
          return acc;
        }, {} as Record<string, { count: number; totalPrice: number }>);

        const propertyTypeStats = Object.entries(typeGroups || {})
          .map(([type, data]) => ({
            type,
            count: data.count,
            avgPrice: Math.round(data.totalPrice / data.count)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setPropertyTypes(propertyTypeStats);

        // إحصائيات المدن
        const cityGroups = listings?.reduce((acc, l) => {
          const city = l.city || 'غير محدد';
          if (!acc[city]) acc[city] = { listings: 0, totalPrice: 0 };
          acc[city].listings++;
          acc[city].totalPrice += l.price || 0;
          return acc;
        }, {} as Record<string, { listings: number; totalPrice: number }>);

        const cityStats = Object.entries(cityGroups || {})
          .map(([city, data]) => ({
            city,
            listings: data.listings,
            avgPrice: Math.round(data.totalPrice / data.listings)
          }))
          .sort((a, b) => b.listings - a.listings)
          .slice(0, 5);

        setTopCities(cityStats);

      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} م`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)} ألف`;
    }
    return price.toLocaleString('ar-SA');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">جاري تحميل بيانات السوق...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center gap-2">
        <Globe className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-foreground">إحصائيات السوق العقاري</h2>
        <Badge variant="outline">بيانات عامة</Badge>
      </div>

      {/* المؤشرات الرئيسية */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {marketStats.map((stat) => (
          <Card key={stat.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3 text-white`}>
                {stat.icon}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-xl font-bold text-foreground">
                {typeof stat.value === 'number' ? stat.value.toLocaleString('ar-SA') : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* إحصائيات أنواع العقارات والمدن */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أنواع العقارات */}
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5 text-purple-500" />
              توزيع أنواع العقارات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {propertyTypes.map((type, idx) => {
              const maxCount = propertyTypes[0]?.count || 1;
              const percentage = (type.count / maxCount) * 100;
              
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{type.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{type.count} عرض</span>
                      <span className="text-purple-600 font-bold">
                        {formatPrice(type.avgPrice)} ر.س
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* أفضل المدن */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-blue-500" />
              أكثر المدن نشاطاً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCities.map((city, idx) => {
              const maxListings = topCities[0]?.listings || 1;
              const percentage = (city.listings / maxListings) * 100;
              
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{idx + 1}
                      </Badge>
                      <span className="font-medium">{city.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{city.listings} عرض</span>
                      <span className="text-blue-600 font-bold">
                        {formatPrice(city.avgPrice)} متوسط
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* تنبيه */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Activity className="w-6 h-6 text-amber-600" />
          <div>
            <p className="font-medium text-foreground">بيانات السوق محدثة</p>
            <p className="text-sm text-muted-foreground">
              هذه الإحصائيات مبنية على جميع العروض النشطة في المنصة وتُحدث بشكل مباشر
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
