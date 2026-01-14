// ملف: src/types/offer.ts
// أنواع العروض والمشاركة - حرفي من البرومبت

export interface OfferShare {
  id: string;
  shareUrl: string;
  qrCodeUrl: string;
  shareCount: number;
  viewCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

export interface OfferShareStats {
  shareCount: number;
  viewCount: number;
  uniqueViewers: number;
  lastViewedAt?: Date;
}

export enum ShareMethod {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  SMS = 'sms',
  LINK = 'link',
  QR = 'qr',
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  images: string[];
  city: string;
  district: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  // باقي الحقول
  share?: OfferShare;
}

// أنواع العملاء - حرفي من البرومبت
export type ClientType = 'buyer' | 'seller' | 'tenant' | 'landlord' | 'investor' | 'vip' | 'developer' | 'broker';

// درجات الاهتمام - الدرجات الجديدة المطلوبة
export type InterestLevel = 'veryInterested' | 'interested' | 'moderate' | 'lowInterest' | 'notInterested';

// ألوان أنواع العملاء - ألوان هادئة وخفيفة
export const clientTypeColors: Record<ClientType, string> = {
  buyer: '#059669',     // أخضر زمردي هادئ
  seller: '#DC2626',    // أحمر داكن
  tenant: '#2563EB',    // أزرق ملكي
  landlord: '#7C3AED',  // بنفسجي
  investor: '#B45309',  // ذهبي/برتقالي
  vip: '#01411C',       // أخضر ملكي
  developer: '#EA580C', // برتقالي
  broker: '#4F46E5',    // نيلي
};

// ألوان درجات الاهتمام - ألوان مختلفة تماماً عن نوع العميل
export const interestLevelColors: Record<InterestLevel, string> = {
  veryInterested: '#BE185D',  // وردي/فوشي داكن
  interested: '#0891B2',      // سماوي/تيل
  moderate: '#CA8A04',        // أصفر ذهبي
  lowInterest: '#64748B',     // رمادي مزرق
  notInterested: '#9CA3AF',   // رمادي فاتح
};

// تكوين أنواع العملاء الكامل - ألوان خلفية هادئة
export const clientTypes = {
  buyer: {
    label: 'مشتري',
    labelEn: 'Buyer',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#059669',
    icon: '🏡',
    iconComponent: 'Home',
    priority: 8,
    badge: 'مشتري'
  },
  seller: {
    label: 'بائع',
    labelEn: 'Seller',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#DC2626',
    icon: '💰',
    iconComponent: 'DollarSign',
    priority: 9,
    badge: 'بائع'
  },
  tenant: {
    label: 'مستأجر',
    labelEn: 'Tenant',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#2563EB',
    icon: '🔑',
    iconComponent: 'Key',
    priority: 7,
    badge: 'مستأجر'
  },
  landlord: {
    label: 'مؤجر',
    labelEn: 'Landlord',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#7C3AED',
    icon: '🏢',
    iconComponent: 'Building',
    priority: 8,
    badge: 'مؤجر'
  },
  investor: {
    label: 'مستثمر',
    labelEn: 'Investor',
    color: '#B45309',
    bgColor: '#FFFBEB',
    borderColor: '#B45309',
    icon: '📊',
    iconComponent: 'TrendingUp',
    priority: 10,
    badge: 'مستثمر'
  },
  vip: {
    label: 'VIP',
    labelEn: 'VIP',
    color: '#01411C',
    bgColor: '#F0FDF4',
    borderColor: '#D4AF37',
    icon: '👑',
    iconComponent: 'Crown',
    priority: 12,
    badge: 'VIP'
  },
  developer: {
    label: 'مطور',
    labelEn: 'Developer',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#EA580C',
    icon: '🏗️',
    iconComponent: 'Hammer',
    priority: 9,
    badge: 'مطور'
  },
  broker: {
    label: 'وسيط',
    labelEn: 'Broker',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#4F46E5',
    icon: '🤝',
    iconComponent: 'Handshake',
    priority: 7,
    badge: 'وسيط'
  }
};

// تكوين درجات الاهتمام الكامل - الدرجات الجديدة المطلوبة
export const interestLevels = {
  veryInterested: {
    label: 'مهتم جداً',
    labelEn: 'Very Interested',
    color: '#BE185D',
    bgColor: '#FDF2F8',
    borderColor: '#BE185D',
    icon: '🔥',
    iconComponent: 'Flame',
    priority: 10,
    badge: 'عاجل',
    animation: 'animate-pulse',
    description: 'يحتاج استجابة فورية',
    sla: '< 1 ساعة',
    autoReminder: 30
  },
  interested: {
    label: 'مهتم',
    labelEn: 'Interested',
    color: '#0891B2',
    bgColor: '#ECFEFF',
    borderColor: '#0891B2',
    icon: '⭐',
    iconComponent: 'Star',
    priority: 8,
    badge: 'مهم',
    animation: null,
    description: 'مهتم بشكل نشط',
    sla: '< 4 ساعات',
    autoReminder: 60
  },
  moderate: {
    label: 'معتدل',
    labelEn: 'Moderate',
    color: '#CA8A04',
    bgColor: '#FEFCE8',
    borderColor: '#CA8A04',
    icon: '💡',
    iconComponent: 'Lightbulb',
    priority: 6,
    badge: 'متابعة',
    animation: null,
    description: 'مهتم ولكن غير مستعجل',
    sla: '< 24 ساعة',
    autoReminder: 120
  },
  lowInterest: {
    label: 'قليل الاهتمام',
    labelEn: 'Low Interest',
    color: '#64748B',
    bgColor: '#F8FAFC',
    borderColor: '#64748B',
    icon: '💤',
    iconComponent: 'Moon',
    priority: 4,
    badge: 'انتظار',
    animation: null,
    description: 'يحتاج إعادة تفعيل',
    sla: '< 48 ساعة',
    autoReminder: 240
  },
  notInterested: {
    label: 'غير مهتم',
    labelEn: 'Not Interested',
    color: '#9CA3AF',
    bgColor: '#F9FAFB',
    borderColor: '#9CA3AF',
    icon: '⏸️',
    iconComponent: 'Pause',
    priority: 1,
    badge: 'معلق',
    animation: null,
    description: 'غير مهتم حالياً',
    sla: null,
    autoReminder: null
  }
};

// أنواع البلاغات - حرفي من البرومبت
export interface ReportType {
  id: string;
  category: 'عقارات' | 'وسطاء' | 'معاملات' | 'محتوى' | 'تقني' | 'خدمة_عملاء' | 'أنظمة_سعودية' | 'أخرى';
  subCategory: string;
  severity: 'منخفض' | 'متوسط' | 'عالي' | 'حرج';
  description: string;
  createdAt: Date;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
}

// فئات البلاغات - حرفي من البرومبت
export const reportCategories = {
  عقارات: [
    'معلومات مضللة',
    'صور مضللة',
    'وصف كاذب',
    'سعر وهمي',
    'عقار وهمي',
    'ملكية مزورة',
    'احتيال مالي',
    'انتحال شخصية',
    'عقار مخالف للبناء',
    'استخدام غير قانوني',
    'تعدي على أملاك عامة',
    'مخالفة للوائح البلدية',
    'إعلان مكرر',
    'سبام إعلانات',
    'إعادة نشر متكررة'
  ],
  وسطاء: [
    'عدم الالتزام بالمواعيد',
    'سوء المعاملة',
    'عدم الاحترافية',
    'طلبات غير مناسبة',
    'عمولات مخفية',
    'وسيط وهمي',
    'رخصة مزورة',
    'شركة وهمية',
    'انتهاك الخصوصية',
    'تضارب المصالح',
    'قبول رشاوى',
    'استغلال العملاء'
  ],
  معاملات: [
    'عقد مزور',
    'شروط مخفية',
    'إلغاء تعسفي',
    'عدم الالتزام بالعقد',
    'احتيال في الدفع',
    'عدم سداد العمولة',
    'مبالغ غير متفق عليها',
    'تأخير في الدفع'
  ],
  محتوى: [
    'لغة غير لائقة',
    'محتوى عنصري',
    'تحرش',
    'تهديدات',
    'محتوى جنسي',
    'ترويج ممنوعات',
    'محتوى متطرف',
    'انتهاك حقوق نشر'
  ],
  تقني: [
    'خطأ في النظام',
    'بيانات مفقودة',
    'روابط معطلة',
    'خطأ في الحساب',
    'اختراق حساب',
    'نشاط مشبوه',
    'بريد مزعج',
    'برمجيات خبيثة'
  ],
  خدمة_عملاء: [
    'عدم الرد',
    'معلومات ناقصة',
    'تأخير في الخدمة',
    'جودة الخدمة',
    'اقتراح تحسين',
    'ميزة مطلوبة',
    'ملاحظات عامة',
    'طلب دعم'
  ],
  أنظمة_سعودية: [
    'مخالفة نظام الإيجار',
    'عدم توثيق العقد (إيجار)',
    'ضريبة القيمة المضافة',
    'رسوم وكالة',
    'عدم احترام الخصوصية',
    'سكن غير مناسب',
    'تمييز ضد السعوديين/المقيمين',
    'شروط تعسفية'
  ],
  أخرى: [
    'انتهاك شروط الاستخدام',
    'حساب مزيف',
    'تلاعب بالتقييمات',
    'إساءة استخدام النظام'
  ]
};
