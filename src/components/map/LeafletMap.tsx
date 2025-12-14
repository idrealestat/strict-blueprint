/**
 * LeafletMap.tsx
 * خريطة مجانية باستخدام OpenStreetMap + Leaflet
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapLocation {
  id: string;
  name_ar: string;
  name_en: string | null;
  latitude: number;
  longitude: number;
  location_type: string;
  description: string | null;
  city: string | null;
  district: string | null;
  status: string | null;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  onLocationClick?: (location: MapLocation) => void;
  showLocations?: boolean;
  showRoutes?: boolean;
  className?: string;
}

// ألوان أنواع المواقع
const LOCATION_COLORS: Record<string, string> = {
  customer: '#3B82F6',
  employee: '#10B981',
  branch: '#8B5CF6',
  warehouse: '#F59E0B',
  delivery_point: '#EF4444',
  service_point: '#06B6D4',
  landmark: '#EC4899',
  competitor: '#6B7280',
  potential: '#84CC16',
  property: '#01411C',
};

// إنشاء أيقونة مخصصة
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function LeafletMap({
  center = [24.7136, 46.6753], // الرياض
  zoom = 12,
  onLocationClick,
  showLocations = true,
  showRoutes = true,
  className = '',
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routesRef = useRef<L.LayerGroup | null>(null);
  
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب المواقع من قاعدة البيانات
  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('map_locations')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('خطأ في تحميل المواقع');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب المسارات من قاعدة البيانات
  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('map_routes')
        .select('*');
      
      if (error) throw error;
      
      // رسم المسارات على الخريطة
      if (data && routesRef.current && mapRef.current) {
        routesRef.current.clearLayers();
        
        data.forEach((route) => {
          if (route.path_coordinates && Array.isArray(route.path_coordinates)) {
            const coords = (route.path_coordinates as any[]).map(
              (c: any) => [c.lat, c.lng] as [number, number]
            );
            
            if (coords.length > 0) {
              const polyline = L.polyline(coords, {
                color: '#01411C',
                weight: 4,
                opacity: 0.8,
              });
              
              polyline.bindPopup(`
                <div dir="rtl" style="font-family: Arial, sans-serif;">
                  <strong>${route.name_ar}</strong><br/>
                  <span style="color: gray;">${route.route_type}</span>
                </div>
              `);
              
              routesRef.current?.addLayer(polyline);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // إنشاء الخريطة
    mapRef.current = L.map(mapContainer.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    });

    // إضافة طبقة OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // إضافة أزرار التكبير/التصغير
    L.control.zoom({
      position: 'topleft',
    }).addTo(mapRef.current);

    // إنشاء مجموعات الطبقات
    markersRef.current = L.layerGroup().addTo(mapRef.current);
    routesRef.current = L.layerGroup().addTo(mapRef.current);

    // جلب البيانات
    fetchLocations();
    fetchRoutes();

    // تنظيف عند إزالة المكون
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // إضافة العلامات عند تحميل المواقع
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !showLocations) return;

    markersRef.current.clearLayers();

    locations.forEach((location) => {
      const color = LOCATION_COLORS[location.location_type] || '#01411C';
      const icon = createCustomIcon(color);

      const marker = L.marker([location.latitude, location.longitude], { icon });

      marker.bindPopup(`
        <div dir="rtl" style="font-family: Arial, sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #01411C;">${location.name_ar}</h3>
          ${location.description ? `<p style="margin: 0 0 8px 0; color: gray;">${location.description}</p>` : ''}
          <div style="font-size: 12px; color: #666;">
            ${location.city ? `<span>📍 ${location.city}</span>` : ''}
            ${location.district ? `<span> - ${location.district}</span>` : ''}
          </div>
          <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: flex-end;">
            <button onclick="navigator.clipboard.writeText('${location.latitude}, ${location.longitude}')" style="padding: 4px 8px; background: #01411C; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              نسخ الإحداثيات
            </button>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onLocationClick) {
          onLocationClick(location);
        }
      });

      markersRef.current?.addLayer(marker);
    });
  }, [locations, showLocations, onLocationClick]);

  // إضافة موقع جديد
  const addLocation = async (lat: number, lng: number, name: string, type: string) => {
    try {
      const { data, error } = await supabase
        .from('map_locations')
        .insert({
          name_ar: name,
          latitude: lat,
          longitude: lng,
          location_type: type,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      
      setLocations(prev => [...prev, data]);
      toast.success('تم إضافة الموقع بنجاح');
      return data;
    } catch (error) {
      console.error('Error adding location:', error);
      toast.error('خطأ في إضافة الموقع');
      return null;
    }
  };

  // تحديث مركز الخريطة
  const setMapCenter = (lat: number, lng: number, newZoom?: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], newZoom || zoom);
    }
  };

  // الحصول على موقع المستخدم الحالي
  const goToMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter(latitude, longitude, 15);
          
          // إضافة علامة للموقع الحالي
          if (mapRef.current) {
            const myLocationIcon = L.divIcon({
              className: 'my-location-marker',
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background: #3B82F6;
                  border-radius: 50%;
                  border: 4px solid white;
                  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
                  animation: pulse 2s infinite;
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.marker([latitude, longitude], { icon: myLocationIcon })
              .addTo(mapRef.current)
              .bindPopup('موقعك الحالي');
          }
          
          toast.success('تم تحديد موقعك');
        },
        (error) => {
          toast.error('لم نتمكن من تحديد موقعك');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('المتصفح لا يدعم تحديد الموقع');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#01411C] border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-gray-600">جاري تحميل الخريطة...</p>
          </div>
        </div>
      )}

      {/* CSS للأنيميشن */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        .leaflet-container {
          font-family: Arial, sans-serif;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        
        .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
}

// تصدير الدوال للاستخدام الخارجي
export { createCustomIcon, LOCATION_COLORS };
