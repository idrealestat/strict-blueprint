/**
 * OfficialCardMiniPreview.tsx
 * معاينة مصغرة للبطاقة الرسمية في الـ Right Slider Header
 */

import React from 'react';
import { Edit2, Star, Globe } from 'lucide-react';
import { useBusinessCardData } from '@/hooks/useBusinessCardData';
import { getIdentityImage, getAvatarFallback } from '@/types/businessCard';

interface OfficialCardMiniPreviewProps {
  onEdit: () => void;
}

export default function OfficialCardMiniPreview({ onEdit }: OfficialCardMiniPreviewProps) {
  const { data, loading } = useBusinessCardData();

  const identityImage = getIdentityImage(data);
  const avatarFallback = getAvatarFallback(data.name || 'م');
  const publicUrl = data.slug ? `wasataai.com/${data.slug}` : 'wasataai.com/...';

  if (loading) {
    return (
      <div className="bg-white/10 rounded-lg p-3 animate-pulse">
        <div className="h-16 bg-white/20 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white/90 text-sm font-medium">بطاقة الأعمال الرسمية</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] transition-colors"
          title="تحرير البطاقة"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Card Preview */}
      <div 
        className="relative bg-gradient-to-br from-[#01411C] to-[#065f41] rounded-lg border-2 border-[#D4AF37] p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <span className="text-2xl font-bold text-white">وساطة</span>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {/* Identity Image */}
          <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
            {identityImage ? (
              <img src={identityImage} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#01411C] text-sm font-bold">{avatarFallback}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h5 className="text-white font-bold text-sm truncate">{data.name || 'اسمك هنا'}</h5>
            <p className="text-[#D4AF37] text-xs truncate">{data.title || 'وسيط عقاري معتمد'}</p>
            
            {/* Rating */}
            <div className="flex items-center gap-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-2 h-2 ${i <= Math.floor(data.rating || 4.5) ? 'text-[#D4AF37] fill-current' : 'text-white/20'}`}
                />
              ))}
              <span className="text-[#D4AF37] text-[10px] mr-1">{data.rating || 4.5}</span>
            </div>
          </div>

          {/* QR Placeholder */}
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] text-[#01411C] font-bold">QR</span>
          </div>
        </div>

        {/* URL */}
        <div className="flex items-center gap-1 mt-2 text-[#D4AF37]/80 text-[10px]">
          <Globe className="w-2.5 h-2.5" />
          <span dir="ltr" className="truncate">{publicUrl}</span>
        </div>
      </div>

      {/* Hint */}
      <p className="text-white/50 text-[10px] text-center mt-1.5">
        اضغط للتحرير والطباعة
      </p>
    </div>
  );
}
