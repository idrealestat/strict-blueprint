'use client';

/**
 * PublicCardView.tsx
 * صفحة عرض البطاقة الرقمية العامة - تستخدم بيانات حقيقية من قاعدة البيانات
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Mail, MessageCircle, MapPin, Globe, Linkedin, Instagram, Twitter, Facebook, Download, Share2, QrCode, Building2, Briefcase, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useEventTracker } from '@/hooks/useEventTracker';
import { triggerOfferInteractionNotification } from '@/utils/notificationTriggers';

interface CardData {
  id: string;
  slug: string;
  user_id: string;
  fullName: string;
  fullNameEn?: string;
  jobTitle: string;
  jobTitleEn?: string;
  company: string;
  companyEn?: string;
  bio?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  licenseNumber?: string;
  primaryColor: string;
  secondaryColor: string;
  template: string;
  layout: string;
  profileImage?: string;
  coverImage?: string;
  qrCode?: string;
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  customLinks?: { label: string; url: string; icon?: string }[];
  isActive: boolean;
}

export default function PublicCardView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trackPageView, track } = useEventTracker();
  
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // جلب البطاقة من قاعدة البيانات
  useEffect(() => {
    const fetchCard = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('public_business_cards')
          .select('id, slug, user_id, data, published')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Parse the data JSON
        const cardInfo = data.data as Record<string, any>;
        
        const parsedCard: CardData = {
          id: data.id,
          slug: data.slug || slug,
          user_id: data.user_id,
          fullName: cardInfo?.userName || cardInfo?.fullName || '',
          fullNameEn: cardInfo?.userNameEn || '',
          jobTitle: cardInfo?.userTitle || cardInfo?.jobTitle || 'وسيط عقاري معتمد',
          jobTitleEn: cardInfo?.jobTitleEn || '',
          company: cardInfo?.companyName || cardInfo?.company || '',
          companyEn: cardInfo?.companyEn || '',
          bio: cardInfo?.bio || '',
          email: cardInfo?.email || '',
          phone: cardInfo?.primaryPhone || cardInfo?.phone || '',
          whatsapp: cardInfo?.whatsapp || cardInfo?.primaryPhone || '',
          website: cardInfo?.websiteUrl || cardInfo?.website || '',
          address: cardInfo?.officeAddress || cardInfo?.location || '',
          licenseNumber: cardInfo?.falLicense || cardInfo?.licenseNumber || '',
          primaryColor: cardInfo?.primaryColor || '#01411C',
          secondaryColor: cardInfo?.secondaryColor || '#D4AF37',
          template: cardInfo?.template || 'luxury',
          layout: cardInfo?.layout || 'vertical',
          profileImage: cardInfo?.profileImage || '',
          coverImage: cardInfo?.coverImage || '',
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`,
          socialLinks: cardInfo?.socialLinks || {},
          customLinks: cardInfo?.customLinks || [],
          isActive: true,
        };

        setCard(parsedCard);
        setNotFound(false);

        // Track page view
        trackPageView('business_card', data.id, 'public_web');
        
      } catch (err) {
        console.error('Error fetching card:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [slug, trackPageView]);

  const handleCall = async () => {
    if (card?.phone) {
      window.open(`tel:${card.phone}`, '_self');
      
      // Track event
      track({
        eventName: 'card_call',
        channel: 'public_web',
        entityType: 'business_card',
        entityId: card.id,
        metadata: { slug: card.slug },
      });
      
      // Trigger notification
      if (card.user_id) {
        await triggerOfferInteractionNotification(card.user_id, {
          offerTitle: card.fullName || 'بطاقة الأعمال',
          interactionType: 'call',
        });
      }
    }
  };

  const handleWhatsApp = async () => {
    if (card?.whatsapp) {
      const message = encodeURIComponent(`مرحباً ${card.fullName}، تواصلت معك عبر بطاقتك الرقمية`);
      window.open(`https://wa.me/${card.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
      
      // Track event
      track({
        eventName: 'card_whatsapp',
        channel: 'public_web',
        entityType: 'business_card',
        entityId: card.id,
        metadata: { slug: card.slug },
      });
      
      // Trigger notification
      if (card.user_id) {
        await triggerOfferInteractionNotification(card.user_id, {
          offerTitle: card.fullName || 'بطاقة الأعمال',
          interactionType: 'whatsapp',
        });
      }
    }
  };

  const handleEmail = async () => {
    if (card?.email) {
      window.open(`mailto:${card.email}`, '_self');
      
      // Track event
      track({
        eventName: 'card_email',
        channel: 'public_web',
        entityType: 'business_card',
        entityId: card.id,
        metadata: { slug: card.slug },
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    // Track event
    if (card) {
      track({
        eventName: 'card_share',
        channel: 'public_web',
        entityType: 'business_card',
        entityId: card.id,
        metadata: { slug: card.slug },
      });
      
      // Trigger notification
      if (card.user_id) {
        await triggerOfferInteractionNotification(card.user_id, {
          offerTitle: card.fullName || 'بطاقة الأعمال',
          interactionType: 'share',
        });
      }
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: card?.fullName,
          text: `${card?.jobTitle} - ${card?.company}`,
          url,
        });
      } catch (error) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContact = () => {
    if (!card) return;

    // Create vCard
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${card.fullName}
N:${card.fullName};;;
ORG:${card.company}
TITLE:${card.jobTitle}
TEL;TYPE=CELL:${card.phone}
EMAIL:${card.email}
${card.address ? `ADR;TYPE=WORK:;;${card.address};;;` : ''}
${card.website ? `URL:${card.website}` : ''}
NOTE:رقم الترخيص: ${card.licenseNumber || 'غير متوفر'}
END:VCARD`;

    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.fullName}.vcf`;
    link.click();
    URL.revokeObjectURL(url);

    setSaved(true);
    toast.success('تم حفظ جهة الاتصال');
    setTimeout(() => setSaved(false), 2000);
    
    // Track save event
    track({
      eventName: 'card_save_contact',
      channel: 'public_web',
      entityType: 'business_card',
      entityId: card.id,
      metadata: { slug: card.slug },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
        <Card className="p-8 text-center max-w-md">
          <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold mb-2">البطاقة غير موجودة</h1>
          <p className="text-gray-600 mb-6">
            عذراً، لم نتمكن من العثور على هذه البطاقة أو أنها غير منشورة.
          </p>
          <Button onClick={() => navigate('/')}>
            العودة للصفحة الرئيسية
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{card.fullName} | بطاقة أعمال رقمية</title>
        <meta name="description" content={`${card.fullName} - ${card.jobTitle} - ${card.company}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto p-4 py-8"
        >
          <Card className="overflow-hidden shadow-xl">
            {/* Header */}
            <div 
              className="p-6 text-white text-center"
              style={{ backgroundColor: card.primaryColor }}
            >
              {card.profileImage ? (
                <img 
                  src={card.profileImage} 
                  alt={card.fullName}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/30 object-cover"
                />
              ) : (
                <div 
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/30 flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: card.secondaryColor }}
                >
                  {card.fullName.charAt(0)}
                </div>
              )}
              <h1 className="text-2xl font-bold mb-1">{card.fullName}</h1>
              <p className="text-white/80">{card.jobTitle}</p>
              {card.company && <p className="text-white/70 text-sm mt-1">{card.company}</p>}
              
              {card.licenseNumber && (
                <Badge 
                  className="mt-3"
                  style={{ backgroundColor: card.secondaryColor, color: card.primaryColor }}
                >
                  رخصة فال: {card.licenseNumber}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 grid grid-cols-4 gap-2">
              {card.phone && (
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center py-4 h-auto"
                  onClick={handleCall}
                >
                  <Phone className="h-5 w-5 mb-1" style={{ color: card.primaryColor }} />
                  <span className="text-xs">اتصال</span>
                </Button>
              )}
              {card.whatsapp && (
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center py-4 h-auto"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-5 w-5 mb-1 text-green-600" />
                  <span className="text-xs">واتساب</span>
                </Button>
              )}
              {card.email && (
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center py-4 h-auto"
                  onClick={handleEmail}
                >
                  <Mail className="h-5 w-5 mb-1" style={{ color: card.primaryColor }} />
                  <span className="text-xs">بريد</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                className="flex flex-col items-center py-4 h-auto"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 mb-1" style={{ color: card.primaryColor }} />
                <span className="text-xs">مشاركة</span>
              </Button>
            </div>

            <Separator />

            {/* Info */}
            <div className="p-4 space-y-4">
              {card.bio && (
                <div>
                  <h3 className="font-semibold mb-2">نبذة</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{card.bio}</p>
                </div>
              )}

              {card.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">الموقع</p>
                    <p className="text-gray-600 text-sm">{card.address}</p>
                  </div>
                </div>
              )}

              {card.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">الموقع الإلكتروني</p>
                    <a 
                      href={card.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      {card.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Save Contact */}
            <div className="p-4">
              <Button 
                className="w-full"
                style={{ backgroundColor: card.primaryColor }}
                onClick={handleSaveContact}
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4 ml-2" />
                    تم الحفظ
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 ml-2" />
                    حفظ جهة الاتصال
                  </>
                )}
              </Button>
            </div>

            {/* QR Code */}
            {card.qrCode && (
              <div className="p-4 pt-0 text-center">
                <img 
                  src={card.qrCode} 
                  alt="QR Code" 
                  className="w-24 h-24 mx-auto rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-2">امسح للوصول السريع</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </>
  );
}
