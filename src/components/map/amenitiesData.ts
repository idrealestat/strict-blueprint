/**
 * amenitiesData.ts
 * بيانات الخدمات والمرافق - وساطه AI
 * حرفياً من SPATIAL_INTELLIGENCE_INTEGRATION
 */

// GeoJSON Types
export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  properties: Record<string, any>;
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString' | 'MultiPoint' | 'MultiPolygon' | 'MultiLineString';
    coordinates: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface Amenity {
  type: 'school' | 'hospital' | 'mosque' | 'fuel' | 'mall' | 'park';
  name: string;
  name_en: string;
  city: string;
  coordinates: [number, number]; // [lng, lat]
}

// بيانات الخدمات في المدن الرئيسية
export const amenitiesData: Amenity[] = [
  // === الرياض ===
  // مدارس
  { type: 'school', name: 'مدارس الرياض النموذجية', name_en: 'Riyadh Model Schools', city: 'الرياض', coordinates: [46.6753, 24.7136] },
  { type: 'school', name: 'مدارس المملكة', name_en: 'Kingdom Schools', city: 'الرياض', coordinates: [46.7020, 24.7300] },
  { type: 'school', name: 'مدارس التربية النموذجية', name_en: 'Model Education Schools', city: 'الرياض', coordinates: [46.6500, 24.6900] },
  
  // مستشفيات
  { type: 'hospital', name: 'مستشفى الملك فيصل التخصصي', name_en: 'King Faisal Specialist Hospital', city: 'الرياض', coordinates: [46.6880, 24.6720] },
  { type: 'hospital', name: 'مستشفى الملك خالد الجامعي', name_en: 'King Khalid University Hospital', city: 'الرياض', coordinates: [46.7100, 24.7200] },
  
  // مساجد
  { type: 'mosque', name: 'مسجد الراجحي', name_en: 'Al-Rajhi Mosque', city: 'الرياض', coordinates: [46.7050, 24.6300] },
  { type: 'mosque', name: 'جامع الملك خالد', name_en: 'King Khalid Mosque', city: 'الرياض', coordinates: [46.6800, 24.7000] },
  
  // محطات وقود
  { type: 'fuel', name: 'محطة أرامكو - العليا', name_en: 'Aramco Station - Olaya', city: 'الرياض', coordinates: [46.6900, 24.7100] },
  { type: 'fuel', name: 'محطة بترومين - النخيل', name_en: 'Petromin Station - Nakheel', city: 'الرياض', coordinates: [46.6600, 24.7400] },
  
  // مولات
  { type: 'mall', name: 'الرياض بارك', name_en: 'Riyadh Park', city: 'الرياض', coordinates: [46.6200, 24.7800] },
  { type: 'mall', name: 'بانوراما مول', name_en: 'Panorama Mall', city: 'الرياض', coordinates: [46.6700, 24.7500] },
  
  // حدائق
  { type: 'park', name: 'حديقة الملك عبدالله', name_en: 'King Abdullah Park', city: 'الرياض', coordinates: [46.6950, 24.7050] },

  // === جدة ===
  // مدارس
  { type: 'school', name: 'مدارس دار الحكمة', name_en: 'Dar Al-Hekma Schools', city: 'جدة', coordinates: [39.1568, 21.5433] },
  { type: 'school', name: 'المدرسة البريطانية الدولية', name_en: 'British International School', city: 'جدة', coordinates: [39.1200, 21.5600] },
  
  // مستشفيات
  { type: 'hospital', name: 'مستشفى الملك فهد', name_en: 'King Fahd Hospital', city: 'جدة', coordinates: [39.1700, 21.4800] },
  { type: 'hospital', name: 'مستشفى الدكتور سليمان فقيه', name_en: 'Dr. Sulaiman Fakeeh Hospital', city: 'جدة', coordinates: [39.1400, 21.5200] },
  
  // مساجد
  { type: 'mosque', name: 'مسجد الملك سعود', name_en: 'King Saud Mosque', city: 'جدة', coordinates: [39.1650, 21.5000] },
  
  // محطات وقود
  { type: 'fuel', name: 'محطة النفط السعودية', name_en: 'Saudi Oil Station', city: 'جدة', coordinates: [39.1500, 21.5100] },

  // === الدمام ===
  // مدارس
  { type: 'school', name: 'مدارس الظهران الأهلية', name_en: 'Dhahran Ahliyya Schools', city: 'الدمام', coordinates: [50.1033, 26.4207] },
  
  // مستشفيات
  { type: 'hospital', name: 'مستشفى الملك فهد الجامعي', name_en: 'King Fahd University Hospital', city: 'الدمام', coordinates: [50.0800, 26.4000] },
  
  // مساجد
  { type: 'mosque', name: 'جامع الراشد', name_en: 'Al-Rashid Mosque', city: 'الدمام', coordinates: [50.1100, 26.4300] },
  
  // محطات وقود
  { type: 'fuel', name: 'محطة أرامكو - الدمام', name_en: 'Aramco Station - Dammam', city: 'الدمام', coordinates: [50.0900, 26.4100] },

  // === الخبر ===
  // مدارس
  { type: 'school', name: 'مدارس الخبر النموذجية', name_en: 'Khobar Model Schools', city: 'الخبر', coordinates: [50.2083, 26.2172] },
  
  // مستشفيات
  { type: 'hospital', name: 'مستشفى سعد التخصصي', name_en: 'Saad Specialist Hospital', city: 'الخبر', coordinates: [50.2000, 26.2300] },
  
  // محطات وقود
  { type: 'fuel', name: 'محطة الراجحي - الخبر', name_en: 'Al-Rajhi Station - Khobar', city: 'الخبر', coordinates: [50.1900, 26.2100] },
];

// تحويل البيانات إلى GeoJSON
export const amenitiesGeoJSON: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: amenitiesData.map((amenity, index) => ({
    type: 'Feature' as const,
    id: index,
    properties: {
      type: amenity.type,
      name: amenity.name,
      name_en: amenity.name_en,
      city: amenity.city,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: amenity.coordinates,
    },
  })),
};

// دالة للحصول على الخدمات حسب النوع
export function getAmenitiesByType(type: Amenity['type']): Amenity[] {
  return amenitiesData.filter(a => a.type === type);
}

// دالة للحصول على الخدمات حسب المدينة
export function getAmenitiesByCity(city: string): Amenity[] {
  return amenitiesData.filter(a => a.city === city);
}

// أيقونات الخدمات
export const amenityIcons: Record<Amenity['type'], string> = {
  school: '🏫',
  hospital: '🏥',
  mosque: '🕌',
  fuel: '⛽',
  mall: '🛍️',
  park: '🌳',
};

// تسميات الخدمات
export const amenityLabels: Record<Amenity['type'], string> = {
  school: 'مدرسة',
  hospital: 'مستشفى',
  mosque: 'مسجد',
  fuel: 'محطة وقود',
  mall: 'مول',
  park: 'حديقة',
};
