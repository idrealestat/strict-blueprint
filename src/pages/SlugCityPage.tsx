/**
 * SlugCityPage.tsx
 * صفحة عروض المدينة العامة
 * الوصول عبر: /{slug}/{city}
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Building2, ChevronLeft, Home, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { slugToArabic, arabicToSlug, buildDistrictUrl } from '@/utils/slugify';
import LiveViewersBadge from '@/components/ui/LiveViewersBadge';
import { usePagePresence } from '@/hooks/usePagePresence';

interface Listing {
  id: string;
  title: string;
  price: number;
  property_type: string;
  city: string;
  district: string;
  image: string | null;
  images: string[] | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  views: number | null;
}

interface DistrictGroup {
  name: string;
  slug: string;
  listings: Listing[];
  totalViews: number;
}

const SlugCityPage: React.FC = () => {
  const { slug, citySlug } = useParams<{ slug: string; citySlug: string }>();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<DistrictGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cityName, setCityName] = useState('');
  const [brokerName, setBrokerName] = useState('');

  const { liveCount } = usePagePresence('city', `${slug}-${citySlug}`);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !citySlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // جلب بيانات الوسيط
        const { data: businessCard } = await supabase
          .from('business_cards')
          .select('user_id, data')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (!businessCard) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const cardData = businessCard.data as Record<string, any>;
        setBrokerName(cardData?.userName || '');

        // جلب العروض للمدينة
        const { data: listings, error } = await supabase
          .from('platform_listings')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .is('deleted_at', null);

        if (error) throw error;

        // تصفية حسب المدينة (مقارنة الـ slug)
        const cityListings = (listings || []).filter(l => 
          arabicToSlug(l.city) === citySlug
        );

        if (cityListings.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // استخراج اسم المدينة
        setCityName(cityListings[0]?.city || slugToArabic(citySlug));

        // تجميع حسب الحي
        const districtMap = new Map<string, Listing[]>();
        cityListings.forEach(listing => {
          const district = listing.district || 'بدون حي';
          if (!districtMap.has(district)) {
            districtMap.set(district, []);
          }
          districtMap.get(district)!.push(listing as Listing);
        });

        // تحويل إلى مصفوفة مع حساب الإحصائيات
        const districtGroups: DistrictGroup[] = Array.from(districtMap.entries()).map(([name, listings]) => ({
          name,
          slug: arabicToSlug(name),
          listings,
          totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
        }));

        // ترتيب حسب عدد العروض
        districtGroups.sort((a, b) => b.listings.length - a.listings.length);

        setDistricts(districtGroups);
      } catch (err) {
        console.error('Error fetching city data:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, citySlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">المدينة غير موجودة</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على عروض في هذه المدينة.
          </p>
          <Button onClick={() => navigate(`/${slug}`)}>
            <Home className="w-4 h-4 ml-2" />
            العودة للمنصة
          </Button>
        </div>
      </div>
    );
  }

  const totalListings = districts.reduce((sum, d) => sum + d.listings.length, 0);
  const pageTitle = `عروض ${cityName} - ${brokerName}`;
  const pageDescription = `تصفح ${totalListings} عرض عقاري في ${cityName} من ${brokerName}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <LiveViewersBadge count={liveCount} variant="floating" />

      <div className="min-h-screen bg-gradient-to-b from-[#01411C]/5 to-background" dir="rtl">
        {/* Header */}
        <div className="bg-[#01411C] text-white py-6 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/70 mb-4">
              <Link to={`/${slug}`} className="hover:text-white transition-colors">
                {brokerName || 'المنصة'}
              </Link>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[#D4AF37]">{cityName}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[#01411C]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{cityName}</h1>
                <p className="text-white/80 mt-1">
                  {totalListings} عرض في {districts.length} حي
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Districts Grid */}
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {districts.map(district => {
              const previewImages = district.listings
                .slice(0, 4)
                .map(l => l.images?.[0] || l.image)
                .filter(Boolean);

              return (
                <Card 
                  key={district.name}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#01411C]"
                  onClick={() => navigate(buildDistrictUrl(slug!, cityName, district.name))}
                >
                  {/* صور المعاينة */}
                  <div className="h-32 bg-gray-100 relative">
                    <div className="grid grid-cols-4 h-full">
                      {previewImages.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="overflow-hidden">
                          <img 
                            src={img as string} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {previewImages.length < 4 && Array(4 - previewImages.length).fill(0).map((_, idx) => (
                        <div key={`empty-${idx}`} className="bg-gray-200 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                      ))}
                    </div>
                    <Badge className="absolute top-2 right-2 bg-[#01411C]">
                      {district.listings.length} عرض
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-[#01411C] text-lg">{district.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Eye className="w-3 h-3" />
                          {district.totalViews.toLocaleString()} مشاهدة
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default SlugCityPage;
