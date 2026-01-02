/**
 * SlugBusinessCardPage.tsx
 * صفحة البطاقة الرقمية العامة بناءً على الـ slug
 * الوصول عبر: wasataai.com/{slug}/businesscard
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard } from 'lucide-react';
import PublicCardView from '@/pages/PublicCardView';

interface BusinessCardData {
  id: string;
  slug: string;
  user_id: string;
  published: boolean;
  data: {
    userName?: string;
    phone?: string;
    email?: string;
    company?: string;
    bio?: string;
    licenseNumber?: string;
    [key: string]: any;
  };
}

const SlugBusinessCardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">البطاقة غير موجودة</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على هذا النطاق أو البطاقة غير منشورة.
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
  const pageTitle = cardData.userName ? `${cardData.userName} - البطاقة الرقمية` : 'البطاقة الرقمية';
  const pageDescription = cardData.userName
    ? `${cardData.userName} - ${cardData.company || 'وسيط عقاري معتمد'}`
    : 'بطاقة أعمال رقمية';

  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}/businesscard` : '';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="profile" />
      </Helmet>

      {/* إعادة استخدام PublicCardView مع تمرير الـ slug */}
      <PublicCardView />
    </>
  );
};

export default SlugBusinessCardPage;
