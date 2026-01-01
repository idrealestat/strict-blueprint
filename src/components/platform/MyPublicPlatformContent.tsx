/**
 * MyPublicPlatformContent.tsx
 * صفحة المنصة العامة - عرض العروض بشكل هرمي مع بطاقة الوسيط
 */

import React, { useState, useEffect } from 'react';
import { Star, Building2, MapPin, Eye, BedDouble, Bath, Maximize, Phone, MessageSquare, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OfferDetailsPage from './OfferDetailsPage';
import { toast } from 'sonner';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  propertyType: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  image: string;
  imageCount: number;
  city: string;
  district: string;
  images?: string[];
  ownerName?: string;
  ownerPhone?: string;
  createdAt?: string;
  views?: number;
  street?: string;
  age?: number;
  direction?: string;
  features?: string[];
}

interface District {
  id: string;
  name: string;
  listings: Listing[];
}

interface CityGroup {
  id: string;
  type: string;
  name: string;
  districts: District[];
}

interface UserData {
  name?: string;
  title?: string;
  rating?: number;
  badge?: string;
  totalDeals?: number;
}

interface BusinessCardData {
  userName: string;
  companyName: string;
  falLicense: string;
  falExpiry: string;
  commercialRegistration: string;
  commercialExpiryDate: string;
  primaryPhone: string;
  email: string;
  domain: string;
  googleMapsLocation: string;
  location: string;
  officialPlatform: string;
  bio: string;
  achievements: {
    totalDeals: number;
    totalProperties: number;
    totalClients: number;
    yearsOfExperience: number;
    awards: string[];
    certifications: string[];
    topPerformer: boolean;
    verified: boolean;
  };
  profileImage: string;
  coverImage: string;
  logoImage: string;
}

interface MyPublicPlatformContentProps {
  currentUser?: UserData;
  userId?: string;
}

