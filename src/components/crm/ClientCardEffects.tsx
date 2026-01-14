// ملف: src/components/crm/ClientCardEffects.tsx
// تأثيرات بطاقة العميل - محدث حسب الطلب

import React from 'react';
import { ClientType, InterestLevel, clientTypes, interestLevels } from '@/types/offer';

interface ClientCardEffectsProps {
  clientType: ClientType;
  interestLevel: InterestLevel;
  isVIP?: boolean;
  children: React.ReactNode;
  className?: string;
}

// تأثيرات البوردر بناءً على نوع العميل - ألوان هادئة
const borderEffects: Record<ClientType, string> = {
  buyer: 'border-r-4 border-r-emerald-600',
  seller: 'border-r-4 border-r-red-600',
  tenant: 'border-r-4 border-r-blue-600',
  landlord: 'border-r-4 border-r-violet-600',
  investor: 'border-r-4 border-r-amber-600',
  vip: 'border-r-4 border-r-[#D4AF37] shadow-lg shadow-[#D4AF37]/20',
  developer: 'border-r-4 border-r-orange-600',
  broker: 'border-r-4 border-r-indigo-600',
};

// تأثيرات البوردر بناءً على درجة الاهتمام - ألوان مختلفة عن نوع العميل
const interestBorderEffects: Record<InterestLevel, string> = {
  veryInterested: 'border-2 border-pink-600 shadow-lg shadow-pink-200 animate-pulse',
  interested: 'border-2 border-cyan-600 shadow-md shadow-cyan-100',
  moderate: 'border-2 border-yellow-600 shadow-sm shadow-yellow-50',
  lowInterest: 'border-2 border-slate-500',
  notInterested: 'border-2 border-gray-400 opacity-60',
};

// تأثيرات الخلفية المشتركة - ألوان خفيفة هادئة
const getBackgroundEffect = (clientType: ClientType, interestLevel: InterestLevel): string => {
  // VIP + مهتم جداً
  if (clientType === 'vip' && interestLevel === 'veryInterested') {
    return 'bg-gradient-to-br from-[#01411C]/5 via-[#D4AF37]/5 to-pink-50 shadow-2xl shadow-[#D4AF37]/30 ring-2 ring-[#D4AF37] ring-offset-2';
  }
  
  // VIP + مهتم
  if (clientType === 'vip' && interestLevel === 'interested') {
    return 'bg-gradient-to-br from-[#01411C]/5 to-cyan-50 shadow-xl shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]';
  }
  
  // مستثمر + مهتم جداً
  if (clientType === 'investor' && interestLevel === 'veryInterested') {
    return 'bg-gradient-to-br from-amber-50 to-pink-50 shadow-lg shadow-amber-200';
  }
  
  // غير مهتم
  if (interestLevel === 'notInterested') {
    return 'bg-gray-50 shadow-sm opacity-75';
  }
  
  // بطاقات عادية
  return 'bg-white hover:bg-gray-50 shadow hover:shadow-md';
};

// شريط الحالة العلوي
const getTopStatusBar = (interestLevel: InterestLevel, isVIP: boolean): { height: string; bg: string; animation?: string } | null => {
  if (isVIP) {
    return {
      height: '4px',
      bg: 'bg-gradient-to-l from-[#D4AF37] via-[#01411C] to-[#D4AF37]',
      animation: 'animate-shimmer',
    };
  }
  
  if (interestLevel === 'veryInterested') {
    return {
      height: '4px',
      bg: 'bg-gradient-to-l from-pink-600 via-rose-500 to-pink-600',
      animation: 'animate-pulse',
    };
  }
  
  if (interestLevel === 'interested') {
    return {
      height: '3px',
      bg: 'bg-gradient-to-l from-cyan-600 to-teal-500',
    };
  }
  
  return null;
};

// شريط جانبي ملون
const coloredSidebarStyles: Record<ClientType, string> = {
  buyer: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
  seller: 'bg-gradient-to-b from-red-400 to-red-600',
  tenant: 'bg-gradient-to-b from-blue-400 to-blue-600',
  landlord: 'bg-gradient-to-b from-violet-400 to-violet-600',
  investor: 'bg-gradient-to-b from-amber-400 to-amber-600',
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
      
      {/* Badge مهتم جداً */}
      {interestLevel === 'veryInterested' && (
        <div className="absolute top-0 left-0 bg-pink-600 text-white px-3 py-1 rounded-br-lg text-xs font-bold flex items-center gap-1 animate-pulse z-10">
          <span>🔥</span>
          <span>مهتم جداً</span>
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

// رموز الحالة السريعة
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