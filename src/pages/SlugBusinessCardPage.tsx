/**
 * SlugBusinessCardPage.tsx
 * صفحة البطاقة الرقمية العامة بناءً على الـ slug
 * الوصول عبر: wasataai.com/{slug}/card
 */

import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicBusinessCard } from "@/hooks/usePublicBusinessCard";
import { useEventTracker } from "@/hooks/useEventTracker";
import PublicBusinessCardView from "@/components/business-card/PublicBusinessCardView";

const BASE_DOMAIN = "wasataai.com";

const SlugBusinessCardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, loading, userId } = usePublicBusinessCard(slug);
  const { trackPageView } = useEventTracker();

  // Track page view
  useEffect(() => {
    if (slug && data) {
      trackPageView('business_card', slug, 'public_web');
    }
  }, [slug, data, trackPageView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!slug || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">البطاقة غير موجودة</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على هذا الرابط أو أن الصفحة غير منشورة.
          </p>
          <Button onClick={() => navigate("/")}>الذهاب للصفحة الرئيسية</Button>
        </div>
      </div>
    );
  }

  const fullName = (data.userName ?? "").toString().trim();
  const title = (data.companyName ?? data.userTitle ?? "وسيط عقاري معتمد").toString().trim();

  const pageTitle = fullName ? `${fullName} | بطاقة أعمال رقمية` : "بطاقة أعمال رقمية";
  const pageDescription = fullName ? `${fullName} - ${title}` : "بطاقة أعمال رقمية";
  const canonicalUrl = `https://${BASE_DOMAIN}/${slug}/card`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={canonicalUrl} />
        {data.profileImage && (
          <meta property="og:image" content={data.profileImage} />
        )}
      </Helmet>

      <PublicBusinessCardView data={data} slug={slug} />
    </>
  );
};

export default SlugBusinessCardPage;