const MyPublicPlatformContent: React.FC<MyPublicPlatformContentProps> = ({ currentUser, userId = 'default' }) => {
  const [hierarchyData, setHierarchyData] = useState<CityGroup[]>([]);
  const [businessCardData, setBusinessCardData] = useState<BusinessCardData | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  
  // مفتاح التخزين - نفس المفتاح المستخدم في بطاقة الأعمال
  const STORAGE_KEY = `business_card_${userId}`;
  const SWAP_KEY = `business_card_swap_${userId}`;
  
  useEffect(() => {
    const loadData = () => {
      // تحميل العروض من localStorage
      const savedAds = localStorage.getItem('wasata_platform_complete');
      if (savedAds) {
        try {
          const ads = JSON.parse(savedAds).filter((ad: any) => ad.status === 'published');
          const hierarchy = buildHierarchy(ads);
          setHierarchyData(hierarchy);
        } catch (error) {
          console.error('خطأ في تحميل البيانات:', error);
          setHierarchyData(getMockHierarchy());
        }
      } else {
        setHierarchyData(getMockHierarchy());
      }
    };
    
    const loadCardData = () => {
      // تحميل بيانات بطاقة الأعمال بالكامل من نفس المفتاح
      const savedBusinessCard = localStorage.getItem(STORAGE_KEY);
      
      if (savedBusinessCard) {
        try {
          const data = JSON.parse(savedBusinessCard);
          setBusinessCardData(data);
        } catch (error) {
          console.error('خطأ في تحميل بيانات البطاقة:', error);
          setBusinessCardData(null);
        }
      } else {
        setBusinessCardData(null);
      }
      
      // تحميل حالة التبديل
      const swapState = localStorage.getItem(SWAP_KEY);
      setIsSwapped(swapState === 'true');
    };
    
    loadData();
    loadCardData();
    
    const handleUpdate = () => {
      loadData();
      loadCardData();
    };
    
    const handleSwap = () => {
      const swapState = localStorage.getItem(SWAP_KEY);
      setIsSwapped(swapState === 'true');
    };
    
    // الاستماع لحدث تحديث بطاقة الأعمال
    window.addEventListener('businessCardUpdated', handleUpdate);
    window.addEventListener('businessCardSwapped', handleSwap);
    window.addEventListener('publishedAdSaved', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('businessCardUpdated', handleUpdate);
      window.removeEventListener('businessCardSwapped', handleSwap);
      window.removeEventListener('publishedAdSaved', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [currentUser, STORAGE_KEY, SWAP_KEY]);

  // حساب مستوى الشارة
  const getBadgeLevel = () => {
    if (!businessCardData) return { name: "ماسي", icon: "💎", color: "from-purple-500 to-purple-700" };
    
    const deals = businessCardData.achievements?.totalDeals || 0;
    const years = businessCardData.achievements?.yearsOfExperience || 0;
    
    if (deals >= 100 && years >= 10) return { name: "ماسي", icon: "👑", color: "from-purple-500 to-purple-700" };
    if (deals >= 50 && years >= 5) return { name: "بلاتيني", icon: "🏆", color: "from-gray-400 to-gray-600" };
    if (deals >= 30 && years >= 3) return { name: "ذهبي", icon: "🥇", color: "from-yellow-400 to-yellow-600" };
    if (deals >= 15 && years >= 2) return { name: "فضي", icon: "🥈", color: "from-gray-300 to-gray-500" };
    if (deals >= 5 && years >= 1) return { name: "برونزي", icon: "🥉", color: "from-orange-400 to-orange-600" };
    return { name: "مبتدئ", icon: "⚡", color: "from-blue-400 to-blue-600" };
  };

  const badge = getBadgeLevel();
  
  const getMockHierarchy = (): CityGroup[] => {
    return [
      {
        id: 'city-jeddah',
        type: 'city',
        name: 'جدة',
        districts: [
          {
            id: 'district-jeddah-rawda',
            name: 'حي الروضة',
            listings: [
              { id: 'jed-1', title: 'شقة فاخرة للإيجار', description: 'شقة مؤثثة بالكامل مع إطلالة رائعة', price: 3000, propertyType: 'شقة', bedrooms: 3, bathrooms: 2, area: 180, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', imageCount: 12, city: 'جدة', district: 'حي الروضة' },
              { id: 'jed-2', title: 'شقة عائلية مميزة', description: 'شقة واسعة مناسبة للعائلات', price: 4500, propertyType: 'شقة', bedrooms: 4, bathrooms: 3, area: 220, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', imageCount: 8, city: 'جدة', district: 'حي الروضة' },
            ]
          },
          {
            id: 'district-jeddah-hamra',
            name: 'حي الحمراء',
            listings: [
              { id: 'jed-4', title: 'فيلا للبيع', description: 'فيلا فاخرة مع حديقة وحمام سباحة', price: 2500000, propertyType: 'فيلا', bedrooms: 6, bathrooms: 5, area: 500, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', imageCount: 15, city: 'جدة', district: 'حي الحمراء' },
            ]
          }
        ]
      },
      {
        id: 'city-riyadh',
        type: 'city',
        name: 'الرياض',
        districts: [
          {
            id: 'district-riyadh-narjis',
            name: 'حي النرجس',
            listings: [
              { id: 'riy-1', title: 'فيلا فاخرة جديدة', description: 'فيلا حديثة التصميم مع كافة المرافق', price: 3200000, propertyType: 'فيلا', bedrooms: 7, bathrooms: 6, area: 600, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', imageCount: 20, city: 'الرياض', district: 'حي النرجس' },
              { id: 'riy-2', title: 'فيلا مودرن', description: 'تصميم عصري مع تشطيبات فاخرة', price: 2800000, propertyType: 'فيلا', bedrooms: 5, bathrooms: 4, area: 450, image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400', imageCount: 18, city: 'الرياض', district: 'حي النرجس' },
            ]
          }
        ]
      }
    ];
  };
  
  const buildHierarchy = (ads: any[]): CityGroup[] => {
    const cityGroups: { [key: string]: any } = {};
    
    ads.forEach((ad: any) => {
      const city = ad.city || ad.location?.city || 'غير محدد';
      const district = ad.district || ad.location?.district || 'غير محدد';
      
      if (!cityGroups[city]) {
        cityGroups[city] = {
          id: `city-${city}`,
          type: 'city',
          name: city,
          districts: {}
        };
      }
      
      if (!cityGroups[city].districts[district]) {
        cityGroups[city].districts[district] = {
          id: `district-${city}-${district}`,
          name: district,
          listings: []
        };
      }
      
      cityGroups[city].districts[district].listings.push({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price || 0,
        propertyType: ad.propertyType,
        area: ad.area,
        bedrooms: ad.bedrooms,
        bathrooms: ad.bathrooms,
        image: ad.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        imageCount: ad.images?.length || 1,
        city: city,
        district: district
      });
    });
    
    return Object.values(cityGroups).map((city: any) => ({
      ...city,
      districts: Object.values(city.districts)
    }));
  };
  
  const badgeConfig: { [key: string]: { color: string; icon: string } } = {
    "ماسي": { color: "from-purple-600 to-purple-800", icon: "💎" },
    "ذهبي": { color: "from-yellow-500 to-yellow-700", icon: "👑" },
    "فضي": { color: "from-gray-400 to-gray-600", icon: "⭐" },
    "برونزي": { color: "from-orange-400 to-orange-600", icon: "🥉" },
    "نشط": { color: "from-green-500 to-green-700", icon: "✅" },
    "جديد": { color: "from-blue-400 to-blue-600", icon: "🆕" }
  };
  
  const currentBadge = badgeConfig[badge.name] || badge;

  // بطاقة الإعلان
  const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
    if (!listing) return null;

    const handleViewDetails = () => {
      setSelectedListing(listing);
      setShowDetails(true);
    };

    const formatPrice = (price: number) => {
      if (price >= 1000000) {
        return `${(price / 1000000).toFixed(1)} مليون ريال`;
      } else if (price >= 1000) {
        return `${price.toLocaleString()} ريال`;
      }
      return `${price} ريال/شهرياً`;
    };

    return (
      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
        onClick={handleViewDetails}
      >
        <div className="relative h-48">
          <img 
            src={listing.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'} 
            alt={listing.title || 'عقار'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {listing.imageCount > 1 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
              📷 {listing.imageCount}
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-[#01411C] text-white px-3 py-1 rounded-lg font-bold text-sm">
            {formatPrice(listing.price)}
          </div>
          <Badge className="absolute top-2 left-2 bg-[#D4AF37] text-[#01411C] text-xs">
            {listing.propertyType}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 text-base">{listing.title || 'بدون عنوان'}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description || 'لا يوجد وصف'}</p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {listing.area && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Maximize className="w-3 h-3" />
                <span>{listing.area} م²</span>
              </div>
            )}
            {listing.bedrooms && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <BedDouble className="w-3 h-3" />
                <span>{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Bath className="w-3 h-3" />
                <span>{listing.bathrooms}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              <span>{listing.district}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
              className="text-[#01411C] text-sm font-bold hover:text-[#065f41] transition-colors flex items-center gap-1"
            >
              عرض التفاصيل
              <span>←</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // إنشاء رابط المنصة الحقيقي - دائماً يستخدم default
  const getPlatformUrl = () => {
    // يمكن استبدال هذا بالدومين المخصص لاحقاً
    const baseUrl = window.location.origin;
    return `${baseUrl}/platform/default`;
  };

  // مشاركة رابط المنصة
  const sharePlatformLink = async () => {
    const platformLink = getPlatformUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `منصة ${businessCardData?.userName || currentUser?.name || 'الوسيط'}`,
          text: 'تفضل بزيارة منصتي العقارية',
          url: platformLink
        });
      } catch (error) {
        navigator.clipboard.writeText(platformLink);
        toast.success(`تم نسخ الرابط: ${platformLink}`);
      }
    } else {
      navigator.clipboard.writeText(platformLink);
      toast.success(`تم نسخ الرابط: ${platformLink}`);
    }
  };

  // تحديد الصورة الكبيرة فقط بناءً على حالة التبديل (لا نعرض الصورة الصغيرة في منصتي)
  const mainImage = isSwapped ? businessCardData?.logoImage : businessCardData?.profileImage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-white" dir="rtl">
      {/* Header - مطابق تماماً لبطاقة الأعمال */}
      <div 
        className="relative bg-gradient-to-r from-[#01411C] to-[#065f41] text-white p-6 shadow-2xl border-b-4 border-[#D4AF37] bg-cover bg-center transition-all duration-500"
        style={businessCardData?.coverImage ? {
          backgroundImage: `url(${businessCardData.coverImage})`,
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(1, 65, 28, 0.85)'
        } : undefined}
      >
        {/* Pattern overlay - only when no cover image */}
        {!businessCardData?.coverImage && (
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }} />
          </div>
        )}

        {/* زر مشاركة الرابط - أعلى اليمين */}
        <div className="absolute top-4 left-4 z-20">
          <Button
            onClick={sharePlatformLink}
            variant="ghost"
            className="text-white hover:bg-white/20 flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            مشاركة
          </Button>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Profile Image - نفس الحجم والتنسيق في بطاقة الأعمال */}
          <div className="flex justify-center pt-6">
            <div className="relative">
              {/* Main Image - الصورة الكبيرة حسب حالة التبديل */}
              <div className="w-36 h-36 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden bg-gradient-to-br from-white/20 to-white/10 transition-all duration-300">
                {mainImage ? (
                  <img 
                    src={mainImage} 
                    alt="Main"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-[#D4AF37]">
                    {businessCardData?.userName?.charAt(0) || currentUser?.name?.charAt(0) || 'و'}
                  </div>
                )}
              </div>
              {/* لا يتم عرض الصورة الصغيرة في منصتي - فقط الصورة الكبيرة */}
            </div>
          </div>

          {/* Profile Info - نفس التنسيق في بطاقة الأعمال */}
          <div className="pt-4 pb-8 px-4 text-center">
            {/* Name and Badge */}
            <h1 className="text-2xl font-bold text-white">{businessCardData?.userName || currentUser?.name || 'مستخدم تجريبي'}</h1>
            <div className="mt-2 inline-flex items-center gap-2 flex-wrap justify-center">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm"
                title={`${badge.name} - ${businessCardData?.achievements?.totalDeals || 0} صفقة - ${businessCardData?.achievements?.yearsOfExperience || 0} سنوات خبرة`}
              >
                {badge.icon} {badge.name}
              </span>
              {businessCardData?.achievements?.verified && (
                <span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  ✅ موثق
                </span>
              )}
              {businessCardData?.achievements?.topPerformer && (
                <span className="px-2 py-1 rounded-full text-xs bg-[#D4AF37] text-white">
                  ⭐ أفضل أداء
                </span>
              )}
            </div>

            {/* Company */}
            {businessCardData?.companyName && (
              <p className="mt-2 text-white/90 flex items-center justify-center gap-1">
                <Building2 className="w-4 h-4" />
                {businessCardData.companyName}
              </p>
            )}

            {/* Licenses */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {businessCardData?.falLicense && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  📜 رخصة فال: {businessCardData.falLicense}
                </span>
              )}
              {businessCardData?.commercialRegistration && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                  📋 السجل: {businessCardData.commercialRegistration}
                </span>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-white/90">
              {businessCardData?.primaryPhone && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  {businessCardData.primaryPhone}
                </span>
              )}
              {businessCardData?.email && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Star className="w-4 h-4 text-[#D4AF37]" />
                  {businessCardData.email}
                </span>
              )}
              {businessCardData?.location && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  {businessCardData.location}
                </span>
              )}
            </div>

            {/* Website/Domain */}
            {businessCardData?.domain && (
              <div className="mt-3">
                <a 
                  href={businessCardData.domain} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-[#D4AF37] text-[#01411C] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#f1c40f] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  زيارة الموقع
                </a>
              </div>
            )}

            {/* أزرار التواصل */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button 
                size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => window.open(`https://wa.me/${businessCardData?.primaryPhone?.replace(/\D/g, '') || '966501234567'}`, '_blank')}
              >
                <MessageSquare className="w-4 h-4 ml-2" />
                واتساب
              </Button>
              <Button 
                size="sm" 
                className="bg-[#D4AF37] hover:bg-[#c9a030] text-[#01411C]"
                onClick={() => window.open(`tel:${businessCardData?.primaryPhone || '+966501234567'}`, '_blank')}
              >
                <Phone className="w-4 h-4 ml-2" />
                اتصال
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* عرض العروض */}
        {hierarchyData.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 md:p-16 text-center border-2 border-dashed border-[#d4af37]">
            <div className="text-5xl md:text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد عروض منشورة</h3>
            <p className="text-gray-600">ابدأ بنشر أول عرض عقاري</p>
          </div>
        ) : (
          <div className="space-y-8">
            {hierarchyData.map((city) => {
              if (city.districts && city.districts.length > 0) {
                const hasMultipleDistricts = city.districts.length > 1;
                const totalListings = city.districts.reduce((sum, d) => sum + d.listings.length, 0);
                
                return (
                  <div key={city.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border-2 border-[#01411C]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-[#01411C] flex items-center gap-2">
                        <span className="text-2xl">🏙️</span>
                        {city.name}
                      </h2>
                      <Badge className="bg-[#01411C] text-[#D4AF37]">
                        {totalListings} عقار
                      </Badge>
                    </div>
                    
                    {hasMultipleDistricts ? (
                      <div className="space-y-6">
                        {city.districts.map((district) => (
                          <div key={district.id}>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-200">
                              <MapPin className="w-5 h-5 text-[#D4AF37]" />
                              {district.name}
                              <Badge variant="outline" className="text-xs">
                                {district.listings.length} عقار
                              </Badge>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {district.listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {city.districts[0].listings.map((listing) => (
                          <ListingCard key={listing.id} listing={listing} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        )}
        
        {/* Footer */}
        <footer className="bg-[#01411C] text-white py-4 text-center mt-12 rounded-xl">
          <p className="text-sm opacity-75 flex items-center justify-center gap-2">
            <span>مدعوم من</span>
            <span className="font-bold text-[#D4AF37]">وساطه AI Wasata</span>
          </p>
        </footer>
      </div>

      {/* صفحة تفاصيل العرض */}
      {selectedListing && (
        <OfferDetailsPage
          listing={selectedListing}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedListing(null);
          }}
        />
      )}
    </div>
  );
};

export default MyPublicPlatformContent;
