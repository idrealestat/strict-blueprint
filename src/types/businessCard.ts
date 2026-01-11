/**
 * BusinessCard Data Types - Single Source of Truth
 * واجهة بيانات البطاقة الموحدة
 */

export interface BusinessCardSourceOfTruth {
  // Core Identity
  name: string;
  title: string;
  companyName: string;
  rating: number;
  
  // Contact Info
  phone: string;
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
}

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
  
  return `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
N:${data.name};;;
ORG:${data.companyName || ''}
TITLE:${data.title || 'وسيط عقاري معتمد'}
TEL;TYPE=CELL:${data.phone || ''}
EMAIL:${data.email || ''}
ADR;TYPE=WORK:;;${data.city || ''};;;
URL:${url}
END:VCARD`;
}
