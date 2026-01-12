/**
 * SwipeableOpportunityCard.tsx
 * بطاقة فرصة ذكية قابلة للسحب مع تصميم طولي
 */

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  X, 
  MapPin, 
  DollarSign, 
  Building2, 
  BedDouble, 
  Bath,
  Maximize2,
  Sparkles,
  User,
  Phone,
  MessageCircle
} from 'lucide-react';

interface OpportunityItem {
  id: string;
  title: string;
  property_type?: string;
  city: string;
  district: string;
  price: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  images?: string[];
  image?: string;
}

interface BrokerInfo {
  name?: string;
  phone?: string;
  whatsapp?: string;
  fal_license?: string;
}

export interface SmartOpportunity {
  id: string;
  type: 'offer_to_request' | 'request_to_offer';
  similarity_score: number;
  matched_features: string[];
  owner_item: OpportunityItem;
  other_item: OpportunityItem;
  other_broker: BrokerInfo;
}

interface SwipeableOpportunityCardProps {
  opportunity: SmartOpportunity;
  onAccept: (opportunity: SmartOpportunity) => void;
  onReject: (opportunity: SmartOpportunity) => void;
}

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

export default function SwipeableOpportunityCard({
  opportunity,
  onAccept,
  onReject
}: SwipeableOpportunityCardProps) {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // مؤشرات القبول والرفض
  const acceptOpacity = useTransform(x, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // سحب لليمين = قبول
      setExitDirection('right');
      setTimeout(() => onAccept(opportunity), 300);
    } else if (info.offset.x < -threshold) {
      // سحب لليسار = رفض
      setExitDirection('left');
      setTimeout(() => onReject(opportunity), 300);
    }
  };

  const handleAcceptClick = () => {
    setExitDirection('right');
    setTimeout(() => onAccept(opportunity), 300);
  };

  const handleRejectClick = () => {
    setExitDirection('left');
    setTimeout(() => onReject(opportunity), 300);
  };

  // تحديد أي عنصر يظهر أولاً بناءً على نوع الفرصة
  const isOfferFromOther = opportunity.type === 'offer_to_request';
  const topItem = isOfferFromOther ? opportunity.other_item : opportunity.other_item;
  const bottomItem = isOfferFromOther ? opportunity.owner_item : opportunity.owner_item;
  const topLabel = isOfferFromOther ? 'عرض الوسيط' : 'طلب الوسيط';
  const bottomLabel = isOfferFromOther ? 'طلبي المناسب' : 'عرضي المناسب';
  
  // صورة العنصر العلوي
  const topImage = topItem.images?.[0] || topItem.image || '/placeholder.svg';
  const bottomImage = bottomItem.images?.[0] || bottomItem.image;

  return (
    <AnimatePresence>
      {!exitDirection && (
        <motion.div
          ref={cardRef}
          className="w-full max-w-md mx-auto cursor-grab active:cursor-grabbing"
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ 
            x: exitDirection === 'right' ? 300 : -300,
            opacity: 0,
            transition: { duration: 0.3 }
          }}
        >
          {/* مؤشرات السحب */}
          <div className="relative">
            {/* مؤشر القبول - يمين */}
            <motion.div
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
              style={{ opacity: acceptOpacity }}
            >
              ✓ قبول
            </motion.div>
            
            {/* مؤشر الرفض - يسار */}
            <motion.div
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
              style={{ opacity: rejectOpacity }}
            >
              ✗ رفض
            </motion.div>

            <Card className="overflow-hidden border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 shadow-xl">
              {/* العنصر العلوي (عرض/طلب الوسيط الآخر) */}
              <div className="relative">
                {/* صورة العرض/الطلب */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={topImage} 
                    alt={topItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* شارة نوع العنصر */}
                  <Badge className="absolute top-3 right-3 bg-amber-500 text-white gap-1">
                    <Sparkles className="w-3 h-3" />
                    {topLabel}
                  </Badge>

                  {/* معلومات العقار */}
                  <div className="absolute bottom-3 right-3 left-3 text-white">
                    <h3 className="font-bold text-lg line-clamp-1">{topItem.title}</h3>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{topItem.city} - {topItem.district}</span>
                    </div>
                  </div>
                </div>

                {/* تفاصيل العنصر العلوي */}
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">
                        {topItem.price.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    {topItem.area && (
                      <div className="flex items-center gap-1.5">
                        <Maximize2 className="w-4 h-4" />
                        <span>{topItem.area} م²</span>
                      </div>
                    )}
                    {topItem.bedrooms && (
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4" />
                        <span>{topItem.bedrooms} غرف</span>
                      </div>
                    )}
                    {topItem.bathrooms && (
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4" />
                        <span>{topItem.bathrooms} حمام</span>
                      </div>
                    )}
                  </div>

                  {/* معلومات الوسيط */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{opportunity.other_broker.name || 'وسيط عقاري'}</p>
                      <p className="text-xs text-gray-500">{opportunity.other_broker.fal_license}</p>
                    </div>
                    <div className="flex gap-1">
                      {opportunity.other_broker.phone && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                          <a href={`tel:${opportunity.other_broker.phone}`}>
                            <Phone className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {opportunity.other_broker.whatsapp && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" asChild>
                          <a href={`https://wa.me/${opportunity.other_broker.whatsapp}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* خط فاصل */}
              <div className="relative px-4">
                <Separator className="bg-amber-200 dark:bg-amber-800" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-3">
                  <Badge variant="outline" className="border-amber-400 text-amber-600">
                    تطابق
                  </Badge>
                </div>
              </div>

              {/* العنصر السفلي (عرضي/طلبي) */}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {bottomLabel}
                  </Badge>
                </div>

                {/* صورة مصغرة للعرض/الطلب الخاص بي إذا وجدت */}
                {bottomImage && (
                  <div className="h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2">
                    <img 
                      src={bottomImage} 
                      alt={bottomItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-sm">{bottomItem.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {bottomItem.city} - {bottomItem.district}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-3 h-3" />
                    {bottomItem.price.toLocaleString('ar-SA')} ر.س
                  </div>
                </div>

                {/* نسبة التشابه */}
                <div className="flex items-center justify-center gap-2 py-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">{opportunity.similarity_score}%</span>
                    <span className="text-sm">نسبة التطابق</span>
                  </div>
                </div>

                {/* أوجه التشابه */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {opportunity.matched_features.map((f, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    >
                      <CheckCircle2 className="w-3 h-3 ml-1" />
                      {formatFeature(f)}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              {/* أزرار القبول والرفض */}
              <CardContent className="p-4 pt-0">
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-red-500 hover:bg-red-600 gap-2 text-white"
                    onClick={handleRejectClick}
                  >
                    <X className="w-5 h-5" />
                    رفض
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 gap-2 text-white"
                    onClick={handleAcceptClick}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    قبول
                  </Button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  أو اسحب البطاقة يميناً للقبول أو يساراً للرفض
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
