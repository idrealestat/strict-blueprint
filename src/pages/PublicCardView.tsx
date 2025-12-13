'use client';

import { useParams } from 'react-router-dom';
import { Phone, Mail, MessageCircle, MapPin, Globe, Linkedin, Instagram, Twitter, Facebook, Download, Share2, QrCode, Building2, Briefcase, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

// Mock card data - TODO: Replace with backend API call
const mockCards: Record<string, CardData> = {
  'ahmed-mohammed': {
    id: '1',
    slug: 'ahmed-mohammed',
    fullName: 'أحمد محمد',
    fullNameEn: 'Ahmed Mohammed',
    jobTitle: 'وسيط عقاري معتمد',
    jobTitleEn: 'Certified Real Estate Broker',
    company: 'شركة الوساطة العقارية',
    companyEn: 'Real Estate Brokerage Co.',
    bio: 'وسيط عقاري معتمد بخبرة أكثر من 10 سنوات في السوق السعودي. متخصص في العقارات السكنية والتجارية في منطقة الرياض.',
    email: 'ahmed@example.com',
    phone: '+966512345678',
    whatsapp: '+966512345678',
    website: 'https://wasata.ai',
    address: 'الرياض، حي النخيل',
    licenseNumber: 'FAL-12345678',
    primaryColor: '#01411C',
    secondaryColor: '#D4AF37',
    template: 'luxury',
    layout: 'vertical',
    profileImage: '',
    coverImage: '',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wasata.ai/cards/ahmed-mohammed',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/ahmed',
      instagram: 'https://instagram.com/ahmed',
      twitter: 'https://twitter.com/ahmed',
      facebook: '',
    },
    customLinks: [
      { label: 'عقاراتي المتاحة', url: 'https://example.com/properties', icon: 'building' },
    ],
    isActive: true,
    totalViews: 1250,
    totalScans: 340,
    totalClicks: 890,
    totalSaves: 156,
  },
  'sara-ali': {
    id: '2',
    slug: 'sara-ali',
    fullName: 'سارة علي',
    fullNameEn: 'Sara Ali',
    jobTitle: 'مستشارة عقارية',
    jobTitleEn: 'Real Estate Consultant',
    company: 'مجموعة العقارات الذهبية',
    companyEn: 'Golden Real Estate Group',
    bio: 'مستشارة عقارية متخصصة في العقارات الفاخرة والاستثمارات العقارية.',
    email: 'sara@example.com',
    phone: '+966555555555',
    whatsapp: '+966555555555',
    website: '',
    address: 'جدة، حي الروضة',
    licenseNumber: 'FAL-87654321',
    primaryColor: '#D4AF37',
    secondaryColor: '#01411C',
    template: 'modern',
    layout: 'vertical',
    profileImage: '',
    coverImage: '',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wasata.ai/cards/sara-ali',
    socialLinks: {
      linkedin: '',
      instagram: 'https://instagram.com/sara',
      twitter: '',
      facebook: 'https://facebook.com/sara',
    },
    customLinks: [],
    isActive: true,
    totalViews: 890,
    totalScans: 210,
    totalClicks: 456,
    totalSaves: 89,
  },
};

interface CardData {
  id: string;
  slug: string;
  fullName: string;
  fullNameEn?: string;
  jobTitle: string;
  jobTitleEn?: string;
  company: string;
  companyEn?: string;
  bio?: string;
  email: string;
  phone: string;
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
  qrCode: string;
  socialLinks: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  customLinks: Array<{ label: string; url: string; icon: string }>;
  isActive: boolean;
  totalViews: number;
  totalScans: number;
  totalClicks: number;
  totalSaves: number;
}

