/**
 * GeneralInfoTab.tsx
 * تبويب المعلومات العامة - مطابق للتصميم من Figma
 * مع الخريطة والتعبئة التلقائية للعنوان
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Upload,
  FileText,
  Image,
  Calendar,
  CheckCircle,
  Lock,
  Copy,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  company?: string;
  type?: 'buyer' | 'seller' | 'renter' | 'owner' | 'investor' | 'other';
  interestLevel?: 'hot' | 'warm' | 'cold' | 'moderate';
  propertyType?: string;
  budget?: string;
  location?: string;
  notes?: string;
  source?: string;
  status: string;
  columnId: string;
  tags?: string[];
  image?: string;
  profileImage?: string;
  createdAt: string;
  lastContact?: string;
  nextFollowUp?: string;
}

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

interface GeneralInfoTabProps {
  customer: Customer;
  isEditing: boolean;
  editedCustomer: Customer;
  setEditedCustomer: (customer: Customer) => void;
}

// أنواع العملاء - مطابق للصورة تماماً
const CUSTOMER_TYPES = [
  { id: 'seller', name: 'بائع', dotColor: '#3B82F6' }, // أزرق
  { id: 'buyer', name: 'مشتري', dotColor: '#22C55E' }, // أخضر
  { id: 'landlord', name: 'مؤجر', dotColor: '#F97316' }, // برتقالي
  { id: 'renter', name: 'مستأجر', dotColor: '#FACC15' }, // أصفر
  { id: 'finance', name: 'تمويل', dotColor: '#A855F7' }, // بنفسجي
  { id: 'other', name: 'أخرى', dotColor: '#374151' }, // رمادي غامق
];

// درجات الاهتمام - مطابق للصورة تماماً
const INTEREST_LEVELS = [
  { id: 'passionate', name: 'شغوف', dotColor: '#EF4444' }, // أحمر
  { id: 'interested', name: 'مهتم', dotColor: '#F97316' }, // برتقالي
  { id: 'moderate', name: 'معتدل', dotColor: '#8B5CF6' }, // بنفسجي
  { id: 'limited', name: 'محدود', dotColor: '#92400E' }, // بني
  { id: 'not_interested', name: 'غير مهتم', dotColor: '#1F2937' }, // أسود
];

export default function GeneralInfoTab({ 
  customer, 
  isEditing, 
  editedCustomer, 
  setEditedCustomer 
}: GeneralInfoTabProps) {
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({
    city: '',
    district: '',
    street: '',
    nationalAddress: '',
    postalCode: '',
    buildingNumber: '',
    additionalNumber: '',
    latitude: 24.7136,
    longitude: 46.6753,
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const customerType = CUSTOMER_TYPES.find(t => t.id === customer.type);
  const interestLevel = INTEREST_LEVELS.find(l => l.id === customer.interestLevel);

  const handleAddPhone = () => {
    setAdditionalPhones([...additionalPhones, '']);
  };

  // جلب تفاصيل العنوان من الإحداثيات باستخدام Nominatim (OpenStreetMap)
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        // استخراج البيانات من الاستجابة
        const newAddress: AddressDetails = {
          city: addr.city || addr.town || addr.village || addr.state || '',
          district: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
          street: addr.road || addr.street || '',
          nationalAddress: `${addr.house_number || ''} ${addr.road || ''} ${addr.suburb || ''} ${addr.city || ''}`.trim(),
          postalCode: addr.postcode || '',
          buildingNumber: addr.house_number || '',
          additionalNumber: '',
          latitude: lat,
          longitude: lng,
        };
        
        // توليد رقم إضافي عشوائي (للمحاكاة)
        newAddress.additionalNumber = Math.floor(1000 + Math.random() * 9000).toString();
        
        setAddressDetails(newAddress);
        toast.success('تم تحديد الموقع بنجاح');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('فشل في جلب تفاصيل العنوان');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // تهيئة الخريطة باستخدام Leaflet
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current) {
      // تحميل Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // تحميل Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        const L = (window as any).L;
        
        const map = L.map(mapRef.current).setView([addressDetails.latitude, addressDetails.longitude], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // إضافة علامة قابلة للسحب
        const marker = L.marker([addressDetails.latitude, addressDetails.longitude], {
          draggable: true
        }).addTo(map);
        
        // عند سحب العلامة
        marker.on('dragend', function(e: any) {
          const position = marker.getLatLng();
          fetchAddressFromCoordinates(position.lat, position.lng);
        });
        
        // عند النقر على الخريطة
        map.on('click', function(e: any) {
          marker.setLatLng(e.latlng);
          fetchAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
        });
        
        mapInstanceRef.current = map;
        markerRef.current = marker;
      };
      document.head.appendChild(script);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap]);

  // الحصول على الموقع الحالي
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 17);
            markerRef.current.setLatLng([lat, lng]);
          }
          
          fetchAddressFromCoordinates(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('فشل في الحصول على الموقع الحالي');
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast.error('المتصفح لا يدعم خدمة تحديد الموقع');
    }
  };

  // الحصول على ألوان الخطوط من نوع العميل ودرجة الاهتمام
  const topLineColor = customerType?.dotColor || '#E5E7EB';
  const bottomLineColor = interestLevel?.dotColor || '#E5E7EB';

  return (
    <div className="space-y-4 pb-8">
      {/* القسم الرئيسي - المعلومات العامة */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden relative">
        {/* خط علوي بلون نوع العميل */}
        <div 
          className="absolute top-0 left-0 right-0 h-1" 
          style={{ backgroundColor: topLineColor }}
        />
        {/* خط سفلي بلون درجة الاهتمام */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1" 
          style={{ backgroundColor: bottomLineColor }}
        />
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100 py-3 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-700" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-800">المعلومات العامة</CardTitle>
          </div>
          <p className="text-xs text-gray-500 mr-10">البيانات الأساسية والأنشطة</p>
        </CardHeader>
        <CardContent className="p-0">
          {/* المعلومات العامة - القسم الداخلي */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">المعلومات العامة</span>
            </div>
            
            {/* الاسم */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">الاسم</Label>
                  {isEditing ? (
                    <Input 
                      value={editedCustomer.name}
                      onChange={(e) => setEditedCustomer({...editedCustomer, name: e.target.value})}
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">{customer.name}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* الوظيفة */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">الوظيفة</Label>
                  {isEditing ? (
                    <Input 
                      placeholder="مدير مبيعات"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">مدير مبيعات</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* الشركة */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">الشركة</Label>
                  {isEditing ? (
                    <Input 
                      value={editedCustomer.company || ''}
                      onChange={(e) => setEditedCustomer({...editedCustomer, company: e.target.value})}
                      placeholder="شركة العقارات الذكية"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">{customer.company || 'شركة العقارات الذكية'}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* نوع العميل - مطابق للصورة */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">نوع العميل</Label>
                  <Select 
                    value={isEditing ? editedCustomer.type : customer.type} 
                    onValueChange={(value: any) => {
                      if (isEditing) {
                        setEditedCustomer({...editedCustomer, type: value});
                      }
                    }}
                  >
                    <SelectTrigger 
                      className="h-10 border-2 border-amber-400 rounded-lg bg-white"
                      style={{ borderTopColor: customerType?.dotColor }}
                    >
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: customerType?.dotColor }}
                          />
                          <span className="font-medium">{customerType?.name || 'اختر نوع العميل'}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 border-0 shadow-lg">
                      {CUSTOMER_TYPES.map((type, index) => (
                        <SelectItem 
                          key={type.id} 
                          value={type.id}
                          className={`cursor-pointer ${
                            (isEditing ? editedCustomer.type : customer.type) === type.id 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 w-full justify-end">
                            <span className="font-medium">{type.name}</span>
                            <span 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: type.dotColor }}
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* درجة الاهتمام - مطابق للصورة */}
            <div className="flex items-center justify-between py-3 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Lock className="w-4 h-4 text-gray-400" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">درجة الاهتمام</Label>
                  <Select 
                    value={isEditing ? editedCustomer.interestLevel : customer.interestLevel} 
                    onValueChange={(value: any) => {
                      if (isEditing) {
                        setEditedCustomer({...editedCustomer, interestLevel: value});
                      }
                    }}
                  >
                    <SelectTrigger 
                      className="h-10 border-2 border-amber-400 rounded-lg bg-white"
                      style={{ borderTopColor: interestLevel?.dotColor }}
                    >
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: interestLevel?.dotColor }}
                          />
                          <span className="font-medium">{interestLevel?.name || 'اختر درجة الاهتمام'}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 border-0 shadow-lg">
                      {INTEREST_LEVELS.map((level) => (
                        <SelectItem 
                          key={level.id} 
                          value={level.id}
                          className={`cursor-pointer ${
                            (isEditing ? editedCustomer.interestLevel : customer.interestLevel) === level.id 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 w-full justify-end">
                            <span className="font-medium">{level.name}</span>
                            <span 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: level.dotColor }}
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* رقم إضافي (فرعي) */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">رقم إضافي (فرعي)</span>
            </div>
          </div>
          <div className="mt-3">
            <Button 
              variant="ghost" 
              className="text-gray-500 hover:text-gray-700 gap-2"
              onClick={handleAddPhone}
            >
              <Plus className="w-4 h-4" />
              إضافة رقم فرعي
            </Button>
            {additionalPhones.map((phone, index) => (
              <Input 
                key={index}
                placeholder="أدخل الرقم الفرعي"
                className="mt-2 h-9"
                value={phone}
                onChange={(e) => {
                  const newPhones = [...additionalPhones];
                  newPhones[index] = e.target.value;
                  setAdditionalPhones(newPhones);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* بريد الشركة (اختياري) */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">بريد الشركة (اختياري)</span>
            <Lock className="w-3 h-3 text-gray-400 mr-auto" />
          </div>
          <Input 
            placeholder="work@company.com"
            defaultValue="work@company.com"
            className="h-9"
            dir="ltr"
          />
        </CardContent>
      </Card>

      {/* الموقع - خريطة مع التعبئة التلقائية */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">الموقع</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              onClick={() => setShowMap(!showMap)}
            >
              <MapPin className="w-4 h-4" />
              {showMap ? 'إخفاء الخريطة' : 'فتح الخريطة'}
            </Button>
          </div>

          {!showMap ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">اضغط للاختيار من خرائط قوقل</p>
              <Button 
                variant="outline" 
                className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                onClick={() => setShowMap(true)}
              >
                <MapPin className="w-4 h-4" />
                فتح الخريطة
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* الخريطة */}
              <div 
                ref={mapRef}
                className="w-full h-64 rounded-lg border border-gray-200 bg-gray-100"
              />
              
              {/* زر الموقع الحالي */}
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                تحديد موقعي الحالي
              </Button>

              {/* حقول العنوان المعبأة تلقائياً */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">المدينة</Label>
                  <Input 
                    value={addressDetails.city} 
                    onChange={(e) => setAddressDetails({...addressDetails, city: e.target.value})}
                    className="h-9 mt-1"
                    placeholder="الرياض"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">الحي</Label>
                  <Input 
                    value={addressDetails.district} 
                    onChange={(e) => setAddressDetails({...addressDetails, district: e.target.value})}
                    className="h-9 mt-1"
                    placeholder="النرجس"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">الشارع</Label>
                  <Input 
                    value={addressDetails.street} 
                    onChange={(e) => setAddressDetails({...addressDetails, street: e.target.value})}
                    className="h-9 mt-1"
                    placeholder="شارع الملك فهد"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">الرمز البريدي</Label>
                  <Input 
                    value={addressDetails.postalCode} 
                    onChange={(e) => setAddressDetails({...addressDetails, postalCode: e.target.value})}
                    className="h-9 mt-1"
                    placeholder="12345"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">رقم المبنى</Label>
                  <Input 
                    value={addressDetails.buildingNumber} 
                    onChange={(e) => setAddressDetails({...addressDetails, buildingNumber: e.target.value})}
                    className="h-9 mt-1"
                    placeholder="1234"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">الرقم الإضافي</Label>
                  <Input 
                    value={addressDetails.additionalNumber} 
                    onChange={(e) => setAddressDetails({...addressDetails, additionalNumber: e.target.value})}
                    className="h-9 mt-1"
                    placeholder="5678"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">العنوان الوطني</Label>
                <Input 
                  value={addressDetails.nationalAddress} 
                  onChange={(e) => setAddressDetails({...addressDetails, nationalAddress: e.target.value})}
                  className="h-9 mt-1"
                  placeholder="العنوان الوطني الكامل"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الوسائط المتعددة */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">الوسائط المتعددة (0/27)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 gap-1">
              <Upload className="w-4 h-4" />
              رفع صور/فيديو
            </Button>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-400">اسحب وأفلت الملفات هنا أو اضغط للرفع</p>
          </div>
        </CardContent>
      </Card>

      {/* المستندات والملفات */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">المستندات والملفات (0)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 gap-1">
              <Upload className="w-4 h-4" />
              رفع مستند
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-gray-600">
              <Upload className="w-4 h-4" />
              رفع PDF, Word, Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدولة الاجتماعات */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">جدولة الاجتماعات (0)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 gap-1">
              <Plus className="w-4 h-4" />
              جدولة اجتماع
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* سجل النشاط التلقائي */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-700" />
            </div>
            <span className="text-sm font-medium text-gray-700">سجل النشاط التلقائي</span>
          </div>
          
          {/* فلاتر النشاط */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              اتصالات
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              رسائل
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              🗓️ مواعيد
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📎 مستندات
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              👁️ معاينات
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              ✓ واتساب
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📧 إيميلات
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📤 عروض مرسلة
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              📍 مواقع جغرافية
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
              ✓ تعديلات
            </Badge>
          </div>

          {/* حالة فارغة */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
                <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M50 30 L70 50 L50 70 L30 50 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400">لا يوجد نشاط مسجل بعد</p>
          </div>
        </CardContent>
      </Card>

      {/* المهام */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">لا توجد مهام. اضغط "إضافة مهمة" للبدء</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
