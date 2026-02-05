/**
 * SpecialRequestsAdminPanel.tsx
 * لوحة إدارة الطلبات الخاصة للمالك مع نظام بحث متقدم
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Target, Search, MapPin, Building, Clock, CheckCircle, AlertCircle,
  DollarSign, Send, Loader2, RefreshCw, Eye, MessageSquare, User,
  Phone, Calendar, Zap, Bell, Database, ExternalLink, Copy, Home
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SpecialRequest {
  id: string;
  user_id: string;
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
  admin_notes: string | null;
  found_count: number;
  payment_status: string;
  payment_amount: number;
  matching_listings: any[];
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}

interface ListingResult {
  id: string;
  title: string;
  city: string;
  district: string;
  price: number;
  area: number | null;
  property_type: string;
  broker_name?: string;
  broker_phone?: string;
  owner_name?: string;
  owner_phone?: string;
  national_address?: string;
  google_maps_link?: string;
  plus_code?: string;
  lat?: number;
  lng?: number;
  deed_number?: string;
  deed_date?: string;
  deed_city?: string;
  created_at: string;
  status: string;
}

// أنواع العقارات
const propertyTypes: Record<string, string> = {
  apartment: 'شقة',
  villa: 'فيلا',
  land: 'أرض',
  building: 'عمارة',
  duplex: 'دبلكس',
  commercial: 'تجاري',
  farm: 'مزرعة',
  other: 'أخرى',
};

// المدن الرئيسية
const cities = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
  'الخبر', 'الطائف', 'تبوك', 'أبها', 'حائل', 'الجبيل', 'ينبع'
];

export default function SpecialRequestsAdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SpecialRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchResults, setSearchResults] = useState<ListingResult[]>([]);
  const [adminResponse, setAdminResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // حالات البحث المتقدم
  const [advancedSearchCity, setAdvancedSearchCity] = useState('');
  const [advancedSearchDistrict, setAdvancedSearchDistrict] = useState('');
  const [advancedSearchPropertyType, setAdvancedSearchPropertyType] = useState('');
  const [advancedSearchNationalAddress, setAdvancedSearchNationalAddress] = useState('');
  const [advancedSearchGoogleLink, setAdvancedSearchGoogleLink] = useState('');
  const [advancedSearchPlusCode, setAdvancedSearchPlusCode] = useState('');
  const [advancedSearchResults, setAdvancedSearchResults] = useState<ListingResult[]>([]);
  const [isAdvancedSearching, setIsAdvancedSearching] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingResult | null>(null);
  const [showListingDialog, setShowListingDialog] = useState(false);

  // تحميل الطلبات
  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('special_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedRequests = (data || []).map(r => ({
        ...r,
        user_name: profilesMap.get(r.user_id)?.full_name || 'غير معروف',
        user_phone: profilesMap.get(r.user_id)?.phone || '',
        matching_listings: Array.isArray(r.matching_listings) ? r.matching_listings : [],
      }));

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('فشل في تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  };

  // البحث المتقدم في قاعدة البيانات
  const performAdvancedSearch = async () => {
    if (!advancedSearchCity && !advancedSearchDistrict && !advancedSearchNationalAddress && 
        !advancedSearchGoogleLink && !advancedSearchPlusCode && !advancedSearchPropertyType) {
      toast.error('يرجى إدخال معيار بحث واحد على الأقل');
      return;
    }

    setIsAdvancedSearching(true);
    try {
      let query = supabase
        .from('platform_listings')
        .select('id, title, city, district, price, area, property_type, user_id, broker_phone, owner_name, owner_phone, national_address, google_maps_link, plus_code, lat, lng, deed_number, deed_date, deed_city, created_at, status')
        .is('deleted_at', null);

      if (advancedSearchCity) {
        query = query.eq('city', advancedSearchCity);
      }

      if (advancedSearchDistrict) {
        query = query.ilike('district', `%${advancedSearchDistrict}%`);
      }

      if (advancedSearchPropertyType) {
        query = query.eq('property_type', advancedSearchPropertyType);
      }

      if (advancedSearchNationalAddress) {
        query = query.ilike('national_address', `%${advancedSearchNationalAddress}%`);
      }

      if (advancedSearchPlusCode) {
        query = query.ilike('plus_code', `%${advancedSearchPlusCode}%`);
      }

      // البحث برابط قوقل يحتاج معالجة خاصة (استخراج الإحداثيات)
      if (advancedSearchGoogleLink) {
        const coords = extractCoordsFromGoogleLink(advancedSearchGoogleLink);
        if (coords) {
          // البحث ضمن نطاق 500 متر من الموقع
          const latRange = 0.005; // تقريباً 500 متر
          const lngRange = 0.005;
          query = query
            .gte('lat', coords.lat - latRange)
            .lte('lat', coords.lat + latRange)
            .gte('lng', coords.lng - lngRange)
            .lte('lng', coords.lng + lngRange);
        } else {
          query = query.ilike('google_maps_link', `%${advancedSearchGoogleLink}%`);
        }
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // جلب بيانات الوسطاء
      const userIds = [...new Set((data || []).map(l => l.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const results: ListingResult[] = (data || []).map(l => ({
        id: l.id,
        title: l.title,
        city: l.city,
        district: l.district,
        price: l.price,
        area: l.area,
        property_type: l.property_type,
        broker_name: profilesMap.get(l.user_id)?.full_name || 'غير معروف',
        broker_phone: l.broker_phone || profilesMap.get(l.user_id)?.phone || '',
        owner_name: l.owner_name || undefined,
        owner_phone: l.owner_phone || undefined,
        national_address: l.national_address || undefined,
        google_maps_link: l.google_maps_link || undefined,
        plus_code: l.plus_code || undefined,
        lat: l.lat,
        lng: l.lng,
        deed_number: l.deed_number || undefined,
        deed_date: l.deed_date || undefined,
        deed_city: l.deed_city || undefined,
        created_at: l.created_at,
        status: l.status,
      }));

      setAdvancedSearchResults(results);
      toast.success(`تم العثور على ${results.length} عقار`);
    } catch (error) {
      console.error('Error in advanced search:', error);
      toast.error('فشل في البحث');
    } finally {
      setIsAdvancedSearching(false);
    }
  };

  // استخراج الإحداثيات من رابط قوقل
  const extractCoordsFromGoogleLink = (link: string): { lat: number; lng: number } | null => {
    try {
      // محاولة استخراج من رابط مثل: https://maps.google.com/?q=24.7136,46.6753
      const match1 = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match1) {
        return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) };
      }
      
      const match2 = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match2) {
        return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
      }

      const match3 = link.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match3) {
        return { lat: parseFloat(match3[1]), lng: parseFloat(match3[2]) };
      }

      return null;
    } catch {
      return null;
    }
  };

  // البحث عن عقارات مطابقة للطلب
  const searchMatchingListings = async (request: SpecialRequest) => {
    setIsSearching(true);
    try {
      let query = supabase
        .from('platform_listings')
        .select('id, title, city, district, price, area, property_type, user_id, broker_phone, owner_name, owner_phone, national_address, google_maps_link, plus_code, lat, lng, deed_number, deed_date, deed_city, created_at, status')
        .eq('city', request.city)
        .is('deleted_at', null);

      if (request.property_type) {
        query = query.eq('property_type', request.property_type);
      }

      if (request.district) {
        query = query.ilike('district', `%${request.district}%`);
      }

      if (request.min_area) {
        query = query.gte('area', request.min_area);
      }

      if (request.max_area) {
        query = query.lte('area', request.max_area);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      const userIds = [...new Set((data || []).map(l => l.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const results: ListingResult[] = (data || []).map(l => ({
        id: l.id,
        title: l.title,
        city: l.city,
        district: l.district,
        price: l.price,
        area: l.area,
        property_type: l.property_type,
        broker_name: profilesMap.get(l.user_id)?.full_name || 'غير معروف',
        broker_phone: l.broker_phone || profilesMap.get(l.user_id)?.phone || '',
        owner_name: l.owner_name || undefined,
        owner_phone: l.owner_phone || undefined,
        national_address: l.national_address || undefined,
        google_maps_link: l.google_maps_link || undefined,
        plus_code: l.plus_code || undefined,
        lat: l.lat,
        lng: l.lng,
        deed_number: l.deed_number || undefined,
        deed_date: l.deed_date || undefined,
        deed_city: l.deed_city || undefined,
        created_at: l.created_at,
        status: l.status,
      }));

      setSearchResults(results);
      toast.success(`تم العثور على ${results.length} عقار مطابق`);
    } catch (error) {
      console.error('Error searching listings:', error);
      toast.error('فشل في البحث');
    } finally {
      setIsSearching(false);
    }
  };

  // تحديث الطلب
  const updateRequest = async (newStatus: string) => {
    if (!selectedRequest) return;

    setIsSaving(true);
    try {
      const updateData: any = {
        status: newStatus,
        admin_response: adminResponse || null,
        admin_notes: adminNotes || null,
        responded_by: user?.id,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (searchResults.length > 0) {
        updateData.matching_listings = searchResults;
        updateData.found_count = searchResults.length;
      }

      if (paymentAmount) {
        updateData.payment_amount = parseFloat(paymentAmount);
      }

      const { error } = await supabase
        .from('special_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await supabase.from('special_request_notifications').insert({
        user_id: selectedRequest.user_id,
        request_id: selectedRequest.id,
        notification_type: newStatus === 'found' ? 'found' : 'update',
        title: newStatus === 'found' ? 'تم العثور على عقار مطابق!' : 'تحديث على طلبك',
        message: adminResponse || `تم تحديث حالة طلبك إلى: ${getStatusLabel(newStatus)}`,
      });

      toast.success('تم تحديث الطلب وإرسال إشعار للمستخدم');
      setShowDetailsDialog(false);
      loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('فشل في تحديث الطلب');
    } finally {
      setIsSaving(false);
    }
  };

  // نسخ للحافظة
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  // حالات الطلب
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'قيد المراجعة',
      searching: 'جاري البحث',
      found: 'تم الإيجاد',
      paid: 'تم الدفع',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      searching: 'bg-blue-100 text-blue-700',
      found: 'bg-green-100 text-green-700',
      paid: 'bg-purple-100 text-purple-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return <Badge className={statusColors[status] || 'bg-gray-100'}>{getStatusLabel(status)}</Badge>;
  };

  const getUrgencyLabel = (urgency: string) => {
    const urgencyMap: Record<string, { label: string; color: string }> = {
      normal: { label: 'عادي', color: 'bg-gray-100 text-gray-700' },
      urgent: { label: 'مستعجل', color: 'bg-amber-100 text-amber-700' },
      very_urgent: { label: 'مستعجل جداً', color: 'bg-red-100 text-red-700' },
    };
    const u = urgencyMap[urgency] || { label: urgency, color: 'bg-gray-100' };
    return <Badge className={u.color}>{u.label}</Badge>;
  };

  const openRequestDetails = (request: SpecialRequest) => {
    setSelectedRequest(request);
    setAdminResponse(request.admin_response || '');
    setAdminNotes(request.admin_notes || '');
    setPaymentAmount(request.payment_amount?.toString() || '');
    setSearchResults(request.matching_listings || []);
    setShowDetailsDialog(true);
  };

  const openListingDetails = (listing: ListingResult) => {
    setSelectedListing(listing);
    setShowListingDialog(true);
  };

  // مسح نتائج البحث المتقدم
  const clearAdvancedSearch = () => {
    setAdvancedSearchCity('');
    setAdvancedSearchDistrict('');
    setAdvancedSearchPropertyType('');
    setAdvancedSearchNationalAddress('');
    setAdvancedSearchGoogleLink('');
    setAdvancedSearchPlusCode('');
    setAdvancedSearchResults([]);
  };

  // إحصائيات
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    searching: requests.filter(r => r.status === 'searching').length,
    found: requests.filter(r => r.status === 'found').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            الطلبات الخاصة
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            بحث في قاعدة العروض
          </TabsTrigger>
        </TabsList>

        {/* تبويب الطلبات الخاصة */}
        <TabsContent value="requests" className="space-y-6">
          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
                <div className="text-sm text-gray-600">إجمالي الطلبات</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">قيد المراجعة</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.searching}</div>
                <div className="text-sm text-gray-600">جاري البحث</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.found}</div>
                <div className="text-sm text-gray-600">تم الإيجاد</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-emerald-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">{stats.completed}</div>
                <div className="text-sm text-gray-600">مكتمل</div>
              </CardContent>
            </Card>
          </div>

          {/* الفلترة */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  الطلبات الخاصة
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">قيد المراجعة</SelectItem>
                      <SelectItem value="searching">جاري البحث</SelectItem>
                      <SelectItem value="found">تم الإيجاد</SelectItem>
                      <SelectItem value="paid">تم الدفع</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={loadRequests} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p>لا توجد طلبات</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الوسيط</TableHead>
                        <TableHead className="text-right">نوع العقار</TableHead>
                        <TableHead className="text-right">الموقع</TableHead>
                        <TableHead className="text-right">الاستعجال</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.user_name}</div>
                              {request.user_phone && (
                                <div className="text-xs text-gray-500">{request.user_phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{propertyTypes[request.property_type] || request.property_type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {request.city}
                              {request.district && ` - ${request.district}`}
                            </div>
                          </TableCell>
                          <TableCell>{getUrgencyLabel(request.urgency)}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRequestDetails(request)}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              عرض
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب البحث في قاعدة العروض */}
        <TabsContent value="database" className="space-y-6">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                البحث المتقدم في قاعدة العروض
              </CardTitle>
              <CardDescription>
                ابحث عن العقارات المعروضة من الوسطاء باستخدام معايير متعددة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* معايير البحث */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* المدينة */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    المدينة
                  </Label>
                  <Select value={advancedSearchCity} onValueChange={setAdvancedSearchCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* الحي */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-500" />
                    الحي
                  </Label>
                  <Input
                    value={advancedSearchDistrict}
                    onChange={(e) => setAdvancedSearchDistrict(e.target.value)}
                    placeholder="مثال: حي النرجس"
                  />
                </div>

                {/* نوع العقار */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    نوع العقار
                  </Label>
                  <Select value={advancedSearchPropertyType} onValueChange={setAdvancedSearchPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(propertyTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* العنوان الوطني */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    العنوان الوطني
                  </Label>
                  <Input
                    value={advancedSearchNationalAddress}
                    onChange={(e) => setAdvancedSearchNationalAddress(e.target.value)}
                    placeholder="مثال: AAAA1234"
                  />
                </div>

                {/* رابط قوقل */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-red-500" />
                    رابط قوقل ماب
                  </Label>
                  <Input
                    value={advancedSearchGoogleLink}
                    onChange={(e) => setAdvancedSearchGoogleLink(e.target.value)}
                    placeholder="الصق رابط قوقل ماب هنا"
                    dir="ltr"
                  />
                </div>

                {/* Plus Code */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    Plus Code (OLC)
                  </Label>
                  <Input
                    value={advancedSearchPlusCode}
                    onChange={(e) => setAdvancedSearchPlusCode(e.target.value)}
                    placeholder="مثال: 7V69+HQ"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* أزرار البحث */}
              <div className="flex gap-2">
                <Button
                  onClick={performAdvancedSearch}
                  disabled={isAdvancedSearching}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAdvancedSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Search className="w-4 h-4 ml-2" />
                  )}
                  بحث
                </Button>
                <Button variant="outline" onClick={clearAdvancedSearch}>
                  مسح
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* نتائج البحث */}
          {advancedSearchResults.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  نتائج البحث ({advancedSearchResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {advancedSearchResults.map((listing) => (
                      <Card 
                        key={listing.id} 
                        className="border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => openListingDetails(listing)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="font-bold text-lg">{listing.title}</div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4" />
                                {listing.city} - {listing.district}
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <Badge variant="outline">{propertyTypes[listing.property_type] || listing.property_type}</Badge>
                                {listing.area && <span>{listing.area} م²</span>}
                                <span className="text-green-600 font-bold">{listing.price?.toLocaleString()} ريال</span>
                              </div>
                            </div>
                            <div className="text-left space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{listing.broker_name}</span>
                              </div>
                              {listing.broker_phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Phone className="w-3 h-3" />
                                  <span dir="ltr">{listing.broker_phone}</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-400">
                                {new Date(listing.created_at).toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* نافذة تفاصيل الطلب */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              تفاصيل الطلب
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* معلومات الطلب */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات الوسيط</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedRequest.user_name}</span>
                    </div>
                    {selectedRequest.user_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedRequest.user_phone}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedRequest.user_phone!)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">العقار المطلوب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{propertyTypes[selectedRequest.property_type] || selectedRequest.property_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{selectedRequest.city} {selectedRequest.district && `- ${selectedRequest.district}`}</span>
                    </div>
                    {selectedRequest.specific_location && (
                      <div className="text-sm text-gray-600">{selectedRequest.specific_location}</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selectedRequest.description && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">الوصف</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedRequest.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* البحث عن عقارات مطابقة */}
              <Card className="border-2 border-blue-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      البحث في قاعدة البيانات
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => searchMatchingListings(selectedRequest)}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Search className="w-4 h-4 ml-2" />
                      )}
                      بحث
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {searchResults.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((listing) => (
                        <div
                          key={listing.id}
                          className="p-3 border rounded-lg bg-green-50 border-green-200 cursor-pointer hover:bg-green-100"
                          onClick={() => openListingDetails(listing)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{listing.title}</div>
                              <div className="text-sm text-gray-600">
                                {listing.city} - {listing.district}
                              </div>
                              <div className="text-sm text-green-600 font-bold">
                                {listing.price?.toLocaleString()} ريال
                              </div>
                            </div>
                            <div className="text-left text-sm">
                              <div className="font-medium">{listing.broker_name}</div>
                              {listing.broker_phone && (
                                <div className="text-gray-500">{listing.broker_phone}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      اضغط على "بحث" للبحث عن عقارات مطابقة
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* الرد */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">الرد على الوسيط</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الرسالة للوسيط</Label>
                    <Textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="اكتب رسالتك للوسيط..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>ملاحظات داخلية</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="ملاحظات للإدارة فقط..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>مبلغ الدفع (ريال)</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* أزرار الإجراءات */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => updateRequest('searching')}
                  disabled={isSaving}
                >
                  <Search className="w-4 h-4 ml-2" />
                  جاري البحث
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateRequest('found')}
                  disabled={isSaving || searchResults.length === 0}
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  تم الإيجاد ({searchResults.length})
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => updateRequest('completed')}
                  disabled={isSaving}
                >
                  <Send className="w-4 h-4 ml-2" />
                  إرسال المعلومات
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateRequest('cancelled')}
                  disabled={isSaving}
                >
                  إلغاء الطلب
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة تفاصيل العقار */}
      <Dialog open={showListingDialog} onOpenChange={setShowListingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              تفاصيل العقار
            </DialogTitle>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معلومات العقار</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>العنوان:</strong> {selectedListing.title}</div>
                    <div><strong>النوع:</strong> {propertyTypes[selectedListing.property_type] || selectedListing.property_type}</div>
                    <div><strong>الموقع:</strong> {selectedListing.city} - {selectedListing.district}</div>
                    {selectedListing.area && <div><strong>المساحة:</strong> {selectedListing.area} م²</div>}
                    <div><strong>السعر:</strong> <span className="text-green-600 font-bold">{selectedListing.price?.toLocaleString()} ريال</span></div>
                    
                    {/* معلومات الصك */}
                    {selectedListing.deed_number && (
                      <div className="p-2 bg-amber-50 rounded border border-amber-200 space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-amber-700">رقم الصك:</strong> 
                          <span>{selectedListing.deed_number}</span>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedListing.deed_number!)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        {selectedListing.deed_date && (
                          <div className="flex items-center gap-2">
                            <strong className="text-amber-700">تاريخ الصك:</strong> 
                            <span>{selectedListing.deed_date}</span>
                          </div>
                        )}
                        {selectedListing.deed_city && (
                          <div className="flex items-center gap-2">
                            <strong className="text-amber-700">مدينة الصك:</strong> 
                            <span>{selectedListing.deed_city}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedListing.national_address && (
                      <div className="flex items-center gap-2">
                        <strong>العنوان الوطني:</strong> 
                        <span>{selectedListing.national_address}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedListing.national_address!)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {selectedListing.plus_code && (
                      <div className="flex items-center gap-2">
                        <strong>Plus Code:</strong> 
                        <span dir="ltr">{selectedListing.plus_code}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedListing.plus_code!)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {selectedListing.google_maps_link && (
                      <div className="flex items-center gap-2">
                        <strong>رابط قوقل:</strong>
                        <a href={selectedListing.google_maps_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          فتح في قوقل ماب
                        </a>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedListing.google_maps_link!)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* تاريخ الإعلان */}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <strong>تاريخ الإعلان:</strong>
                        <span>{new Date(selectedListing.created_at).toLocaleDateString('ar-SA', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700">معلومات التواصل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-bold text-blue-700 mb-1">الوسيط</div>
                      <div className="flex items-center justify-between">
                        <span>{selectedListing.broker_name}</span>
                        {selectedListing.broker_phone && (
                          <div className="flex items-center gap-1">
                            <span dir="ltr">{selectedListing.broker_phone}</span>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedListing.broker_phone!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(selectedListing.owner_name || selectedListing.owner_phone) && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-bold text-green-700 mb-1">المالك</div>
                        {selectedListing.owner_name && (
                          <div className="flex items-center justify-between">
                            <span>{selectedListing.owner_name}</span>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedListing.owner_name!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {selectedListing.owner_phone && (
                          <div className="flex items-center justify-between mt-1">
                            <span dir="ltr">{selectedListing.owner_phone}</span>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedListing.owner_phone!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-400 text-center">
                      تاريخ الإعلان: {new Date(selectedListing.created_at).toLocaleDateString('ar-SA')}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
