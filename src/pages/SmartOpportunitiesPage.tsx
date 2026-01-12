import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { Sparkles, ArrowRight, CheckCircle2, X, Building2, MapPin, DollarSign, Percent, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartOpportunities } from '@/hooks/useSmartOpportunities';
import { toast } from '@/hooks/use-toast';

// بيانات تجريبية للفرص الذكية
const mockOpportunities = [
  {
    id: '1',
    type: 'offer_to_request' as const,
    similarity_score: 87,
    matched_features: ['same_city', 'same_property_type', 'price_close', 'area_close'],
    owner_item: {
      id: 'req-1',
      title: 'أبحث عن شقة في الرياض',
      property_type: 'شقة',
      city: 'الرياض',
      district: 'النرجس',
      price: 500000,
      area: 150,
    },
    other_item: {
      id: 'offer-1',
      title: 'شقة فاخرة للبيع في النرجس',
      property_type: 'شقة',
      city: 'الرياض',
      district: 'النرجس',
      price: 520000,
      area: 160,
      bedrooms: 3,
      bathrooms: 2,
      description: 'شقة فاخرة بتشطيبات عالية الجودة، قريبة من جميع الخدمات',
      images: ['/placeholder.svg'],
    },
    other_broker: {
      name: 'أحمد محمد',
      phone: '0501234567',
      whatsapp: '966501234567',
      fal_license: 'FAL-12345',
    },
  },
  {
    id: '2',
    type: 'request_to_offer' as const,
    similarity_score: 72,
    matched_features: ['same_city', 'same_property_type', 'bedrooms_match'],
    owner_item: {
      id: 'offer-2',
      title: 'فيلا دوبلكس للبيع',
      property_type: 'فيلا',
      city: 'جدة',
      district: 'الحمراء',
      price: 1500000,
      area: 350,
    },
    other_item: {
      id: 'req-2',
      title: 'مطلوب فيلا في جدة',
      property_type: 'فيلا',
      city: 'جدة',
      district: 'أبحر الشمالية',
      price: 1400000,
      area: 300,
      bedrooms: 5,
      description: 'أبحث عن فيلا عائلية بمواصفات جيدة',
    },
    other_broker: {
      name: 'سعد العتيبي',
      phone: '0509876543',
      whatsapp: '966509876543',
      fal_license: 'FAL-67890',
    },
  },
];

const SmartOpportunitiesPage = () => {
  const navigate = useNavigate();
  const { acceptOpportunity } = useSmartOpportunities();
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAccept = async (opp: typeof mockOpportunities[0]) => {
    const result = await acceptOpportunity({
      type: opp.type,
      owner_item_id: opp.owner_item.id,
      other_item_id: opp.other_item.id,
      similarity_score: opp.similarity_score,
      matched_features: opp.matched_features,
      owner_item_data: opp.owner_item,
      other_item_data: opp.other_item,
      other_broker_info: opp.other_broker,
    });

    if (result) {
      toast({
        title: 'تم قبول الفرصة',
        description: 'يمكنك مشاهدة التفاصيل في صفحة العروض والطلبات',
      });
      setOpportunities(prev => prev.filter(o => o.id !== opp.id));
    }
  };

  const handleReject = (id: string) => {
    setOpportunities(prev => prev.filter(o => o.id !== id));
    toast({
      title: 'تم رفض الفرصة',
      variant: 'destructive',
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: 'تم التحديث',
        description: 'جاري البحث عن فرص جديدة...',
      });
    }, 1500);
  };

  const formatFeature = (feature: string): string => {
    const map: Record<string, string> = {
      'same_city': 'نفس المدينة',
      'same_district': 'نفس الحي',
      'same_property_type': 'نفس نوع العقار',
      'price_close': 'السعر قريب',
      'area_close': 'المساحة قريبة',
      'bedrooms_match': 'عدد الغرف متطابق',
    };
    return map[feature] || feature;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/app/dashboard')}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                الفرص الذكية
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                فرص مطابقة لعروضك وطلباتك من وسطاء آخرين
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* قائمة الفرص */}
        {opportunities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="w-12 h-12 text-amber-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                لا توجد فرص ذكية حالياً
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                سنخبرك عند وجود فرص مطابقة لعروضك أو طلباتك
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="overflow-hidden border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-gray-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500 text-white gap-1">
                        <Sparkles className="w-3 h-3" />
                        فرصة ذكية
                      </Badge>
                      <Badge variant="outline" className="gap-1 border-emerald-500 text-emerald-600">
                        <Percent className="w-3 h-3" />
                        {opp.similarity_score}% تشابه
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {opp.type === 'offer_to_request' ? 'عرض مطابق لطلبك' : 'طلب مطابق لعرضك'}
                    </Badge>
                  </div>

                  {/* أوجه التشابه */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {opp.matched_features.map((f, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 ml-1" />
                        {formatFeature(f)}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* بيانات صاحب الطلب/العرض */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* منصتي */}
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border">
                      <div className="text-xs text-gray-500 mb-2">في منصتي</div>
                      <h4 className="font-semibold">{opp.owner_item.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {opp.owner_item.city} - {opp.owner_item.district}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-3.5 h-3.5" />
                        {opp.owner_item.price.toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>

                    {/* الطرف الآخر */}
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200">
                      <div className="text-xs text-emerald-600 mb-2">
                        {opp.type === 'offer_to_request' ? 'عرض الوسيط' : 'طلب الوسيط'}
                      </div>
                      <h4 className="font-semibold">{opp.other_item.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {opp.other_item.city} - {opp.other_item.district}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-3.5 h-3.5" />
                        {opp.other_item.price.toLocaleString('ar-SA')} ر.س
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        الوسيط: {opp.other_broker.name} | {opp.other_broker.fal_license}
                      </div>
                    </div>
                  </div>

                  {/* أزرار القبول والرفض */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 gap-2"
                      onClick={() => handleAccept(opp)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      قبول الفرصة
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleReject(opp.id)}
                    >
                      <X className="w-4 h-4" />
                      رفض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SmartOpportunitiesPage;
