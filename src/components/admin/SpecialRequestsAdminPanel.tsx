/**
 * SpecialRequestsAdminPanel.tsx
 * لوحة إدارة الطلبات الخاصة للمالك
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
  Phone, Calendar, Zap, Bell
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
  // بيانات المستخدم
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}

interface MatchingListing {
  id: string;
  title: string;
  city: string;
  district: string;
  price: number;
  broker_name?: string;
  broker_phone?: string;
  created_at: string;
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

export default function SpecialRequestsAdminPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SpecialRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchResults, setSearchResults] = useState<MatchingListing[]>([]);
  const [adminResponse, setAdminResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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

      // جلب بيانات المستخدمين
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

  // البحث عن عقارات مطابقة
  const searchMatchingListings = async (request: SpecialRequest) => {
    setIsSearching(true);
    try {
      let query = supabase
        .from('platform_listings')
        .select('id, title, city, district, price, user_id, created_at, broker_phone')
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

      // جلب أسماء الوسطاء
      const userIds = [...new Set((data || []).map(l => l.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const results: MatchingListing[] = (data || []).map(l => ({
        id: l.id,
        title: l.title,
        city: l.city,
        district: l.district,
        price: l.price,
        broker_name: profilesMap.get(l.user_id)?.full_name || 'غير معروف',
        broker_phone: l.broker_phone || profilesMap.get(l.user_id)?.phone || '',
        created_at: l.created_at,
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

      // إرسال إشعار للمستخدم
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
                          className="p-3 border rounded-lg bg-green-50 border-green-200"
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
    </div>
  );
}
