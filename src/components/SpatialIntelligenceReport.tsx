/**
 * SpatialIntelligenceReport.tsx
 * تقرير الذكاء المكاني - وساطه AI
 * حرفياً من SPATIAL_INTELLIGENCE_INTEGRATION
 */

import React from 'react';
import { X, MapPin, School, Hospital, Building2, Fuel, ShoppingBag, Trees, AlertTriangle, Sparkles, TrendingUp, Home, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { SpatialAnalysisOutput, NearestAmenityResult } from '@/utils/spatialIntelligence';
import { amenityIcons, amenityLabels } from './map/amenitiesData';
import { riskLevelColors, riskLevelLabels, riskLevelIcons } from './map/floodZonesData';

interface SpatialIntelligenceReportProps {
  report: SpatialAnalysisOutput;
  onClose: () => void;
}

export function SpatialIntelligenceReport({ report, onClose }: SpatialIntelligenceReportProps) {
  const {
    attractiveness_score,
    suggested_use,
    ai_comment,
    spatial_context,
    proximity,
    risk,
    coordinates,
  } = report;

  // تحديد لون النتيجة
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getProgressColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // أيقونة الخدمة
  const getAmenityIcon = (type: string) => {
    switch (type) {
      case 'school': return <School className="w-4 h-4" />;
      case 'hospital': return <Hospital className="w-4 h-4" />;
      case 'mosque': return <Building2 className="w-4 h-4" />;
      case 'fuel': return <Fuel className="w-4 h-4" />;
      case 'mall': return <ShoppingBag className="w-4 h-4" />;
      case 'park': return <Trees className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  // عرض خدمة واحدة
  const renderAmenity = (amenity: NearestAmenityResult | undefined, label: string) => {
    if (!amenity) return null;
    
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center gap-2">
          {getAmenityIcon(amenity.type)}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-600">{amenity.name}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{amenity.distance_m} م</span>
            {amenity.walk_min && <span>• {amenity.walk_min} دقيقة مشياً</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-xl border-2 border-[#D4AF37] overflow-hidden" dir="rtl">
      {/* Header */}
      <CardHeader className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <CardTitle className="text-lg">تقرير الذكاء المكاني</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-white/80 mt-1">تحليل وساطه AI</p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* درجة الجاذبية */}
        <div className={`rounded-xl p-4 ${getScoreBgColor(attractiveness_score)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">درجة الجاذبية العقارية</span>
            <span className={`text-3xl font-bold ${getScoreColor(attractiveness_score)}`}>
              {attractiveness_score}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(attractiveness_score)}`}
              style={{ width: `${attractiveness_score}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">{suggested_use}</p>
        </div>

        {/* تعليق وساطه AI */}
        <div className="bg-gradient-to-l from-[#fffef7] to-white border border-[#D4AF37]/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-full bg-[#01411C]">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#01411C] mb-1">تعليق وساطه AI</p>
              <p className="text-sm text-gray-700">{ai_comment}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* السياق العمراني */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#01411C]" />
            السياق العمراني
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">الكثافة</p>
              <p className="text-sm font-bold text-gray-800">
                {spatial_context.density.category === 'low' && 'منخفضة'}
                {spatial_context.density.category === 'medium' && 'متوسطة'}
                {spatial_context.density.category === 'high' && 'عالية'}
              </p>
              <p className="text-xs text-gray-500">{spatial_context.density.count} مبنى</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">الشكل</p>
              <p className="text-sm font-bold text-gray-800">
                {spatial_context.shape.shape === 'compact' && 'متراص'}
                {spatial_context.shape.shape === 'regular' && 'منتظم'}
                {spatial_context.shape.shape === 'irregular' && 'غير منتظم'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">المساحة</p>
              <p className="text-sm font-bold text-gray-800">
                {spatial_context.shape.area_m2 > 0 
                  ? `${spatial_context.shape.area_m2} م²` 
                  : 'غير محدد'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* قرب الخدمات */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#01411C]" />
            قرب الخدمات
          </h4>
          <div className="space-y-1">
            {renderAmenity(proximity.school, '🏫 مدرسة')}
            {renderAmenity(proximity.hospital, '🏥 مستشفى')}
            {renderAmenity(proximity.mosque, '🕌 مسجد')}
            {renderAmenity(proximity.fuel, '⛽ محطة وقود')}
            {renderAmenity(proximity.mall, '🛍️ مول')}
            {renderAmenity(proximity.park, '🌳 حديقة')}
          </div>
        </div>

        <Separator />

        {/* تقييم المخاطر */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#01411C]" />
            تقييم المخاطر
          </h4>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <span className="text-sm">خطر السيول</span>
            <Badge
              style={{
                backgroundColor: risk.flood === 'none' 
                  ? '#22c55e' 
                  : riskLevelColors[risk.flood as keyof typeof riskLevelColors],
                color: 'white',
              }}
            >
              {risk.flood === 'none' ? '🟢 لا يوجد' : `${riskLevelIcons[risk.flood as keyof typeof riskLevelIcons]} ${riskLevelLabels[risk.flood as keyof typeof riskLevelLabels]}`}
            </Badge>
          </div>
          {risk.flood_zone && (
            <p className="text-xs text-gray-500 mt-2">
              {risk.flood_zone.description}
            </p>
          )}
        </div>

        {/* الإحداثيات */}
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">الإحداثيات</p>
          <p className="text-sm font-mono text-gray-700">
            {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-400">
            تم التحليل بواسطة وساطه AI • {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default SpatialIntelligenceReport;
