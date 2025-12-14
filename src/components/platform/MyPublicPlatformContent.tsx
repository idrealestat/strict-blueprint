/**
 * MyPublicPlatformContent.tsx
 * صفحة المنصة العامة - عرض العروض بشكل هرمي مع بطاقة الوسيط
 */

import React, { useState, useEffect } from 'react';
import { Star, Building2, MapPin, Eye, BedDouble, Bath, Maximize, Phone, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface MyPublicPlatformContentProps {
  currentUser?: UserData;
}

const MyPublicPlatformContent: React.FC<MyPublicPlatformContentProps> = ({ currentUser }) => {
  const [hierarchyData, setHierarchyData] = useState<CityGroup[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [cardData, setCardData] = useState<UserData>({});
  
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
          // استخدام بيانات تجريبية
          setHierarchyData(getMockHierarchy());
        }
      } else {
        // بيانات تجريبية
        setHierarchyData(getMockHierarchy());
      }
    };
    
    const loadCardData = () => {
      const savedProfile = localStorage.getItem('businessCard_profileImage');
      const savedLogo = localStorage.getItem('businessCard_logoImage');
      const savedCover = localStorage.getItem('businessCard_coverImage');
      const savedData = localStorage.getItem('businessCard_data');
      
      if (savedProfile) setProfileImage(savedProfile);
      if (savedLogo) setLogoImage(savedLogo);
      if (savedCover) setCoverImage(savedCover);
      if (savedData) {
        const data = JSON.parse(savedData);
        setCardData({
          name: data.name || currentUser?.name || 'مستخدم تجريبي',
          title: data.title || currentUser?.title || 'وسيط عقاري معتمد',
          rating: currentUser?.rating || 5.0,
          badge: currentUser?.badge || 'ماسي',
          totalDeals: currentUser?.totalDeals || 156
        });
      } else {
        setCardData({
          name: currentUser?.name || 'مستخدم تجريبي',
          title: currentUser?.title || 'وسيط عقاري معتمد',
          rating: currentUser?.rating || 5.0,
          badge: currentUser?.badge || 'ماسي',
          totalDeals: currentUser?.totalDeals || 156
        });
      }
    };
    
    loadData();
    loadCardData();
    
    const handleUpdate = () => {
      loadData();
      loadCardData();
    };
    
    window.addEventListener('publishedAdSaved', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('publishedAdSaved', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [currentUser]);
  
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
  
  const currentBadge = badgeConfig[cardData.badge || "جديد"] || badgeConfig["جديد"];

  // بطاقة الإعلان
  const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
    if (!listing) return null;

    const handleViewDetails = () => {
      window.dispatchEvent(new CustomEvent('viewAdDetails', { 
        detail: { adId: listing.id, source: 'platform' } 
      }));
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
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
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
              onClick={handleViewDetails}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-white" dir="rtl">
      {/* Header - بطاقة الوسيط */}
      <div 
        className="pt-8 pb-6 px-6 relative"
        style={{
          background: coverImage 
            ? `linear-gradient(rgba(1, 65, 28, 0.85), rgba(6, 95, 65, 0.85)), url(${coverImage}) center/cover`
            : 'linear-gradient(to bottom right, #01411C, #065f41)'
        }}
      >
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="relative inline-block">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile"
                className="w-28 h-28 md:w-32 md:h-32 mx-auto mb-3 rounded-full border-4 border-[#D4AF37] shadow-2xl object-cover"
              />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 mx-auto mb-3 rounded-full border-4 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center shadow-2xl">
                <span className="text-3xl md:text-4xl font-bold text-[#01411C]">
                  {cardData.name?.substring(0, 2) || 'وس'}
                </span>
              </div>
            )}
            {logoImage && (
              <img 
                src={logoImage}
                alt="Logo"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white shadow-lg object-cover absolute bottom-0 right-2"
              />
            )}
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">{cardData.name}</h1>
          <p className="text-white/90 text-sm md:text-base mb-3">{cardData.title}</p>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-white font-bold text-lg">{cardData.rating}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 md:w-5 md:h-5 ${
                    star <= Math.floor(cardData.rating || 5)
                      ? "text-[#D4AF37] fill-current"
                      : "text-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className={`inline-block px-4 py-1.5 bg-gradient-to-r ${currentBadge.color} text-white text-sm rounded-full font-bold shadow-lg mb-4`}>
            {currentBadge.icon} {cardData.badge}
          </div>

          {/* أزرار التواصل */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button 
              size="sm" 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => window.open('https://wa.me/966501234567', '_blank')}
            >
              <MessageSquare className="w-4 h-4 ml-2" />
              واتساب
            </Button>
            <Button 
              size="sm" 
              className="bg-[#D4AF37] hover:bg-[#c9a030] text-[#01411C]"
              onClick={() => window.open('tel:+966501234567', '_blank')}
            >
              <Phone className="w-4 h-4 ml-2" />
              اتصال
            </Button>
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
    </div>
  );
};

export default MyPublicPlatformContent;
