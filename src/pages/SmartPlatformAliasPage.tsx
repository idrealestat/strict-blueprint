/**
 * SmartPlatformAliasPage.tsx
 * يفتح نفس صفحة المشاركة العامة القديمة (/platform/1) عبر رابط ثابت: /smart
 */

import React from "react";
import { Helmet } from "react-helmet-async";
import MyPublicPlatformContent from "@/components/platform/MyPublicPlatformContent";
import { usePublicBusinessCard } from "@/hooks/usePublicBusinessCard";

const SmartPlatformAliasPage: React.FC = () => {
  // نفس صفحة /platform/1 حرفياً (نفس userId)
  const legacyUserId = "1";

  const { data: businessCard, loading } = usePublicBusinessCard(legacyUserId);

  const pageTitle = businessCard?.userName ? `منصة ${businessCard.userName} العقارية` : "المنصة العقارية";
  const pageDescription = businessCard?.userName
    ? `تصفح العروض العقارية المميزة من ${businessCard.userName} - وسيط عقاري معتمد`
    : "منصة عقارية متكاملة لعرض العقارات والخدمات العقارية";

  const canonicalUrl = typeof window !== "undefined" ? `${window.location.origin}/smart` : "";

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

      <MyPublicPlatformContent
        currentUser={businessCard ? { name: businessCard.userName } : undefined}
        userId="public"
        platformSlug={legacyUserId}
        businessCardOverride={loading ? null : (businessCard as any)}
      />
    </>
  );
};

export default SmartPlatformAliasPage;
