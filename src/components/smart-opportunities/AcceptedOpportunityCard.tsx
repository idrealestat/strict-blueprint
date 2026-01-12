import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Phone, MessageCircle, User, Building2, MapPin, DollarSign, Sparkles, Percent, CheckCircle2 } from 'lucide-react';
import { SmartOpportunityAcceptance } from '@/hooks/useSmartOpportunities';
import { Button } from '@/components/ui/button';

interface AcceptedOpportunityCardProps {
  acceptance: SmartOpportunityAcceptance;
  type: 'offer' | 'request';
}

// تحويل أوجه التشابه إلى نص بشري
const formatMatchedFeature = (feature: string): string => {
  const featureMap: Record<string, string> = {
    'same_city': 'نفس المدينة',
    'same_district': 'نفس الحي',
    'same_property_type': 'نفس نوع العقار',
    'price_close': 'السعر قريب',
    'area_close': 'المساحة قريبة',
    'bedrooms_match': 'عدد الغرف متطابق',
    'bathrooms_match': 'عدد الحمامات متطابق',
  };
  return featureMap[feature] || feature;
};

export function AcceptedOpportunityCard({ acceptance, type }: AcceptedOpportunityCardProps) {
  const { 
    similarity_score, 
    matched_features, 
    owner_item_data, 
    other_item_data, 
    other_broker_info,
    source,
    created_at 
  } = acceptance;

  const isFromSmartOpportunities = source === 'smart_opportunities';

  // بيانات منصتي (owner)
  const ownerData = owner_item_data;
  // بيانات الطرف الآخر
  const otherData = other_item_data;
  const brokerInfo = other_broker_info;

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isFromSmartOpportunities ? 'border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-900' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          {/* الشارات */}
          <div className="flex items-center gap-2 flex-wrap">
            {isFromSmartOpportunities && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                <Sparkles className="w-3 h-3" />
                من الفرص الذكية
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
              <Percent className="w-3 h-3" />
              {Math.round(similarity_score)}% تشابه
            </Badge>
          </div>
          
          {/* التاريخ */}
          <span className="text-xs text-muted-foreground">
            {new Date(created_at).toLocaleDateString('ar-SA')}
          </span>
        </div>

        {/* أوجه التشابه */}
        {matched_features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {matched_features.slice(0, 5).map((feature, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                <CheckCircle2 className="w-3 h-3 ml-1" />
                {formatMatchedFeature(feature)}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* القسم الأول: بيانات منصتي (owner) - مختصر */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {type === 'offer' ? 'طلبي' : 'عرضي'}
            </Badge>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">في منصتي</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>{ownerData.property_type || ownerData.title || 'عقار'}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{ownerData.city || ownerData.district || 'غير محدد'}</span>
            </div>
            {ownerData.price && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{Number(ownerData.price).toLocaleString('ar-SA')} ر.س</span>
              </div>
            )}
          </div>
        </div>

        {/* القسم الثاني: بيانات الطرف الآخر - كامل */}
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-emerald-500 text-white text-xs">
              {type === 'offer' ? 'عرض الوسيط الآخر' : 'طلب الوسيط الآخر'}
            </Badge>
          </div>

          {/* صور العقار */}
          {otherData.images && otherData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {otherData.images.slice(0, 3).map((img: string, idx: number) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt={`صورة ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* تفاصيل العقار */}
          <div className="space-y-2 mb-4">
            <h4 className="font-bold text-gray-800 dark:text-white">
              {otherData.title || otherData.property_type || 'عقار'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{otherData.property_type || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{otherData.city} - {otherData.district || ''}</span>
              </div>
              {otherData.price && (
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">{Number(otherData.price).toLocaleString('ar-SA')} ر.س</span>
                </div>
              )}
              {otherData.area && (
                <div className="text-gray-700 dark:text-gray-300">
                  المساحة: {otherData.area} م²
                </div>
              )}
              {otherData.bedrooms && (
                <div className="text-gray-700 dark:text-gray-300">
                  غرف: {otherData.bedrooms}
                </div>
              )}
              {otherData.bathrooms && (
                <div className="text-gray-700 dark:text-gray-300">
                  حمامات: {otherData.bathrooms}
                </div>
              )}
            </div>
            {otherData.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {otherData.description}
              </p>
            )}
          </div>

          {/* معلومات الوسيط */}
          <div className="pt-3 border-t border-emerald-200 dark:border-emerald-700">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <User className="w-4 h-4" />
              معلومات الوسيط
            </h5>
            <div className="space-y-2">
              {brokerInfo.name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{brokerInfo.name}</span>
                </div>
              )}
              {brokerInfo.fal_license && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    رخصة فال: {brokerInfo.fal_license}
                  </Badge>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {brokerInfo.phone && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-1"
                    onClick={() => window.open(`tel:${brokerInfo.phone}`, '_blank')}
                  >
                    <Phone className="w-4 h-4" />
                    اتصال
                  </Button>
                )}
                {brokerInfo.whatsapp && (
                  <Button 
                    size="sm" 
                    className="gap-1 bg-green-500 hover:bg-green-600"
                    onClick={() => window.open(`https://wa.me/${brokerInfo.whatsapp}`, '_blank')}
                  >
                    <MessageCircle className="w-4 h-4" />
                    واتساب
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
