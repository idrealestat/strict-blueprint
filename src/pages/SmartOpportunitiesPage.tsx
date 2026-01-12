/**
 * SmartOpportunitiesPage.tsx
 * صفحة الفرص الذكية مع بطاقات قابلة للسحب
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { Sparkles, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartOpportunities } from '@/hooks/useSmartOpportunities';
import { usePlatformListings } from '@/hooks/usePlatformListings';
import { useBusinessCardData } from '@/hooks/useBusinessCardData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SwipeableOpportunityCard, { SmartOpportunity } from '@/components/smart-opportunities/SwipeableOpportunityCard';

const SmartOpportunitiesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptOpportunity } = useSmartOpportunities();
  const { data: businessCardData } = useBusinessCardData();
  const userSlug = businessCardData?.slug;
  
  const [opportunities, setOpportunities] = useState<SmartOpportunity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // جلب الفرص الذكية الحقيقية من قاعدة البيانات
  const fetchSmartOpportunities = useCallback(async () => {
    if (!user || !userSlug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // جلب عروض المستخدم الحالي
      const { data: myListings, error: myListingsError } = await supabase
        .from('platform_listings')
        .select('*')
        .eq('slug', userSlug)
        .is('deleted_at', null)
        .eq('status', 'published');

      if (myListingsError) throw myListingsError;

      // جلب عروض المستخدمين الآخرين
      const { data: otherListings, error: otherListingsError } = await supabase
        .from('platform_listings')
        .select('*')
        .neq('slug', userSlug)
        .is('deleted_at', null)
        .eq('status', 'published')
        .limit(50);

      if (otherListingsError) throw otherListingsError;

      // جلب بيانات الوسطاء الآخرين
      const otherSlugs = [...new Set(otherListings?.map(l => l.slug) || [])];
      const { data: otherCards } = await supabase
        .from('business_cards')
        .select('slug, data, phone, email, fal_license_number')
        .in('slug', otherSlugs);

      const cardsBySlug = new Map(otherCards?.map(c => [c.slug, c]) || []);

      // إنشاء الفرص الذكية بناءً على التطابق
      const generatedOpportunities: SmartOpportunity[] = [];

      if (myListings && otherListings) {
        for (const myListing of myListings) {
          for (const otherListing of otherListings) {
            const matchResult = calculateMatch(myListing, otherListing);
            
            if (matchResult.score >= 50) {
              const otherCard = cardsBySlug.get(otherListing.slug);
              const cardData = otherCard?.data as any || {};

              generatedOpportunities.push({
                id: `${myListing.id}-${otherListing.id}`,
                type: myListing.purpose === 'للبيع' || myListing.purpose === 'للإيجار' 
                  ? 'request_to_offer' 
                  : 'offer_to_request',
                similarity_score: matchResult.score,
                matched_features: matchResult.features,
                owner_item: {
                  id: myListing.id,
                  title: myListing.title,
                  property_type: myListing.property_type,
                  city: myListing.city,
                  district: myListing.district,
                  price: myListing.price,
                  area: myListing.area,
                  bedrooms: myListing.bedrooms,
                  bathrooms: myListing.bathrooms,
                  images: myListing.images,
                  image: myListing.image,
                },
                other_item: {
                  id: otherListing.id,
                  title: otherListing.title,
                  property_type: otherListing.property_type,
                  city: otherListing.city,
                  district: otherListing.district,
                  price: otherListing.price,
                  area: otherListing.area,
                  bedrooms: otherListing.bedrooms,
                  bathrooms: otherListing.bathrooms,
                  description: otherListing.description,
                  images: otherListing.images,
                  image: otherListing.image,
                },
                other_broker: {
                  name: cardData?.name || cardData?.fullName || 'وسيط عقاري',
                  phone: otherCard?.phone || cardData?.phone,
                  whatsapp: otherCard?.phone?.replace(/^0/, '966') || cardData?.phone?.replace(/^0/, '966'),
                  fal_license: otherCard?.fal_license_number || cardData?.falLicense,
                },
              });
            }
          }
        }
      }

      // ترتيب حسب نسبة التطابق
      generatedOpportunities.sort((a, b) => b.similarity_score - a.similarity_score);

      setOpportunities(generatedOpportunities.slice(0, 20)); // أول 20 فرصة
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching smart opportunities:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب الفرص الذكية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, userSlug]);

  // حساب نسبة التطابق بين عرضين
  const calculateMatch = (listing1: any, listing2: any) => {
    const features: string[] = [];
    let score = 0;

    // نفس المدينة
    if (listing1.city && listing2.city && 
        listing1.city.toLowerCase() === listing2.city.toLowerCase()) {
      features.push('same_city');
      score += 25;
    }

    // نفس الحي
    if (listing1.district && listing2.district && 
        listing1.district.toLowerCase() === listing2.district.toLowerCase()) {
      features.push('same_district');
      score += 15;
    }

    // نفس نوع العقار
    if (listing1.property_type && listing2.property_type && 
        listing1.property_type === listing2.property_type) {
      features.push('same_property_type');
      score += 20;
    }

    // السعر قريب (±20%)
    if (listing1.price && listing2.price) {
      const priceDiff = Math.abs(listing1.price - listing2.price) / Math.max(listing1.price, listing2.price);
      if (priceDiff <= 0.2) {
        features.push('price_close');
        score += 20;
      }
    }

    // المساحة قريبة (±15%)
    if (listing1.area && listing2.area) {
      const areaDiff = Math.abs(listing1.area - listing2.area) / Math.max(listing1.area, listing2.area);
      if (areaDiff <= 0.15) {
        features.push('area_close');
        score += 10;
      }
    }

    // عدد الغرف متطابق
    if (listing1.bedrooms && listing2.bedrooms && 
        listing1.bedrooms === listing2.bedrooms) {
      features.push('bedrooms_match');
      score += 10;
    }

    return { score: Math.min(score, 100), features };
  };

  useEffect(() => {
    fetchSmartOpportunities();
  }, [fetchSmartOpportunities]);

  const handleAccept = async (opp: SmartOpportunity) => {
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
        title: '✅ تم قبول الفرصة',
        description: 'يمكنك مشاهدة التفاصيل في صفحة العروض والطلبات',
      });
    }
    
    // الانتقال للبطاقة التالية
    setCurrentIndex(prev => prev + 1);
  };

  const handleReject = (opp: SmartOpportunity) => {
    toast({
      title: 'تم رفض الفرصة',
      variant: 'destructive',
    });
    
    // الانتقال للبطاقة التالية
    setCurrentIndex(prev => prev + 1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSmartOpportunities();
    setIsRefreshing(false);
    toast({
      title: 'تم التحديث',
      description: 'تم البحث عن فرص جديدة',
    });
  };

  const currentOpportunity = opportunities[currentIndex];
  const remainingCount = opportunities.length - currentIndex;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 min-h-screen">
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
                اسحب يميناً للقبول أو يساراً للرفض
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {remainingCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {remainingCount} فرصة متبقية
              </Badge>
            )}
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
        </div>

        {/* المحتوى */}
        <div className="flex flex-col items-center justify-center py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
              <p className="text-gray-500">جاري البحث عن فرص ذكية...</p>
            </div>
          ) : !currentOpportunity ? (
            <Card className="border-dashed w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="w-16 h-16 text-amber-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
                  {opportunities.length === 0 
                    ? 'لا توجد فرص ذكية حالياً'
                    : 'انتهت الفرص المتاحة 🎉'
                  }
                </h3>
                <p className="text-sm text-gray-400 mt-2 max-w-xs">
                  {opportunities.length === 0 
                    ? 'سنخبرك عند وجود فرص مطابقة لعروضك. تأكد من نشر عروضك أولاً!'
                    : 'لقد راجعت جميع الفرص المتاحة. يمكنك التحديث للبحث عن فرص جديدة.'
                  }
                </p>
                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={handleRefresh}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                  </Button>
                  <Button 
                    onClick={() => navigate('/app/offers-requests')}
                    className="bg-emerald-500 hover:bg-emerald-600 gap-2"
                  >
                    عرض المقبولة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SwipeableOpportunityCard
              key={currentOpportunity.id}
              opportunity={currentOpportunity}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          )}
        </div>

        {/* شريط التقدم */}
        {opportunities.length > 0 && currentIndex < opportunities.length && (
          <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / opportunities.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {currentIndex + 1} / {opportunities.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SmartOpportunitiesPage;
