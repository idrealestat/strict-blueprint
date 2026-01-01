/**
 * SimilarOffersSection.tsx
 * قسم العروض المشابهة - يظهر عروض مشابهة بناءً على المدينة والحي ونوع العقار
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Maximize, ChevronLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  propertyType: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  image: string;
  imageCount: number;
  city: string;
  district: string;
  images?: string[];
  ownerName?: string;
  ownerPhone?: string;
}

interface SimilarOffersSectionProps {
  currentListing: Listing;
  allListings: Listing[];
  onSelectListing: (listing: Listing) => void;
  brokerPhone?: string;
}

const SimilarOffersSection: React.FC<SimilarOffersSectionProps> = ({
  currentListing,
  allListings,
  onSelectListing,
  brokerPhone
}) => {
  // فلترة العروض المشابهة
  const getSimilarListings = () => {
    if (!currentListing || !allListings.length) return [];
    
    // استبعاد العرض الحالي
    const otherListings = allListings.filter(l => l.id !== currentListing.id);
    
    // حساب درجة التشابه لكل عرض
    const scoredListings = otherListings.map(listing => {
      let score = 0;
      
      // نفس المدينة - أعلى أولوية
      if (listing.city === currentListing.city) score += 30;
      
      // نفس الحي - ثاني أعلى أولوية
      if (listing.district === currentListing.district) score += 25;
      
      // نفس نوع العقار - ثالث أعلى أولوية
      if (listing.propertyType === currentListing.propertyType) score += 20;
      
      // عدد غرف مشابه
      if (listing.bedrooms && currentListing.bedrooms) {
        const bedroomDiff = Math.abs(listing.bedrooms - currentListing.bedrooms);
        if (bedroomDiff === 0) score += 10;
        else if (bedroomDiff === 1) score += 5;
      }
      
      // مساحة مشابهة (±20%)
      if (listing.area && currentListing.area) {
        const areaDiff = Math.abs(listing.area - currentListing.area) / currentListing.area;
        if (areaDiff <= 0.1) score += 10;
        else if (areaDiff <= 0.2) score += 5;
      }
      
      // سعر مشابه (±30%)
      if (listing.price && currentListing.price) {
        const priceDiff = Math.abs(listing.price - currentListing.price) / currentListing.price;
        if (priceDiff <= 0.15) score += 8;
        else if (priceDiff <= 0.3) score += 4;
      }
      
      return { listing, score };
    });
    
    // ترتيب حسب الدرجة وإرجاع أفضل 6
    return scoredListings
      .filter(s => s.score >= 20) // فقط العروض المشابهة فعلاً
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(s => s.listing);
  };

  const similarListings = getSimilarListings();

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} مليون`;
    }
    return `${price.toLocaleString()} ريال`;
  };

  if (similarListings.length === 0) return null;

  return (
    <div className="mt-8 bg-gradient-to-br from-[#f0fdf4] to-white rounded-xl p-6 border-2 border-[#01411C]/20">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-[#D4AF37]" />
        <h3 className="text-xl font-bold text-[#01411C]">عروض مشابهة قد تهمك</h3>
        <Badge className="bg-[#01411C] text-white">{similarListings.length}</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {similarListings.map((listing, index) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100"
            onClick={() => onSelectListing({ ...listing, ownerPhone: brokerPhone })}
          >
            <div className="relative h-36">
              <img 
                src={listing.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'} 
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 bg-[#01411C] text-white px-3 py-1 rounded-lg font-bold text-sm">
                {formatPrice(listing.price)}
              </div>
              <Badge className="absolute top-2 left-2 bg-[#D4AF37] text-[#01411C] text-xs">
                {listing.propertyType}
              </Badge>
              
              {/* مؤشر التشابه */}
              {listing.city === currentListing.city && listing.district === currentListing.district && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                  نفس الحي
                </div>
              )}
            </div>
            
            <div className="p-3">
              <h4 className="font-bold text-gray-900 mb-2 line-clamp-1 text-sm">{listing.title}</h4>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3 text-[#D4AF37]" />
                <span className="truncate">{listing.city} - {listing.district}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {listing.area && (
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                    <Maximize className="w-3 h-3" />
                    <span>{listing.area} م²</span>
                  </div>
                )}
                {listing.bedrooms && (
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                    <BedDouble className="w-3 h-3" />
                    <span>{listing.bedrooms}</span>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                    <Bath className="w-3 h-3" />
                    <span>{listing.bathrooms}</span>
                  </div>
                )}
              </div>
              
              <button 
                className="mt-3 w-full text-[#01411C] text-sm font-bold hover:text-[#065f41] transition-colors flex items-center justify-center gap-1 py-2 bg-[#f0fdf4] rounded-lg"
              >
                عرض التفاصيل
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SimilarOffersSection;
