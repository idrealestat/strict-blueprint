/**
 * spatialIntelligence.ts
 * نظام الذكاء المكاني - وساطه AI
 * حرفياً من SPATIAL_INTELLIGENCE_INTEGRATION
 */

import { amenitiesData, type Amenity, type GeoJSONFeature, type GeoJSONFeatureCollection } from '../components/map/amenitiesData';
import { floodZonesData, isPointInFloodZone, type FloodZone } from '../components/map/floodZonesData';

// === الواجهات ===

export interface SpatialAnalysisInput {
  lng: number;
  lat: number;
  buildingsData?: GeoJSONFeatureCollection;
  amenitiesData?: GeoJSONFeatureCollection;
  floodZonesData?: GeoJSONFeatureCollection;
}

export interface NearestAmenityResult {
  name: string;
  name_en: string;
  distance_m: number;
  walk_min?: number;
  drive_min?: number;
  type: Amenity['type'];
}

export interface DensityResult {
  count: number;
  category: 'low' | 'medium' | 'high';
  density: number; // buildings per km²
}

export interface ShapeAnalysis {
  shape: 'compact' | 'regular' | 'irregular';
  area_m2: number;
}

export interface RiskAssessment {
  flood: 'none' | 'low' | 'medium' | 'high';
  flood_zone?: FloodZone;
}

export interface ProximityAnalysis {
  school?: NearestAmenityResult;
  hospital?: NearestAmenityResult;
  mosque?: NearestAmenityResult;
  fuel?: NearestAmenityResult;
  mall?: NearestAmenityResult;
  park?: NearestAmenityResult;
}

export interface SpatialContext {
  density: DensityResult;
  shape: ShapeAnalysis;
}

export interface SpatialAnalysisOutput {
  attractiveness_score: number; // 0-100
  suggested_use: string;
  ai_comment: string;
  spatial_context: SpatialContext;
  proximity: ProximityAnalysis;
  risk: RiskAssessment;
  coordinates: { lng: number; lat: number };
  timestamp: string;
}

// === الدوال الأساسية ===

/**
 * حساب المسافة بين نقطتين (بالمتر)
 * Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // نصف قطر الأرض بالمتر
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Snapping للمباني (حد 500 متر)
 */
export function snapToNearestBuilding(
  lng: number,
  lat: number,
  buildingsData?: GeoJSONFeatureCollection,
  maxDistance: number = 500
): { lng: number; lat: number; snapped: boolean; building?: GeoJSONFeature } {
  if (!buildingsData || !buildingsData.features.length) {
    return { lng, lat, snapped: false };
  }

  let nearestBuilding: GeoJSONFeature | null = null;
  let nearestDistance = Infinity;
  let nearestPoint: [number, number] = [lng, lat];

  for (const feature of buildingsData.features) {
    if (feature.geometry.type === 'Point') {
      const [bLng, bLat] = feature.geometry.coordinates as [number, number];
      const distance = calculateDistance(lat, lng, bLat, bLng);
      
      if (distance < nearestDistance && distance <= maxDistance) {
        nearestDistance = distance;
        nearestBuilding = feature;
        nearestPoint = [bLng, bLat];
      }
    } else if (feature.geometry.type === 'Polygon') {
      // حساب مركز الـ polygon
      const coords = feature.geometry.coordinates[0] as [number, number][];
      const center = getCentroid(coords);
      const distance = calculateDistance(lat, lng, center[1], center[0]);
      
      if (distance < nearestDistance && distance <= maxDistance) {
        nearestDistance = distance;
        nearestBuilding = feature;
        nearestPoint = center;
      }
    }
  }

  if (nearestBuilding) {
    return {
      lng: nearestPoint[0],
      lat: nearestPoint[1],
      snapped: true,
      building: nearestBuilding,
    };
  }

  return { lng, lat, snapped: false };
}

/**
 * حساب مركز polygon
 */
function getCentroid(coords: [number, number][]): [number, number] {
  let sumLng = 0;
  let sumLat = 0;
  
  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }
  
  return [sumLng / coords.length, sumLat / coords.length];
}

/**
 * إيجاد أقرب خدمة
 */
export function nearestAmenity(
  lng: number,
  lat: number,
  type: Amenity['type']
): NearestAmenityResult | null {
  const amenitiesOfType = amenitiesData.filter(a => a.type === type);
  
  if (amenitiesOfType.length === 0) {
    return null;
  }

  let nearest: Amenity | null = null;
  let nearestDistance = Infinity;

  for (const amenity of amenitiesOfType) {
    const distance = calculateDistance(lat, lng, amenity.coordinates[1], amenity.coordinates[0]);
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = amenity;
    }
  }

  if (!nearest) {
    return null;
  }

  const result: NearestAmenityResult = {
    name: nearest.name,
    name_en: nearest.name_en,
    distance_m: Math.round(nearestDistance),
    type: nearest.type,
  };

  // حساب وقت المشي (5 كم/ساعة = 83 متر/دقيقة)
  if (nearestDistance <= 2000) {
    result.walk_min = Math.round(nearestDistance / 83);
  }
  
  // حساب وقت القيادة (40 كم/ساعة = 667 متر/دقيقة)
  result.drive_min = Math.max(1, Math.round(nearestDistance / 667));

  return result;
}

