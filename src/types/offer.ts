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

// درجات الاهتمام - حرفي من البرومبت
export type InterestLevel = 'hot' | 'warm' | 'medium' | 'cold' | 'followUp' | 'notInterested' | 'closed' | 'lost';

// ألوان أنواع العملاء - حرفي من البرومبت
export const clientTypeColors: Record<ClientType, string> = {
  buyer: '#10B981',     // أخضر
  seller: '#EF4444',    // أحمر
  tenant: '#3B82F6',    // أزرق
  landlord: '#8B5CF6',  // بنفسجي
  investor: '#D4AF37',  // ذهبي
  vip: '#01411C',       // أخضر ملكي
  developer: '#F97316', // برتقالي
  broker: '#6366F1',    // نيلي
};

// ألوان درجات الاهتمام - حرفي من البرومبت
export const interestLevelColors: Record<InterestLevel, string> = {
  hot: '#DC2626',           // أحمر داكن
  warm: '#F97316',          // برتقالي
  medium: '#FBBF24',        // أصفر
  cold: '#3B82F6',          // أزرق
  followUp: '#8B5CF6',      // بنفسجي
  notInterested: '#6B7280', // رمادي
  closed: '#10B981',        // أخضر
  lost: '#EF4444',          // أحمر
};

// تكوين أنواع العملاء الكامل - حرفي من البرومبت
export const clientTypes = {
  buyer: {
    label: 'مشتري',
    labelEn: 'Buyer',
    color: '#10B981',
    bgColor: '#D1FAE5',
    borderColor: '#10B981',
    icon: '🏡',
    iconComponent: 'Home',
    priority: 8,
    badge: 'مشتري'
  },
  seller: {
    label: 'بائع',
    labelEn: 'Seller',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    borderColor: '#EF4444',
    icon: '💰',
    iconComponent: 'DollarSign',
    priority: 9,
    badge: 'بائع'
  },
  tenant: {
    label: 'مستأجر',
    labelEn: 'Tenant',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    borderColor: '#3B82F6',
    icon: '🔑',
    iconComponent: 'Key',
    priority: 7,
    badge: 'مستأجر'
  },
  landlord: {
    label: 'مؤجر',
    labelEn: 'Landlord',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    icon: '🏢',
    iconComponent: 'Building',
    priority: 8,
    badge: 'مؤجر'
  },
  investor: {
    label: 'مستثمر',
    labelEn: 'Investor',
    color: '#D4AF37',
    bgColor: '#FFFBEB',
    borderColor: '#D4AF37',
    icon: '📊',
    iconComponent: 'TrendingUp',
    priority: 10,
    badge: 'مستثمر'
  },
  vip: {
    label: 'VIP',
    labelEn: 'VIP',
    color: '#01411C',
    bgColor: '#D1FAE5',
    borderColor: '#D4AF37',
    icon: '👑',
    iconComponent: 'Crown',
    priority: 12,
    badge: 'VIP'
  },
  developer: {
    label: 'مطور',
    labelEn: 'Developer',
    color: '#F97316',
    bgColor: '#FFEDD5',
    borderColor: '#F97316',
    icon: '🏗️',
    iconComponent: 'Hammer',
    priority: 9,
    badge: 'مطور'
  },
  broker: {
    label: 'وسيط',
    labelEn: 'Broker',
    color: '#6366F1',
    bgColor: '#E0E7FF',
    borderColor: '#6366F1',
    icon: '🤝',
    iconComponent: 'Handshake',
    priority: 7,
    badge: 'وسيط'
  }
};

// تكوين درجات الاهتمام الكامل - حرفي من البرومبت
export const interestLevels = {
  hot: {
    label: 'ساخن جداً',
    labelEn: 'Hot',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#DC2626',
    icon: '🔥',
    iconComponent: 'Flame',
    priority: 10,
    badge: 'عاجل',
    animation: 'animate-pulse',
    description: 'يحتاج استجابة فورية',
    sla: '< 1 ساعة',
    autoReminder: 30
  },
  warm: {
    label: 'ساخن',
    labelEn: 'Warm',
    color: '#F97316',
    bgColor: '#FFEDD5',
    borderColor: '#F97316',
    icon: '☀️',
    iconComponent: 'Sun',
    priority: 8,
    badge: 'مهم',
    animation: null,
    description: 'مهتم بشكل نشط',
    sla: '< 4 ساعات',
    autoReminder: 60
  },
  medium: {
    label: 'متوسط',
    labelEn: 'Medium',
    color: '#FBBF24',
    bgColor: '#FEF3C7',
    borderColor: '#FBBF24',
    icon: '💡',
    iconComponent: 'Lightbulb',
    priority: 6,
    badge: 'متابعة',
    animation: null,
    description: 'مهتم ولكن غير مستعجل',
    sla: '< 24 ساعة',
    autoReminder: 120
  },
  cold: {
    label: 'بارد',
    labelEn: 'Cold',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    borderColor: '#3B82F6',
    icon: '❄️',
    iconComponent: 'Snowflake',
    priority: 4,
    badge: 'انتظار',
    animation: null,
    description: 'يحتاج إعادة تفعيل',
    sla: '< 48 ساعة',
    autoReminder: 240
  },
  followUp: {
    label: 'متابعة لاحقة',
    labelEn: 'Follow Up',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    icon: '📅',
    iconComponent: 'CalendarClock',
    priority: 5,
    badge: 'منتظر',
    animation: null,
    description: 'موعد محدد للمتابعة',
    sla: 'حسب الموعد',
    autoReminder: null
  },
  notInterested: {
    label: 'غير مهتم',
    labelEn: 'Not Interested',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#6B7280',
    icon: '⏸️',
    iconComponent: 'Pause',
    priority: 1,
    badge: 'معلق',
    animation: null,
    description: 'غير مهتم حالياً',
    sla: null,
    autoReminder: null
  },
  closed: {
    label: 'مغلق',
    labelEn: 'Closed',
    color: '#10B981',
    bgColor: '#D1FAE5',
    borderColor: '#10B981',
    icon: '✅',
    iconComponent: 'CheckCircle2',
    priority: 0,
    badge: 'منتهي',
    animation: null,
    description: 'تمت الصفقة بنجاح',
    sla: null,
    autoReminder: null
  },
  lost: {
    label: 'ضائع',
    labelEn: 'Lost',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    borderColor: '#EF4444',
    icon: '❌',
    iconComponent: 'XCircle',
    priority: 0,
    badge: 'ملغي',
    animation: null,
    description: 'فشلت الصفقة',
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
