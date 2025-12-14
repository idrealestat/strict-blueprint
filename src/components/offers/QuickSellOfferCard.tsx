import React, { useState, useEffect, useRef } from 'react';
import {
  Eye, Share2, MoreVertical, MapPin, 
  Maximize2, Copy, Download, MessageCircle, Calendar, 
  User, Package, EyeOff, Phone, FileText,
  Send, CreditCard, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AdStats {
  views?: number;
  shares?: number;
}

interface AdLocation {
  city?: string;
  district?: string;
}

interface MediaFile {
  url: string;
  type?: string;
}

interface Ad {
  id: string;
  title: string;
  price?: number;
  area?: number;
  bedrooms?: number;
  status: string;
  ownerName?: string;
  ownerPhone?: string;
  whatsappNumber?: string;
  adNumber?: string;
  location?: AdLocation;
  mediaFiles?: MediaFile[];
  stats?: AdStats;
  createdAt?: string;
}

interface QuickSellOfferCardProps {
  ad: Ad;
  onEdit?: (ad: Ad) => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string, status: string) => void;
  onViewOwner?: (phone?: string) => void;
  onRepublish?: (ad: Ad) => void;
}

const QuickSellOfferCard: React.FC<QuickSellOfferCardProps> = ({ 
  ad, 
  onEdit, 
  onDelete, 
  onTogglePublish, 
  onViewOwner, 
  onRepublish 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isLiveViewer, setIsLiveViewer] = useState(false);
  const [liveViewTimer, setLiveViewTimer] = useState<NodeJS.Timeout | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  
  // Eye indicator logic
  useEffect(() => {
    const handleLiveView = (e: CustomEvent) => {
      if (e.detail.adId === ad.id) {
        setIsLiveViewer(true);
        
        // Reset timer
        if (liveViewTimer) clearTimeout(liveViewTimer);
        
        // Set new timer (60s)
        const timer = setTimeout(() => {
          setIsLiveViewer(false);
        }, 60000);
        
        setLiveViewTimer(timer);
      }
    };
    
    window.addEventListener('adViewedLive', handleLiveView as EventListener);
    return () => {
      window.removeEventListener('adViewedLive', handleLiveView as EventListener);
      if (liveViewTimer) clearTimeout(liveViewTimer);
    };
  }, [ad.id, liveViewTimer]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    
    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);
  
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-orange-100 text-orange-800',
    sold: 'bg-purple-100 text-purple-800',
    rented: 'bg-cyan-100 text-cyan-800',
    archived: 'bg-red-100 text-red-800'
  };

  const generateShareLink = (ad: Ad) => {
    return `${window.location.origin}/offers/${ad.id}`;
  };
  
  const handleShare = (type: string, isPrivate = false) => {
    const shareLink = generateShareLink(ad);
    
    if (type === 'copy') {
      if (isPrivate) {
        const confirmed = confirm('⚠️ تنبيه: هذا الرابط خاص\n\nسيكون صالحاً لمدة 24 ساعة فقط.\nلا تشاركه إلا مع العميل المطلوب.\n\nهل تريد المتابعة؟');
        if (!confirmed) return;
      }
      
      navigator.clipboard.writeText(shareLink);
      
      const toastMsg = isPrivate 
        ? '🔒 تم نسخ الرابط الخاص! (صالح لـ 24 ساعة)'
        : '✅ تم نسخ الرابط!';
      
      toast.success(toastMsg);
    } else if (type === 'whatsapp') {
      const message = encodeURIComponent(`شاهد هذا العرض: ${ad.title}\n${shareLink}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    } else if (type === 'pdf') {
      toast.info('جاري تحميل PDF...');
      // TODO: Implement PDF download
    } else if (type === 'qr') {
      toast.info('جاري إنشاء QR Code...');
      // TODO: Implement QR code modal
    }
    
    setShowActions(false);
  };
  
  const handlePayDeposit = () => {
    setShowDepositModal(true);
    setShowActions(false);
    toast.info('جاري فتح نافذة دفع العربون...');
  };
  
  const handleSendQuote = () => {
    setShowQuoteModal(true);
    setShowActions(false);
    toast.info('جاري فتح نافذة إرسال عرض السعر...');
  };
  
  const handleScheduleVisit = () => {
    setShowVisitModal(true);
    setShowActions(false);
    toast.info('جاري فتح نافذة حجز الموعد...');
  };
  
  const handleViewOwnerCard = () => {
    if (onViewOwner) onViewOwner(ad.ownerPhone);
  };
  
  const handleRepublish = () => {
    localStorage.setItem('TEMP_PUBLISH_DRAFT', JSON.stringify(ad));
    toast.success('✅ تم تعبئة نموذج النشر! سيتم فتح صفحة النشر...');
    if (onRepublish) onRepublish(ad);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-all duration-200 overflow-hidden" dir="rtl">
      {/* Header with thumbnail */}
      <div className="relative h-48">
        {ad.mediaFiles && ad.mediaFiles.length > 0 ? (
          <img 
            src={ad.mediaFiles[0].url} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Eye indicator - top right */}
        <div className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isLiveViewer 
            ? 'bg-red-500 animate-pulse shadow-lg' 
            : 'bg-gray-400/70'
        }`}>
          <Eye className={`w-5 h-5 text-white`} />
        </div>
        
        {/* Toggle publish - top left */}
        <button
          onClick={() => onTogglePublish?.(ad.id, ad.status === 'published' ? 'inactive' : 'published')}
          className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            ad.status === 'published' 
              ? 'bg-green-500 hover:bg-orange-500' 
              : 'bg-gray-500 hover:bg-green-500'
          } shadow-lg`}
        >
          {ad.status === 'published' ? (
            <Eye className="w-5 h-5 text-white" />
          ) : (
            <EyeOff className="w-5 h-5 text-white" />
          )}
        </button>
        
        {/* Price ribbon */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{ad.price?.toLocaleString()} ريال</div>
            <div className="flex items-center gap-1 text-xs">
              <Maximize2 className="w-3 h-3" />
              <span>{ad.area}م²</span>
              {ad.bedrooms && ad.bedrooms > 0 && (
                <>
                  <span className="mx-1">•</span>
                  <span>{ad.bedrooms} غرف</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4">
        {/* Title & Subtitle */}
        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{ad.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
          <button 
            onClick={() => onViewOwner?.(ad.ownerPhone)}
            className="hover:text-blue-600 hover:underline flex items-center gap-1"
          >
            <User className="w-3 h-3" />
            {ad.ownerName}
          </button>
          <span>•</span>
          <span>{ad.adNumber}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {ad.location?.city} - {ad.location?.district}
          </span>
        </div>
        
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className={statusColors[ad.status] || 'bg-gray-100 text-gray-800'}>
            {ad.status === 'draft' ? 'مسودة' :
             ad.status === 'published' ? 'منشور' :
             ad.status === 'active' ? 'نشط' :
             ad.status === 'inactive' ? 'غير نشط' :
             ad.status === 'sold' ? 'مباع' :
             ad.status === 'rented' ? 'مؤجر' : 'مؤرشف'}
          </Badge>
          {isLiveViewer && (
            <Badge className="bg-red-100 text-red-800 animate-pulse">
              🔴 يُشاهد الآن
            </Badge>
          )}
        </div>
        
        {/* Primary Actions Row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button 
            size="sm" 
            onClick={handlePayDeposit}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white"
          >
            <CreditCard className="w-4 h-4 ml-1" />
            ادفع عربون
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              const message = encodeURIComponent(`مرحباً، أنا مهتم بعرضكم: ${ad.title}`);
              window.open(`https://wa.me/${ad.whatsappNumber}?text=${message}`, '_blank');
            }}
          >
            <Phone className="w-4 h-4 ml-1" />
            واتساب
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleSendQuote}
          >
            <Send className="w-4 h-4 ml-1" />
            أرسل عرض سعر
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleScheduleVisit}
          >
            <Calendar className="w-4 h-4 ml-1" />
            حدد موعد زيارة
          </Button>
        </div>
        
        {/* Share Button with submenu */}
        <div className="relative mb-3">
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={() => setShowActions(!showActions)}
          >
            <Share2 className="w-4 h-4 ml-1" />
            مشاركة ▾
          </Button>
          
          {showActions && (
            <div 
              ref={actionsRef}
              className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-xl border-2 border-blue-200 z-50 py-2"
            >
              <button 
                onClick={() => handleShare('copy', false)}
                className="w-full px-4 py-2 text-right hover:bg-blue-50 flex items-center justify-between text-sm font-bold"
              >
                <span className="text-blue-600">نسخ الرابط</span>
                <Copy className="w-4 h-4 text-blue-600" />
              </button>
              <button 
                onClick={() => handleShare('copy', true)}
                className="w-full px-4 py-2 text-right hover:bg-orange-50 flex items-center justify-between text-sm"
              >
                <span className="text-orange-600">🔒 نسخ رابط خاص (24 ساعة)</span>
                <Copy className="w-4 h-4 text-orange-600" />
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button 
                onClick={() => handleShare('whatsapp')}
                className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center justify-end gap-2"
              >
                <span>مشاركة عبر واتساب</span>
                <MessageCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleShare('pdf')}
                className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center justify-end gap-2"
              >
                <span>تصدير PDF</span>
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleShare('qr')}
                className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center justify-end gap-2"
              >
                <span>إنشاء QR Code</span>
                <FileText className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Manage Row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button 
            onClick={handleViewOwnerCard}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <User className="w-3 h-3" />
            معلومات المالك
          </button>
          <button 
            onClick={handleRepublish}
            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            إعادة نشر
          </button>
          <button 
            onClick={() => {
              const link = generateShareLink(ad);
              window.open(link, '_blank');
            }}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            فتح العرض
          </button>
          <button 
            onClick={() => onDelete?.(ad.id)}
            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <MoreVertical className="w-3 h-3" />
            أرشفة
          </button>
        </div>
        
        {/* Footer stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <span>{ad.createdAt ? new Date(ad.createdAt).toLocaleDateString('ar-SA') : '-'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {ad.stats?.views || 0}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            {ad.stats?.shares || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickSellOfferCard;
