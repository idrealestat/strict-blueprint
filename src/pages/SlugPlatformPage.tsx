/**
 * SlugPlatformPage.tsx
 * صفحة المنصة العامة بناءً على الـ slug
 * الوصول عبر: wasataai.com/{slug}
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import MyPublicPlatformContent from '@/components/platform/MyPublicPlatformContent';
import { Loader2 } from 'lucide-react';
import LiveViewersBadge from '@/components/ui/LiveViewersBadge';
import { usePagePresence } from '@/hooks/usePagePresence';
import { usePageViewTracker } from '@/hooks/usePageViewTracker';

interface BusinessCardData {
  id: string;
  slug: string;
  user_id: string;
  data: {
    userName?: string;
    phone?: string;
    email?: string;
    bio?: string;
    company?: string;
    licenseNumber?: string;
    [key: string]: any;
  };
}

const SlugPlatformPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [businessCard, setBusinessCard] = useState<BusinessCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // تتبع الزوار المتصلين حالياً
  const { liveCount } = usePagePresence('platform', slug);
  
  // تسجيل المشاهدة للإحصائيات
  usePageViewTracker('platform', slug);

  useEffect(() => {
    const fetchBusinessCard = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('business_cards')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error || !data) {
          console.log('Business card not found for slug:', slug);
          setNotFound(true);
        } else {
          setBusinessCard(data as BusinessCardData);
        }
      } catch (err) {
        console.error('Error fetching business card:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessCard();
  }, [slug]);

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
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على هذا النطاق. قد يكون غير مسجل أو معطل.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            الذهاب للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  const cardData = businessCard?.data || {};
  const pageTitle = cardData.userName ? `منصة ${cardData.userName} العقارية` : 'المنصة العقارية';
  const pageDescription = cardData.userName
    ? `تصفح العروض العقارية المميزة من ${cardData.userName} - وسيط عقاري معتمد`
    : 'منصة عقارية متكاملة لعرض العقارات والخدمات العقارية';

  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : '';

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

      {/* عداد الزوار المتصلين */}
      <LiveViewersBadge count={liveCount} variant="floating" />

      <MyPublicPlatformContent
        currentUser={cardData.userName ? { name: cardData.userName } : undefined}
        userId={businessCard?.user_id || 'public'}
        platformSlug={slug}
        businessCardOverride={businessCard as any}
      />
    </>
  );
};

export default SlugPlatformPage;
