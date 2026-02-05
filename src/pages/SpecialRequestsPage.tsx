/**
 * SpecialRequestsPage.tsx
 * صفحة الطلبات الخاصة - البحث عن عقارات بمواصفات محددة
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Target, Plus, Search, Clock, CheckCircle, MapPin, Building, Home,
  Send, Loader2, ArrowRight, Zap, AlertCircle, DollarSign, Eye,
  Navigation, Satellite, Map as MapIcon, Calendar, User, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// أنواع العقارات
const propertyTypes = [
  { id: 'apartment', label: 'شقة', icon: '🏢' },
  { id: 'villa', label: 'فيلا', icon: '🏡' },
  { id: 'land', label: 'أرض', icon: '🏞️' },
  { id: 'building', label: 'عمارة', icon: '🏢' },
  { id: 'duplex', label: 'دبلكس', icon: '🏘️' },
  { id: 'commercial', label: 'تجاري', icon: '🏬' },
  { id: 'farm', label: 'مزرعة', icon: '🌾' },
  { id: 'other', label: 'أخرى', icon: '📦' },
];

// المدن السعودية
const saudiCities = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
  'الخبر', 'تبوك', 'أبها', 'الطائف', 'حائل', 'ينبع', 'الجبيل'
];

// مستويات الاستعجال
const urgencyLevels = [
  { id: 'normal', label: 'عادي', description: 'أسبوع - أسبوعين', color: 'bg-gray-100 text-gray-700' },
  { id: 'urgent', label: 'مستعجل', description: '3-5 أيام', color: 'bg-amber-100 text-amber-700' },
  { id: 'very_urgent', label: 'مستعجل جداً', description: '24 ساعة', color: 'bg-red-100 text-red-700' },
];

interface SpecialRequest {
  id: string;
  property_type: string;
  city: string;
  district: string | null;
  specific_location: string | null;
  min_area: number | null;
  max_area: number | null;
  description: string | null;
  urgency: string;
  status: string;
  admin_response: string | null;
  found_count: number;
  payment_status: string;
  created_at: string;
}

export default function SpecialRequestsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<SpecialRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // نموذج الطلب
  const [formData, setFormData] = useState({
    propertyType: '',
    city: '',
    district: '',
    specificLocation: '',
    googleMapsLink: '',
    lat: null as number | null,
    lng: null as number | null,
    street: '',
    buildingNumber: '',
    postalCode: '',
    nationalAddress: '',
    minArea: '',
    maxArea: '',
    description: '',
    urgency: 'normal',
  });

  // خريطة
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street'>('satellite');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  // تحميل طلباتي
  useEffect(() => {
    if (isAuthenticated && user) {
      loadMyRequests();
    }
  }, [isAuthenticated, user]);

  const loadMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('special_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // تهيئة الخريطة
  useEffect(() => {
    if (activeTab !== 'create') return;
    if (!mapContainer.current || mapRef.current) return;

    // تأخير قليل للتأكد من تحميل الـ container
    const timer = setTimeout(() => {
      if (!mapContainer.current) return;

      mapRef.current = L.map(mapContainer.current, {
        center: [24.7136, 46.6753],
        zoom: 10,
        zoomControl: true,
      });

      streetLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      });

      satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© ESRI',
        maxZoom: 19,
      });

      satelliteLayerRef.current.addTo(mapRef.current);

      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else if (mapRef.current) {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
          markerRef.current.on('dragend', (ev) => {
            const pos = ev.target.getLatLng();
            fetchAddressFromCoordinates(pos.lat, pos.lng);
          });
        }
        fetchAddressFromCoordinates(lat, lng);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [activeTab]);

  // دالة جلب العنوان من الإحداثيات
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`
      );
      const data = await response.json();

      if (data?.address) {
        const addr = data.address;
        const district = addr.suburb || addr.neighbourhood || addr.quarter || '';
        const city = addr.city || addr.town || addr.county || '';

        setFormData(prev => ({
          ...prev,
          city: city || prev.city,
          district: district.replace(/^حي\s*/i, '').trim() || prev.district,
          street: addr.road || addr.street || '',
          buildingNumber: addr.house_number || '',
          postalCode: addr.postcode || '',
          lat,
          lng,
          nationalAddress: `${addr.house_number || ''}, ${addr.road || ''}, ${district}, ${city}, ${addr.postcode || ''}`.trim(),
          googleMapsLink: `https://www.google.com/maps?q=${lat},${lng}`,
        }));
        toast.success('تم تحديد الموقع بنجاح');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('فشل في جلب العنوان');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // تبديل طبقة الخريطة
  const toggleMapLayer = () => {
    if (!mapRef.current) return;
    if (mapLayer === 'satellite') {
      if (satelliteLayerRef.current) mapRef.current.removeLayer(satelliteLayerRef.current);
      if (streetLayerRef.current) streetLayerRef.current.addTo(mapRef.current);
      setMapLayer('street');
    } else {
      if (streetLayerRef.current) mapRef.current.removeLayer(streetLayerRef.current);
      if (satelliteLayerRef.current) satelliteLayerRef.current.addTo(mapRef.current);
      setMapLayer('satellite');
    }
  };

  // موقعي الحالي
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
                fetchAddressFromCoordinates(pos.lat, pos.lng);
              });
            }
            fetchAddressFromCoordinates(latitude, longitude);
          }
        },
        () => toast.error('فشل في تحديد الموقع')
      );
    }
  };

  // إرسال الطلب
  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/app/login');
      return;
    }

    if (!formData.propertyType || !formData.city) {
      toast.error('يرجى تحديد نوع العقار والمدينة');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('special_requests').insert({
        user_id: user.id,
        property_type: formData.propertyType,
        city: formData.city,
        district: formData.district || null,
        specific_location: formData.specificLocation || null,
        google_maps_link: formData.googleMapsLink || null,
        lat: formData.lat,
        lng: formData.lng,
        street: formData.street || null,
        building_number: formData.buildingNumber || null,
        postal_code: formData.postalCode || null,
        national_address: formData.nationalAddress || null,
        min_area: formData.minArea ? parseFloat(formData.minArea) : null,
        max_area: formData.maxArea ? parseFloat(formData.maxArea) : null,
        description: formData.description || null,
        urgency: formData.urgency,
      });

      if (error) throw error;

      toast.success('تم إرسال طلبك بنجاح! سنبحث لك في قاعدة بياناتنا');
      setFormData({
        propertyType: '', city: '', district: '', specificLocation: '',
        googleMapsLink: '', lat: null, lng: null, street: '', buildingNumber: '',
        postalCode: '', nationalAddress: '', minArea: '', maxArea: '',
        description: '', urgency: 'normal',
      });
      loadMyRequests();
      setActiveTab('my-requests');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('فشل في إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  // حالة الطلب
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700' },
      searching: { label: 'جاري البحث', color: 'bg-blue-100 text-blue-700' },
      found: { label: 'تم الإيجاد', color: 'bg-green-100 text-green-700' },
      paid: { label: 'تم الدفع', color: 'bg-purple-100 text-purple-700' },
      completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700' },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
    };
    const s = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  // نوع العقار
  const getPropertyTypeLabel = (type: string) => {
    const pt = propertyTypes.find(p => p.id === type);
    return pt ? `${pt.icon} ${pt.label}` : type;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Target className="w-16 h-16 mx-auto text-purple-600 mb-4" />
          <h2 className="text-xl font-bold mb-2">الطلبات الخاصة</h2>
          <p className="text-gray-600 mb-6">يجب تسجيل الدخول للوصول لهذه الخدمة</p>
          <Button onClick={() => navigate('/app/login')} className="bg-[#01411C]">
            تسجيل الدخول
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-[#D4AF37]" />
            <h1 className="text-lg font-bold">الطلبات الخاصة</h1>
          </div>
          <Badge className="bg-[#D4AF37] text-[#01411C]">VIP</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إنشاء طلب جديد
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              طلباتي ({myRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* تبويب إنشاء طلب جديد */}
          <TabsContent value="create" className="space-y-4">
            {/* شرح النظام */}
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Zap className="w-5 h-5" />
                  اطلب عقارك المثالي
                </CardTitle>
                <CardDescription>
                  أدخل المواصفات الدقيقة للعقار الذي تبحث عنه وسنبحث لك في قاعدة بياناتنا
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border">
                    <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center font-bold">1</span>
                    <span>أدخل مواصفات العقار بدقة</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border">
                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center font-bold">2</span>
                    <span>سنبحث في قاعدة بياناتنا عن عقار مطابق</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border">
                    <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center font-bold">3</span>
                    <span>عند الإيجاد: ستصلك رسالة فورية</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border">
                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center font-bold">4</span>
                    <span>ادفع رسوم المعلومات واحصل على تفاصيل العقار</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* نوع العقار */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#01411C]" />
                  نوع العقار <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData(prev => ({ ...prev, propertyType: type.id }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        formData.propertyType === type.id
                          ? 'border-[#01411C] bg-green-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الموقع */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#01411C]" />
                  الموقع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* المدينة */}
                <div>
                  <Label>المدينة <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {saudiCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setFormData(prev => ({ ...prev, city }))}
                        className={`p-2 rounded-lg border text-sm transition-all ${
                          formData.city === city
                            ? 'border-[#01411C] bg-green-50 font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* الحي */}
                <div>
                  <Label>الحي (اختياري)</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    placeholder="مثال: حي النرجس"
                    className="mt-1"
                  />
                </div>

                {/* موقع محدد */}
                <div>
                  <Label>موقع محدد (اختياري)</Label>
                  <Input
                    value={formData.specificLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, specificLocation: e.target.value }))}
                    placeholder="مثال: قريب من مدرسة الأمل، بجانب مسجد الهدى"
                    className="mt-1"
                  />
                </div>

                {/* الخريطة */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>حدد الموقع على الخريطة</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={toggleMapLayer}>
                        {mapLayer === 'satellite' ? <MapIcon className="w-4 h-4" /> : <Satellite className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToMyLocation} disabled={isLoadingLocation}>
                        {isLoadingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div ref={mapContainer} className="h-[250px] rounded-xl border-2 border-gray-200 overflow-hidden" />
                  {formData.nationalAddress && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                      📍 {formData.nationalAddress}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* المساحة */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">المساحة (اختياري)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الحد الأدنى (م²)</Label>
                    <Input
                      type="number"
                      value={formData.minArea}
                      onChange={(e) => setFormData(prev => ({ ...prev, minArea: e.target.value }))}
                      placeholder="100"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>الحد الأقصى (م²)</Label>
                    <Input
                      type="number"
                      value={formData.maxArea}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxArea: e.target.value }))}
                      placeholder="500"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* وصف تفصيلي */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">وصف تفصيلي (اختياري)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="أي تفاصيل إضافية تساعدنا في البحث..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* مدى الاستعجال */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">مدى الاستعجال</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {urgencyLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setFormData(prev => ({ ...prev, urgency: level.id }))}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.urgency === level.id
                          ? 'border-[#01411C] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-sm font-bold mb-1 ${level.color} inline-block px-2 py-1 rounded`}>
                        {level.label}
                      </div>
                      <div className="text-xs text-gray-500">{level.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* زر الإرسال */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.propertyType || !formData.city}
              className="w-full h-14 text-lg bg-gradient-to-r from-[#01411C] to-[#065f41] hover:from-[#016630] hover:to-[#01411C]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 ml-2" />
                  إرسال الطلب
                </>
              )}
            </Button>
          </TabsContent>

          {/* تبويب طلباتي */}
          <TabsContent value="my-requests">
            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#01411C]" />
              </div>
            ) : myRequests.length === 0 ? (
              <Card className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">لا توجد طلبات بعد</h3>
                <p className="text-gray-400 mb-4">أنشئ طلبك الأول للبحث عن عقار</p>
                <Button onClick={() => setActiveTab('create')} className="bg-[#01411C]">
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء طلب جديد
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {myRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{propertyTypes.find(p => p.id === request.property_type)?.icon || '🏠'}</span>
                          <div>
                            <div className="font-bold">{getPropertyTypeLabel(request.property_type)}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {request.city} {request.district && `- ${request.district}`}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      {request.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.description}</p>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(request.created_at).toLocaleDateString('ar-SA')}
                        </div>
                        {request.found_count > 0 && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            {request.found_count} نتيجة
                          </Badge>
                        )}
                      </div>

                      {request.admin_response && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-medium mb-1">رد الإدارة:</div>
                          <p className="text-sm text-blue-800">{request.admin_response}</p>
                        </div>
                      )}

                      {request.status === 'found' && request.payment_status === 'unpaid' && (
                        <Button className="w-full mt-3 bg-[#D4AF37] text-[#01411C] hover:bg-[#c9a431]">
                          <DollarSign className="w-4 h-4 ml-2" />
                          ادفع للحصول على المعلومات
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
