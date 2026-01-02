/**
 * MyPlatformSmartPaths.tsx
 * منصتي مع نظام المسارات الذكية
 * حرفياً من الملف SMART_PATHS_COMPLETE_SYSTEM
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Eye,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  Home,
  Building,
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { 
  getAllPublishedAds, 
  PublishedAd, 
  groupAdsBySmartPath, 
  GroupedAds,
  clearMockAds 
} from '@/utils/publishedAds';
import { useDashboardContext } from '@/context/DashboardContext';

// واجهة المستخدم
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  plan?: string;
  companyName?: string;
  licenseNumber?: string;
}

// واجهة الـ Props
interface MyPlatformSmartPathsProps {
  user: User | null;
  onBack: () => void;
  showHeader?: boolean;
}

// بيانات الوسيط (للعرض)
const formData = {
  primaryPhone: '0501234567',
  whatsapp: '0501234567'
};

export default function MyPlatformSmartPaths({ user, onBack, showHeader = true }: MyPlatformSmartPathsProps) {
  const { leftSidebarOpen } = useDashboardContext();
  
  // الحالات الأساسية
  const [publishedAds, setPublishedAds] = useState<PublishedAd[]>([]);
  const [filteredAds, setFilteredAds] = useState<PublishedAd[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'sale' | 'rent'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [selectedAdNumber, setSelectedAdNumber] = useState<string | null>(null);
  
  // 🆕 الحالات الإضافية للمسارات الذكية (3 states جديدة)
  const [displayMode, setDisplayMode] = useState<'grouped' | 'flat'>('grouped');
  const [groupedAds, setGroupedAds] = useState<GroupedAds[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupedAds | null>(null);
  
  // الحالة الموجودة مسبقاً
  const [selectedAdForDetail, setSelectedAdForDetail] = useState<PublishedAd | null>(null);

  // تحميل الإعلانات عند التحميل
  useEffect(() => {
    clearMockAds(); // مسح البيانات الوهمية
    const ads = getAllPublishedAds();
    setPublishedAds(ads);
    setFilteredAds(ads);
  }, []);

  // فلترة الإعلانات
  useEffect(() => {
    let filtered = [...publishedAds];
    
    // فلترة حسب التبويب
    if (activeTab === 'sale') {
      filtered = filtered.filter(ad => ad.purpose === 'بيع');
    } else if (activeTab === 'rent') {
      filtered = filtered.filter(ad => ad.purpose === 'إيجار');
    }
    
    // فلترة حسب البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(query) ||
        ad.location.city.toLowerCase().includes(query) ||
        ad.location.district.toLowerCase().includes(query)
      );
    }
    
    // فلترة حسب السعر
    if (priceRange.min) {
      filtered = filtered.filter(ad => ad.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(ad => ad.price <= parseFloat(priceRange.max));
    }
    
    setFilteredAds(filtered);
  }, [publishedAds, activeTab, searchQuery, priceRange]);

  // 🆕 تجميع الإعلانات حسب المسار الذكي
  useEffect(() => {
    if (displayMode === 'grouped') {
      const grouped = groupAdsBySmartPath();
      setGroupedAds(grouped);
      console.log('📁 تم تجميع الإعلانات:', grouped.length, 'مجموعة');
    }
  }, [publishedAds, displayMode]);

  // تحديث إحصائيات المشاهدة
  const handleViewAd = (ad: PublishedAd) => {
    // ✅ إغلاق مودال المجموعة أولاً إذا كان مفتوحاً
    if (selectedGroup) {
      setSelectedGroup(null);
    }
    // ثم فتح تفاصيل العقار
    setSelectedAdForDetail(ad);
  };

  // 🆕 بطاقة العرض الفردي
  const OfferCard = ({ ad }: { ad: PublishedAd }) => {
    return (
      <Card 
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-gray-200"
        onClick={() => handleViewAd(ad)}
      >
        {/* الصورة */}
        <div className="relative h-40 md:h-64 overflow-hidden">
          <img
            src={ad.mediaFiles[0]?.url || 'https://via.placeholder.com/400x300?text=عقار'}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Badge الغرض */}
          <div className="absolute top-4 right-4">
            <Badge className={ad.purpose === 'بيع' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}>
              {ad.purpose}
            </Badge>
          </div>

          {/* Badge السعر */}
          <div className="absolute bottom-4 right-4">
            <Badge className="bg-[#01411C] text-[#D4AF37] text-sm px-3 py-1">
              {ad.priceText || `${ad.price.toLocaleString()} ريال`}
            </Badge>
          </div>

          {/* التدرج */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <CardContent className="p-3 md:p-4 space-y-2">
          {/* العنوان */}
          <h3 className="font-bold text-sm md:text-lg text-[#01411C] line-clamp-1">
            {ad.title}
          </h3>

          {/* الموقع */}
          <div className="flex items-center gap-2 text-gray-600 text-xs md:text-sm">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-[#D4AF37]" />
            <span>{ad.location.city} - {ad.location.district}</span>
          </div>

          {/* المميزات */}
          {ad.features && (
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500">
              {ad.features.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{ad.features.bedrooms}</span>
                </div>
              )}
              {ad.features.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{ad.features.bathrooms}</span>
                </div>
              )}
              {ad.features.area && (
                <div className="flex items-center gap-1">
                  <Maximize className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{ad.features.area} م²</span>
                </div>
              )}
            </div>
          )}

          {/* الإحصائيات */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Eye className="w-3 h-3" />
              <span>{ad.views || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Heart className="w-3 h-3" />
              <span>{ad.favorites || 0}</span>
            </div>
          </div>

          {/* أزرار التواصل */}
          <div className="flex gap-2">
            <Button 
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/${formData.primaryPhone}?text=مرحباً، أنا مهتم بـ: ${ad.title}`, '_blank');
              }}
            >
              <MessageCircle className="w-3 h-3 ml-1" />
              واتساب
            </Button>
            <Button 
              size="sm"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${formData.primaryPhone}`;
              }}
            >
              <Phone className="w-3 h-3 ml-1" />
              اتصال
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 🆕 بطاقة المجموعة الرئيسية
  const GroupCard = ({ group }: { group: GroupedAds }) => {
    const handleClick = () => {
      setSelectedGroup(group);
    };

    return (
      <Card 
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-[#D4AF37]/30"
        onClick={handleClick}
      >
        {/* صورة أول إعلان */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={group.firstImage || 'https://via.placeholder.com/400x300?text=عقار'}
            alt={group.path}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Badge عدد الفروع */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-[#01411C] text-[#D4AF37] text-lg px-4 py-2">
              {group.count} عرض
            </Badge>
          </div>

          {/* التدرج */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <CardContent className="p-4 space-y-3">
          {/* معلومات المسار */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-bold text-[#01411C]">{group.pathParts.city}</span>
              <span className="text-gray-400">•</span>
              <span>{group.pathParts.district}</span>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Building className="w-3 h-3 ml-1" />
                {group.pathParts.propertyType}
              </Badge>
              
              <Badge variant="outline" className={
                group.pathParts.purpose === 'بيع' 
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }>
                <DollarSign className="w-3 h-3 ml-1" />
                {group.pathParts.purpose}
              </Badge>
              
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {group.pathParts.category === 'سكني' ? '🏠' : '🏢'} {group.pathParts.category}
              </Badge>
            </div>
          </div>

          {/* زر العرض */}
          <Button 
            className="w-full bg-gradient-to-r from-[#01411C] to-[#065f41] text-[#D4AF37] hover:from-[#065f41] hover:to-[#01411C]"
          >
            عرض جميع العقارات ({group.count})
            <Eye className="w-4 h-4 mr-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div 
      className="bg-gradient-to-b from-gray-50 to-white transition-all duration-300 min-h-screen" 
      dir="rtl"
      style={{
        marginLeft: leftSidebarOpen ? "350px" : "0"
      }}
    >
      {/* 🆕 مودال عرض الفروع */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedGroup(null)}>
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#01411C]">
                  {selectedGroup.pathParts.city} - {selectedGroup.pathParts.district}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {selectedGroup.pathParts.propertyType}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {selectedGroup.pathParts.purpose}
                  </Badge>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                    {selectedGroup.pathParts.category}
                  </Badge>
                  <span className="text-gray-500">• {selectedGroup.count} عرض</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedGroup(null)}
                className="rounded-full w-10 h-10 p-0"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedGroup.ads.map(ad => (
                <OfferCard key={ad.id} ad={ad} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* مودال تفاصيل العقار */}
      {selectedAdForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedAdForDetail(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img
                src={selectedAdForDetail.mediaFiles[0]?.url || 'https://via.placeholder.com/600x400?text=عقار'}
                alt={selectedAdForDetail.title}
                className="w-full h-64 object-cover"
              />
              <Button
                variant="outline"
                onClick={() => setSelectedAdForDetail(null)}
                className="absolute top-4 left-4 rounded-full w-10 h-10 p-0 bg-white"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-[#01411C]">{selectedAdForDetail.title}</h2>
              
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                <span>{selectedAdForDetail.location.city} - {selectedAdForDetail.location.district}</span>
              </div>
              
              <div className="text-2xl font-bold text-[#D4AF37]">
                {selectedAdForDetail.priceText || `${selectedAdForDetail.price.toLocaleString()} ريال`}
              </div>
              
              {selectedAdForDetail.description && (
                <p className="text-gray-600">{selectedAdForDetail.description}</p>
              )}
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => window.open(`https://wa.me/${formData.primaryPhone}?text=مرحباً، أنا مهتم بـ: ${selectedAdForDetail.title}`, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  واتساب
                </Button>
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => window.location.href = `tel:${formData.primaryPhone}`}
                >
                  <Phone className="w-4 h-4 ml-2" />
                  اتصال
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* الهيدر */}
      {showHeader && (
        <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-b-4 border-[#D4AF37] shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={onBack}
                variant="outline"
                className="border-2 border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة
              </Button>
              
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Home className="w-6 h-6" />
                منصتي
              </h1>
              
              <div className="w-20" /> {/* Spacer */}
            </div>
          </div>
        </header>
      )}

      {/* المحتوى الرئيسي */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* التبويبات والفلاتر */}
        <Card className="border-2 border-[#D4AF37]">
          <CardContent className="p-4 space-y-4">
            {/* صف التبويبات وأزرار العرض */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* التبويبات */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                    الكل
                  </TabsTrigger>
                  <TabsTrigger value="sale" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                    للبيع
                  </TabsTrigger>
                  <TabsTrigger value="rent" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
                    للإيجار
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* أزرار طريقة العرض */}
              <div className="flex gap-2 mr-4">
                {/* 🆕 نمط العرض: مجموعات أو عشوائي */}
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
                  <Button
                    size="sm"
                    variant={displayMode === 'grouped' ? 'default' : 'outline'}
                    onClick={() => setDisplayMode('grouped')}
                    className={displayMode === 'grouped' ? 'bg-[#01411C] text-[#D4AF37]' : ''}
                    title="عرض مجموعات (رئيسي + فروع)"
                  >
                    <Building className="w-4 h-4 ml-1" />
                    مجموعات
                  </Button>
                  <Button
                    size="sm"
                    variant={displayMode === 'flat' ? 'default' : 'outline'}
                    onClick={() => setDisplayMode('flat')}
                    className={displayMode === 'flat' ? 'bg-[#01411C] text-[#D4AF37]' : ''}
                    title="عرض عشوائي (جميع العروض)"
                  >
                    <Grid className="w-4 h-4 ml-1" />
                    عشوائي
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-[#01411C] text-[#D4AF37]' : ''}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-[#01411C] text-[#D4AF37]' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="ابحث في العقارات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 border-2 border-gray-300 focus:border-[#D4AF37]"
              />
            </div>
          </CardContent>
        </Card>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#D4AF37]">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-[#01411C]">{publishedAds.length}</div>
              <div className="text-sm text-gray-600">إجمالي العروض</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-400">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {publishedAds.filter(a => a.purpose === 'بيع').length}
              </div>
              <div className="text-sm text-gray-600">للبيع</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-400">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {publishedAds.filter(a => a.purpose === 'إيجار').length}
              </div>
              <div className="text-sm text-gray-600">للإيجار</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-400">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{groupedAds.length}</div>
              <div className="text-sm text-gray-600">مجموعات</div>
            </CardContent>
          </Card>
        </div>

        {/* عرض العقارات */}
        {displayMode === 'flat' ? (
          /* العرض العشوائي (الطريقة القديمة) */
          filteredAds.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">لا توجد عقارات متاحة حالياً</p>
                <p className="text-sm mt-2">جارٍ إضافة عقارات جديدة قريباً</p>
              </div>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredAds.map(ad => (
                <OfferCard key={ad.id} ad={ad} />
              ))}
            </div>
          )
        ) : (
          /* 🆕 العرض المجمع (رئيسي + فروع) */
          groupedAds.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">لا توجد مجموعات متاحة حالياً</p>
                <p className="text-sm mt-2">جارٍ إضافة عقارات جديدة قريباً</p>
              </div>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {groupedAds.map(group => (
                <GroupCard key={group.path} group={group} />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
