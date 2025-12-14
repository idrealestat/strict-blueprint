/**
 * floodZonesData.ts
 * بيانات مناطق المخاطر (السيول) - وساطه AI
 * حرفياً من SPATIAL_INTELLIGENCE_INTEGRATION
 * ملاحظة: بيانات افتراضية - يجب استبدالها ببيانات رسمية
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

export interface FloodZone {
  id: string;
  name: string;
  city: string;
  risk_level: 'high' | 'medium' | 'low';
  coordinates: [number, number][]; // Polygon coordinates [lng, lat][]
  description: string;
}

// بيانات مناطق السيول
export const floodZonesData: FloodZone[] = [
  // === الرياض ===
  {
    id: 'riyadh_wadi_hanifa',
    name: 'وادي حنيفة',
    city: 'الرياض',
    risk_level: 'high',
    coordinates: [
      [46.6200, 24.6000],
      [46.6400, 24.6200],
      [46.6500, 24.6500],
      [46.6300, 24.6700],
      [46.6100, 24.6500],
      [46.6200, 24.6000],
    ],
    description: 'منطقة وادي حنيفة - خطر سيول مرتفع في موسم الأمطار',
  },
  {
    id: 'riyadh_south',
    name: 'جنوب الرياض',
    city: 'الرياض',
    risk_level: 'medium',
    coordinates: [
      [46.7000, 24.5500],
      [46.7500, 24.5500],
      [46.7500, 24.6000],
      [46.7000, 24.6000],
      [46.7000, 24.5500],
    ],
    description: 'منطقة جنوب الرياض - خطر سيول متوسط',
  },
  {
    id: 'riyadh_east',
    name: 'شرق الرياض',
    city: 'الرياض',
    risk_level: 'low',
    coordinates: [
      [46.8000, 24.7000],
      [46.8500, 24.7000],
      [46.8500, 24.7500],
      [46.8000, 24.7500],
      [46.8000, 24.7000],
    ],
    description: 'منطقة شرق الرياض - خطر سيول منخفض',
  },

  // === جدة ===
  {
    id: 'jeddah_south',
    name: 'جنوب جدة',
    city: 'جدة',
    risk_level: 'high',
    coordinates: [
      [39.1000, 21.4000],
      [39.1500, 21.4000],
      [39.1500, 21.4500],
      [39.1000, 21.4500],
      [39.1000, 21.4000],
    ],
    description: 'منطقة جنوب جدة - خطر سيول مرتفع (كارثة 2009/2011)',
  },
  {
    id: 'jeddah_east',
    name: 'شرق جدة',
    city: 'جدة',
    risk_level: 'medium',
    coordinates: [
      [39.2000, 21.5000],
      [39.2500, 21.5000],
      [39.2500, 21.5500],
      [39.2000, 21.5500],
      [39.2000, 21.5000],
    ],
    description: 'منطقة شرق جدة - خطر سيول متوسط',
  },

  // === الدمام ===
  {
    id: 'dammam_coastal',
    name: 'ساحل الدمام',
    city: 'الدمام',
    risk_level: 'low',
    coordinates: [
      [50.0500, 26.3500],
      [50.1000, 26.3500],
      [50.1000, 26.4000],
      [50.0500, 26.4000],
      [50.0500, 26.3500],
    ],
    description: 'منطقة ساحل الدمام - خطر فيضان ساحلي منخفض',
  },
];

// تحويل البيانات إلى GeoJSON
export const floodZonesGeoJSON: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: floodZonesData.map((zone) => ({
    type: 'Feature' as const,
    id: zone.id,
    properties: {
      id: zone.id,
      name: zone.name,
      city: zone.city,
      risk_level: zone.risk_level,
      description: zone.description,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [zone.coordinates],
    },
  })),
};

// دالة للتحقق إذا كانت نقطة داخل منطقة سيول
export function isPointInFloodZone(lng: number, lat: number): FloodZone | null {
  for (const zone of floodZonesData) {
    if (isPointInPolygon([lng, lat], zone.coordinates)) {
      return zone;
    }
  }
  return null;
}

// دالة بسيطة للتحقق إذا كانت نقطة داخل polygon
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// ألوان مستويات الخطر
export const riskLevelColors: Record<FloodZone['risk_level'], string> = {
  high: '#ef4444',    // أحمر
  medium: '#f59e0b',  // برتقالي
  low: '#22c55e',     // أخضر
};

// تسميات مستويات الخطر
export const riskLevelLabels: Record<FloodZone['risk_level'], string> = {
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
};

// أيقونات مستويات الخطر
export const riskLevelIcons: Record<FloodZone['risk_level'], string> = {
  high: '🔴',
  medium: '🟠',
  low: '🟢',
};
