 /**
  * أنواع نظام النشر على التواصل الاجتماعي
  */
 
 // المنصات الاجتماعية المدعومة (7 منصات فقط)
 export type SocialPlatformId = 
   | 'instagram' 
   | 'facebook' 
   | 'tiktok' 
   | 'youtube' 
   | 'google_business' 
   | 'telegram' 
   | 'linkedin';
 
 export interface SocialPlatform {
   id: SocialPlatformId;
   name: string;
   nameEn: string;
   icon: string;
   color: string;
   bgColor: string;
   status: 'connected' | 'disconnected' | 'pending';
   supportsOrganic: boolean;
   supportsPaid: boolean;
   supportsMessaging: boolean;
 }
 
 // المنصات المتاحة
 export const SOCIAL_PLATFORMS: SocialPlatform[] = [
   { 
     id: 'instagram', 
     name: 'إنستغرام', 
     nameEn: 'Instagram',
     icon: '📷', 
     color: '#E1306C', 
     bgColor: 'bg-pink-100',
     status: 'disconnected',
     supportsOrganic: true,
     supportsPaid: true,
     supportsMessaging: false
   },
   { 
     id: 'facebook', 
     name: 'فيسبوك', 
     nameEn: 'Facebook',
     icon: '📘', 
     color: '#1877F2', 
     bgColor: 'bg-blue-100',
     status: 'disconnected',
     supportsOrganic: true,
     supportsPaid: true,
     supportsMessaging: false
   },
   { 
     id: 'tiktok', 
     name: 'تيك توك', 
     nameEn: 'TikTok',
     icon: '🎵', 
     color: '#000000', 
     bgColor: 'bg-gray-100',
     status: 'disconnected',
     supportsOrganic: true,
     supportsPaid: true,
     supportsMessaging: false
   },
   { 
     id: 'youtube', 
     name: 'يوتيوب', 
     nameEn: 'YouTube',
     icon: '🎬', 
     color: '#FF0000', 
     bgColor: 'bg-red-100',
     status: 'disconnected',
     supportsOrganic: true,
     supportsPaid: false,
     supportsMessaging: false
   },
   { 
     id: 'google_business', 
     name: 'جوجل بيزنس', 
     nameEn: 'Google Business',
     icon: '🏢', 
     color: '#4285F4', 
     bgColor: 'bg-blue-50',
     status: 'disconnected',
     supportsOrganic: true,
     supportsPaid: true,
     supportsMessaging: false
   },
   { 
     id: 'telegram', 
     name: 'تيليجرام', 
     nameEn: 'Telegram',
     icon: '✈️', 
     color: '#0088CC', 
     bgColor: 'bg-cyan-100',
     status: 'disconnected',
     supportsOrganic: true,
     supportsPaid: false,
     supportsMessaging: true
   },
   { 
     id: 'linkedin', 
     name: 'لينكد إن', 
     nameEn: 'LinkedIn',
     icon: '💼', 
     color: '#0A66C2', 
     bgColor: 'bg-blue-100',
     status: 'disconnected',
     supportsOrganic: true,
     supportsPaid: true,
     supportsMessaging: false
   },
 ];
 
 // منصات الإعلانات المدفوعة
 export type PaidAdPlatformId = 
   | 'google_ads' 
   | 'instagram_ads' 
   | 'facebook_ads' 
   | 'tiktok_ads' 
   | 'linkedin_ads';
 
 export interface PaidAdPlatform {
   id: PaidAdPlatformId;
   name: string;
   nameEn: string;
   icon: string;
   color: string;
   status: 'connected' | 'disconnected';
 }
 
 export const PAID_AD_PLATFORMS: PaidAdPlatform[] = [
   { id: 'google_ads', name: 'إعلانات جوجل', nameEn: 'Google Ads', icon: '🔍', color: '#4285F4', status: 'disconnected' },
   { id: 'instagram_ads', name: 'إعلانات إنستغرام', nameEn: 'Instagram Ads', icon: '📷', color: '#E1306C', status: 'disconnected' },
   { id: 'facebook_ads', name: 'إعلانات فيسبوك', nameEn: 'Facebook Ads', icon: '📘', color: '#1877F2', status: 'disconnected' },
   { id: 'tiktok_ads', name: 'إعلانات تيك توك', nameEn: 'TikTok Ads', icon: '🎵', color: '#000000', status: 'disconnected' },
   { id: 'linkedin_ads', name: 'إعلانات لينكد إن', nameEn: 'LinkedIn Ads', icon: '💼', color: '#0A66C2', status: 'disconnected' },
 ];
 
 // إعدادات الفيديو
 export interface VideoSettings {
   subtitlesEnabled: boolean;
  subtitleColor: 'gold' | 'silver' | 'dark' | 'light' | 'white' | 'black' | 'wasata-green' | 'red' | 'blue' | 'purple' | 'orange' | 'cyan';
   subtitleFont: string;
   subtitleFontSize: number;
   logoPosition: 'top-right' | 'top-center' | 'top-left';
   companyName: string;
   showCompanyName: boolean;
 }
 
 // الخطوط المعتمدة
 export const APPROVED_FONTS = [
   { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة' },
   { id: 'tajawal', name: 'Tajawal', nameAr: 'تجوال' },
   { id: 'almarai', name: 'Almarai', nameAr: 'المراعي' },
   { id: 'ibm-plex-arabic', name: 'IBM Plex Arabic', nameAr: 'آي بي إم بلكس' },
   { id: 'noto-sans-arabic', name: 'Noto Sans Arabic', nameAr: 'نوتو سانس' },
 ];
 
 // ألوان الترجمة
 export const SUBTITLE_COLORS = [
   { id: 'gold', name: 'ذهبي', color: '#D4AF37' },
   { id: 'silver', name: 'فضي', color: '#C0C0C0' },
  { id: 'wasata-green', name: 'أخضر وساطة', color: '#01411C' },
  { id: 'white', name: 'أبيض', color: '#FFFFFF' },
  { id: 'black', name: 'أسود', color: '#000000' },
  { id: 'dark', name: 'رمادي داكن', color: '#333333' },
  { id: 'light', name: 'رمادي فاتح', color: '#E5E5E5' },
  { id: 'red', name: 'أحمر', color: '#DC2626' },
  { id: 'blue', name: 'أزرق', color: '#2563EB' },
  { id: 'purple', name: 'بنفسجي', color: '#7C3AED' },
  { id: 'orange', name: 'برتقالي', color: '#EA580C' },
  { id: 'cyan', name: 'سماوي', color: '#0891B2' },
 ];
 
 // حالة المنشور
 export type PostStatus = 'draft' | 'uploading' | 'published' | 'failed';
 
 // بيانات التحليلات
 export interface PlatformAnalytics {
   platformId: SocialPlatformId;
   totalPosts: number;
   totalViews: number;
   totalLikes: number;
   totalComments: number;
   totalShares: number;
   posts: PostAnalytics[];
 }
 
 export interface PostAnalytics {
   id: string;
   platformId: SocialPlatformId;
   title: string;
   publishedAt: string;
   views: number;
   likes: number;
   comments: number;
   shares: number;
   status: PostStatus;
 }

// حالة النشر لكل منصة
export type PublishPlatformStatus = 'pending' | 'uploading' | 'success' | 'failed';

export interface PlatformPublishProgress {
  platformId: SocialPlatformId;
  platformName: string;
  icon: string;
  status: PublishPlatformStatus;
  progress: number; // 0-100
  errorMessage?: string;
}

// بيانات النشر على التواصل الاجتماعي
export interface SocialPublishData {
  description: string;
  hashtags: string[];
  selectedPlatforms: SocialPlatformId[];
  videoFile?: File | null;
  textOverlays: any[];
  logo: any | null;
}

// الهاشتاقات العقارية الشائعة
export const REAL_ESTATE_HASHTAGS = [
  '#عقارات',
  '#عقارات_السعودية',
  '#عقارات_الرياض',
  '#عقار',
  '#للبيع',
  '#للايجار',
  '#شقق',
  '#فلل',
  '#ارض',
  '#استثمار_عقاري',
  '#وسيط_عقاري',
  '#مسوق_عقاري',
  '#عروض_عقارية',
  '#السوق_العقاري',
  '#تسويق_عقاري',
  '#realestate',
  '#property',
  '#investment',
  '#riyadh',
  '#jeddah',
  '#saudiarabia',
];