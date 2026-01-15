/**
 * SlugDistrictPage.tsx
 * صفحة عروض الحي العامة
 * الوصول عبر: /{slug}/{city}/{district}
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Building2, ChevronLeft, Home, Eye, BedDouble, Bath, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { slugToArabic, arabicToSlug, buildOfferUrl } from '@/utils/slugify';
import LiveViewersBadge from '@/components/ui/LiveViewersBadge';
import LiveViewerIndicator from '@/components/ui/LiveViewerIndicator';
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

const SlugDistrictPage: React.FC = () => {
  const { slug, citySlug, districtSlug } = useParams<{ 
    slug: string; 
    citySlug: string; 
    districtSlug: string;
  }>();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cityName, setCityName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [offerLiveViewers, setOfferLiveViewers] = useState<Record<string, number>>({});

  const { liveCount } = usePagePresence('district', `${slug}-${citySlug}-${districtSlug}`);
  
  // تتبع المشاهدين لكل عرض
  useEffect(() => {
    if (listings.length === 0) return;
    
    const channels: ReturnType<typeof supabase.channel>[] = [];
    
    listings.forEach(listing => {
      const channelName = `page-presence-offer-${listing.id}`;
      const channel = supabase.channel(channelName, {
        config: { presence: { key: `district-viewer-${Date.now()}` } }
      });
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setOfferLiveViewers(prev => ({
            ...prev,
            [listing.id]: Object.keys(state).length
          }));
        })
        .subscribe();
      
      channels.push(channel);
    });
    
    return () => {
      channels.forEach(ch => ch.unsubscribe());
    };
  }, [listings]);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !citySlug || !districtSlug) {
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

        // جلب العروض
        const { data: allListings, error } = await supabase
          .from('platform_listings')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .is('deleted_at', null);

        if (error) throw error;

        // تصفية حسب المدينة والحي
        const filteredListings = (allListings || []).filter(l => 
          arabicToSlug(l.city) === citySlug && 
          arabicToSlug(l.district) === districtSlug
        );

        if (filteredListings.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCityName(filteredListings[0]?.city || slugToArabic(citySlug));
        setDistrictName(filteredListings[0]?.district || slugToArabic(districtSlug));
        setListings(filteredListings as Listing[]);
      } catch (err) {
        console.error('Error fetching district data:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, citySlug, districtSlug]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} مليون ريال`;
    }
    return `${price.toLocaleString()} ريال`;
  };

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
            <Building2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">الحي غير موجود</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على عروض في هذا الحي.
          </p>
          <Button onClick={() => navigate(`/${slug}`)}>
            <Home className="w-4 h-4 ml-2" />
            العودة للمنصة
          </Button>
        </div>
      </div>
    );
  }

  const pageTitle = `عروض ${districtName} - ${cityName} | ${brokerName}`;
  const pageDescription = `تصفح ${listings.length} عرض عقاري في ${districtName}، ${cityName}`;

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
            <nav className="flex items-center gap-2 text-sm text-white/70 mb-4 flex-wrap">
              <Link to={`/${slug}`} className="hover:text-white transition-colors">
                {brokerName || 'المنصة'}
              </Link>
              <ChevronLeft className="w-4 h-4" />
              <Link to={`/${slug}/${citySlug}`} className="hover:text-white transition-colors">
                {cityName}
              </Link>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[#D4AF37]">{districtName}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center">
                <Building2 className="w-8 h-8 text-[#01411C]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold">{districtName}</h1>
                  <LiveViewerIndicator 
                    liveViewers={liveCount} 
                    totalViews={listings.reduce((sum, l) => sum + (l.views || 0), 0)}
                    showTotalViews={true}
                    size="md"
                  />
                </div>
                <p className="text-white/80 mt-1">
                  {cityName} • {listings.length} عرض
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(listing => (
              <Card 
                key={listing.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#01411C]"
                onClick={() => navigate(buildOfferUrl(slug!, cityName, districtName, listing.id))}
              >
                {/* صورة العرض */}
                <div className="h-48 bg-gray-100 relative">
                  <img 
                    src={listing.images?.[0] || listing.image || '/placeholder.svg'} 
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-[#01411C]">
                    {listing.property_type}
                  </Badge>
                  {/* مؤشر المشاهدات المباشرة */}
                  <div className="absolute top-2 left-2">
                    <LiveViewerIndicator 
                      liveViewers={offerLiveViewers[listing.id] || 0} 
                      size="sm"
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {(listing.views || 0).toLocaleString()}
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-bold text-[#01411C] line-clamp-1">{listing.title}</h3>
                  <p className="text-[#D4AF37] font-bold mt-2">{formatPrice(listing.price)}</p>
                  
                  <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
                    {listing.bedrooms && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-4 h-4" />
                        {listing.bedrooms}
                      </span>
                    )}
                    {listing.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {listing.bathrooms}
                      </span>
                    )}
                    {listing.area && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        {listing.area} م²
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SlugDistrictPage;