export default function PublicCardView() {
  const { slug } = useParams<{ slug: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Simulate API fetch - TODO: Replace with real API call
    const fetchCard = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (slug && mockCards[slug]) {
        setCard(mockCards[slug]);
        setNotFound(false);
        // TODO: Track view in backend
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchCard();
  }, [slug]);

  const handleCall = () => {
    if (card?.phone) {
      window.open(`tel:${card.phone}`, '_self');
      // TODO: Track click in backend
    }
  };

  const handleWhatsApp = () => {
    if (card?.whatsapp) {
      const message = encodeURIComponent(`مرحباً ${card.fullName}، تواصلت معك عبر بطاقتك الرقمية`);
      window.open(`https://wa.me/${card.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
      // TODO: Track click in backend
    }
  };

  const handleEmail = () => {
    if (card?.email) {
      window.open(`mailto:${card.email}`, '_self');
      // TODO: Track click in backend
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
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
    // TODO: Track save in backend
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#01411C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            عذراً، لم نتمكن من العثور على البطاقة المطلوبة. قد تكون محذوفة أو الرابط غير صحيح.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-[#01411C] hover:bg-[#01411C]/90"
          >
            الذهاب للصفحة الرئيسية
          </Button>
        </Card>
      </div>
    );
  }

  if (!card.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
        <Card className="p-8 text-center max-w-md">
          <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold mb-2">البطاقة غير متاحة</h1>
          <p className="text-gray-600">
            هذه البطاقة معطلة حالياً من قبل صاحبها.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{card.fullName} - {card.jobTitle}</title>
        <meta name="description" content={card.bio || `${card.jobTitle} في ${card.company}`} />
        <meta property="og:title" content={`${card.fullName} - ${card.jobTitle}`} />
        <meta property="og:description" content={card.bio || `${card.jobTitle} في ${card.company}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://wasata.ai/cards/${card.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
        {/* Cover Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-48 md:h-56"
          style={{
            background: `linear-gradient(135deg, ${card.primaryColor} 0%, ${card.secondaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Share Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white"
            onClick={handleShare}
          >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
          </Button>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-lg mx-auto px-4 -mt-20 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden shadow-xl">
              {/* Profile Section */}
              <div className="text-center pt-4 pb-6 px-6">
                {/* Avatar */}
                <div 
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto -mt-16 flex items-center justify-center text-white text-3xl font-bold"
                  style={{ backgroundColor: card.primaryColor }}
                >
                  {card.profileImage ? (
                    <img src={card.profileImage} alt={card.fullName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    card.fullName.charAt(0)
                  )}
                </div>

                {/* Name & Title */}
                <h1 className="text-2xl font-bold mt-4 mb-1">{card.fullName}</h1>
                {card.fullNameEn && (
                  <p className="text-sm text-muted-foreground" dir="ltr">{card.fullNameEn}</p>
                )}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{card.jobTitle}</span>
                </div>
                {card.company && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{card.company}</span>
                  </div>
                )}

                {/* License Badge */}
                {card.licenseNumber && (
                  <Badge 
                    variant="outline" 
                    className="mt-3"
                    style={{ borderColor: card.primaryColor, color: card.primaryColor }}
                  >
                    رخصة فال: {card.licenseNumber}
                  </Badge>
                )}

                {/* Bio */}
                {card.bio && (
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    {card.bio}
                  </p>
                )}
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={handleCall}
                    className="flex-col h-auto py-4"
                    style={{ backgroundColor: card.primaryColor }}
                  >
                    <Phone className="h-5 w-5 mb-1" />
                    <span className="text-xs">اتصال</span>
                  </Button>
                  <Button
                    onClick={handleWhatsApp}
                    className="flex-col h-auto py-4 bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-5 w-5 mb-1" />
                    <span className="text-xs">واتساب</span>
                  </Button>
                  <Button
                    onClick={handleEmail}
                    variant="outline"
                    className="flex-col h-auto py-4"
                  >
                    <Mail className="h-5 w-5 mb-1" />
                    <span className="text-xs">إيميل</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Contact Details */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">معلومات التواصل</h3>
                
                {/* Phone */}
                <a 
                  href={`tel:${card.phone}`}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: card.primaryColor }}
                  >
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">رقم الجوال</p>
                    <p className="font-medium" dir="ltr">{card.phone}</p>
                  </div>
                </a>

                {/* Email */}
                <a 
                  href={`mailto:${card.email}`}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: card.primaryColor }}
                  >
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium" dir="ltr">{card.email}</p>
                  </div>
                </a>

                {/* Address */}
                {card.address && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: card.primaryColor }}
                    >
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">العنوان</p>
                      <p className="font-medium">{card.address}</p>
                    </div>
                  </div>
                )}

                {/* Website */}
                {card.website && (
                  <a 
                    href={card.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: card.primaryColor }}
                    >
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">الموقع الإلكتروني</p>
                      <p className="font-medium" dir="ltr">{card.website.replace('https://', '')}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>

              {/* Social Links */}
              {(card.socialLinks.linkedin || card.socialLinks.instagram || card.socialLinks.twitter || card.socialLinks.facebook) && (
                <>
                  <Separator />
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">التواصل الاجتماعي</h3>
                    <div className="flex justify-center gap-3">
                      {card.socialLinks.linkedin && (
                        <a 
                          href={card.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-[#0077B5] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {card.socialLinks.instagram && (
                        <a 
                          href={card.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                      {card.socialLinks.twitter && (
                        <a 
                          href={card.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-[#1DA1F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                      {card.socialLinks.facebook && (
                        <a 
                          href={card.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Custom Links */}
              {card.customLinks.length > 0 && (
                <>
                  <Separator />
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">روابط إضافية</h3>
                    {card.customLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: card.secondaryColor }}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </div>
                        <span className="font-medium flex-1">{link.label}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* QR Code Section */}
              <Separator />
              <div className="p-6 text-center bg-muted/30">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">مسح QR للحفظ</h3>
                <img 
                  src={card.qrCode} 
                  alt="QR Code" 
                  className="w-32 h-32 mx-auto rounded-lg shadow-md"
                />
              </div>

              {/* Save Contact Button */}
              <div className="p-4">
                <Button
                  onClick={handleSaveContact}
                  className="w-full py-6 text-lg"
                  style={{ backgroundColor: card.primaryColor }}
                >
                  {saved ? (
                    <>
                      <Check className="h-5 w-5 ml-2" />
                      تم الحفظ!
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 ml-2" />
                      حفظ جهة الاتصال
                    </>
                  )}
                </Button>
              </div>

              {/* Footer */}
              <div className="text-center py-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  بطاقة رقمية من{' '}
                  <a 
                    href="https://wasata.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                    style={{ color: card.primaryColor }}
                  >
                    وساطة AI
                  </a>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
