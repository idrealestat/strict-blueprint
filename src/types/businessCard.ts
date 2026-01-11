/**
 * BusinessCard Data Types - Single Source of Truth
 * واجهة بيانات البطاقة الموحدة
 */

// Card display options - خيارات عرض البطاقة
export interface CardDisplayOptions {
  // Name display
  nameDisplay: 'arabic' | 'arabic-english';
  nameEnglish?: string;
  
  // Job title
  jobTitle: string;
  
  // Phone display
  phoneDisplay: 'phone-only' | 'phone-whatsapp';
  whatsappNumber?: string;
  primaryNumber: 'phone' | 'whatsapp';
  
  // Optional fields visibility
  showEmail: boolean;
  showCity: boolean;
  showDistrict: boolean;
}

export interface BusinessCardSourceOfTruth {
  // Core Identity
  name: string;
  title: string;
  companyName: string;
  rating: number;
  
  // Contact Info
  phone: string;
  whatsapp?: string;
  email: string;
  
  // Location
  city: string;
  district?: string;
  location?: string;
  
  // Public Link
  slug: string;
  
  // Identity Mode
  identityMode: 'profile' | 'logo';
  profileImageUrl: string | null;
  logoUrl: string | null;
  
  // Additional Fields
  bio?: string;
  falLicense?: string;
  website?: string;
  
  // Display Options
  displayOptions?: CardDisplayOptions;
}

// Default display options
export const defaultDisplayOptions: CardDisplayOptions = {
  nameDisplay: 'arabic',
  nameEnglish: '',
  jobTitle: 'وسيط ومسوق عقاري',
  phoneDisplay: 'phone-only',
  whatsappNumber: '',
  primaryNumber: 'phone',
  showEmail: true,
  showCity: true,
  showDistrict: false,
};

/**
 * Get identity image based on mode
 */
export function getIdentityImage(data: BusinessCardSourceOfTruth): string | null {
  if (data.identityMode === 'logo') {
    return data.logoUrl || data.profileImageUrl || null;
  }
  return data.profileImageUrl || data.logoUrl || null;
}

/**
 * Get fallback initial for avatar
 */
export function getAvatarFallback(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

/**
 * Generate vCard string from business card data
 */
export function generateVCard(data: BusinessCardSourceOfTruth): string {
  const url = `https://wasataai.com/${data.slug}`;
  const displayOptions = data.displayOptions || defaultDisplayOptions;
  const phone = displayOptions.primaryNumber === 'whatsapp' ? (data.whatsapp || data.phone) : data.phone;
  
  return `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
N:${data.name};;;
ORG:${data.companyName || ''}
TITLE:${displayOptions.jobTitle || 'وسيط عقاري معتمد'}
TEL;TYPE=CELL:${phone || ''}
EMAIL:${data.email || ''}
ADR;TYPE=WORK:;;${data.city || ''};;;
URL:${url}
END:VCARD`;
}
