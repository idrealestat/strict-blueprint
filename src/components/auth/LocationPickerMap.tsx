import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function LocationPickerMap({
  onLocationSelect,
  initialLat = 24.7136,
  initialLng = 46.6753,
}: LocationPickerMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // إضافة علامة أولية إذا كانت موجودة
    if (initialLat && initialLng) {
      markerRef.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapRef.current);
      
      markerRef.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        setSelectedLocation({ lat: position.lat, lng: position.lng });
        onLocationSelect(position.lat, position.lng);
      });
    }

    // إضافة حدث النقر على الخريطة
    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current!);
        
        markerRef.current.on('dragend', (e) => {
          const position = e.target.getLatLng();
          setSelectedLocation({ lat: position.lat, lng: position.lng });
          onLocationSelect(position.lat, position.lng);
        });
      }
      
      setSelectedLocation({ lat, lng });
      onLocationSelect(lat, lng);
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
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
            
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            } else {
              markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
              
              markerRef.current.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                setSelectedLocation({ lat: pos.lat, lng: pos.lng });
                onLocationSelect(pos.lat, pos.lng);
              });
            }
            
            setSelectedLocation({ lat: latitude, lng: longitude });
            onLocationSelect(latitude, longitude);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />
      
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2 z-[1000]"
        onClick={goToMyLocation}
      >
        <Navigation className="w-4 h-4 ml-1" />
        موقعي
      </Button>
      
      {selectedLocation && (
        <div className="absolute bottom-2 right-2 z-[1000] bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs flex items-center gap-1">
          <MapPin className="w-3 h-3 text-primary" />
          <span>{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}
