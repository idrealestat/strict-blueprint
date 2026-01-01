/**
 * PublicPlatformPage.tsx
 * صفحة المنصة العامة - تظهر للعملاء والجمهور
 * يمكن الوصول إليها عبر الدومين المخصص: Apptitle-usertitle.com
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MyPublicPlatformContent from '@/components/platform/MyPublicPlatformContent';
import { usePublicBusinessCard } from '@/hooks/usePublicBusinessCard';

const PublicPlatformPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const slug = userId || 'default';

  const { data: businessCard, loading } = usePublicBusinessCard(slug);

  const pageTitle = businessCard?.userName ? `منصة ${businessCard.userName} العقارية` : 'المنصة العقارية';
  const pageDescription = businessCard?.userName
    ? `تصفح العروض العقارية المميزة من ${businessCard.userName} - وسيط عقاري معتمد`
    : 'منصة عقارية متكاملة لعرض العقارات والخدمات العقارية';

  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/platform/${slug}` : '';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      {/* نعرض حتى أثناء التحميل، لأن الهيدر سيتحدث فور وصول البيانات */}
      <MyPublicPlatformContent
        currentUser={businessCard ? { name: businessCard.userName } : undefined}
        userId="public"
        platformSlug={slug}
        businessCardOverride={loading ? null : (businessCard as any)}
      />
    </>
  );
};

export default PublicPlatformPage;
