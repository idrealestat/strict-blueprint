/**
 * SmartOpportunitiesPage.tsx
 * صفحة الفرص الذكية مع بطاقات قابلة للسحب وفلاتر متقدمة
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { Sparkles, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartOpportunities } from '@/hooks/useSmartOpportunities';
import { useBusinessCardData } from '@/hooks/useBusinessCardData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SwipeableOpportunityCard, { SmartOpportunity } from '@/components/smart-opportunities/SwipeableOpportunityCard';
import OpportunityFilters, { OpportunityFiltersState, defaultFilters } from '@/components/smart-opportunities/OpportunityFilters';

// بيانات تجريبية للاختبار
const DEMO_OPPORTUNITIES: SmartOpportunity[] = [
  {
    id: 'demo-1',
    type: 'offer_to_request',
    similarity_score: 92,
    matched_features: ['same_city', 'same_property_type', 'price_close', 'bedrooms_match'],
    owner_item: {
      id: 'my-req-1',
      title: 'أبحث عن شقة في الرياض',
      property_type: 'شقة',
      city: 'الرياض',
      district: 'النرجس',
      price: 450000,
      area: 140,
      bedrooms: 3,
      bathrooms: 2,
    },
    other_item: {
      id: 'other-offer-1',
      title: 'شقة فاخرة للبيع في حي النرجس',
      property_type: 'شقة',
      city: 'الرياض',
      district: 'النرجس',
      price: 480000,
      area: 150,
      bedrooms: 3,
      bathrooms: 2,
      description: 'شقة راقية بتشطيبات سوبر لوكس، 3 غرف نوم، صالة كبيرة، مطبخ أمريكي',
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    },
    other_broker: {
      name: 'أحمد محمد العتيبي',
      phone: '0501234567',
      whatsapp: '966501234567',
      fal_license: 'FAL-1234567890',
    },
  },
  {
    id: 'demo-2',
    type: 'request_to_offer',
    similarity_score: 85,
    matched_features: ['same_city', 'same_district', 'same_property_type', 'area_close'],
    owner_item: {
      id: 'my-offer-1',
      title: 'فيلا دوبلكس للبيع',
      property_type: 'فيلا',
      city: 'جدة',
      district: 'الحمراء',
      price: 1800000,
      area: 400,
      bedrooms: 5,
      bathrooms: 4,
      images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
    },
    other_item: {
      id: 'other-req-1',
      title: 'مطلوب فيلا في جدة - الحمراء',
      property_type: 'فيلا',
      city: 'جدة',
      district: 'الحمراء',
      price: 1700000,
      area: 380,
      bedrooms: 5,
      bathrooms: 4,
      description: 'أبحث عن فيلا دوبلكس للعائلة في حي الحمراء أو ما يقاربه',
    },
    other_broker: {
      name: 'سعد عبدالله القحطاني',
      phone: '0559876543',
      whatsapp: '966559876543',
      fal_license: 'FAL-9876543210',
    },
  },
  {
    id: 'demo-3',
    type: 'offer_to_request',
    similarity_score: 78,
    matched_features: ['same_city', 'same_property_type', 'price_close'],
    owner_item: {
      id: 'my-req-2',
      title: 'أبحث عن أرض تجارية',
      property_type: 'أرض',
      city: 'الدمام',
      district: 'الشاطئ',
      price: 2500000,
      area: 1000,
    },
    other_item: {
      id: 'other-offer-2',
      title: 'أرض تجارية على شارع رئيسي',
      property_type: 'أرض',
      city: 'الدمام',
      district: 'الفيصلية',
      price: 2700000,
      area: 1200,
      description: 'أرض تجارية ممتازة على شارع 40 متر، قريبة من طريق الملك فهد',
      images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    },
    other_broker: {
      name: 'خالد إبراهيم الشمري',
      phone: '0503456789',
      whatsapp: '966503456789',
      fal_license: 'FAL-3456789012',
    },
  },
  {
    id: 'demo-4',
    type: 'request_to_offer',
    similarity_score: 71,
    matched_features: ['same_city', 'same_property_type', 'bedrooms_match'],
    owner_item: {
      id: 'my-offer-2',
      title: 'شقة للإيجار في المدينة',
      property_type: 'شقة',
      city: 'المدينة المنورة',
      district: 'العزيزية',
      price: 35000,
      area: 120,
      bedrooms: 2,
      bathrooms: 1,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    },
    other_item: {
      id: 'other-req-2',
      title: 'مطلوب شقة للإيجار - العزيزية',
      property_type: 'شقة',
      city: 'المدينة المنورة',
      district: 'قباء',
      price: 30000,
      area: 100,
      bedrooms: 2,
      bathrooms: 1,
      description: 'أبحث عن شقة نظيفة غرفتين في المدينة المنورة',
    },
    other_broker: {
      name: 'محمد علي الزهراني',
      phone: '0507654321',
      whatsapp: '966507654321',
      fal_license: 'FAL-7654321098',
    },
  },
  {
    id: 'demo-5',
    type: 'offer_to_request',
    similarity_score: 65,
    matched_features: ['same_city', 'price_close'],
    owner_item: {
      id: 'my-req-3',
      title: 'أبحث عن محل تجاري',
      property_type: 'محل',
      city: 'مكة المكرمة',
      district: 'العزيزية',
      price: 150000,
      area: 50,
    },
    other_item: {
      id: 'other-offer-3',
      title: 'محل تجاري للإيجار',
      property_type: 'محل',
      city: 'مكة المكرمة',
      district: 'الشوقية',
      price: 140000,
      area: 45,
      description: 'محل تجاري جاهز على شارع حيوي، مناسب لجميع الأنشطة',
      images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
    },
    other_broker: {
      name: 'عبدالرحمن فهد المالكي',
      phone: '0508765432',
      whatsapp: '966508765432',
      fal_license: 'FAL-8765432109',
    },
  },
];

const SmartOpportunitiesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptOpportunity, rejectOpportunity, rejectedKeys } = useSmartOpportunities();
  const { data: businessCardData } = useBusinessCardData();
  const userSlug = businessCardData?.slug;
  
  const [allOpportunities, setAllOpportunities] = useState<SmartOpportunity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<OpportunityFiltersState>(defaultFilters);
  const [useDemoData, setUseDemoData] = useState(false);

  // استخراج المدن والأحياء المتاحة من الفرص
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    allOpportunities.forEach(opp => {
      if (opp.other_item.city) cities.add(opp.other_item.city);
      if (opp.owner_item.city) cities.add(opp.owner_item.city);
    });
    return Array.from(cities).sort();
  }, [allOpportunities]);

  const availableDistricts = useMemo(() => {
    const districts = new Set<string>();
    allOpportunities.forEach(opp => {
      if (opp.other_item.district) districts.add(opp.other_item.district);
      if (opp.owner_item.district) districts.add(opp.owner_item.district);
    });
    return Array.from(districts).sort();
  }, [allOpportunities]);

  // تطبيق الفلاتر على الفرص
  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter(opp => {
      const item = opp.other_item;

      // استبعاد الفرص المرفوضة مرتين
      const oppKey = `${opp.owner_item.id}-${opp.other_item.id}`;
      if (rejectedKeys.has(oppKey)) return false;

      // فلتر المدينة
      if (filters.city && item.city !== filters.city) return false;

      // فلتر الحي
      if (filters.district && item.district !== filters.district) return false;

      // فلتر نوع العقار
      if (filters.propertyType && item.property_type !== filters.propertyType) return false;

      // فلتر السعر
      if (item.price) {
        if (filters.minPrice > 0 && item.price < filters.minPrice) return false;
        if (filters.maxPrice < 10000000 && item.price > filters.maxPrice) return false;
      }

      // فلتر عدد الغرف
      if (filters.bedrooms) {
        const bedroomFilter = filters.bedrooms === '6+' ? 6 : parseInt(filters.bedrooms);
        if (filters.bedrooms === '6+') {
          if (!item.bedrooms || item.bedrooms < 6) return false;
        } else {
          if (item.bedrooms !== bedroomFilter) return false;
        }
      }

      // فلتر نسبة التطابق
      if (filters.minMatchScore > 0 && opp.similarity_score < filters.minMatchScore) return false;

      return true;
    });
  }, [allOpportunities, filters, rejectedKeys]);

  // حساب عدد الفلاتر النشطة
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.city) count++;
    if (filters.district) count++;
    if (filters.propertyType) count++;
    if (filters.purpose) count++;
    if (filters.category) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 10000000) count++;
    if (filters.bedrooms) count++;
    if (filters.floors) count++;
    if (filters.minMatchScore > 0) count++;
    if (filters.features.length > 0) count++;
    return count;
  }, [filters]);

  // جلب الفرص الذكية الحقيقية من قاعدة البيانات
  const fetchSmartOpportunities = useCallback(async () => {
    setIsLoading(true);

    try {
      // إذا لم يكن هناك مستخدم أو slug، استخدم البيانات التجريبية
      if (!user || !userSlug) {
        setAllOpportunities(DEMO_OPPORTUNITIES);
        setUseDemoData(true);
        setCurrentIndex(0);
        setIsLoading(false);
        return;
      }

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
        .limit(100);

      if (otherListingsError) throw otherListingsError;

      // إذا لم توجد بيانات حقيقية، استخدم التجريبية
      if (!myListings?.length || !otherListings?.length) {
        setAllOpportunities(DEMO_OPPORTUNITIES);
        setUseDemoData(true);
        setCurrentIndex(0);
        setIsLoading(false);
        return;
      }

      // جلب بيانات الوسطاء الآخرين
      const otherSlugs = [...new Set(otherListings?.map(l => l.slug) || [])];
      const { data: otherCards } = await supabase
        .from('business_cards')
        .select('slug, data, phone, email, fal_license_number')
        .in('slug', otherSlugs);

      const cardsBySlug = new Map(otherCards?.map(c => [c.slug, c]) || []);

      // إنشاء الفرص الذكية بناءً على التطابق
      const generatedOpportunities: SmartOpportunity[] = [];

      for (const myListing of myListings) {
        for (const otherListing of otherListings) {
          const matchResult = calculateMatch(myListing, otherListing);
          
          if (matchResult.score >= 40) {
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

      // ترتيب حسب نسبة التطابق
      generatedOpportunities.sort((a, b) => b.similarity_score - a.similarity_score);

      if (generatedOpportunities.length > 0) {
        setAllOpportunities(generatedOpportunities);
        setUseDemoData(false);
      } else {
        // لا توجد فرص حقيقية، استخدم التجريبية
        setAllOpportunities(DEMO_OPPORTUNITIES);
        setUseDemoData(true);
      }
      
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching smart opportunities:', error);
      // في حالة الخطأ، استخدم البيانات التجريبية
      setAllOpportunities(DEMO_OPPORTUNITIES);
      setUseDemoData(true);
      toast({
        title: 'تنبيه',
        description: 'يتم عرض بيانات تجريبية للمعاينة',
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

  // إعادة تعيين المؤشر عند تغيير الفلاتر
  useEffect(() => {
    setCurrentIndex(0);
  }, [filters]);

  const handleAccept = async (opp: SmartOpportunity) => {
    // للبيانات التجريبية، نظهر رسالة فقط
    if (useDemoData) {
      toast({
        title: '✅ تم قبول الفرصة (تجريبي)',
        description: 'هذه بيانات تجريبية للمعاينة فقط',
      });
      setCurrentIndex(prev => prev + 1);
      return;
    }

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

  const handleReject = async (opp: SmartOpportunity) => {
    const oppKey = `${opp.owner_item.id}-${opp.other_item.id}`;
    
    // للبيانات التجريبية
    if (useDemoData) {
      toast({
        title: 'تم رفض الفرصة (تجريبي)',
        description: 'هذه بيانات تجريبية للمعاينة فقط',
        variant: 'destructive',
      });
      setCurrentIndex(prev => prev + 1);
      return;
    }

    // تسجيل الرفض
    await rejectOpportunity(oppKey);
    
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

  const currentOpportunity = filteredOpportunities[currentIndex];
  const remainingCount = filteredOpportunities.length - currentIndex;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
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
                {useDemoData && (
                  <Badge variant="outline" className="mr-2 text-xs border-amber-400 text-amber-600">
                    تجريبي
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                اسحب يميناً للقبول أو يساراً للرفض
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {remainingCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {remainingCount} فرصة متبقية
              </Badge>
            )}
            
            {/* زر الفلترة */}
            <OpportunityFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableCities={availableCities}
              availableDistricts={availableDistricts}
              activeFiltersCount={activeFiltersCount}
            />

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

        {/* شريط الفلاتر النشطة */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">الفلاتر النشطة:</span>
            {filters.city && (
              <Badge variant="outline" className="gap-1">
                المدينة: {filters.city}
              </Badge>
            )}
            {filters.district && (
              <Badge variant="outline" className="gap-1">
                الحي: {filters.district}
              </Badge>
            )}
            {filters.propertyType && (
              <Badge variant="outline" className="gap-1">
                النوع: {filters.propertyType}
              </Badge>
            )}
            {filters.purpose && (
              <Badge variant="outline" className="gap-1">
                الغرض: {filters.purpose}
              </Badge>
            )}
            {filters.category && (
              <Badge variant="outline" className="gap-1">
                التصنيف: {filters.category}
              </Badge>
            )}
            {filters.bedrooms && (
              <Badge variant="outline" className="gap-1">
                الغرف: {filters.bedrooms}
              </Badge>
            )}
            {filters.minMatchScore > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-400 text-amber-600">
                التطابق: {filters.minMatchScore}%+
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(defaultFilters)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              مسح الكل
            </Button>
          </div>
        )}

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
                  {allOpportunities.length === 0 
                    ? 'لا توجد فرص ذكية حالياً'
                    : filteredOpportunities.length === 0
                      ? 'لا توجد فرص تطابق الفلاتر المحددة'
                      : 'انتهت الفرص المتاحة 🎉'
                  }
                </h3>
                <p className="text-sm text-gray-400 mt-2 max-w-xs">
                  {allOpportunities.length === 0 
                    ? 'سنخبرك عند وجود فرص مطابقة لعروضك. تأكد من نشر عروضك أولاً!'
                    : filteredOpportunities.length === 0
                      ? 'جرب تغيير الفلاتر للعثور على فرص أكثر'
                      : 'لقد راجعت جميع الفرص المتاحة. يمكنك التحديث للبحث عن فرص جديدة.'
                  }
                </p>
                <div className="flex gap-3 mt-6 flex-wrap justify-center">
                  {filteredOpportunities.length === 0 && activeFiltersCount > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setFilters(defaultFilters)}
                      className="gap-2"
                    >
                      مسح الفلاتر
                    </Button>
                  )}
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
        {filteredOpportunities.length > 0 && currentIndex < filteredOpportunities.length && (
          <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / filteredOpportunities.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {currentIndex + 1} / {filteredOpportunities.length}
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
