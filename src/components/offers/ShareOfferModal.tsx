// ملف: src/components/offers/ShareOfferModal.tsx
// Modal مشاركة العرض - حرفي من البرومبت

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShareButtons } from './ShareButtons';
import { QRCodeGenerator } from './QRCodeGenerator';
import { useOfferShare } from '@/hooks/useOfferShare';
import { useClipboard } from '@/hooks/useClipboard';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareOfferModalProps {
  offer: {
    id: string;
    title: string;
    description?: string;
  };
  open: boolean;
  onClose: () => void;
}

export const ShareOfferModal: React.FC<ShareOfferModalProps> = ({
  offer,
  open,
  onClose,
}) => {
  const { loading, share, createShare, trackShare, resetShare } = useOfferShare();
  const { copied, copyToClipboard } = useClipboard();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (open && !initialized && !share) {
      handleCreateShare();
      setInitialized(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setInitialized(false);
      resetShare();
    }
  }, [open]);

  const handleCreateShare = async () => {
    try {
      await createShare(offer.id);
    } catch (error) {
      console.error('Create share error:', error);
    }
  };

  const handleCopy = async () => {
    if (share) {
      await copyToClipboard(share.shareUrl);
      await trackShare(share.id, 'link' as any);
    }
  };

  const handleShare = async (method: string) => {
    if (!share) return;

    await trackShare(share.id, method as any);

    const text = `شاهد هذا العرض العقاري المميز:\n${offer.title}\n${share.shareUrl}`;

    switch (method) {
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;

      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(offer.title)}&body=${encodeURIComponent(text)}`;
        break;

      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#01411C]" />
            مشاركة العرض
          </DialogTitle>
        </DialogHeader>

        {loading && !share ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01411C]" />
          </div>
        ) : share ? (
          <div className="space-y-6">
            {/* رابط المشاركة */}
            <div className="space-y-2">
              <Label>رابط المشاركة</Label>
              <div className="flex gap-2">
                <Input
                  value={share.shareUrl}
                  readOnly
                  className="flex-1 text-left"
                  dir="ltr"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* أزرار المشاركة */}
            <ShareButtons onShare={handleShare} />

            {/* QR Code */}
            <QRCodeGenerator
              url={share.shareUrl}
              qrCodeUrl={share.qrCodeUrl}
            />

            {/* إحصائيات */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#01411C]">
                  {share.viewCount}
                </div>
                <div className="text-sm text-gray-600">مشاهدة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">
                  {share.shareCount}
                </div>
                <div className="text-sm text-gray-600">مشاركة</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            فشل في تحميل معلومات المشاركة
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareOfferModal;
