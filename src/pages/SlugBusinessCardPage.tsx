/**
 * SlugBusinessCardPage.tsx
 * صفحة البطاقة الرقمية العامة بناءً على الـ slug
 * الوصول عبر: wasataai.com/{slug}
 */

import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, CreditCard, Phone, Mail, Globe, MapPin, Building2, BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePublicBusinessCard } from "@/hooks/usePublicBusinessCard";
import { useEventTracker } from "@/hooks/useEventTracker";

const BASE_DOMAIN = "wasataai.com";

const SlugBusinessCardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, loading } = usePublicBusinessCard(slug);
  const { trackPageView, trackCardInteraction } = useEventTracker();

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
  const phone = (data.primaryPhone ?? data.phone ?? "").toString().trim();
  const email = (data.email ?? "").toString().trim();
  const websiteUrl = (data.websiteUrl ?? data.website ?? "").toString().trim();
  const address = (data.officeAddress ?? data.location ?? "").toString().trim();

  const pageTitle = fullName ? `${fullName} | بطاقة أعمال رقمية` : "بطاقة أعمال رقمية";
  const pageDescription = fullName ? `${fullName} - ${title}` : "بطاقة أعمال رقمية";
  const canonicalUrl = `https://${BASE_DOMAIN}/${slug}`;

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
      </Helmet>

      <main className="min-h-screen bg-background" dir="rtl">
        <section className="mx-auto max-w-xl px-4 py-10">
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{fullName || "بطاقة أعمال"}</h1>
                  <p className="text-muted-foreground mt-1">{title}</p>
                </div>

                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <span>صفحة مشاركة عامة</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
              {phone && (
                  <Button 
                    asChild 
                    className="gap-2"
                    onClick={() => slug && trackCardInteraction(slug, 'call', 'public_web')}
                  >
                    <a href={`tel:${phone}`} aria-label="اتصال">
                      <Phone className="h-4 w-4" />
                      اتصال
                    </a>
                  </Button>
                )}

                {email && (
                  <Button 
                    asChild 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => slug && trackCardInteraction(slug, 'email', 'public_web')}
                  >
                    <a href={`mailto:${email}`} aria-label="إرسال بريد">
                      <Mail className="h-4 w-4" />
                      بريد
                    </a>
                  </Button>
                )}

                <Button asChild variant="secondary" className="gap-2">
                  <a href={canonicalUrl} aria-label="رابط الصفحة" target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                    {BASE_DOMAIN}/{slug}
                  </a>
                </Button>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-4">
              {(address || websiteUrl) && (
                <div className="grid gap-3">
                  {address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">الموقع</p>
                        <p className="text-sm text-muted-foreground">{address}</p>
                      </div>
                    </div>
                  )}

                  {websiteUrl && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">الموقع الإلكتروني</p>
                        <a
                          className="text-sm text-primary hover:underline break-all"
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {websiteUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {data.bio && (
                <section aria-label="نبذة">
                  <h2 className="text-sm font-semibold mb-2">نبذة</h2>
                  <p className="text-sm text-muted-foreground leading-7">{String(data.bio)}</p>
                </section>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default SlugBusinessCardPage;

