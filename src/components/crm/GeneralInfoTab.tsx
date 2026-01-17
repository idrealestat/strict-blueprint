/**
 * GeneralInfoTab.tsx
 * تبويب المعلومات العامة - مطابق للتصميم من Figma
 * مع الخريطة والتعبئة التلقائية للعنوان
 */

import { useState, useEffect, useRef, useCallback } from "react";
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
  Send,
  Download,
  Eye,
  Trash2,
  DollarSign,
  MessageCircle,
  Check,
  XCircle,
  Clock,
  Satellite,
  Map,
} from "lucide-react";
import { toast } from "sonner";
import FinancialDocumentModal from './FinancialDocumentModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import ReceivedQuoteResponseModal from './ReceivedQuoteResponseModal';
import { useBusinessCardData } from '@/hooks/useBusinessCardData';
import { clientTypes, interestLevels, ClientType, InterestLevel } from '@/types/offer';

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
  // الحقول الإضافية من بيانات المالك
  idNumber?: string;
  birthDate?: string;
  city?: string;
  district?: string;
  metadata?: Record<string, any>;
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
  onImmediateUpdate?: (customer: Customer) => void;
}

// تحويل clientTypes من offer.ts إلى تنسيق CUSTOMER_TYPES المتوافق
const CUSTOMER_TYPES = Object.entries(clientTypes).map(([id, config]) => ({
  id,
  name: config.label,
  dotColor: config.color,
  bgColor: config.bgColor,
  icon: config.icon,
}));

// تحويل interestLevels من offer.ts إلى تنسيق INTEREST_LEVELS المتوافق
const INTEREST_LEVELS = Object.entries(interestLevels).map(([id, config]) => ({
  id,
  name: config.label,
  dotColor: config.color,
  bgColor: config.bgColor,
  icon: config.icon,
}));

