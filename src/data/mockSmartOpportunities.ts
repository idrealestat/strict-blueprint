/**
 * ⚠️ ملف محمي - لا تعدل بدون إذن المستخدم ⚠️
 * mockSmartOpportunities.ts
 * بيانات وهمية للفرص الذكية - للتجربة والعرض
 * 
 * هذه البيانات تُستخدم لعرض آلية عمل الفرص الذكية:
 * 1. تظهر كفرص قابلة للسحب (Swipe)
 * 2. عند القبول تنتقل إلى صفحة "العروض والطلبات"
 * 3. عند الرفض مرتين تختفي نهائياً
 */

import type { SmartOpportunity } from '@/components/smart-opportunities/SwipeableOpportunityCard';

// صور وهمية للعقارات
const mockImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
];

/**
 * بيانات الفرص الذكية الوهمية
 * تحاكي التطابق بين عروض الوسيط الحالي وعروض/طلبات الوسطاء الآخرين
 */
export const mockSmartOpportunities: SmartOpportunity[] = [
  // الفرصة 1: عرض فيلا في الرياض - حي النرجس
  {
    id: 'mock-opp-1',
    type: 'offer_to_request',
    similarity_score: 92,
    matched_features: ['same_city', 'same_district', 'same_property_type', 'price_close', 'bedrooms_match'],
    owner_item: {
      id: 'my-listing-1',
      title: 'طلب شراء فيلا في حي النرجس',
      property_type: 'فيلا',
      city: 'الرياض',
      district: 'النرجس',
      price: 2800000,
      area: 400,
      bedrooms: 5,
      bathrooms: 4,
      description: 'أبحث عن فيلا مودرن في حي النرجس بمواصفات عالية',
    },
    other_item: {
      id: 'other-listing-1',
      title: 'فيلا فاخرة للبيع في حي النرجس',
      property_type: 'فيلا',
      city: 'الرياض',
      district: 'النرجس',
      price: 2750000,
      area: 420,
      bedrooms: 5,
      bathrooms: 5,
      description: 'فيلا مودرن تشطيب سوبر ديلوكس، مسبح خاص، حديقة كبيرة، قريبة من الخدمات',
      images: [mockImages[0], mockImages[1], mockImages[2]],
    },
    other_broker: {
      name: 'أحمد محمد العتيبي',
      phone: '0555123456',
      whatsapp: '966555123456',
      fal_license: 'FAL-1234567890',
    },
  },
  
  // الفرصة 2: شقة في جدة - حي الحمراء
  {
    id: 'mock-opp-2',
    type: 'request_to_offer',
    similarity_score: 85,
    matched_features: ['same_city', 'same_district', 'same_property_type', 'area_close'],
    owner_item: {
      id: 'my-listing-2',
      title: 'شقة للبيع في حي الحمراء',
      property_type: 'شقة',
      city: 'جدة',
      district: 'الحمراء',
      price: 850000,
      area: 180,
      bedrooms: 3,
      bathrooms: 2,
      description: 'شقة تمليك ممتازة في موقع مميز',
    },
    other_item: {
      id: 'other-request-2',
      title: 'مطلوب شقة تمليك في الحمراء',
      property_type: 'شقة',
      city: 'جدة',
      district: 'الحمراء',
      price: 900000,
      area: 170,
      bedrooms: 3,
      bathrooms: 2,
      description: 'عميل يبحث عن شقة تمليك بمواصفات جيدة، الميزانية مرنة',
      images: [mockImages[3]],
    },
    other_broker: {
      name: 'فهد سعد الغامدي',
      phone: '0566789012',
      whatsapp: '966566789012',
      fal_license: 'FAL-9876543210',
    },
  },

  // الفرصة 3: أرض في الدمام
  {
    id: 'mock-opp-3',
    type: 'offer_to_request',
    similarity_score: 78,
    matched_features: ['same_city', 'same_property_type', 'price_close', 'area_close'],
    owner_item: {
      id: 'my-listing-3',
      title: 'طلب شراء أرض سكنية في الدمام',
      property_type: 'أرض',
      city: 'الدمام',
      district: 'الشاطئ',
      price: 1500000,
      area: 600,
      description: 'أبحث عن أرض سكنية بموقع مميز',
    },
    other_item: {
      id: 'other-listing-3',
      title: 'أرض سكنية للبيع - الدمام',
      property_type: 'أرض',
      city: 'الدمام',
      district: 'الفيصلية',
      price: 1450000,
      area: 580,
      description: 'أرض سكنية بصك إلكتروني، شارعين، قريبة من الكورنيش',
      images: [mockImages[4]],
    },
    other_broker: {
      name: 'خالد عبدالله الدوسري',
      phone: '0577345678',
      whatsapp: '966577345678',
      fal_license: 'FAL-5555666677',
    },
  },

  // الفرصة 4: عمارة استثمارية في مكة
  {
    id: 'mock-opp-4',
    type: 'offer_to_request',
    similarity_score: 88,
    matched_features: ['same_city', 'same_property_type', 'price_close'],
    owner_item: {
      id: 'my-listing-4',
      title: 'طلب عمارة استثمارية في مكة',
      property_type: 'عمارة',
      city: 'مكة المكرمة',
      district: 'العزيزية',
      price: 8000000,
      area: 800,
      description: 'مستثمر يبحث عن عمارة بدخل جيد',
    },
    other_item: {
      id: 'other-listing-4',
      title: 'عمارة استثمارية للبيع - العزيزية',
      property_type: 'عمارة',
      city: 'مكة المكرمة',
      district: 'العزيزية',
      price: 7800000,
      area: 750,
      description: 'عمارة 12 شقة مؤجرة بالكامل، دخل سنوي 600 ألف',
      images: [mockImages[1], mockImages[2]],
    },
    other_broker: {
      name: 'سلطان محمد القحطاني',
      phone: '0588901234',
      whatsapp: '966588901234',
      fal_license: 'FAL-7777888899',
    },
  },

  // الفرصة 5: دوبلكس في الخبر
  {
    id: 'mock-opp-5',
    type: 'request_to_offer',
    similarity_score: 72,
    matched_features: ['same_city', 'same_property_type', 'bedrooms_match'],
    owner_item: {
      id: 'my-listing-5',
      title: 'دوبلكس للبيع في الخبر',
      property_type: 'دوبلكس',
      city: 'الخبر',
      district: 'العقربية',
      price: 1800000,
      area: 300,
      bedrooms: 4,
      bathrooms: 3,
      description: 'دوبلكس فاخر بتشطيبات عالية',
    },
    other_item: {
      id: 'other-request-5',
      title: 'مطلوب دوبلكس في الخبر',
      property_type: 'دوبلكس',
      city: 'الخبر',
      district: 'الراكة',
      price: 2000000,
      area: 350,
      bedrooms: 4,
      bathrooms: 4,
      description: 'عميل جاد يبحث عن دوبلكس مودرن، الدفع كاش',
      images: [mockImages[0]],
    },
    other_broker: {
      name: 'ماجد علي الشمري',
      phone: '0599567890',
      whatsapp: '966599567890',
      fal_license: 'FAL-3333444455',
    },
  },
];

/**
 * دالة للحصول على فرص وهمية مفلترة
 */
export function getMockOpportunitiesByCity(city?: string): SmartOpportunity[] {
  if (!city) return mockSmartOpportunities;
  return mockSmartOpportunities.filter(opp => 
    opp.owner_item.city === city || opp.other_item.city === city
  );
}

/**
 * دالة للحصول على فرص وهمية حسب النوع
 */
export function getMockOpportunitiesByType(type: 'offer_to_request' | 'request_to_offer'): SmartOpportunity[] {
  return mockSmartOpportunities.filter(opp => opp.type === type);
}

/**
 * دالة للحصول على فرص وهمية بنسبة تطابق معينة
 */
export function getMockOpportunitiesByScore(minScore: number): SmartOpportunity[] {
  return mockSmartOpportunities.filter(opp => opp.similarity_score >= minScore);
}
