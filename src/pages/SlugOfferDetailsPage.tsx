/**
 * SlugOfferDetailsPage.tsx
 * صفحة تفاصيل العرض العامة
 * الوصول عبر: /{slug}/{city}/{district}/{offerId}
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { slugToArabic, arabicToSlug } from '@/utils/slugify';
import LiveViewersBadge from '@/components/ui/LiveViewersBadge';
import { usePagePresence } from '@/hooks/usePagePresence';
import OfferDetailsPage from '@/components/platform/OfferDetailsPage';
import { getDisplayName } from '@/components/business-card/DisplayNameSettings';

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  property_type: string;
  city: string;
  district: string;
  street: string | null;
  image: string | null;
  images: string[] | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  age: number | null;
  direction: string | null;
  features: string[] | null;
  views: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  broker_phone: string | null;
  video_url: string | null;
  tour_3d_url: string | null;
  living_rooms: string | null;
  councils: string | null;
  floors: string | null;
  floor_number: string | null;
  corner_type: string | null;
  street_width: string | null;
  furnishing: string | null;
  entrances: string | null;
  balconies: string | null;
  ac_units: string | null;
  warehouses: string | null;
  has_laundry_room: boolean | null;
  curtains: string | null;
  has_extra_kitchen: boolean | null;
  extra_kitchen_appliances: string | null;
  category: string | null;
  purpose: string | null;
  warranties: any;
  payment_option: string | null;
  payment_prices: any;
  hashtags: string[] | null;
  custom_hashtags: string[] | null;
  deed_number: string | null;
  deed_date: string | null;
  ad_license: string | null;
  lat: number | null;
  lng: number | null;
}

const SlugOfferDetailsPage: React.FC = () => {
  const { slug, citySlug, districtSlug, offerId } = useParams<{ 
    slug: string; 
    citySlug: string; 
    districtSlug: string;
    offerId: string;
  }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [brokerName, setBrokerName] = useState('');
  const [businessCardData, setBusinessCardData] = useState<Record<string, any> | null>(null);

  const { liveCount } = usePagePresence('offer', offerId);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !offerId) {
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
        setBusinessCardData(cardData);
        // استخراج الاسم المعروض بناءً على إعدادات البطاقة
        const displayType = cardData?.displayNameType || 'personal';
        const displayedName = getDisplayName(
          displayType,
          cardData?.userName || '',
          cardData?.companyName || '',
          cardData?.platformNameArabic || ''
        );
        setBrokerName(displayedName);

        // جلب العرض - البحث بالـ ID الكامل أو الجزئي
        let query = supabase
          .from('platform_listings')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .is('deleted_at', null);

        const { data: listings, error } = await query;

        if (error) throw error;

        // البحث عن العرض بالـ ID
        const foundListing = (listings || []).find(l => 
          l.id === offerId || l.id.endsWith(offerId)
        );

        if (!foundListing) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // زيادة عدد المشاهدات (في Supabase)
        await supabase
          .from('platform_listings')
          .update({ views: (foundListing.views || 0) + 1 })
          .eq('id', foundListing.id);

        setListing(foundListing as Listing);
      } catch (err) {
        console.error('Error fetching offer data:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, offerId]);

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

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">العرض غير موجود</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على هذا العرض.
          </p>
          <Button onClick={() => navigate(`/${slug}`)}>
            <Home className="w-4 h-4 ml-2" />
            العودة للمنصة
          </Button>
        </div>
      </div>
    );
  }

  // تحويل البيانات لشكل OfferDetailsPage
  const listingForDetails = {
    id: listing.id,
    title: listing.title,
    description: listing.description || '',
    price: listing.price,
    propertyType: listing.property_type,
    area: listing.area || undefined,
    bedrooms: listing.bedrooms || undefined,
    bathrooms: listing.bathrooms || undefined,
    image: listing.images?.[0] || listing.image || '',
    imageCount: listing.images?.length || 1,
    city: listing.city,
    district: listing.district,
    images: listing.images || [listing.image].filter(Boolean),
    ownerName: listing.owner_name || '',
    ownerPhone: listing.owner_phone || '',
    brokerPhone: listing.broker_phone || businessCardData?.primaryPhone || '',
    views: listing.views || 0,
    street: listing.street || '',
    age: listing.age || undefined,
    direction: listing.direction || '',
    features: listing.features || [],
    videoUrl: listing.video_url || '',
    tour3DUrl: listing.tour_3d_url || '',
    livingRooms: listing.living_rooms || '',
    councils: listing.councils || '',
    floors: listing.floors || '',
    floorNumber: listing.floor_number || '',
    cornerType: listing.corner_type || '',
    streetWidth: listing.street_width || '',
    furnishing: listing.furnishing || '',
    entrances: listing.entrances || '',
    balconies: listing.balconies || '',
    acUnits: listing.ac_units || '',
    warehouses: listing.warehouses || '',
    hasLaundryRoom: listing.has_laundry_room || false,
    curtains: listing.curtains || '',
    hasExtraKitchen: listing.has_extra_kitchen || false,
    extraKitchenAppliances: listing.extra_kitchen_appliances || '',
    category: listing.category || '',
    purpose: listing.purpose || '',
    warranties: listing.warranties || [],
    paymentOption: listing.payment_option || '',
    paymentPrices: listing.payment_prices || {},
    hashtags: listing.hashtags || [],
    customHashtags: listing.custom_hashtags || [],
    deedNumber: listing.deed_number || '',
    deedDate: listing.deed_date || '',
    adLicense: listing.ad_license || '',
    lat: listing.lat || undefined,
    lng: listing.lng || undefined,
  };

  const pageTitle = `${listing.title} - ${listing.district}، ${listing.city}`;
  const pageDescription = listing.description || `${listing.property_type} في ${listing.district}، ${listing.city}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {listing.images?.[0] && <meta property="og:image" content={listing.images[0]} />}
      </Helmet>

      <LiveViewersBadge count={liveCount} variant="floating" />

      <OfferDetailsPage
        listing={listingForDetails}
        isOpen={true}
        onClose={() => navigate(`/${slug}/${citySlug}/${districtSlug}`)}
        brokerName={brokerName}
        brokerPhone={businessCardData?.primaryPhone}
        platformSlug={slug}
      />
    </>
  );
};

export default SlugOfferDetailsPage;