export default function GeneralInfoTab({ 
  customer, 
  isEditing, 
  editedCustomer, 
  setEditedCustomer,
  onImmediateUpdate
}: GeneralInfoTabProps) {
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: 'image' | 'video'; name: string }[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  // Session storage key للحفاظ على البيانات عند فتح المعرض على الهواتف
  const SESSION_STORAGE_KEY = `crm_customer_media_${customer.id}`;
  const [showMap, setShowMap] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFinancialForm, setShowFinancialForm] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [selectedReceivedDoc, setSelectedReceivedDoc] = useState<any | null>(null);
  const [addressDetails, setAddressDetails] = useState<AddressDetails>(() => {
    // تهيئة من metadata العميل إذا وجدت
    const meta = customer.metadata as Record<string, any> | undefined;
    return {
      city: meta?.city || meta?.ownerCity || (customer as any).city || '',
      district: meta?.district || meta?.ownerDistrict || (customer as any).district || '',
      street: meta?.street || '',
      nationalAddress: '',
      postalCode: meta?.postalCode || '',
      buildingNumber: meta?.buildingNumber || '',
      additionalNumber: '',
      latitude: meta?.lat || 24.7136,
      longitude: meta?.lng || 46.6753,
    };
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // جلب بيانات البطاقة للمستندات المالية
  const { data: businessCardData } = useBusinessCardData();

  // استعادة الوسائط من sessionStorage عند تحميل الصفحة (للتعامل مع تجديد الصفحة على الهواتف)
  useEffect(() => {
    try {
      const savedMedia = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedMedia) {
        const parsed = JSON.parse(savedMedia);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMediaFiles(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to restore media from sessionStorage:', e);
    }
  }, [SESSION_STORAGE_KEY]);

  // حفظ الوسائط في sessionStorage و localStorage عند التغيير
  useEffect(() => {
    if (mediaFiles.length > 0) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mediaFiles));
        // حفظ في localStorage أيضاً للاستمرارية
        const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
        const customerIndex = customers.findIndex((c: any) => c.id === customer.id || c.phone === customer.phone);
        if (customerIndex !== -1) {
          customers[customerIndex].mediaFiles = mediaFiles;
          localStorage.setItem('crm_customers', JSON.stringify(customers));
        }
      } catch (e) {
        console.warn('Failed to save media:', e);
      }
    }
  }, [mediaFiles, customer.id, customer.phone, SESSION_STORAGE_KEY]);

  // تحميل الوسائط المحفوظة من localStorage
  useEffect(() => {
    const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
    const currentCustomer = customers.find((c: any) => c.id === customer.id || c.phone === customer.phone);
    if (currentCustomer?.mediaFiles && currentCustomer.mediaFiles.length > 0) {
      setMediaFiles(currentCustomer.mediaFiles);
    }
  }, [customer.id, customer.phone]);

  // تحميل المستندات المحفوظة
  useEffect(() => {
    const loadSavedDocuments = () => {
      const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      const currentCustomer = customers.find((c: any) => c.id === customer.id || c.phone === customer.phone);
      if (currentCustomer?.documents) {
        setSavedDocuments(currentCustomer.documents);
      }
    };
    
    loadSavedDocuments();

    // الاستماع لحدث إضافة مستند جديد
    const handleDocumentAdded = (event: CustomEvent) => {
      if (event.detail.customerId === customer.id) {
        setSavedDocuments(prev => [...prev, event.detail.document]);
      }
    };

    window.addEventListener('customerDocumentAdded', handleDocumentAdded as EventListener);
    return () => {
      window.removeEventListener('customerDocumentAdded', handleDocumentAdded as EventListener);
    };
  }, [customer.id, customer.phone]);

  // معالجة اختيار ملفات الوسائط
  const handleMediaSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);

    try {
      const newMedia: { url: string; type: 'image' | 'video'; name: string }[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // تحويل الملف إلى base64 data URL
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const isVideo = file.type.startsWith('video/');
        newMedia.push({
          url: dataUrl,
          type: isVideo ? 'video' : 'image',
          name: file.name
        });
      }

      setMediaFiles(prev => [...prev, ...newMedia]);
      toast.success(`تم رفع ${newMedia.length} ملف بنجاح`);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('حدث خطأ أثناء رفع الملفات');
    } finally {
      setIsUploadingMedia(false);
      // إعادة تعيين input للسماح برفع نفس الملف مرة أخرى
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
    }
  }, []);

  // حذف ملف وسائط
  const handleRemoveMedia = useCallback((index: number) => {
    setMediaFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // تحديث sessionStorage
      try {
        if (updated.length > 0) {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Failed to update sessionStorage:', e);
      }
      return updated;
    });
    toast.success('تم حذف الملف');
  }, [SESSION_STORAGE_KEY]);

  const normalizeClientType = (value: any): ClientType => {
    if (value === 'renter') return 'tenant';
    if (value === 'owner') return 'landlord';
    if (value && value in clientTypes) return value as ClientType;
    return 'buyer';
  };

  const normalizeInterestLevel = (value: any): InterestLevel => {
    if (value === 'hot' || value === 'passionate') return 'veryInterested';
    if (value === 'warm') return 'interested';
    if (value === 'cold' || value === 'limited') return 'lowInterest';
    if (value === 'not_interested') return 'notInterested';
    if (value && value in interestLevels) return value as InterestLevel;
    return 'moderate';
  };

  const selectedClientType = normalizeClientType(editedCustomer.type ?? customer.type);
  const selectedInterestLevel = normalizeInterestLevel(editedCustomer.interestLevel ?? customer.interestLevel);

  const customerType = CUSTOMER_TYPES.find(t => t.id === selectedClientType);
  const interestLevel = INTEREST_LEVELS.find(l => l.id === selectedInterestLevel);

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
        
        // Street layer (OpenStreetMap)
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        });
        
        // Satellite layer (ESRI)
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© ESRI',
          maxZoom: 19,
        });
        
        // Add satellite layer by default
        satelliteLayer.addTo(map);
        
        // Store layers for toggle
        (map as any)._streetLayer = streetLayer;
        (map as any)._satelliteLayer = satelliteLayer;
        (map as any)._currentLayer = 'satellite';
        
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

            {/* رقم الهوية */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">رقم الهوية</Label>
                  {isEditing ? (
                    <Input 
                      value={(editedCustomer as any).idNumber || (editedCustomer.metadata as any)?.idNumber || ''}
                      onChange={(e) => setEditedCustomer({
                        ...editedCustomer, 
                        metadata: { ...(editedCustomer.metadata || {}), idNumber: e.target.value }
                      } as any)}
                      placeholder="1xxxxxxxxx"
                      className="h-9"
                      dir="ltr"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">
                      {(customer as any).idNumber || (customer.metadata as any)?.idNumber || '-'}
                    </div>
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

            {/* تاريخ الميلاد */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">تاريخ الميلاد</Label>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={(editedCustomer as any).birthDate || (editedCustomer.metadata as any)?.birthDate || ''}
                      onChange={(e) => setEditedCustomer({
                        ...editedCustomer, 
                        metadata: { ...(editedCustomer.metadata || {}), birthDate: e.target.value }
                      } as any)}
                      className="h-9"
                      dir="ltr"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">
                      {(customer as any).birthDate || (customer.metadata as any)?.birthDate || '-'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* المدينة */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">المدينة</Label>
                  {isEditing ? (
                    <Input 
                      value={(editedCustomer as any).city || (editedCustomer.metadata as any)?.city || (editedCustomer.metadata as any)?.ownerCity || editedCustomer.location?.split(' - ')[0] || ''}
                      onChange={(e) => setEditedCustomer({
                        ...editedCustomer, 
                        metadata: { ...(editedCustomer.metadata || {}), city: e.target.value }
                      } as any)}
                      placeholder="الرياض"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">
                      {(customer as any).city || (customer.metadata as any)?.city || (customer.metadata as any)?.ownerCity || customer.location?.split(' - ')[0] || '-'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* الحي */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">الحي</Label>
                  {isEditing ? (
                    <Input 
                      value={(editedCustomer as any).district || (editedCustomer.metadata as any)?.district || (editedCustomer.metadata as any)?.ownerDistrict || ''}
                      onChange={(e) => setEditedCustomer({
                        ...editedCustomer, 
                        metadata: { ...(editedCustomer.metadata || {}), district: e.target.value }
                      } as any)}
                      placeholder="النرجس"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">
                      {(customer as any).district || (customer.metadata as any)?.district || (customer.metadata as any)?.ownerDistrict || '-'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <Building2 className="w-4 h-4 text-gray-400" />
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
                    <div className="text-sm font-medium text-gray-800">-</div>
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

            {/* نوع العميل - مفتوح للتعديل دائماً */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 group">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">نوع العميل</Label>
                  <Select 
                    value={selectedClientType}
                    onValueChange={(value: any) => {
                      const updated = { ...editedCustomer, type: value };
                      setEditedCustomer(updated);
                      // حفظ مباشر للتغيير
                      if (onImmediateUpdate) {
                        onImmediateUpdate(updated);
                      }
                    }}
                  >
                    <SelectTrigger 
                      className="h-10 border-2 rounded-lg bg-white"
                      style={{ 
                        borderColor: customerType?.dotColor,
                        backgroundColor: `${customerType?.dotColor}15`
                      }}
                    >
                      <SelectValue>
                        <div 
                          className="flex items-center gap-2 px-2 py-1 rounded"
                          style={{ backgroundColor: `${customerType?.dotColor}20` }}
                        >
                          <span 
                            className="font-medium"
                            style={{ color: customerType?.dotColor }}
                          >
                            {customerType?.name || 'اختر نوع العميل'}
                          </span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 border-0 shadow-lg">
                      {CUSTOMER_TYPES.map((type) => (
                        <SelectItem 
                          key={type.id} 
                          value={type.id}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          <div 
                            className="flex items-center gap-2 w-full justify-end px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: selectedClientType === type.id ? `${type.dotColor}30` : 'transparent'
                            }}
                          >
                            <span 
                              className="font-medium"
                              style={{ color: type.dotColor }}
                            >
                              {type.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* درجة الاهتمام - مفتوح للتعديل دائماً */}
            <div className="flex items-center justify-between py-3 group">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">درجة الاهتمام</Label>
                  <Select 
                    value={selectedInterestLevel}
                    onValueChange={(value: any) => {
                      const updated = { ...editedCustomer, interestLevel: value };
                      setEditedCustomer(updated);
                      // حفظ مباشر للتغيير
                      if (onImmediateUpdate) {
                        onImmediateUpdate(updated);
                      }
                    }}
                  >
                    <SelectTrigger 
                      className="h-10 border-2 rounded-lg bg-white"
                      style={{ 
                        borderColor: interestLevel?.dotColor,
                        backgroundColor: `${interestLevel?.dotColor}15`
                      }}
                    >
                      <SelectValue>
                        <div 
                          className="flex items-center gap-2 px-2 py-1 rounded"
                          style={{ backgroundColor: `${interestLevel?.dotColor}20` }}
                        >
                          <span 
                            className="font-medium"
                            style={{ color: interestLevel?.dotColor }}
                          >
                            {interestLevel?.name || 'اختر درجة الاهتمام'}
                          </span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 border-0 shadow-lg">
                      {INTEREST_LEVELS.map((level) => (
                        <SelectItem 
                          key={level.id} 
                          value={level.id}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          <div 
                            className="flex items-center gap-2 w-full justify-end px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: selectedInterestLevel === level.id ? `${level.dotColor}30` : 'transparent'
                            }}
                          >
                            <span 
                              className="font-medium"
                              style={{ color: level.dotColor }}
                            >
                              {level.name}
                            </span>
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

      {/* رقم الهاتف */}
      <Card className="border border-border rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">رقم الهاتف</span>
          </div>
          <Input
            placeholder="05xxxxxxxx"
            value={editedCustomer.phone || ''}
            onChange={(e) => {
              setEditedCustomer({ ...editedCustomer, phone: e.target.value });
            }}
            onBlur={(e) => {
              onImmediateUpdate?.({ ...editedCustomer, phone: e.target.value });
            }}
            className="h-9"
            dir="ltr"
          />
        </CardContent>
      </Card>

      {/* رقم إضافي (فرعي) */}
      <Card className="border border-border rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">رقم إضافي (فرعي)</span>
            </div>
          </div>
          <div className="mt-3">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground gap-2"
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

      {/* رقم الواتساب */}
      <Card className="border border-primary/30 rounded-xl overflow-hidden bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">رقم الواتساب</span>
          </div>
          <Input
            placeholder="05xxxxxxxx"
            value={editedCustomer.whatsapp || ''}
            onChange={(e) => {
              setEditedCustomer({ ...editedCustomer, whatsapp: e.target.value });
            }}
            onBlur={(e) => {
              onImmediateUpdate?.({ ...editedCustomer, whatsapp: e.target.value });
            }}
            className="h-9 border-border focus-visible:ring-ring"
            dir="ltr"
          />
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
              <div className="relative">
                <div 
                  ref={mapRef}
                  className="w-full h-64 rounded-lg border border-gray-200 bg-gray-100"
                />
                
                {/* زر تبديل طبقة الخريطة */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 left-2 z-[1000] gap-1"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      const map = mapInstanceRef.current as any;
                      if (map._currentLayer === 'satellite') {
                        map.removeLayer(map._satelliteLayer);
                        map._streetLayer.addTo(map);
                        map._currentLayer = 'street';
                      } else {
                        map.removeLayer(map._streetLayer);
                        map._satelliteLayer.addTo(map);
                        map._currentLayer = 'satellite';
                      }
                    }
                  }}
                >
                  {mapInstanceRef.current && (mapInstanceRef.current as any)._currentLayer === 'satellite' ? (
                    <>
                      <Satellite className="w-4 h-4" />
                      <span className="text-xs">أقمار</span>
                    </>
                  ) : (
                    <>
                      <Map className="w-4 h-4" />
                      <span className="text-xs">خريطة</span>
                    </>
                  )}
                </Button>
              </div>
              
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
                  <Label className="text-xs text-gray-500">الرقم الإضافي</Label>
                  <Input 
                    value={addressDetails.buildingNumber} 
                    onChange={(e) => setAddressDetails({...addressDetails, buildingNumber: e.target.value})}
                    className="h-9 mt-1"
                    placeholder="1234"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">رقم المبنى</Label>
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
              <span className="text-sm font-medium text-gray-700">
                الوسائط المتعددة ({mediaFiles.length}/27)
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-emerald-600 gap-1"
              onClick={() => mediaInputRef.current?.click()}
              disabled={isUploadingMedia}
            >
              {isUploadingMedia ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              رفع صور/فيديو
            </Button>
            {/* Input مخفي لاختيار الملفات - بدون capture للسماح بالاختيار من المعرض */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaSelect}
              className="hidden"
            />
          </div>
          
          {mediaFiles.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaFiles.map((media, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  {media.type === 'video' ? (
                    <video 
                      src={media.url} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={media.url} 
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* زر الحذف */}
                  <button
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {/* مؤشر نوع الملف */}
                  {media.type === 'video' && (
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      فيديو
                    </div>
                  )}
                </div>
              ))}
              {/* زر إضافة المزيد */}
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                disabled={isUploadingMedia}
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs">إضافة</span>
              </button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
              onClick={() => mediaInputRef.current?.click()}
            >
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">اسحب وأفلت الملفات هنا أو اضغط للرفع</p>
                <p className="text-xs text-gray-300 mt-1">صور أو فيديو (حد أقصى 27)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إرسال عرض أو طلب - المستندات المالية */}
      <Card className="border-2 border-[#D4AF37] rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] py-3">
          <CardTitle className="flex items-center gap-2 text-[#01411C] text-base">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
            المستندات المالية
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <Button
            onClick={() => setShowFinancialForm(true)}
            className="w-full bg-gradient-to-r from-[#01411C] to-[#065f41] hover:from-[#065f41] hover:to-[#01411C] text-white gap-2"
          >
            <Send className="w-4 h-4" />
            إرسال عرض أو طلب (سند قبض / عرض سعر)
          </Button>
        </CardContent>
      </Card>

      {/* المستندات والملفات */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">
                المستندات والملفات ({savedDocuments.length})
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 gap-1">
              <Upload className="w-4 h-4" />
              رفع مستند
            </Button>
          </div>
          
          {/* عرض المستندات المحفوظة */}
          {savedDocuments.length > 0 ? (
            <div className="space-y-2">
              {savedDocuments.map((doc) => {
                // تحديد نوع المستند وحالته
                const isReceivedQuote = doc.type === 'quotation_request' || doc.source === 'public_form';
                const isApproved = doc.status === 'approved';
                const isRejected = doc.status === 'rejected';
                const isPending = !isApproved && !isRejected;
                
                return (
                  <div 
                    key={doc.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isReceivedQuote 
                        ? isPending 
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:border-orange-400'
                          : isApproved
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-gray-50 border-red-200'
                        : 'bg-gradient-to-r from-gray-50 to-white border-gray-100 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isReceivedQuote
                          ? isPending ? 'bg-orange-100' : isApproved ? 'bg-green-100' : 'bg-red-100'
                          : doc.type === 'quotation' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {isReceivedQuote ? (
                          isPending ? (
                            <Clock className="w-5 h-5 text-orange-600" />
                          ) : isApproved ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )
                        ) : doc.type === 'quotation' ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-sm">
                            {isReceivedQuote ? 'طلب عرض سعر مستلم' : doc.typeName}
                          </p>
                          {isReceivedQuote && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                isPending 
                                  ? 'border-orange-400 text-orange-600 bg-orange-50' 
                                  : isApproved 
                                    ? 'border-green-400 text-green-600 bg-green-50'
                                    : 'border-red-400 text-red-600 bg-red-50'
                              }`}
                            >
                              {isPending ? 'بانتظار الرد' : isApproved ? 'تمت الموافقة' : 'مرفوض'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString('ar-SA')} 
                          {doc.total > 0 && ` • ${doc.total?.toLocaleString()} ر.س`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* زر الرد للمستندات المستلمة */}
                      {isReceivedQuote && isPending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReceivedDoc(doc)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">رد</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isReceivedQuote) {
                            setSelectedReceivedDoc(doc);
                          } else {
                            setSelectedDocument(doc);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // حذف المستند
                          const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
                          const customerIndex = customers.findIndex((c: any) => c.id === customer.id || c.phone === customer.phone);
                          if (customerIndex !== -1 && customers[customerIndex].documents) {
                            customers[customerIndex].documents = customers[customerIndex].documents.filter((d: any) => d.id !== doc.id);
                            localStorage.setItem('crm_customers', JSON.stringify(customers));
                            setSavedDocuments(prev => prev.filter(d => d.id !== doc.id));
                            toast.success('تم حذف المستند');
                          }
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-gray-600">
                <Upload className="w-4 h-4" />
                رفع PDF, Word, Excel
              </Button>
            </div>
          )}
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

      {/* مودال المستندات المالية */}
      {showFinancialForm && (
        <FinancialDocumentModal
          customerName={customer.name}
          customerPhone={customer.phone}
          customerId={customer.id}
          userData={{
            name: businessCardData.name || 'الوسيط',
            companyName: businessCardData.companyName || '',
            falLicense: businessCardData.falLicense || '',
            phone: businessCardData.phone || '',
            profileImage: businessCardData.profileImageUrl || undefined,
            logoImage: businessCardData.logoUrl || undefined,
          }}
          onClose={() => setShowFinancialForm(false)}
        />
      )}

      {/* مودال معاينة المستند المحفوظ */}
      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          userData={{
            profileImage: businessCardData.profileImageUrl || undefined,
            logoImage: businessCardData.logoUrl || undefined,
          }}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* مودال الرد على طلب عرض السعر المستلم */}
      {selectedReceivedDoc && (
        <ReceivedQuoteResponseModal
          document={selectedReceivedDoc}
          userData={{
            name: businessCardData.name || 'الوسيط',
            companyName: businessCardData.companyName || '',
            falLicense: businessCardData.falLicense || '',
            phone: businessCardData.phone || '',
            profileImage: businessCardData.profileImageUrl || undefined,
            logoImage: businessCardData.logoUrl || undefined,
          }}
          onClose={() => setSelectedReceivedDoc(null)}
          onRespond={(response) => {
            // تحديث المستند في القائمة
            setSavedDocuments(prev => 
              prev.map(d => d.id === selectedReceivedDoc.id ? { ...d, ...response } : d)
            );
            setSelectedReceivedDoc(null);
          }}
        />
      )}
    </div>
  );
}
