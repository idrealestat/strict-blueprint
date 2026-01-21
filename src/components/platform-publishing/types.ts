/**
 * Platform Publishing System Types
 * أنواع نظام النشر على المنصات
 */

// منصة خارجية
export interface ExternalPlatform {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
  color: string;
  bgColor: string;
  status: 'connected' | 'pending' | 'disconnected';
  apiEndpoint?: string;
  requiresAuth: boolean;
  features: string[];
}

// حالة النشر
export type PublishStatus = 'success' | 'pending' | 'failed' | 'not_published';

// نتيجة النشر على منصة
export interface PlatformPublishResult {
  platformId: string;
  platformName: string;
  status: PublishStatus;
  externalId?: string;
  publishedAt?: string;
  expiresAt?: string;
  error?: string;
  views?: number;
  clicks?: number;
  leads?: number;
}

// بيانات العرض المنشور على المنصات
export interface PlatformPublishedOffer {
  id: string;
  title: string;
  propertyType: string;
  purpose: string;
  price: string;
  area: string;
  city: string;
  district: string;
  
  // معلومات المالك
  ownerName: string;
  ownerPhone: string;
  ownerIdNumber?: string;
  ownerBirthDate?: string;
  ownerNationalAddress?: string;
  ownerCity?: string;
  ownerDistrict?: string;
  
  // معلومات الصك
  deedNumber?: string;
  deedDate?: string;
  deedCity?: string;
  
  // معلومات الإيجار
  isCurrentlyRented?: boolean;
  contractDuration?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  rentalContractFile?: string;
  
  // الترخيص الإعلاني
  adLicense: string;
  adLicenseDate?: string;
  adLicenseDuration?: string;
  
  // الوسائط
  images?: string[];
  videos?: string[];
  tour3DUrl?: string;
  
  // المواصفات
  bedrooms?: string;
  bathrooms?: string;
  livingRooms?: string;
  floors?: string;
  propertyAge?: string;
  furnishing?: string;
  facade?: string;
  streetWidth?: string;
  
  // الميزات والهاشتاقات
  features?: string[];
  customFeatures?: string[];
  hashtags?: string[];
  customHashtags?: string[];
  
  // الوصف
  aiDescription?: string;
  
  // المنصات المنشور عليها
  publishedPlatforms: PlatformPublishResult[];
  
  // المصدر
  source: 'platform_publishing'; // لتمييزه عن منصتي
  
  // الربط
  linkedCustomerId?: string;
  
  // التاريخ
  createdAt: string;
  updatedAt: string;
}

// إحصائيات المنصة
export interface PlatformStats {
  platformId: string;
  platformName: string;
  totalPublished: number;
  activeListings: number;
  totalViews: number;
  totalClicks: number;
  totalLeads: number;
  avgCTR: number;
  avgCPC: number;
  conversionRate: number;
}

// إحصائيات عامة
export interface PublishingAnalytics {
  totalPublished: number;
  activeListings: number;
  totalViews: number;
  totalClicks: number;
  totalLeads: number;
  platformStats: PlatformStats[];
  topPerformingOffers: {
    offerId: string;
    title: string;
    views: number;
    clicks: number;
    leads: number;
  }[];
  publishingTrend: {
    date: string;
    count: number;
  }[];
}

// المنصات المتاحة - مرتبة حسب الأولوية
export const AVAILABLE_PLATFORMS: ExternalPlatform[] = [
  {
    id: 'wasalt',
    name: 'Wasalt',
    nameAr: 'وصلت',
    logo: '🏠',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['REGA Integration', 'Auto-sync', 'Analytics'],
  },
  {
    id: 'aqar',
    name: 'Aqar',
    nameAr: 'عقار',
    logo: '🏢',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['Auto-sync', 'Premium listings'],
  },
  {
    id: 'deal',
    name: 'Deal',
    nameAr: 'ديل',
    logo: '💎',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['Quick posting', 'Analytics'],
  },
  {
    id: 'haraj',
    name: 'Haraj',
    nameAr: 'حراج',
    logo: '🔵',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['Manual posting', 'Photo upload'],
  },
  {
    id: 'sandak',
    name: 'Sandak',
    nameAr: 'سندك',
    logo: '📋',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['Verification', 'Premium features'],
  },
  {
    id: 'bayut',
    name: 'Bayut',
    nameAr: 'بيوت',
    logo: '🏡',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['International reach', 'Premium listings'],
  },
  {
    id: 'thaki',
    name: 'Thaki',
    nameAr: 'ذكي',
    logo: '🧠',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['AI-powered', 'Smart matching'],
  },
  {
    id: 'moktamel',
    name: 'Moktamel',
    nameAr: 'مكتمل',
    logo: '✅',
    color: '#14B8A6',
    bgColor: 'rgba(20, 184, 166, 0.1)',
    status: 'disconnected',
    requiresAuth: true,
    features: ['Complete listing', 'Full service'],
  },
];
