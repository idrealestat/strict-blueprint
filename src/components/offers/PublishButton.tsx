import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { syncSingleListingToDatabase } from '@/hooks/usePlatformListings';
import { syncPlatformCompleteFromPublishedAds } from '@/utils/platformStorage';

interface PublishedAd {
  id: string;
  title: string;
  description?: string;
  price: number;
  city: string;
  district: string;
  property_type: string;
  images: string[];
  status: string;
  publishedAt: string;
  createdBy?: string;
  ownerName?: string;
  adNumber: string;
  isPinned: boolean;
  isUnread: boolean;
  metadata: {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
}

interface Offer {
  id?: string;
  title: string;
  description?: string;
  price: number;
  city: string;
  district: string;
  property_type: string;
  images?: string[];
  createdBy?: string;
  ownerName?: string;
  ownerPhone?: string;
  adLicense?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

interface PublishButtonProps {
  offer: Offer;
  onPublish?: (ad: PublishedAd) => void;
}

export default function PublishButton({ offer, onPublish }: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'uploading' | 'syncing' | 'success' | 'error'>('idle');
  
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStatus('uploading');
    
    try {
      // الخطوة 1-3: إنشاء كائن PublishedAd (شكل موحّد مع منصتي/إدارة العملاء)
      const publishedAd: PublishedAd = {
        id: offer.id || `ad-${Date.now()}`,
        title: offer.title,
        description: offer.description,
        price: offer.price,
        city: offer.city,
        district: offer.district,
        property_type: offer.property_type,
        images: offer.images || [],
        status: 'published',
        publishedAt: new Date().toISOString(),
        createdBy: offer.createdBy,
        ownerName: offer.ownerName,
        adNumber: `AD-${Date.now().toString().slice(-6)}`,
        isPinned: false,
        isUnread: true,
        metadata: {
          bedrooms: offer.bedrooms,
          bathrooms: offer.bathrooms,
          area: offer.area
        }
      };
      
      // الخطوة 4-6: حفظ في localStorage (✅ المفتاح الرسمي الموحد)
      const existingAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      const updatedAds = [...existingAds, {
        // حقول إضافية مطلوبة لظهور العرض في منصتي/بطاقة العميل
        id: publishedAd.id,
        title: publishedAd.title,
        aiDescription: publishedAd.description || '',
        descriptionTone: 'احترافي',
        descriptionLength: 'متوسط',
        propertyType: publishedAd.property_type,
        category: 'سكني',
        purpose: 'للبيع',
        area: String(publishedAd.metadata?.area ?? ''),
        platformPath: `${publishedAd.city}/${publishedAd.district}/${publishedAd.property_type}`,
        locationDetails: {
          city: publishedAd.city,
          district: publishedAd.district,
          street: '',
          buildingNumber: '',
          postalCode: '',
          additionalNumber: '',
          latitude: 0,
          longitude: 0,
        },
        bedrooms: String(publishedAd.metadata?.bedrooms ?? ''),
        bathrooms: String(publishedAd.metadata?.bathrooms ?? ''),
        livingRooms: '',
        floors: '',
        propertyAge: '',
        furnishing: '',
        facade: '',
        streetWidth: '',
        features: [],
        customFeatures: [],
        warranties: {
          structuralWarranty: false,
          structuralYears: '',
          acWarranty: false,
          acYears: '',
          plumbingWarranty: false,
          plumbingYears: '',
          electricalWarranty: false,
          electricalYears: '',
          customWarranties: [],
        },
        hashtags: [],
        customHashtags: [],
        price: String(publishedAd.price),
        priceType: 'مناسب',
        ownerName: publishedAd.ownerName || '',
        ownerPhone: (offer as any).ownerPhone || '',
        adLicense: (offer as any).adLicense || '',
        images: publishedAd.images,
        videos: [],
        tour3DUrl: '',
        publishedAt: publishedAd.publishedAt,
        status: 'published',
      }];
      localStorage.setItem('published_ads_list', JSON.stringify(updatedAds));

      // ✅ إبقاء wasata_platform_complete متزامناً (لتفادي اختفاء العروض)
      syncPlatformCompleteFromPublishedAds();
      
      setPublishStatus('syncing');
      
      // الخطوة 7-9: مزامنة فعلية لقاعدة البيانات (منصتي + المنصة العامة)
      // لا نوقف الواجهة إذا فشلت (لنمنع الدوران اللانهائي)
      await Promise.race([
        syncSingleListingToDatabase({
          id: publishedAd.id,
          title: publishedAd.title,
          description: publishedAd.description,
          price: publishedAd.price,
          propertyType: publishedAd.property_type,
          ownerName: publishedAd.ownerName,
          ownerPhone: (offer as any).ownerPhone,
          images: publishedAd.images,
          locationDetails: { city: publishedAd.city, district: publishedAd.district },
          city: publishedAd.city,
          district: publishedAd.district,
          bedrooms: publishedAd.metadata?.bedrooms,
          bathrooms: publishedAd.metadata?.bathrooms,
          area: publishedAd.metadata?.area,
          status: 'published',
        }),
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);
      
      // الخطوة 10-12: إطلاق الأحداث
      window.dispatchEvent(new CustomEvent('adPublished', { 
        detail: { adId: publishedAd.id } 
      }));
      
      window.dispatchEvent(new CustomEvent('switchToDashboardTab'));
      
      setPublishStatus('success');
      
      if (onPublish) {
        onPublish(publishedAd);
      }
      
      // إعادة تعيين بعد ثانيتين
      setTimeout(() => {
        setIsPublishing(false);
        setPublishStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('خطأ في النشر:', error);
      setPublishStatus('error');
      setIsPublishing(false);
    }
  };
  
  return (
    <button
      onClick={handlePublish}
      disabled={isPublishing}
      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
        publishStatus === 'success'
          ? 'bg-green-600 text-white'
          : publishStatus === 'error'
          ? 'bg-red-600 text-white'
          : 'bg-gradient-to-r from-[#01411C] to-[#065f41] text-white hover:shadow-lg'
      } ${isPublishing ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {publishStatus === 'idle' && (
        <>
          <Upload className="w-6 h-6" />
          نشر على المنصة
        </>
      )}
      {publishStatus === 'uploading' && (
        <>
          <Loader2 className="w-6 h-6 animate-spin" />
          جاري الرفع...
        </>
      )}
      {publishStatus === 'syncing' && (
        <>
          <Loader2 className="w-6 h-6 animate-spin" />
          جاري المزامنة...
        </>
      )}
      {publishStatus === 'success' && (
        <>
          <CheckCircle className="w-6 h-6" />
          تم النشر بنجاح!
        </>
      )}
      {publishStatus === 'error' && (
        <>
          ❌ فشل النشر
        </>
      )}
    </button>
  );
}