/**
 * حساب الكثافة العمرانية
 */
export function computeDensity(
  lng: number,
  lat: number,
  buildingsData?: GeoJSONFeatureCollection,
  radius: number = 500
): DensityResult {
  if (!buildingsData || !buildingsData.features.length) {
    return { count: 0, category: 'low', density: 0 };
  }

  let count = 0;

  for (const feature of buildingsData.features) {
    let featureLng: number, featureLat: number;
    
    if (feature.geometry.type === 'Point') {
      [featureLng, featureLat] = feature.geometry.coordinates as [number, number];
    } else if (feature.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates[0] as [number, number][];
      [featureLng, featureLat] = getCentroid(coords);
    } else {
      continue;
    }

    const distance = calculateDistance(lat, lng, featureLat, featureLng);
    
    if (distance <= radius) {
      count++;
    }
  }

  // حساب الكثافة (مباني لكل كيلومتر مربع)
  const areaKm2 = Math.PI * Math.pow(radius / 1000, 2);
  const density = count / areaKm2;

  let category: 'low' | 'medium' | 'high';
  if (density < 500) {
    category = 'low';
  } else if (density < 1500) {
    category = 'medium';
  } else {
    category = 'high';
  }

  return {
    count,
    category,
    density: Math.round(density * 100) / 100,
  };
}

/**
 * تحليل شكل المبنى
 */
export function analyzeShape(building?: GeoJSONFeature): ShapeAnalysis {
  if (!building || building.geometry.type !== 'Polygon') {
    return { shape: 'regular', area_m2: 0 };
  }

  const coords = building.geometry.coordinates[0] as [number, number][];
  
  // حساب المساحة التقريبية
  const area = calculatePolygonArea(coords);
  
  // حساب المحيط
  const perimeter = calculatePolygonPerimeter(coords);
  
  // حساب نسبة الـ compactness (4π × Area / Perimeter²)
  const compactness = (4 * Math.PI * area) / Math.pow(perimeter, 2);

  let shape: 'compact' | 'regular' | 'irregular';
  if (compactness > 0.7) {
    shape = 'compact';
  } else if (compactness > 0.4) {
    shape = 'regular';
  } else {
    shape = 'irregular';
  }

  return {
    shape,
    area_m2: Math.round(area),
  };
}

/**
 * حساب مساحة polygon بالمتر المربع
 */
function calculatePolygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  
  // استخدام صيغة Shoelace مع تحويل للمتر المربع
  let area = 0;
  const n = coords.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // تحويل من درجات² إلى متر² (تقريبي)
  // عند خط عرض 24° تقريباً: 1 درجة ≈ 111 كم
  const metersPerDegree = 111000;
  area = area * Math.pow(metersPerDegree, 2);
  
  return area;
}

/**
 * حساب محيط polygon بالمتر
 */
function calculatePolygonPerimeter(coords: [number, number][]): number {
  let perimeter = 0;
  const n = coords.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += calculateDistance(coords[i][1], coords[i][0], coords[j][1], coords[j][0]);
  }
  
  return perimeter;
}

/**
 * تقييم المخاطر
 */
export function assessRisk(lng: number, lat: number): RiskAssessment {
  const floodZone = isPointInFloodZone(lng, lat);
  
  if (floodZone) {
    return {
      flood: floodZone.risk_level,
      flood_zone: floodZone,
    };
  }
  
  return { flood: 'none' };
}

/**
 * تحليل القرب من الخدمات
 */
export function analyzeProximity(lng: number, lat: number): ProximityAnalysis {
  return {
    school: nearestAmenity(lng, lat, 'school') || undefined,
    hospital: nearestAmenity(lng, lat, 'hospital') || undefined,
    mosque: nearestAmenity(lng, lat, 'mosque') || undefined,
    fuel: nearestAmenity(lng, lat, 'fuel') || undefined,
    mall: nearestAmenity(lng, lat, 'mall') || undefined,
    park: nearestAmenity(lng, lat, 'park') || undefined,
  };
}

/**
 * حساب درجة الجاذبية العقارية (0-100)
 */
