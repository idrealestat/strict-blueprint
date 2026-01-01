import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Ruler, Bed, Bath, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import LiveViewerIndicator from "@/components/ui/LiveViewerIndicator";
import { useSingleOfferLiveViewers } from "@/hooks/useLiveViewers";

interface Offer {
  id: string;
  title: string;
  images?: string[];
  status: 'available' | 'reserved' | 'sold' | 'cancelled';
  property_type: 'apartment' | 'villa' | 'land' | 'commercial' | 'building';
  city: string;
  district: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  age?: number;
  price: number;
  views_count?: number;
  commission_rate?: number;
}

interface OfferCardProps {
  offer: Offer;
  onClick: (offer: Offer) => void;
  showLiveViewers?: boolean;
}

export function OfferCard({ offer, onClick, showLiveViewers = true }: OfferCardProps) {
  const liveViewers = useSingleOfferLiveViewers(showLiveViewers ? offer.id : undefined);
  
  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    reserved: "bg-yellow-100 text-yellow-800",
    sold: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800"
  };

  const propertyTypeLabels: Record<string, string> = {
    apartment: "شقة",
    villa: "فيلا",
    land: "أرض",
    commercial: "تجاري",
    building: "عمارة"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-[#D4AF37] overflow-hidden"
        onClick={() => onClick(offer)}
      >
        <div className="relative h-48 bg-gradient-to-br from-[#01411C] to-[#065f41]">
          {offer.images && offer.images.length > 0 ? (
            <img
              src={offer.images[0]}
              alt={offer.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-20 h-20 text-[#D4AF37] opacity-50" />
            </div>
          )}
          
          {/* مؤشر المشاهدات المباشرة */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <LiveViewerIndicator 
              liveViewers={liveViewers}
              totalViews={offer.views_count || 0}
              showTotalViews={true}
              size="sm"
            />
          </div>

          <div className="absolute top-2 left-2">
            <Badge className="bg-white/90 text-[#01411C]">
              {propertyTypeLabels[offer.property_type]}
            </Badge>
          </div>

          {/* شارة الحالة */}
          <div className="absolute bottom-2 right-2">
            <Badge className={statusColors[offer.status]}>
              {offer.status === "available" && "متاح"}
              {offer.status === "reserved" && "محجوز"}
              {offer.status === "sold" && "مباع"}
              {offer.status === "cancelled" && "ملغي"}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4" dir="rtl">
          <h3 className="font-bold text-[#01411C] text-lg mb-2">{offer.title}</h3>

          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm text-gray-600">
              {offer.city} - {offer.district}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Ruler className="w-4 h-4" />
              <span>{offer.area} م²</span>
            </div>
            {offer.bedrooms && (
              <div className="flex items-center gap-2 text-gray-600">
                <Bed className="w-4 h-4" />
                <span>{offer.bedrooms} غرف</span>
              </div>
            )}
            {offer.bathrooms && (
              <div className="flex items-center gap-2 text-gray-600">
                <Bath className="w-4 h-4" />
                <span>{offer.bathrooms} حمام</span>
              </div>
            )}
            {offer.age && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{offer.age} سنة</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-2xl font-bold text-[#01411C]">
              {offer.price.toLocaleString("ar-SA")} <span className="text-sm text-gray-500">ريال</span>
            </div>
          </div>

          {offer.commission_rate && (
            <div className="mt-2 text-sm text-[#065f41] flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>عمولة {offer.commission_rate}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default OfferCard;
