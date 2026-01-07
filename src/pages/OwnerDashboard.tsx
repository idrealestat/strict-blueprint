/**
 * OwnerDashboard.tsx
 * لوحة تحكم المالك - إدارة Slugs + Feature Flags + طلبات النطاقات
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Shield, Check, X, Clock, Search, RefreshCw, Users, Settings,
  Crown, Globe, Lock, Unlock, UserCheck, ChevronLeft, Eye, EyeOff,
  Save, AlertTriangle, ArrowRight
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface DomainRequest {
  id: string;
  user_id: string;
  requested_title: string;
  company_name: string | null;
  status: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  priority_level: number | null;
}

interface SlugRegistryEntry {
  id: string;
  slug: string;
  status: string;
  owner_user_id: string | null;
  reserve_to_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UserFeatureFlags {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  publishing_enabled: boolean;
  smart_paths_enabled: boolean;
  spatial_intelligence_enabled: boolean;
  offers_requests_enabled: boolean;
  quick_calculator_enabled: boolean;
  left_slider_enabled: boolean;
  right_slider_mediation_course_enabled: boolean;
  right_slider_team_management_enabled: boolean;
  right_slider_workspace_enabled: boolean;
  business_card_add_colleague_enabled: boolean;
}

interface FirstNameException {
  id: string;
  first_name_normalized: string;
  allowed_user_id: string | null;
  allowed_email: string | null;
  is_enabled: boolean;
  notes: string | null;
}

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests");
  const [isLoading, setIsLoading] = useState(true);
  
  // طلبات النطاقات
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState("all");
  const [requestSearch, setRequestSearch] = useState("");
  
  // Slug Registry
  const [slugRegistry, setSlugRegistry] = useState<SlugRegistryEntry[]>([]);
  const [slugSearch, setSlugSearch] = useState("");
  const [slugFilter, setSlugFilter] = useState("all");
  
  // Feature Flags
  const [userFlags, setUserFlags] = useState<UserFeatureFlags[]>([]);
  const [flagSearch, setFlagSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserFeatureFlags | null>(null);
  
  // First Name Exceptions
  const [exceptions, setExceptions] = useState<FirstNameException[]>([]);
  const [newException, setNewException] = useState({ name: "", notes: "" });
  
  // Dialogs
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: DomainRequest | null }>({ open: false, request: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: DomainRequest | null; reason: string }>({ open: false, request: null, reason: "" });
  const [slugActionDialog, setSlugActionDialog] = useState<{ open: boolean; slug: SlugRegistryEntry | null; action: string }>({ open: false, slug: null, action: "" });

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. طلبات النطاقات
      const { data: requestsData, error: requestsError } = await supabase
        .from('domain_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!requestsError) setRequests(requestsData || []);

      // 2. Slug Registry
      const { data: slugData, error: slugError } = await supabase
        .from('slug_registry')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!slugError) setSlugRegistry(slugData || []);

      // 3. Feature Flags with user info
      const { data: flagsData, error: flagsError } = await supabase
        .from('feature_flags')
        .select('*');
      
      if (!flagsError && flagsData) {
        // Get user emails from profiles
        const userIds = flagsData.map(f => f.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const { data: cards } = await supabase
          .from('business_cards')
          .select('user_id, email, data')
          .in('user_id', userIds);

        const flagsWithUsers = flagsData.map(flag => {
          const profile = profiles?.find(p => p.user_id === flag.user_id);
          const card = cards?.find(c => c.user_id === flag.user_id);
          const cardData = card?.data as any;
          return {
            ...flag,
            user_email: card?.email || cardData?.email || 'غير معروف',
            user_name: profile?.full_name || cardData?.name || cardData?.userName || 'غير معروف',
          };
        });
        setUserFlags(flagsWithUsers);
      }

      // 4. First Name Exceptions
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from('slug_firstname_exceptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!exceptionsError) setExceptions(exceptionsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =============== طلبات النطاقات ===============
  const handleApproveRequest = async () => {
    if (!approveDialog.request) return;
    const request = approveDialog.request;

    try {
      // 1. تحديث حالة الطلب
      const { error: updateError } = await supabase
        .from('domain_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 2. تحديث business_cards.slug
      const { error: cardError } = await supabase
        .from('business_cards')
        .update({ slug: request.requested_title })
        .eq('user_id', request.user_id);

      if (cardError) throw cardError;

      // 3. تحديث/إنشاء slug_registry
      const { error: registryError } = await supabase
        .from('slug_registry')
        .upsert({
          slug: request.requested_title,
          status: 'closed',
          owner_user_id: request.user_id,
          notes: `تمت الموافقة عبر لوحة المالك`
        }, { onConflict: 'slug' });

      if (registryError) throw registryError;

      toast.success('تمت الموافقة على الطلب بنجاح');
      setApproveDialog({ open: false, request: null });
      fetchData();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'حدث خطأ في الموافقة');
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectDialog.request) return;

    try {
      const { error } = await supabase
        .from('domain_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectDialog.reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', rejectDialog.request.id);

      if (error) throw error;

      toast.success('تم رفض الطلب');
      setRejectDialog({ open: false, request: null, reason: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في الرفض');
    }
  };

  // =============== Slug Registry ===============
  const handleSlugAction = async () => {
    if (!slugActionDialog.slug) return;
    const { slug, action } = slugActionDialog;

    try {
      let updateData: any = { updated_at: new Date().toISOString() };
      
      switch (action) {
        case 'open':
          updateData.status = 'open';
          updateData.owner_user_id = null;
          updateData.reserve_to_user_id = null;
          break;
        case 'close':
          updateData.status = 'closed';
          break;
        case 'block':
          updateData.status = 'blocked';
          break;
      }

      const { error } = await supabase
        .from('slug_registry')
        .update(updateData)
        .eq('id', slug.id);

      if (error) throw error;

      toast.success('تم تحديث حالة الـ slug');
      setSlugActionDialog({ open: false, slug: null, action: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // =============== Feature Flags ===============
  const handleFlagChange = async (userId: string, flagKey: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ [flagKey]: value, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      setUserFlags(prev => prev.map(f => 
        f.user_id === userId ? { ...f, [flagKey]: value } : f
      ));
      
      toast.success('تم تحديث الإعداد');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // =============== First Name Exceptions ===============
  const handleAddException = async () => {
    if (!newException.name.trim()) {
      toast.error('أدخل الاسم');
      return;
    }

    try {
      const { error } = await supabase
        .from('slug_firstname_exceptions')
        .insert({
          first_name_normalized: newException.name.trim(),
          notes: newException.notes || null,
          is_enabled: true
        });

      if (error) throw error;

      toast.success('تم إضافة الاستثناء');
      setNewException({ name: "", notes: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleToggleException = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('slug_firstname_exceptions')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;
      
      setExceptions(prev => prev.map(e => 
        e.id === id ? { ...e, is_enabled: enabled } : e
      ));
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // =============== Filters ===============
  const filteredRequests = requests.filter(r => {
    const matchesFilter = requestFilter === 'all' || r.status === requestFilter;
    const matchesSearch = !requestSearch || 
      r.requested_title.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.company_name || '').toLowerCase().includes(requestSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredSlugs = slugRegistry.filter(s => {
    const matchesFilter = slugFilter === 'all' || s.status === slugFilter;
    const matchesSearch = !slugSearch || s.slug.toLowerCase().includes(slugSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredFlags = userFlags.filter(f => {
    if (!flagSearch) return true;
    const search = flagSearch.toLowerCase();
    return (f.user_email || '').toLowerCase().includes(search) ||
           (f.user_name || '').toLowerCase().includes(search);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">قيد الانتظار</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">مُعتمد</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">مرفوض</Badge>;
      case 'open': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">متاح</Badge>;
      case 'closed': return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">مغلق</Badge>;
      case 'reserved': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">محجوز</Badge>;
      case 'blocked': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">محظور</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b-2 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/app/dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              <h1 className="text-xl font-bold text-white">لوحة تحكم المالك</h1>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchData}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              طلبات الـ Slugs
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <Badge className="bg-red-500 text-white text-xs">{requests.filter(r => r.status === 'pending').length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="slugs" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              إدارة الـ Slugs
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              الميزات
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              استثناءات
            </TabsTrigger>
          </TabsList>

          {/* =============== Tab 1: طلبات النطاقات =============== */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#01411C]" />
                  طلبات الـ Slugs
                </CardTitle>
                <CardDescription>مراجعة والموافقة على طلبات النطاقات</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="بحث بالنطاق أو اسم الشركة..."
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={requestFilter} onValueChange={setRequestFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="فلترة بالحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="approved">معتمد</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>النطاق</TableHead>
                        <TableHead>الشركة</TableHead>
                        <TableHead>الأولوية</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.requested_title}</TableCell>
                          <TableCell>{request.company_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.priority_level === 1 ? 'عالية' : request.priority_level === 2 ? 'متوسطة' : 'عادية'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => setApproveDialog({ open: true, request })}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => setRejectDialog({ open: true, request, reason: "" })}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            لا توجد طلبات
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== Tab 2: إدارة الـ Slugs =============== */}
          <TabsContent value="slugs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#01411C]" />
                  إدارة الـ Slugs
                </CardTitle>
                <CardDescription>إدارة جميع النطاقات المسجلة</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="بحث بالـ slug..."
                      value={slugSearch}
                      onChange={(e) => setSlugSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={slugFilter} onValueChange={setSlugFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="فلترة بالحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="open">متاح</SelectItem>
                      <SelectItem value="closed">مغلق</SelectItem>
                      <SelectItem value="reserved">محجوز</SelectItem>
                      <SelectItem value="blocked">محظور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الـ Slug</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>المالك</TableHead>
                        <TableHead>ملاحظات</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSlugs.map((slug) => (
                        <TableRow key={slug.id}>
                          <TableCell className="font-medium font-mono">{slug.slug}</TableCell>
                          <TableCell>{getStatusBadge(slug.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {slug.owner_user_id ? slug.owner_user_id.slice(0, 8) + '...' : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                            {slug.notes || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(slug.updated_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {slug.status !== 'open' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSlugActionDialog({ open: true, slug, action: 'open' })}
                                >
                                  <Unlock className="w-4 h-4" />
                                </Button>
                              )}
                              {slug.status !== 'closed' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSlugActionDialog({ open: true, slug, action: 'close' })}
                                >
                                  <Lock className="w-4 h-4" />
                                </Button>
                              )}
                              {slug.status !== 'blocked' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => setSlugActionDialog({ open: true, slug, action: 'block' })}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSlugs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            لا توجد نطاقات
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== Tab 3: Feature Flags =============== */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#01411C]" />
                  إدارة الميزات
                </CardTitle>
                <CardDescription>تشغيل/إيقاف الميزات لكل مستخدم</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-4">
                  <Input
                    placeholder="بحث بالإيميل أو الاسم..."
                    value={flagSearch}
                    onChange={(e) => setFlagSearch(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-4">
                  {filteredFlags.map((user) => (
                    <Card key={user.id} className="border">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#01411C] flex items-center justify-center text-white font-bold">
                              {(user.user_name || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{user.user_name}</p>
                              <p className="text-sm text-gray-500">{user.user_email}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                          >
                            {selectedUser?.id === user.id ? 'إخفاء' : 'تعديل'}
                            <ArrowRight className="w-4 h-4 mr-1" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      {selectedUser?.id === user.id && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            {[
                              { key: 'publishing_enabled', label: 'النشر على المنصات' },
                              { key: 'smart_paths_enabled', label: 'المسارات الذكية' },
                              { key: 'spatial_intelligence_enabled', label: 'الذكاء المكاني' },
                              { key: 'offers_requests_enabled', label: 'العروض والطلبات' },
                              { key: 'quick_calculator_enabled', label: 'الحاسبة السريعة' },
                              { key: 'left_slider_enabled', label: 'اللفت سلايدر' },
                              { key: 'right_slider_mediation_course_enabled', label: 'دورة الوساطة' },
                              { key: 'right_slider_team_management_enabled', label: 'إدارة الفريق' },
                              { key: 'right_slider_workspace_enabled', label: 'مساحة العمل' },
                              { key: 'business_card_add_colleague_enabled', label: 'إضافة زميل' },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                                <Label htmlFor={`${user.id}-${key}`} className="text-sm">{label}</Label>
                                <Switch
                                  id={`${user.id}-${key}`}
                                  checked={(user as any)[key]}
                                  onCheckedChange={(checked) => handleFlagChange(user.user_id, key, checked)}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                  
                  {filteredFlags.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا يوجد مستخدمين
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== Tab 4: First Name Exceptions =============== */}
          <TabsContent value="exceptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#01411C]" />
                  استثناءات الاسم الأول
                </CardTitle>
                <CardDescription>إدارة الأسماء المسموحة كـ slugs</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add New */}
                <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <Input
                    placeholder="الاسم الأول (مثل: سلطان)"
                    value={newException.name}
                    onChange={(e) => setNewException(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="ملاحظات (اختياري)"
                    value={newException.notes}
                    onChange={(e) => setNewException(prev => ({ ...prev, notes: e.target.value }))}
                    className="flex-1"
                  />
                  <Button onClick={handleAddException} className="bg-[#01411C] hover:bg-[#065f41]">
                    إضافة
                  </Button>
                </div>

                {/* List */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>مسموح للمستخدم</TableHead>
                        <TableHead>ملاحظات</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exceptions.map((exc) => (
                        <TableRow key={exc.id}>
                          <TableCell className="font-medium">{exc.first_name_normalized}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {exc.allowed_user_id ? exc.allowed_user_id.slice(0, 8) + '...' : 'الجميع'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{exc.notes || '-'}</TableCell>
                          <TableCell>
                            {exc.is_enabled ? (
                              <Badge className="bg-green-100 text-green-700">مفعل</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">معطل</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={exc.is_enabled}
                              onCheckedChange={(checked) => handleToggleException(exc.id, checked)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {exceptions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            لا توجد استثناءات
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* =============== Dialogs =============== */}
      
      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, request: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الموافقة</DialogTitle>
            <DialogDescription>
              سيتم اعتماد النطاق <strong>{approveDialog.request?.requested_title}</strong> للمستخدم ولن يتمكن أي شخص آخر من أخذه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, request: null })}>
              إلغاء
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveRequest}>
              <Check className="w-4 h-4 ml-2" />
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, request: null, reason: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>
              أدخل سبب رفض النطاق <strong>{rejectDialog.request?.requested_title}</strong>
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="سبب الرفض..."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, request: null, reason: "" })}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleRejectRequest}>
              <X className="w-4 h-4 ml-2" />
              رفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slug Action Dialog */}
      <Dialog open={slugActionDialog.open} onOpenChange={(open) => setSlugActionDialog({ open, slug: null, action: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {slugActionDialog.action === 'open' && 'فتح الـ Slug'}
              {slugActionDialog.action === 'close' && 'إغلاق الـ Slug'}
              {slugActionDialog.action === 'block' && 'حظر الـ Slug'}
            </DialogTitle>
            <DialogDescription>
              {slugActionDialog.action === 'open' && `سيصبح النطاق "${slugActionDialog.slug?.slug}" متاحاً للتسجيل`}
              {slugActionDialog.action === 'close' && `سيتم إغلاق النطاق "${slugActionDialog.slug?.slug}"`}
              {slugActionDialog.action === 'block' && `سيتم حظر النطاق "${slugActionDialog.slug?.slug}" ولن يتمكن أحد من استخدامه`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugActionDialog({ open: false, slug: null, action: "" })}>
              إلغاء
            </Button>
            <Button 
              variant={slugActionDialog.action === 'block' ? 'destructive' : 'default'}
              onClick={handleSlugAction}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;
