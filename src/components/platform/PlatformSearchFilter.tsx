/**
 * PlatformSearchFilter.tsx
 * شريط البحث والفلترة للمنصة العامة
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Building2, 
  MapPin, 
  DollarSign,
  BedDouble,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterState {
  search: string;
  city: string;
  district: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
}

interface PlatformSearchFilterProps {
  onFilterChange: (filters: FilterState) => void;
  cities: string[];
  districts: string[];
  propertyTypes: string[];
  totalResults: number;
}

const PlatformSearchFilter: React.FC<PlatformSearchFilterProps> = ({
  onFilterChange,
  cities,
  districts,
  propertyTypes,
  totalResults
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    city: '',
    district: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: ''
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters: FilterState = {
      search: '',
      city: '',
      district: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const bedroomOptions = ['1', '2', '3', '4', '5', '6+'];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6 sticky top-4 z-40">
      {/* شريط البحث الرئيسي */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="ابحث عن عقار..."
            className="pr-10 py-3 text-lg border-2 border-gray-200 focus:border-[#01411C]"
          />
        </div>
        
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? "default" : "outline"}
          className={`flex items-center gap-2 py-3 px-4 ${showFilters ? 'bg-[#01411C] text-white' : ''}`}
        >
          <Filter className="w-5 h-5" />
          فلتر
          {activeFiltersCount > 0 && (
            <Badge className="bg-[#D4AF37] text-[#01411C]">{activeFiltersCount}</Badge>
          )}
        </Button>
      </div>

      {/* عدد النتائج */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-[#01411C]">{totalResults}</span> عقار متاح
        </p>
        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* الفلاتر المتقدمة */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-gray-200">
              {/* المدينة */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">المدينة</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full pr-9 py-2 border-2 border-gray-200 rounded-lg focus:border-[#01411C] appearance-none bg-white text-sm"
                  >
                    <option value="">جميع المدن</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* الحي */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">الحي</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                    className="w-full pr-9 py-2 border-2 border-gray-200 rounded-lg focus:border-[#01411C] appearance-none bg-white text-sm"
                  >
                    <option value="">جميع الأحياء</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* نوع العقار */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">نوع العقار</label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="w-full pr-9 py-2 border-2 border-gray-200 rounded-lg focus:border-[#01411C] appearance-none bg-white text-sm"
                  >
                    <option value="">الكل</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* الحد الأدنى للسعر */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">من (ريال)</label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="0"
                    className="pr-9 py-2 text-sm"
                  />
                </div>
              </div>

              {/* الحد الأقصى للسعر */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">إلى (ريال)</label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="غير محدد"
                    className="pr-9 py-2 text-sm"
                  />
                </div>
              </div>

              {/* عدد الغرف */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">الغرف</label>
                <div className="flex gap-1 flex-wrap">
                  {bedroomOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => handleFilterChange('bedrooms', filters.bedrooms === option ? '' : option)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        filters.bedrooms === option
                          ? 'bg-[#01411C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* الفلاتر النشطة */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                {filters.city && (
                  <Badge className="bg-[#01411C]/10 text-[#01411C] flex items-center gap-1">
                    {filters.city}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('city', '')}
                    />
                  </Badge>
                )}
                {filters.district && (
                  <Badge className="bg-[#01411C]/10 text-[#01411C] flex items-center gap-1">
                    {filters.district}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('district', '')}
                    />
                  </Badge>
                )}
                {filters.propertyType && (
                  <Badge className="bg-[#01411C]/10 text-[#01411C] flex items-center gap-1">
                    {filters.propertyType}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('propertyType', '')}
                    />
                  </Badge>
                )}
                {filters.bedrooms && (
                  <Badge className="bg-[#01411C]/10 text-[#01411C] flex items-center gap-1">
                    {filters.bedrooms} غرف
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('bedrooms', '')}
                    />
                  </Badge>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformSearchFilter;
