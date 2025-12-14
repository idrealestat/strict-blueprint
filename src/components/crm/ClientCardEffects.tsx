// ملف: src/components/crm/ClientCardEffects.tsx
// تأثيرات بطاقة العميل - حرفي من البرومبت

import React from 'react';
import { ClientType, InterestLevel, clientTypes, interestLevels } from '@/types/offer';

interface ClientCardEffectsProps {
  clientType: ClientType;
  interestLevel: InterestLevel;
  isVIP?: boolean;
  children: React.ReactNode;
  className?: string;
}

// تأثيرات البوردر بناءً على نوع العميل - حرفي من البرومبت
const borderEffects: Record<ClientType, string> = {
  buyer: 'border-r-4 border-r-green-500',
  seller: 'border-r-4 border-r-red-500',
  tenant: 'border-r-4 border-r-blue-500',
  landlord: 'border-r-4 border-r-purple-500',
  investor: 'border-r-4 border-r-[#D4AF37]',
  vip: 'border-r-4 border-r-[#D4AF37] shadow-lg shadow-[#D4AF37]/20',
  developer: 'border-r-4 border-r-orange-500',
  broker: 'border-r-4 border-r-indigo-500',
};

// تأثيرات البوردر بناءً على درجة الاهتمام - حرفي من البرومبت
const interestBorderEffects: Record<InterestLevel, string> = {
  hot: 'border-2 border-red-600 shadow-lg shadow-red-200 animate-pulse',
  warm: 'border-2 border-orange-500 shadow-md shadow-orange-100',
  medium: 'border-2 border-yellow-400 shadow-sm shadow-yellow-50',
  cold: 'border-2 border-blue-500',
  followUp: 'border-2 border-purple-500 border-dashed',
  notInterested: 'border-2 border-gray-400 opacity-60',
  closed: 'border-2 border-green-500 bg-green-50',
  lost: 'border-2 border-red-500 bg-red-50 opacity-70',
};

// تأثيرات الخلفية المشتركة - حرفي من البرومبت
const getBackgroundEffect = (clientType: ClientType, interestLevel: InterestLevel): string => {
  // VIP + Hot
  if (clientType === 'vip' && interestLevel === 'hot') {
    return 'bg-gradient-to-br from-[#01411C]/5 via-[#D4AF37]/5 to-red-50 shadow-2xl shadow-[#D4AF37]/30 ring-2 ring-[#D4AF37] ring-offset-2';
  }
  
  // VIP + Warm
  if (clientType === 'vip' && interestLevel === 'warm') {
    return 'bg-gradient-to-br from-[#01411C]/5 to-orange-50 shadow-xl shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]';
  }
  
  // Investor + Hot
  if (clientType === 'investor' && interestLevel === 'hot') {
    return 'bg-gradient-to-br from-amber-50 to-red-50 shadow-lg shadow-amber-200';
  }
  
  // Archived أو غير مهتم
  if (interestLevel === 'notInterested' || interestLevel === 'lost') {
    return 'bg-gray-50 shadow-sm opacity-75';
  }
  
  // بطاقات عادية
  return 'bg-white hover:bg-gray-50 shadow hover:shadow-md';
};

// شريط الحالة العلوي - حرفي من البرومبت
const getTopStatusBar = (interestLevel: InterestLevel, isVIP: boolean): { height: string; bg: string; animation?: string } | null => {
  if (isVIP) {
    return {
      height: '4px',
      bg: 'bg-gradient-to-l from-[#D4AF37] via-[#01411C] to-[#D4AF37]',
      animation: 'animate-shimmer',
    };
  }
  
  if (interestLevel === 'hot') {
    return {
      height: '4px',
      bg: 'bg-gradient-to-l from-red-600 via-orange-500 to-yellow-500',
      animation: 'animate-pulse',
    };
  }
  
  if (interestLevel === 'warm') {
    return {
      height: '3px',
      bg: 'bg-gradient-to-l from-orange-500 to-yellow-400',
    };
  }
  
  return null;
};

// شريط جانبي ملون - حرفي من البرومبت
const coloredSidebarStyles: Record<ClientType, string> = {
  buyer: 'bg-gradient-to-b from-green-400 to-green-600',
  seller: 'bg-gradient-to-b from-red-400 to-red-600',
  tenant: 'bg-gradient-to-b from-blue-400 to-blue-600',
  landlord: 'bg-gradient-to-b from-purple-400 to-purple-600',
  investor: 'bg-gradient-to-b from-[#D4AF37] to-amber-600',
  vip: 'bg-gradient-to-b from-[#D4AF37] via-[#01411C] to-[#D4AF37]',
  developer: 'bg-gradient-to-b from-orange-400 to-orange-600',
  broker: 'bg-gradient-to-b from-indigo-400 to-indigo-600',
};

export const ClientCardEffects: React.FC<ClientCardEffectsProps> = ({
  clientType,
  interestLevel,
  isVIP = false,
  children,
  className = '',
}) => {
  const actualClientType = isVIP ? 'vip' : clientType;
  const backgroundEffect = getBackgroundEffect(actualClientType, interestLevel);
  const topStatusBar = getTopStatusBar(interestLevel, isVIP);
  
  return (
    <div
      className={`
        relative rounded-lg overflow-hidden
        ${backgroundEffect}
        ${borderEffects[actualClientType]}
        ${interestBorderEffects[interestLevel]}
        hover:scale-[1.02] transition-all duration-300
        ${className}
      `}
    >
      {/* شريط الحالة العلوي */}
      {topStatusBar && (
        <div
          className={`absolute top-0 left-0 right-0 ${topStatusBar.bg} ${topStatusBar.animation || ''}`}
          style={{ height: topStatusBar.height }}
        />
      )}
      
      {/* شريط جانبي ملون */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-1.5 ${coloredSidebarStyles[actualClientType]}`}
      />
      
      {/* أيقونة VIP في الزاوية */}
      {isVIP && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-[#D4AF37] to-[#01411C] text-white w-8 h-8 rounded-bl-lg flex items-center justify-center text-lg shadow-lg z-10">
          👑
        </div>
      )}
      
      {/* Badge ساخن جداً */}
      {interestLevel === 'hot' && (
        <div className="absolute top-0 left-0 bg-red-600 text-white px-3 py-1 rounded-br-lg text-xs font-bold flex items-center gap-1 animate-pulse z-10">
          <span>🔥</span>
          <span>ساخن جداً</span>
        </div>
      )}
      
      {/* محتوى البطاقة */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

// مكون Badge نوع العميل
export const ClientTypeBadge: React.FC<{ type: ClientType }> = ({ type }) => {
  const config = clientTypes[type];
  
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.color,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

// مكون Badge درجة الاهتمام
export const InterestLevelBadge: React.FC<{ level: InterestLevel }> = ({ level }) => {
  const config = interestLevels[level];
  
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.animation || ''}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.color,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

// رموز الحالة السريعة - حرفي من البرومبت
export const quickStatusIcons = {
  hasAppointment: '📅',     // لديه موعد قريب
  hasWhatsApp: '💬',        // تواصل واتساب نشط
  newLead: '✨',            // عميل جديد (أقل من 24 ساعة)
  respondedToday: '⚡',     // رد اليوم
  missedCall: '📞',         // مكالمة فائتة
  sentOffer: '📋',          // تم إرسال عرض
  viewedProperty: '👁️',    // شاهد عقار
  hasNotes: '📝',           // لديه ملاحظات مهمة
  needsFollowUp: '⏰',      // يحتاج متابعة عاجلة
  budgetApproved: '✅',     // ميزانية معتمدة
};

export default ClientCardEffects;
