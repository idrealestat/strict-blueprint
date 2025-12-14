// ملف: src/hooks/useOfferShare.ts
// Hook لمشاركة العروض - حرفي من البرومبت

import { useState } from 'react';
import { OfferShare, ShareMethod } from '@/types/offer';
import { toast } from 'sonner';

// محاكاة API (سيتم استبدالها بـ API حقيقي لاحقاً)
const mockShareApi = {
  createShare: async (offerId: string, expiresAt?: Date): Promise<OfferShare> => {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const uniqueId = Date.now().toString(36).substring(0, 8);
    const shareUrl = `offer-${uniqueId}`;
    
    return {
      id: `share-${Date.now()}`,
      shareUrl: `${window.location.origin}/offers/share/${shareUrl}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/offers/share/${shareUrl}`)}`,
      shareCount: 0,
      viewCount: 0,
      expiresAt,
      createdAt: new Date(),
    };
  },
  
  trackShare: async (shareId: string, method: ShareMethod): Promise<void> => {
    console.log(`تتبع المشاركة: ${shareId} عبر ${method}`);
  },
};

export const useOfferShare = () => {
  const [loading, setLoading] = useState(false);
  const [share, setShare] = useState<OfferShare | null>(null);

  const createShare = async (offerId: string, expiresAt?: Date) => {
    setLoading(true);
    try {
      const newShare = await mockShareApi.createShare(offerId, expiresAt);
      setShare(newShare);
      toast.success('تم إنشاء رابط المشاركة');
      return newShare;
    } catch (error: any) {
      toast.error(error.message || 'فشل في إنشاء المشاركة');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const trackShare = async (shareId: string, method: ShareMethod) => {
    try {
      await mockShareApi.trackShare(shareId, method);
    } catch (error) {
      console.error('Track share error:', error);
    }
  };

  const resetShare = () => {
    setShare(null);
  };

  return {
    loading,
    share,
    createShare,
    trackShare,
    resetShare,
  };
};
