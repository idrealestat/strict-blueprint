// أنواع نظام الوصف الذكي بالذكاء الاصطناعي

export interface PropertyFeatures {
  // المدخل والموقع
  entrances?: 'مدخلين' | 'مدخل واحد' | 'ثلاث مداخل أو أكثر' | string;
  position?: 'زاوية' | 'بطن';
  cornerType?: string; // زاوية / بطن
  level?: 'أرضي' | 'علوي';
  floorNumber?: number; // رقم الدور
  hasAnnex?: boolean; // ملحق
  
  // غرف إضافية ومميزات حديثة
  hasMaidRoom?: boolean; // غرفة خادمة
  hasLaundryRoom?: boolean; // غرفة غسيل
  hasJacuzzi?: boolean; // جاكوزي
  hasRainShower?: boolean; // دش مطري
  isSmartHome?: boolean; // سمارت هوم
  hasSmartEntry?: boolean; // دخول ذكي
  
  // الغرف والمساحات
  bedrooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  councils?: number;
  storageRooms?: number; // مستودعات
  warehouses?: number; // مستودعات
  balconies?: number; // بلكونات
  curtains?: number; // ستائر
  airConditioners?: number; // مكيفات
  parkingSpaces?: number; // موقف خاص
  floors?: number; // الأدوار
  
  // المرافق
  hasPool?: boolean; // مسبح
  hasPlayground?: boolean; // مساحة ألعاب أطفال
  hasGarden?: boolean; // حديقة
  hasElevator?: boolean; // مصعد
  hasExternalMajlis?: boolean; // مجلس خارجي
  hasPrivateRoof?: boolean; // سطح خاص
  
  // المطبخ والأثاث
  isFurnished?: boolean; // مؤثث
  hasBuiltInKitchen?: boolean; // مطبخ راكب
  kitchenWithAppliances?: boolean; // مطبخ بالأجهزة
  kitchenAppliances?: string[]; // قائمة الأجهزة
  hasExtraKitchen?: boolean; // مطبخ إضافي
  extraKitchenAppliances?: string; // أجهزة المطبخ الإضافي
  
  // مميزات إضافية
  area?: number;
  propertyAge?: number;
  streetWidth?: number;
  facade?: string;
  furnishing?: string;
  category?: string;
  customFeatures?: string[];
  warranties?: { type: string; duration: string }[];
}

export interface AIDescriptionRequest {
  mode: 'sale' | 'rent' | 'buy-request' | 'rent-request';
  city?: string;
  district?: string;
  type?: string;
  features?: PropertyFeatures;
  price?: number;
  style?: 'احترافي' | 'تسويقي' | 'فاخر';
  length?: 'قصير' | 'متوسط' | 'طويل';
  language?: 'عربي' | 'انجليزي' | 'عربي انجليزي';
}

export interface AIDescriptionResponse {
  title: string;
  description: string;
  suggestions: string[];
  neighborhoods: string[];
  titleSuggestions?: string[]; // عناوين مقترحة متعددة
}

export type AIDescriptionMode = 'sale' | 'rent' | 'buy-request' | 'rent-request';
