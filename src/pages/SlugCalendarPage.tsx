/**
 * SlugCalendarPage.tsx
 * صفحة التقويم العامة بناءً على الـ slug
 * الوصول عبر: wasataai.com/{slug}/calendar
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useEventTracker } from '@/hooks/useEventTracker';
import { Loader2, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicAppointmentForm } from '@/pages/public-forms';

interface BusinessCardData {
  id: string;
  slug: string;
  user_id: string;
  data: {
    userName?: string;
    phone?: string;
    email?: string;
    company?: string;
    [key: string]: any;
  };
}

const SlugCalendarPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trackPageView } = useEventTracker();
  const [businessCard, setBusinessCard] = useState<BusinessCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          // Track page view
          trackPageView('calendar', data.id, 'public_web');
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

  if (notFound || !businessCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">التقويم غير متاح</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على هذا النطاق أو التقويم غير مفعل.
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

  const cardData = businessCard.data || {};
  const pageTitle = cardData.userName ? `حجز موعد مع ${cardData.userName}` : 'حجز موعد';
  const pageDescription = cardData.userName
    ? `احجز موعد معاينة عقارية مع ${cardData.userName}`
    : 'احجز موعد معاينة عقارية';

  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}/calendar` : '';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30" dir="rtl">
        {/* Header */}
        <header className="bg-primary text-primary-foreground py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/${slug}`)}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
                <p className="text-primary-foreground/80 text-sm">
                  {cardData.company || 'وسيط عقاري معتمد'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>حجز موعد جديد</CardTitle>
              <CardDescription>
                اختر الوقت المناسب لك وسنتواصل معك لتأكيد الموعد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PublicAppointmentForm 
                brokerInfo={{
                  id: businessCard.id,
                  name: cardData.userName || 'وسيط عقاري',
                  company: cardData.companyName || cardData.company || '',
                  phone: cardData.primaryPhone || cardData.phone || '',
                  email: cardData.email || '',
                  location: cardData.location || cardData.officeAddress || '',
                  licenseNumber: cardData.falLicense || '',
                  rating: cardData.rating || 4.5,
                  verified: cardData.verified !== false,
                }}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default SlugCalendarPage;