export function computeAttractiveness(
  proximity: ProximityAnalysis,
  density: DensityResult,
  risk: RiskAssessment
): number {
  let score = 50; // بداية متوسطة

  // === نقاط القرب من الخدمات ===
  // المدرسة
  if (proximity.school) {
    if (proximity.school.distance_m <= 500) score += 10;
    else if (proximity.school.distance_m <= 1000) score += 7;
    else if (proximity.school.distance_m <= 2000) score += 3;
  }

  // المستشفى
  if (proximity.hospital) {
    if (proximity.hospital.distance_m <= 1000) score += 10;
    else if (proximity.hospital.distance_m <= 3000) score += 5;
  }

  // المسجد
  if (proximity.mosque) {
    if (proximity.mosque.distance_m <= 300) score += 8;
    else if (proximity.mosque.distance_m <= 500) score += 5;
  }

  // محطة الوقود
  if (proximity.fuel) {
    if (proximity.fuel.distance_m <= 1000) score += 5;
  }

  // المول
  if (proximity.mall) {
    if (proximity.mall.distance_m <= 2000) score += 5;
  }

  // الحديقة
  if (proximity.park) {
    if (proximity.park.distance_m <= 500) score += 7;
  }

  // === نقاط الكثافة ===
  if (density.category === 'medium') {
    score += 5; // الكثافة المتوسطة مرغوبة
  } else if (density.category === 'high') {
    score -= 5; // الكثافة العالية جداً قد تكون مزعجة
  }

  // === خصم المخاطر ===
  if (risk.flood === 'high') {
    score -= 25;
  } else if (risk.flood === 'medium') {
    score -= 15;
  } else if (risk.flood === 'low') {
    score -= 5;
  }

  // التأكد من أن النتيجة بين 0 و 100
  return Math.max(0, Math.min(100, score));
}

/**
 * توليد الاستخدام المقترح
 */
function getSuggestedUse(score: number, density: DensityResult): string {
  if (score >= 80) {
    return 'سكني / تجاري فاخر (مرغوب جداً)';
  } else if (score >= 60) {
    if (density.category === 'high') {
      return 'تجاري (كثافة عالية)';
    }
    return 'سكني / تجاري مختلط (مرغوب)';
  } else if (score >= 40) {
    return 'سكني متوسط (يحتاج دراسة)';
  } else {
    return 'يحتاج دراسة معمقة (مخاطر محتملة)';
  }
}

/**
 * توليد تعليق وساطه AI الذكي
 */
function getAIComment(
  score: number,
  proximity: ProximityAnalysis,
  density: DensityResult,
  risk: RiskAssessment
): string {
  const comments: string[] = [];

  if (score >= 80) {
    comments.push('موقع استثنائي! 🌟');
  } else if (score >= 60) {
    comments.push('موقع متميز.');
  } else if (score >= 40) {
    comments.push('موقع مقبول.');
  } else {
    comments.push('موقع يحتاج دراسة إضافية.');
  }

  // تعليق على الخدمات
  const nearServices: string[] = [];
  if (proximity.school && proximity.school.distance_m <= 500) nearServices.push('مدرسة');
  if (proximity.hospital && proximity.hospital.distance_m <= 1000) nearServices.push('مستشفى');
  if (proximity.mosque && proximity.mosque.distance_m <= 300) nearServices.push('مسجد');
  
  if (nearServices.length > 0) {
    comments.push(`خدمات قريبة: ${nearServices.join('، ')}.`);
  }

  // تعليق على الكثافة
  if (density.category === 'medium') {
    comments.push('كثافة عمرانية مثالية.');
  } else if (density.category === 'high') {
    comments.push('كثافة عمرانية عالية - قد تؤثر على الخصوصية.');
  } else {
    comments.push('منطقة هادئة - كثافة منخفضة.');
  }

  // تحذير المخاطر
  if (risk.flood === 'high') {
    comments.push('⚠️ تحذير: منطقة خطر سيول مرتفع!');
  } else if (risk.flood === 'medium') {
    comments.push('⚠️ تنبيه: منطقة خطر سيول متوسط.');
  }

  return comments.join(' ');
}

/**
 * التحليل المكاني الشامل - الدالة الرئيسية
 */
export async function analyzeSpatialIntelligence(
  input: SpatialAnalysisInput
): Promise<SpatialAnalysisOutput> {
  const { lng, lat, buildingsData } = input;

  // 1. حساب الكثافة
  const density = computeDensity(lng, lat, buildingsData);

  // 2. تحليل الشكل (إذا توفر مبنى)
  const snappedResult = snapToNearestBuilding(lng, lat, buildingsData);
  const shape = analyzeShape(snappedResult.building);

  // 3. تحليل القرب من الخدمات
  const proximity = analyzeProximity(lng, lat);

  // 4. تقييم المخاطر
  const risk = assessRisk(lng, lat);

  // 5. حساب درجة الجاذبية
  const attractiveness_score = computeAttractiveness(proximity, density, risk);

  // 6. الاستخدام المقترح
  const suggested_use = getSuggestedUse(attractiveness_score, density);

  // 7. تعليق وساطه AI
  const ai_comment = getAIComment(attractiveness_score, proximity, density, risk);

  return {
    attractiveness_score,
    suggested_use,
    ai_comment,
    spatial_context: {
      density,
      shape,
    },
    proximity,
    risk,
    coordinates: { lng, lat },
    timestamp: new Date().toISOString(),
  };
}

export default analyzeSpatialIntelligence;
