/**
 * SlugOffersPage.tsx
 * صفحة العروض العامة بناءً على الـ slug
 * الوصول عبر: wasataai.com/{slug}/offers
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight, Home, MapPin, Bed, Bath, Maximize, Eye, Building2, DollarSign, Grid3X3, List, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface BusinessCardData {
  id: string;
  slug: string;
  user_id: string;
  data: {
    userName?: string;
    companyName?: string;
    primaryPhone?: string;
    email?: string;
    profileImage?: string;
    logoImage?: string;
    location?: string;
    [key: string]: any;
  };
}

interface PropertyListing {
  id: string;
  title: string;
  property_type: string;
  city: string;
  district: string;
  price: number;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  image: string | null;
  images: string[] | null;
  purpose: string | null;
  views: number | null;
  created_at: string;
}

const SlugOffersPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [businessCard, setBusinessCard] = useState<BusinessCardData | null>(null);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // جلب بطاقة الأعمال
        const { data: cardData, error: cardError } = await supabase
          .from('public_business_cards')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (cardError || !cardData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setBusinessCard(cardData as BusinessCardData);

        // جلب العروض العقارية للمستخدم
        const { data: listingsData, error: listingsError } = await supabase
          .from('platform_listings')
          .select('*')
          .eq('user_id', cardData.user_id)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (!listingsError && listingsData) {
          setListings(listingsData as PropertyListing[]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // تصفية العروض
  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchQuery || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.district.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = propertyTypeFilter === 'all' || listing.property_type === propertyTypeFilter;
    const matchesPurpose = purposeFilter === 'all' || listing.purpose === purposeFilter;
    
    return matchesSearch && matchesType && matchesPurpose;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA').format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل العروض...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">العروض غير متاحة</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على هذه الصفحة.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const cardData = businessCard?.data || {};
  const pageTitle = cardData.userName ? `عروض ${cardData.userName} العقارية` : 'العروض العقارية';
  const pageDescription = cardData.userName
    ? `تصفح ${listings.length} عرض عقاري من ${cardData.userName}`
    : 'تصفح العروض العقارية المميزة';

  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}/offers` : '';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <header className="bg-primary text-primary-foreground py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate(`/${slug}`)}
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للمنصة
              </Button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
            <p className="text-primary-foreground/80 mt-2">
              {listings.length} عرض متاح
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="sticky top-0 z-10 bg-card border-b shadow-sm py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في العروض..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Property Type Filter */}
              <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="نوع العقار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="شقة">شقة</SelectItem>
                  <SelectItem value="فيلا">فيلا</SelectItem>
                  <SelectItem value="أرض">أرض</SelectItem>
                  <SelectItem value="عمارة">عمارة</SelectItem>
                  <SelectItem value="مكتب">مكتب</SelectItem>
                  <SelectItem value="محل">محل</SelectItem>
                </SelectContent>
              </Select>

              {/* Purpose Filter */}
              <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="الغرض" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="بيع">للبيع</SelectItem>
                  <SelectItem value="إيجار">للإيجار</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground mt-3">
              عرض {filteredListings.length} من {listings.length} عقار
            </p>
          </div>
        </div>

        {/* Listings */}
        <main className="max-w-7xl mx-auto py-6 px-4">
          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد عروض</h3>
              <p className="text-muted-foreground">
                {searchQuery || propertyTypeFilter !== 'all' || purposeFilter !== 'all'
                  ? 'جرب تغيير معايير البحث'
                  : 'لم يتم نشر أي عروض بعد'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
              : 'space-y-4'
            }>
              {filteredListings.map((listing) => (
                <Card 
                  key={listing.id} 
                  className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group ${
                    viewMode === 'list' ? 'flex flex-row' : ''
                  }`}
                  onClick={() => navigate(`/${slug}/offer/${listing.id}`)}
                >
                  {/* Image */}
                  <div className={`relative bg-muted ${
                    viewMode === 'list' ? 'w-48 h-32 flex-shrink-0' : 'aspect-[4/3]'
                  }`}>
                    {listing.image || (listing.images && listing.images[0]) ? (
                      <img
                        src={listing.image || listing.images![0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Purpose Badge */}
                    {listing.purpose && (
                      <Badge 
                        className="absolute top-2 right-2"
                        variant={listing.purpose === 'بيع' ? 'default' : 'secondary'}
                      >
                        {listing.purpose === 'بيع' ? 'للبيع' : 'للإيجار'}
                      </Badge>
                    )}

                    {/* Views */}
                    {listing.views && listing.views > 0 && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {listing.views}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{listing.title}</h3>
                    
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.district}، {listing.city}</span>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {listing.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{listing.bedrooms}</span>
                        </div>
                      )}
                      {listing.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span>{listing.bathrooms}</span>
                        </div>
                      )}
                      {listing.area && (
                        <div className="flex items-center gap-1">
                          <Maximize className="w-4 h-4" />
                          <span>{listing.area} م²</span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-primary font-bold text-lg">
                        <span>{formatPrice(listing.price)}</span>
                        <span className="text-sm font-normal">ريال</span>
                      </div>
                      <Badge variant="outline">{listing.property_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-muted py-6 px-4 mt-8">
          <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
            <p>
              {cardData.companyName || cardData.userName} © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SlugOffersPage;
