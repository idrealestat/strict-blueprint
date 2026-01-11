/**
 * VisitorsHeatMap.tsx
 * خريطة حرارية لمواقع الزوار مع الذكاء المكاني
 * يستخدم قاعدة البيانات بدلاً من localStorage
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useOfferViewsLog } from '@/hooks/useOfferViewsLog';
import { 
  MapPin, 
  Flame, 
  Users, 
  Globe, 
  RefreshCw, 
  Maximize2,
  TrendingUp,
  Clock,
  Smartphone,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateDistance, analyzeProximity, assessRisk, computeAttractiveness } from '@/utils/spatialIntelligence';

interface VisitorLocation {
  id: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  device: string;
  browser: string;
  timestamp: string;
  offerId: string;
  offerTitle?: string;
  intensity?: number;
}

interface HeatMapStats {
  totalVisitors: number;
  uniqueCities: number;
  topCity: string;
  topDevice: string;
  mobilePercentage: number;
}

interface VisitorsHeatMapProps {
  className?: string;
  onVisitorClick?: (visitor: VisitorLocation) => void;
}

// إحداثيات المدن السعودية الرئيسية
const SAUDI_CITIES: Record<string, [number, number]> = {
  'الرياض': [24.7136, 46.6753],
  'Riyadh': [24.7136, 46.6753],
  'جدة': [21.5433, 39.1728],
  'Jeddah': [21.5433, 39.1728],
  'مكة': [21.4225, 39.8262],
  'Mecca': [21.4225, 39.8262],
  'المدينة': [24.5247, 39.5692],
  'Medina': [24.5247, 39.5692],
  'الدمام': [26.4207, 50.0888],
  'Dammam': [26.4207, 50.0888],
  'الخبر': [26.2172, 50.1971],
  'Khobar': [26.2172, 50.1971],
  'تبوك': [28.3835, 36.5662],
  'Tabuk': [28.3835, 36.5662],
  'أبها': [18.2164, 42.5053],
  'Abha': [18.2164, 42.5053],
};

const VisitorsHeatMap: React.FC<VisitorsHeatMapProps> = ({ 
  className = '', 
  onVisitorClick 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  
  const { logs: dbLogs, loading: isLoading, refetch } = useOfferViewsLog();
  const [visitors, setVisitors] = useState<VisitorLocation[]>([]);
  const [stats, setStats] = useState<HeatMapStats | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [showMarkers, setShowMarkers] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLocation | null>(null);

  // Transform DB logs to visitor locations
  useEffect(() => {
    if (isLoading) return;
    
    const now = new Date();
    
    // فلترة حسب الوقت
    const filtered = dbLogs.filter((log) => {
      if (!log.created_at) return false;
      const logDate = new Date(log.created_at);
      const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      
      switch (timeFilter) {
        case 'today': return diffDays <= 1;
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        default: return true;
      }
    });

    // تحويل إلى مواقع مع إحداثيات
    const visitorLocations: VisitorLocation[] = filtered.map((log, index) => {
      let lat = 24.7136; // الرياض افتراضياً
      let lng = 46.6753;
      
      // محاولة الحصول على الإحداثيات من اسم المدينة
      if (log.city && SAUDI_CITIES[log.city]) {
        [lat, lng] = SAUDI_CITIES[log.city];
        // إضافة بعض التباين العشوائي
        lat += (Math.random() - 0.5) * 0.1;
        lng += (Math.random() - 0.5) * 0.1;
      } else {
        // توزيع عشوائي في السعودية
        lat = 20 + Math.random() * 10;
        lng = 38 + Math.random() * 15;
      }

      return {
        id: `visitor_${index}_${Date.now()}`,
        lat,
        lng,
        city: log.city || undefined,
        country: log.country || 'السعودية',
        device: log.device || 'غير معروف',
        browser: log.browser || 'غير معروف',
        timestamp: log.created_at,
        offerId: log.offer_id,
        offerTitle: log.offer_title || undefined,
        intensity: 1,
      };
    });

    setVisitors(visitorLocations);

    // حساب الإحصائيات
    const cities = new Set(visitorLocations.map(v => v.city).filter(Boolean));
    const cityCount: Record<string, number> = {};
    const deviceCount: Record<string, number> = {};
    let mobileCount = 0;

    visitorLocations.forEach(v => {
      if (v.city) {
        cityCount[v.city] = (cityCount[v.city] || 0) + 1;
      }
      deviceCount[v.device] = (deviceCount[v.device] || 0) + 1;
      if (v.device.includes('هاتف') || v.device.includes('iPhone') || v.device.includes('Android')) {
        mobileCount++;
      }
    });

    const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'غير معروف';
    const topDevice = Object.entries(deviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'غير معروف';

    setStats({
      totalVisitors: visitorLocations.length,
      uniqueCities: cities.size,
      topCity,
      topDevice,
      mobilePercentage: visitorLocations.length > 0 ? Math.round((mobileCount / visitorLocations.length) * 100) : 0,
    });
  }, [dbLogs, isLoading, timeFilter]);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current, {
      center: [24.7136, 46.6753],
      zoom: 6,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'topleft' }).addTo(mapRef.current);

    markersRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // تحميل البيانات عند تغيير الفلتر - البيانات تأتي من useEffect أعلاه

  // تحديث طبقة الحرارة والعلامات
  useEffect(() => {
    if (!mapRef.current) return;

    // إزالة طبقة الحرارة القديمة
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    // إنشاء بيانات الحرارة
    const heatData = visitors.map(v => [v.lat, v.lng, 0.5]);

    // إنشاء طبقة الحرارة باستخدام circles
    if (visitors.length > 0) {
      const heatGroup = L.layerGroup();
      
      // تجميع الزوار حسب الموقع
      const locationGroups: Record<string, VisitorLocation[]> = {};
      visitors.forEach(v => {
        const key = `${Math.round(v.lat * 10) / 10}_${Math.round(v.lng * 10) / 10}`;
        if (!locationGroups[key]) locationGroups[key] = [];
        locationGroups[key].push(v);
      });

      Object.entries(locationGroups).forEach(([key, group]) => {
        const avgLat = group.reduce((sum, v) => sum + v.lat, 0) / group.length;
        const avgLng = group.reduce((sum, v) => sum + v.lng, 0) / group.length;
        const intensity = Math.min(group.length / 5, 1);
        
        // دائرة حرارية
        const circle = L.circleMarker([avgLat, avgLng], {
          radius: 15 + group.length * 5,
          fillColor: `rgba(239, 68, 68, ${0.2 + intensity * 0.4})`,
          fillOpacity: 0.6,
          color: '#EF4444',
          weight: 2,
        });

        circle.bindPopup(`
          <div dir="rtl" style="font-family: Arial, sans-serif; min-width: 150px;">
            <h4 style="margin: 0 0 8px 0; color: #EF4444;">🔥 ${group.length} زائر</h4>
            <p style="margin: 0; color: #666; font-size: 12px;">
              ${group[0]?.city || 'موقع غير معروف'}
            </p>
          </div>
        `);

        heatGroup.addLayer(circle);
      });

      heatGroup.addTo(mapRef.current);
      heatLayerRef.current = heatGroup;
    }

    // تحديث العلامات
    if (markersRef.current) {
      markersRef.current.clearLayers();
      
      if (showMarkers) {
        visitors.slice(0, 100).forEach(visitor => {
          const deviceIcon = visitor.device.includes('هاتف') || visitor.device.includes('iPhone') 
            ? '📱' : '💻';
          
          const marker = L.marker([visitor.lat, visitor.lng], {
            icon: L.divIcon({
              className: 'visitor-marker',
              html: `
                <div style="
                  background: white;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  border: 2px solid #01411C;
                ">${deviceIcon}</div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          });

          const visitTime = new Date(visitor.timestamp).toLocaleString('ar-SA');
          
          marker.bindPopup(`
            <div dir="rtl" style="font-family: Arial, sans-serif; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #01411C;">👁️ مشاهدة عرض</h4>
              ${visitor.offerTitle ? `<p style="margin: 0 0 8px 0; font-weight: bold;">${visitor.offerTitle}</p>` : ''}
              <div style="font-size: 12px; color: #666;">
                <p style="margin: 2px 0;">📍 ${visitor.city || 'غير معروف'}, ${visitor.country}</p>
                <p style="margin: 2px 0;">📱 ${visitor.device}</p>
                <p style="margin: 2px 0;">🌐 ${visitor.browser}</p>
                <p style="margin: 2px 0;">🕐 ${visitTime}</p>
              </div>
            </div>
          `);

          marker.on('click', () => {
            setSelectedVisitor(visitor);
            if (onVisitorClick) onVisitorClick(visitor);
          });

          markersRef.current?.addLayer(marker);
        });
      }
    }
  }, [visitors, showMarkers, onVisitorClick]);

  // تحليل الذكاء المكاني للزائر المحدد
  const spatialAnalysis = useMemo(() => {
    if (!selectedVisitor) return null;
    
    const proximity = analyzeProximity(selectedVisitor.lng, selectedVisitor.lat);
    const risk = assessRisk(selectedVisitor.lng, selectedVisitor.lat);
    const attractiveness = computeAttractiveness(proximity, { count: 0, category: 'medium', density: 0 }, risk);
    
    return { proximity, risk, attractiveness };
  }, [selectedVisitor]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-2 border-gray-100 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-l from-red-50 to-orange-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              خريطة حرارية للزوار
            </CardTitle>

            <div className="flex items-center gap-3">
              {/* فلتر الوقت */}
              <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">أسبوع</SelectItem>
                  <SelectItem value="month">شهر</SelectItem>
                  <SelectItem value="all">الكل</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant={showMarkers ? 'default' : 'outline'}
                onClick={() => setShowMarkers(!showMarkers)}
                className={`h-8 ${showMarkers ? 'bg-[#01411C]' : ''}`}
              >
                <MapPin className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="h-8"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          {stats && (
            <div className="flex gap-4 mt-4 flex-wrap">
              <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {stats.totalVisitors} زائر
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {stats.uniqueCities} مدينة
              </Badge>
              <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                الأكثر: {stats.topCity}
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                {stats.mobilePercentage}% موبايل
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 relative">
          <div 
            ref={mapContainer} 
            className="w-full h-[400px]"
          />

          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-gray-600">جاري تحميل بيانات الزوار...</p>
              </div>
            </div>
          )}

          {/* تحليل الذكاء المكاني للزائر المحدد */}
          {selectedVisitor && spatialAnalysis && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#01411C]" />
                  تحليل موقع الزائر
                </h4>
                <Button size="sm" variant="ghost" onClick={() => setSelectedVisitor(null)}>✕</Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">المدينة:</span>
                  <span className="font-bold mr-2">{selectedVisitor.city || 'غير معروف'}</span>
                </div>
                <div>
                  <span className="text-gray-500">الجهاز:</span>
                  <span className="font-bold mr-2">{selectedVisitor.device}</span>
                </div>
                <div>
                  <span className="text-gray-500">جاذبية الموقع:</span>
                  <span className="font-bold mr-2 text-[#01411C]">{spatialAnalysis.attractiveness}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .visitor-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </motion.div>
  );
};

export default VisitorsHeatMap;
