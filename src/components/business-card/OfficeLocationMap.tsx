import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface AddressDetails {
  city: string;
  district: string;
  street: string;
  nationalAddress: string;
  postalCode: string;
  buildingNumber: string;
  additionalNumber: string;
  latitude: number;
  longitude: number;
}

interface OfficeLocationMapProps {
  onLocationSelect: (lat: number, lng: number, address: AddressDetails) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: AddressDetails | null;
}

export default function OfficeLocationMap({
  onLocationSelect,
  initialLat,
  initialLng,
  initialAddress,
}: OfficeLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [addressDetails, setAddressDetails] = useState<AddressDetails>(
    initialAddress || {
      city: '',
      district: '',
      street: '',
      nationalAddress: '',
      postalCode: '',
      buildingNumber: '',
      additionalNumber: '',
      latitude: initialLat || 24.7136,
      longitude: initialLng || 46.6753,
    }
  );

  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;

        const newAddress: AddressDetails = {
          city: addr.city || addr.town || addr.village || addr.state || '',
          district: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
          street: addr.road || addr.street || '',
          nationalAddress: `${addr.house_number || ''} ${addr.road || ''} ${addr.suburb || ''} ${addr.city || ''}`.trim(),
          postalCode: addr.postcode || '',
          buildingNumber: addr.house_number || '',
          additionalNumber: Math.floor(1000 + Math.random() * 9000).toString(),
          latitude: lat,
          longitude: lng,
        };

        setAddressDetails(newAddress);
        onLocationSelect(lat, lng, newAddress);
        toast.success('تم تحديد الموقع بنجاح');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('فشل في جلب تفاصيل العنوان');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const centerLat = initialLat || 24.7136;
    const centerLng = initialLng || 46.6753;

    mapRef.current = L.map(mapContainer.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add initial marker if coordinates exist
    if (initialLat && initialLng) {
      markerRef.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapRef.current);

      markerRef.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        fetchAddressFromCoordinates(position.lat, position.lng);
      });
    }

    // Add click event
    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (mapRef.current) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);

        markerRef.current.on('dragend', (ev) => {
          const position = ev.target.getLatLng();
          fetchAddressFromCoordinates(position.lat, position.lng);
        });
      }

      fetchAddressFromCoordinates(lat, lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const goToMyLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 17);

            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            } else {
              markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);

              markerRef.current.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                fetchAddressFromCoordinates(pos.lat, pos.lng);
              });
            }

            fetchAddressFromCoordinates(latitude, longitude);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('فشل في الحصول على الموقع الحالي');
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast.error('المتصفح لا يدعم خدمة تحديد الموقع');
    }
  };

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="w-full h-full" />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 z-[1000] gap-1"
          onClick={goToMyLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          موقعي الحالي
        </Button>

        {isLoadingLocation && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[999]">
            <Loader2 className="w-8 h-8 animate-spin text-[#01411C]" />
          </div>
        )}
      </div>

      {/* Address Details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-500">المدينة</Label>
          <Input
            value={addressDetails.city}
            className="mt-1 bg-gray-50"
            readOnly
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">الحي</Label>
          <Input
            value={addressDetails.district}
            className="mt-1 bg-gray-50"
            readOnly
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-gray-500">الشارع</Label>
        <Input
          value={addressDetails.street}
          className="mt-1 bg-gray-50"
          readOnly
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-gray-500">الرقم الإضافي</Label>
          <Input
            value={addressDetails.buildingNumber}
            className="mt-1 bg-gray-50"
            readOnly
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">رقم المبنى</Label>
          <Input
            value={addressDetails.additionalNumber}
            className="mt-1 bg-gray-50"
            readOnly
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">الرمز البريدي</Label>
          <Input
            value={addressDetails.postalCode}
            className="mt-1 bg-gray-50"
            readOnly
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-gray-500">العنوان الوطني</Label>
        <div className="mt-1 p-3 bg-gradient-to-l from-[#01411C]/10 to-[#D4AF37]/10 rounded-lg border border-[#01411C]/20">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#01411C]" />
            <span className="text-sm font-medium text-[#01411C]">
              {addressDetails.nationalAddress || 'اضغط على الخريطة لتحديد الموقع'}
            </span>
          </div>
          {addressDetails.latitude && addressDetails.longitude && (
            <p className="text-xs text-gray-500 mt-1 dir-ltr text-left">
              {addressDetails.latitude.toFixed(6)}, {addressDetails.longitude.toFixed(6)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
