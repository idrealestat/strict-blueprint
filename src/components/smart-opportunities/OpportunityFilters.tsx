/**
 * OpportunityFilters.tsx
 * فلاتر الفرص الذكية
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Filter, 
  MapPin, 
  Building2, 
  Home, 
  DollarSign, 
  BedDouble, 
  Layers,
  Percent,
  Tag,
  X,
  RotateCcw
} from 'lucide-react';

export interface OpportunityFiltersState {
  city: string;
  district: string;
  propertyType: string;
  purpose: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  floors: string;
  minMatchScore: number;
  features: string[];
}

interface OpportunityFiltersProps {
  filters: OpportunityFiltersState;
  onFiltersChange: (filters: OpportunityFiltersState) => void;
  availableCities: string[];
  availableDistricts: string[];
  activeFiltersCount: number;
}

const propertyTypes = [
  { value: '', label: 'الكل' },
  { value: 'شقة', label: 'شقة' },
  { value: 'فيلا', label: 'فيلا' },
  { value: 'دور', label: 'دور' },
  { value: 'أرض', label: 'أرض' },
  { value: 'عمارة', label: 'عمارة' },
  { value: 'محل', label: 'محل تجاري' },
  { value: 'مكتب', label: 'مكتب' },
  { value: 'مستودع', label: 'مستودع' },
  { value: 'استراحة', label: 'استراحة' },
];

const purposes = [
  { value: '', label: 'الكل' },
  { value: 'للبيع', label: 'للبيع' },
  { value: 'للإيجار', label: 'للإيجار' },
];

const categories = [
  { value: '', label: 'الكل' },
  { value: 'سكني', label: 'سكني' },
  { value: 'تجاري', label: 'تجاري' },
  { value: 'صناعي', label: 'صناعي' },
  { value: 'زراعي', label: 'زراعي' },
];

const bedroomOptions = [
  { value: '', label: 'الكل' },
  { value: '1', label: '1 غرفة' },
  { value: '2', label: '2 غرفة' },
  { value: '3', label: '3 غرف' },
  { value: '4', label: '4 غرف' },
  { value: '5', label: '5 غرف' },
  { value: '6+', label: '6+ غرف' },
];

const floorOptions = [
  { value: '', label: 'الكل' },
  { value: '1', label: 'دور واحد' },
  { value: '2', label: 'دورين' },
  { value: '3', label: '3 أدوار' },
  { value: '4+', label: '4+ أدوار' },
];

const featureOptions = [
  'مسبح',
  'حديقة',
  'مصعد',
  'موقف سيارات',
  'غرفة خادمة',
  'غرفة سائق',
  'مجلس',
  'صالة',
  'مطبخ راكب',
  'تكييف مركزي',
  'شقة أرضية',
  'واجهة شمالية',
  'واجهة جنوبية',
  'قريب من مسجد',
  'قريب من مدرسة',
];

const defaultFilters: OpportunityFiltersState = {
  city: '',
  district: '',
  propertyType: '',
  purpose: '',
  category: '',
  minPrice: 0,
  maxPrice: 10000000,
  bedrooms: '',
  floors: '',
  minMatchScore: 0,
  features: [],
};

export default function OpportunityFilters({
  filters,
  onFiltersChange,
  availableCities,
  availableDistricts,
  activeFiltersCount,
}: OpportunityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: keyof OpportunityFiltersState, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setLocalFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} مليون`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)} ألف`;
    }
    return value.toString();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="w-4 h-4" />
          فلترة
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-500 text-white text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-right">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-500" />
            فلترة الفرص الذكية
          </SheetTitle>
          <SheetDescription>
            حدد معايير البحث للعثور على الفرص المناسبة
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-140px)] py-4">
          <Accordion type="multiple" defaultValue={['location', 'property', 'price', 'match']} className="space-y-2">
            {/* الموقع */}
            <AccordionItem value="location" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>الموقع</span>
                  {(localFilters.city || localFilters.district) && (
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {[localFilters.city, localFilters.district].filter(Boolean).length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Select
                    value={localFilters.city}
                    onValueChange={(v) => handleFilterChange('city', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      {availableCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الحي</Label>
                  <Select
                    value={localFilters.district}
                    onValueChange={(v) => handleFilterChange('district', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      {availableDistricts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* نوع العقار */}
            <AccordionItem value="property" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span>نوع العقار</span>
                  {(localFilters.propertyType || localFilters.purpose || localFilters.category) && (
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {[localFilters.propertyType, localFilters.purpose, localFilters.category].filter(Boolean).length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>نوع العقار</Label>
                  <Select
                    value={localFilters.propertyType}
                    onValueChange={(v) => handleFilterChange('propertyType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الغرض</Label>
                  <div className="flex gap-2">
                    {purposes.map(p => (
                      <Button
                        key={p.value}
                        variant={localFilters.purpose === p.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('purpose', p.value)}
                        className={localFilters.purpose === p.value ? 'bg-amber-500 hover:bg-amber-600' : ''}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <Button
                        key={c.value}
                        variant={localFilters.category === c.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('category', c.value)}
                        className={localFilters.category === c.value ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* السعر */}
            <AccordionItem value="price" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>السعر</span>
                  {(localFilters.minPrice > 0 || localFilters.maxPrice < 10000000) && (
                    <Badge variant="secondary" className="mr-2 text-xs">محدد</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>من: {formatPrice(localFilters.minPrice)} ر.س</span>
                    <span>إلى: {formatPrice(localFilters.maxPrice)} ر.س</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs">الحد الأدنى</Label>
                      <Slider
                        value={[localFilters.minPrice]}
                        min={0}
                        max={10000000}
                        step={50000}
                        onValueChange={([v]) => handleFilterChange('minPrice', v)}
                        className="py-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">الحد الأقصى</Label>
                      <Slider
                        value={[localFilters.maxPrice]}
                        min={0}
                        max={10000000}
                        step={50000}
                        onValueChange={([v]) => handleFilterChange('maxPrice', v)}
                        className="py-2"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* المواصفات */}
            <AccordionItem value="specs" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-500" />
                  <span>المواصفات</span>
                  {(localFilters.bedrooms || localFilters.floors) && (
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {[localFilters.bedrooms, localFilters.floors].filter(Boolean).length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4" />
                    عدد الغرف
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {bedroomOptions.map(opt => (
                      <Button
                        key={opt.value}
                        variant={localFilters.bedrooms === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('bedrooms', opt.value)}
                        className={localFilters.bedrooms === opt.value ? 'bg-purple-500 hover:bg-purple-600' : ''}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    عدد الأدوار
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {floorOptions.map(opt => (
                      <Button
                        key={opt.value}
                        variant={localFilters.floors === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('floors', opt.value)}
                        className={localFilters.floors === opt.value ? 'bg-purple-500 hover:bg-purple-600' : ''}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* نسبة التطابق */}
            <AccordionItem value="match" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-500" />
                  <span>نسبة التطابق</span>
                  {localFilters.minMatchScore > 0 && (
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {localFilters.minMatchScore}%+
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-amber-500">{localFilters.minMatchScore}%</span>
                    <p className="text-xs text-gray-500">الحد الأدنى لنسبة التطابق</p>
                  </div>
                  
                  <Slider
                    value={[localFilters.minMatchScore]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([v]) => handleFilterChange('minMatchScore', v)}
                    className="py-2"
                  />

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* المميزات */}
            <AccordionItem value="features" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-500" />
                  <span>المميزات</span>
                  {localFilters.features.length > 0 && (
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {localFilters.features.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map(feature => (
                    <Button
                      key={feature}
                      variant={localFilters.features.includes(feature) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFeatureToggle(feature)}
                      className={`text-xs ${localFilters.features.includes(feature) ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
                    >
                      {feature}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-amber-500 hover:bg-amber-600 gap-2"
          >
            <Filter className="w-4 h-4" />
            تطبيق الفلاتر
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { defaultFilters };
