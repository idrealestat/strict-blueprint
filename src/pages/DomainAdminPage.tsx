import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Shield, Check, X, Clock, Plus, Trash2, Search, 
  Building2, Globe, AlertTriangle, RefreshCw, FileText,
  Bell, DollarSign, Settings, Crown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface DomainRequest {
  id: string;
  user_id: string;
  requested_title: string;
  company_name: string | null;
  website_url: string | null;
  account_type: string;
  status: string;
  rejection_reason: string | null;
  matched_company: string | null;
  admin_notes: string | null;
  created_at: string;
  price_enabled: boolean;
  price: number | null;
  priority_revoked: boolean;
  priority_level: number | null;
  official_domain_verified: boolean | null;
  owner_type: string | null;
}

interface BlacklistEntry {
  id: string;
  company_name: string;
  company_name_en: string | null;
  domain: string | null;
  domain_root: string | null;
  city: string | null;
  category: string;
  source: string | null;
  confidence_level: number;
  is_active: boolean;
  created_at: string;
}

interface ForbiddenPattern {
  id: string;
  pattern: string;
  pattern_type: string;
  description: string | null;
  is_active: boolean;
}

interface DomainSettings {
  id: string;
  pricing_enabled: boolean;
  default_price: number;
  priority_warning_enabled: boolean;
  priority_warning_message: string;
}

const DomainAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [patterns, setPatterns] = useState<ForbiddenPattern[]>([]);
  const [settings, setSettings] = useState<DomainSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // حالات الحوارات
  const [isAddBlacklistOpen, setIsAddBlacklistOpen] = useState(false);
  const [isAddPatternOpen, setIsAddPatternOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DomainRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [requestPrice, setRequestPrice] = useState<string>("");
  const [enablePriceForRequest, setEnablePriceForRequest] = useState(false);

  // نموذج إضافة للقائمة السوداء
  const [newBlacklistEntry, setNewBlacklistEntry] = useState({
    company_name: "",
    company_name_en: "",
    domain: "",
    city: "",
    category: "مكتب عقاري",
    source: "",
    confidence_level: 100
  });

  // نموذج إضافة نمط محظور
  const [newPattern, setNewPattern] = useState({
    pattern: "",
    pattern_type: "keyword",
    description: ""
  });

  // جلب البيانات
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // جلب طلبات النطاقات
      const { data: requestsData, error: requestsError } = await supabase
        .from('domain_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // جلب القائمة السوداء
      const { data: blacklistData, error: blacklistError } = await supabase
        .from('domain_blacklist')
        .select('*')
        .order('created_at', { ascending: false });

      if (blacklistError) throw blacklistError;
      setBlacklist(blacklistData || []);

      // جلب الأنماط المحظورة
      const { data: patternsData, error: patternsError } = await supabase
        .from('forbidden_patterns')
        .select('*')
        .order('created_at', { ascending: false });

      if (patternsError) throw patternsError;
      setPatterns(patternsData || []);

      // جلب الإعدادات
      const { data: settingsData, error: settingsError } = await supabase
        .from('domain_settings')
        .select('*')
        .limit(1)
        .single();

      if (!settingsError && settingsData) {
        setSettings(settingsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("حدث خطأ في جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // إرسال إشعار
  const sendNotification = async (
    userId: string, 
    requestId: string, 
    type: string, 
    title: string, 
    message: string
  ) => {
    try {
      await supabase
        .from('domain_notifications')
        .insert({
          user_id: userId,
          request_id: requestId,
          notification_type: type,
          title,
          message
        });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // الموافقة على طلب
  const approveRequest = async (request: DomainRequest) => {
    try {
      const updateData: any = {
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString()
      };

      // إضافة السعر إذا تم تفعيله
      if (enablePriceForRequest && requestPrice) {
        updateData.price_enabled = true;
        updateData.price = parseFloat(requestPrice);
      }

      const { error } = await supabase
        .from('domain_requests')
        .update(updateData)
        .eq('id', request.id);

      if (error) throw error;

      // إرسال إشعار للمستخدم
      let notificationMessage = `تمت الموافقة على طلب النطاق الخاص بك: WasataAI.com/${request.requested_title}`;
      if (enablePriceForRequest && requestPrice) {
        notificationMessage += `\n\nرسوم النطاق: ${requestPrice} ريال`;
      }
      notificationMessage += '\n\n⚠️ تنبيه: أولوية اختيار النطاق دائماً ستكون لمن يملك النطاق الأصلي حتى لو تم اختيارك له قبله أو تم دفع رسوم عليه.';

      await sendNotification(
        request.user_id,
        request.id,
        'approved',
        '✅ تمت الموافقة على طلب النطاق',
        notificationMessage
      );

      toast.success("تمت الموافقة على الطلب وتم إشعار المستخدم");
      setSelectedRequest(null);
      setAdminNotes("");
      setRequestPrice("");
      setEnablePriceForRequest(false);
      fetchData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error("حدث خطأ في الموافقة");
    }
  };

  // رفض طلب
  const rejectRequest = async (request: DomainRequest) => {
    if (!rejectionReason) {
      toast.error("يجب إدخال سبب الرفض");
      return;
    }

    try {
      const { error } = await supabase
        .from('domain_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      // إرسال إشعار للمستخدم
      await sendNotification(
        request.user_id,
        request.id,
        'rejected',
        '❌ تم رفض طلب النطاق',
        `تم رفض طلب النطاق الخاص بك: WasataAI.com/${request.requested_title}\n\nسبب الرفض: ${rejectionReason}\n\nيمكنك اختيار نطاق آخر.`
      );

      toast.success("تم رفض الطلب وتم إشعار المستخدم");
      setSelectedRequest(null);
      setRejectionReason("");
      setAdminNotes("");
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error("حدث خطأ في الرفض");
    }
  };

  // سحب النطاق (عندما يطالب المالك الأصلي)
  const revokeRequest = async (request: DomainRequest) => {
    try {
      const { error } = await supabase
        .from('domain_requests')
        .update({
          status: 'revoked',
          priority_revoked: true,
          priority_revoked_at: new Date().toISOString(),
          original_owner_claimed: true
        })
        .eq('id', request.id);

      if (error) throw error;

      // إرسال إشعار للمستخدم
      await sendNotification(
        request.user_id,
        request.id,
        'revoked',
        '⚠️ تم سحب النطاق - مطالبة المالك الأصلي',
        `نأسف لإبلاغك أنه تم سحب النطاق: WasataAI.com/${request.requested_title}\n\nالسبب: طالب المالك الأصلي للنطاق باستعادته.\n\nكما أوضحنا مسبقاً، أولوية اختيار النطاق دائماً ستكون لمن يملك النطاق الأصلي.\n\nيرجى اختيار نطاق آخر مناسب لك.`
      );

      toast.success("تم سحب النطاق وإشعار المستخدم");
      fetchData();
    } catch (error) {
      console.error('Error revoking request:', error);
      toast.error("حدث خطأ في سحب النطاق");
    }
  };

  // تحديث الإعدادات
  const updateSettings = async (newSettings: Partial<DomainSettings>) => {
    if (!settings) return;
    
    try {
      const { error } = await supabase
        .from('domain_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...newSettings });
      toast.success("تم تحديث الإعدادات");
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error("حدث خطأ في تحديث الإعدادات");
    }
  };

  // إضافة للقائمة السوداء
  const addToBlacklist = async () => {
    if (!newBlacklistEntry.company_name) {
      toast.error("يجب إدخال اسم الشركة");
      return;
    }

    try {
      const domainRoot = newBlacklistEntry.domain
        ? newBlacklistEntry.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('.')[0]
        : null;

      const { error } = await supabase
        .from('domain_blacklist')
        .insert({
          ...newBlacklistEntry,
          domain_root: domainRoot
        });

      if (error) throw error;

      toast.success("تمت إضافة الشركة للقائمة السوداء");
      setIsAddBlacklistOpen(false);
      setNewBlacklistEntry({
        company_name: "",
        company_name_en: "",
        domain: "",
        city: "",
        category: "مكتب عقاري",
        source: "",
        confidence_level: 100
      });
      fetchData();
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      toast.error("حدث خطأ في الإضافة");
    }
  };

  // حذف من القائمة السوداء
  const removeFromBlacklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('domain_blacklist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("تم الحذف من القائمة السوداء");
      fetchData();
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      toast.error("حدث خطأ في الحذف");
    }
  };

  // إضافة نمط محظور
  const addPattern = async () => {
    if (!newPattern.pattern) {
      toast.error("يجب إدخال الكلمة المحظورة");
      return;
    }

    try {
      const { error } = await supabase
        .from('forbidden_patterns')
        .insert(newPattern);

      if (error) throw error;

      toast.success("تمت إضافة الكلمة المحظورة");
      setIsAddPatternOpen(false);
      setNewPattern({
        pattern: "",
        pattern_type: "keyword",
        description: ""
      });
      fetchData();
    } catch (error) {
      console.error('Error adding pattern:', error);
      toast.error("حدث خطأ في الإضافة");
    }
  };

  // حذف نمط محظور
  const removePattern = async (id: string) => {
    try {
      const { error } = await supabase
        .from('forbidden_patterns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("تم حذف الكلمة المحظورة");
      fetchData();
    } catch (error) {
      console.error('Error removing pattern:', error);
      toast.error("حدث خطأ في الحذف");
    }
  };

  // تصفية النتائج
  const filteredRequests = requests.filter(r => 
    r.requested_title.includes(searchQuery) ||
    r.company_name?.includes(searchQuery)
  );

  const filteredBlacklist = blacklist.filter(b =>
    b.company_name.includes(searchQuery) ||
    b.company_name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.domain?.includes(searchQuery)
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 ml-1" />قيد المراجعة</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"><Check className="w-3 h-3 ml-1" />موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 ml-1" />مرفوض</Badge>;
      case 'revoked':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-800"><Crown className="w-3 h-3 ml-1" />تم السحب</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header - محسّن للجوال */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b-2 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-3">
          {/* الهيدر للجوال: اسم الصفحة في سطر واحد + الأزرار أسفله */}
          <div className="flex flex-col gap-2">
            {/* اسم الصفحة في الأعلى */}
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <h1 className="text-lg md:text-xl font-bold text-white whitespace-nowrap">إدارة النطاقات</h1>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="animate-pulse text-xs">
                  {pendingCount} جديد
                </Badge>
              )}
            </div>
            
            {/* الأزرار في سطر منفصل */}
            <div className="flex items-center justify-center">
              <Button onClick={fetchData} variant="outline" size="sm" className="border border-[#D4AF37] bg-white/10 text-white hover:bg-white/20">
                <RefreshCw className="w-3 h-3 ml-1" />
                تحديث
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">

      {/* تنبيه الأولوية */}
      <Alert className="border-amber-500 bg-amber-50">
        <Crown className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">تنبيه مهم حول أولوية النطاقات</AlertTitle>
        <AlertDescription className="text-amber-700">
          أولوية اختيار النطاق دائماً ستكون لمن يملك النطاق الأصلي حتى لو تم اختياره من قبل مستخدم آخر أو تم دفع رسوم عليه. 
          يتم إشعار المستخدم تلقائياً عند سحب النطاق منه.
        </AlertDescription>
      </Alert>

      {/* شريط البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="بحث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            طلبات النطاقات
            {pendingCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            إدارة الأولويات
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            القائمة السوداء ({blacklist.length})
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            الكلمات المحظورة ({patterns.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* طلبات النطاقات */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>طلبات النطاقات المعلقة</CardTitle>
              <CardDescription>مراجعة والموافقة أو رفض طلبات النطاقات</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">لا توجد طلبات</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النطاق المطلوب</TableHead>
                      <TableHead>نوع الحساب</TableHead>
                      <TableHead>الشركة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono font-bold">
                          WasataAI.com/{request.requested_title}
                        </TableCell>
                        <TableCell>
                          {request.account_type === 'company' ? 'شركة' : 'فرد'}
                        </TableCell>
                        <TableCell>{request.company_name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.price_enabled && request.price ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              <DollarSign className="w-3 h-3 ml-1" />
                              {request.price} ريال
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => setSelectedRequest(request)}>
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>الموافقة على الطلب</DialogTitle>
                                      <DialogDescription>
                                        هل أنت متأكد من الموافقة على النطاق: {request.requested_title}؟
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {/* خيار السعر */}
                                      {settings?.pricing_enabled && (
                                        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                                          <div className="flex items-center justify-between">
                                            <Label htmlFor="enable-price" className="flex items-center gap-2">
                                              <DollarSign className="w-4 h-4 text-emerald-600" />
                                              تفعيل رسوم النطاق
                                            </Label>
                                            <Switch
                                              id="enable-price"
                                              checked={enablePriceForRequest}
                                              onCheckedChange={setEnablePriceForRequest}
                                            />
                                          </div>
                                          {enablePriceForRequest && (
                                            <div>
                                              <Label>السعر (ريال)</Label>
                                              <Input
                                                type="number"
                                                value={requestPrice}
                                                onChange={(e) => setRequestPrice(e.target.value)}
                                                placeholder={settings.default_price.toString()}
                                                className="mt-1"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      <div>
                                        <Label>ملاحظات الإدارة (اختياري)</Label>
                                        <Textarea
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          placeholder="أضف ملاحظات..."
                                        />
                                      </div>

                                      <Alert className="border-amber-300 bg-amber-50">
                                        <Crown className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-700 text-sm">
                                          سيتم إشعار المستخدم بتنبيه أولوية النطاق للمالك الأصلي
                                        </AlertDescription>
                                      </Alert>
                                    </div>
                                    <DialogFooter>
                                      <Button onClick={() => approveRequest(request)} className="bg-emerald-600 hover:bg-emerald-700">
                                        <Check className="w-4 h-4 ml-2" />
                                        موافقة
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => setSelectedRequest(request)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>رفض الطلب</DialogTitle>
                                      <DialogDescription>
                                        رفض النطاق: {request.requested_title}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>سبب الرفض *</Label>
                                        <Textarea
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="اكتب سبب الرفض..."
                                          required
                                        />
                                      </div>
                                      <div>
                                        <Label>ملاحظات إضافية</Label>
                                        <Textarea
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          placeholder="ملاحظات داخلية..."
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button onClick={() => rejectRequest(request)} variant="destructive">
                                        <X className="w-4 h-4 ml-2" />
                                        رفض
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}

                            {request.status === 'approved' && !request.priority_revoked && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-orange-600">
                                    <Crown className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>سحب النطاق - مطالبة المالك الأصلي</DialogTitle>
                                    <DialogDescription>
                                      هل المالك الأصلي للنطاق يطالب باستعادته؟
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Alert className="border-red-300 bg-red-50">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-700 text-sm">
                                      سيتم سحب النطاق من المستخدم الحالي وإشعاره باختيار نطاق آخر
                                    </AlertDescription>
                                  </Alert>
                                  <DialogFooter>
                                    <Button onClick={() => revokeRequest(request)} className="bg-orange-600 hover:bg-orange-700">
                                      <Crown className="w-4 h-4 ml-2" />
                                      تأكيد السحب
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* إدارة الأولويات */}
        <TabsContent value="priority">
          <div className="space-y-6">
            {/* شرح مستويات الأولوية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  نظام مستويات الأولوية
                </CardTitle>
                <CardDescription>ترتيب الأولوية في تخصيص النطاقات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-amber-500 text-white">🥇 الأولوية 1</Badge>
                    </div>
                    <h4 className="font-semibold text-amber-800">مالك النطاق الرسمي</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      من يملك نطاق رسمي مطابق أو قريب ومُتحقق منه
                    </p>
                    <ul className="text-xs text-amber-600 mt-2 space-y-1">
                      <li>• قبول تلقائي عند التحقق</li>
                      <li>• حق السحب من أي مستخدم آخر</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-500 text-white">🥈 الأولوية 2</Badge>
                    </div>
                    <h4 className="font-semibold text-blue-800">شركة / مكتب عقاري</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      مكتب أو شركة عقارية موثقة تجارياً
                    </p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li>• يحتاج موافقة المشرف</li>
                      <li>• أولوية على الأفراد</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">🥉 الأولوية 3</Badge>
                    </div>
                    <h4 className="font-semibold text-gray-800">حساب فردي</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      أفراد (اسم شخصي)
                    </p>
                    <ul className="text-xs text-gray-600 mt-2 space-y-1">
                      <li>• أقل أولوية</li>
                      <li>• لا يُمنح إلا بدون تعارض</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* طلبات الموافقة السريعة - مالكي النطاقات الرسمية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  الموافقة السريعة - مالكي النطاقات الرسمية
                </CardTitle>
                <CardDescription>طلبات من مستخدمين تم التحقق من ملكيتهم للنطاق الرسمي</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const officialOwnerRequests = requests.filter(r => 
                    r.status === 'pending' && 
                    r.official_domain_verified === true &&
                    r.priority_level === 1
                  );
                  
                  if (officialOwnerRequests.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>لا توجد طلبات من مالكي نطاقات رسمية</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {officialOwnerRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-emerald-50 border-emerald-200">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold">WasataAI.com/{request.requested_title}</span>
                                <Badge className="bg-emerald-500 text-white text-xs">نطاق رسمي مُتحقق</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {request.company_name || 'غير محدد'} • {request.website_url || 'بدون موقع'}
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => approveRequest(request)} 
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="w-4 h-4 ml-2" />
                            موافقة فورية
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* طلبات استرداد النطاقات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  طلبات استرداد النطاقات
                </CardTitle>
                <CardDescription>طلبات من مالكي النطاقات الرسمية لاسترداد نطاقات مستخدمة من آخرين</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const reclaimRequests = requests.filter(r => 
                    r.status === 'pending' && 
                    r.official_domain_verified === true &&
                    r.matched_company
                  );
                  
                  if (reclaimRequests.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>لا توجد طلبات استرداد حالياً</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {reclaimRequests.map((request) => (
                        <div key={request.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                                <Crown className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="font-mono font-bold">WasataAI.com/{request.requested_title}</span>
                                <div className="text-sm text-orange-700">
                                  مطالبة من: {request.company_name} ({request.website_url})
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-orange-300 text-orange-700">
                              يتطلب مراجعة
                            </Badge>
                          </div>
                          <Alert className="border-orange-300 bg-orange-100 mb-3">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-700 text-sm">
                              هذا النطاق مستخدم حالياً من مستخدم آخر. الموافقة ستؤدي لسحبه منه.
                            </AlertDescription>
                          </Alert>
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              onClick={() => rejectRequest(request)}
                              className="text-red-600 border-red-300"
                            >
                              <X className="w-4 h-4 ml-2" />
                              رفض المطالبة
                            </Button>
                            <Button 
                              onClick={() => {
                                // أولاً نوافق على الطلب الجديد
                                approveRequest(request);
                                // ثم نسحب من المستخدم السابق (يتم تلقائياً في الخلفية)
                              }} 
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Crown className="w-4 h-4 ml-2" />
                              الموافقة والسحب من الآخر
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* إحصائيات الأولويات */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات التوزيع حسب الأولوية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-amber-600">
                      {requests.filter(r => r.priority_level === 1).length}
                    </div>
                    <div className="text-sm text-muted-foreground">مالكي نطاقات رسمية</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {requests.filter(r => r.priority_level === 2).length}
                    </div>
                    <div className="text-sm text-muted-foreground">شركات / مكاتب</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-gray-600">
                      {requests.filter(r => r.priority_level === 3).length}
                    </div>
                    <div className="text-sm text-muted-foreground">أفراد</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-emerald-600">
                      {requests.filter(r => r.status === 'approved').length}
                    </div>
                    <div className="text-sm text-muted-foreground">إجمالي الموافقات</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* القائمة السوداء */}
        <TabsContent value="blacklist">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>القائمة السوداء للشركات العقارية</CardTitle>
                <CardDescription>الشركات والنطاقات المحمية من الانتحال</CardDescription>
              </div>
              <Dialog open={isAddBlacklistOpen} onOpenChange={setIsAddBlacklistOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة شركة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة شركة للقائمة السوداء</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>اسم الشركة بالعربية *</Label>
                      <Input
                        value={newBlacklistEntry.company_name}
                        onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="شركة العقار السعودي"
                      />
                    </div>
                    <div>
                      <Label>اسم الشركة بالإنجليزية</Label>
                      <Input
                        value={newBlacklistEntry.company_name_en}
                        onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, company_name_en: e.target.value }))}
                        placeholder="Saudi Real Estate Co"
                      />
                    </div>
                    <div>
                      <Label>النطاق / الموقع</Label>
                      <Input
                        value={newBlacklistEntry.domain}
                        onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, domain: e.target.value }))}
                        placeholder="example.com.sa"
                      />
                    </div>
                    <div>
                      <Label>المدينة</Label>
                      <Input
                        value={newBlacklistEntry.city}
                        onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="الرياض"
                      />
                    </div>
                    <div>
                      <Label>التصنيف</Label>
                      <Select
                        value={newBlacklistEntry.category}
                        onValueChange={(value) => setNewBlacklistEntry(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="مكتب عقاري">مكتب عقاري</SelectItem>
                          <SelectItem value="شركة تطوير">شركة تطوير</SelectItem>
                          <SelectItem value="شركة استثمار">شركة استثمار</SelectItem>
                          <SelectItem value="وسيط عقاري">وسيط عقاري</SelectItem>
                          <SelectItem value="شركة حكومية">شركة حكومية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>المصدر</Label>
                      <Input
                        value={newBlacklistEntry.source}
                        onChange={(e) => setNewBlacklistEntry(prev => ({ ...prev, source: e.target.value }))}
                        placeholder="موقع رسمي / منصة معروف"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addToBlacklist}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : filteredBlacklist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">لا توجد شركات في القائمة</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشركة</TableHead>
                      <TableHead>النطاق</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>الثقة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBlacklist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.company_name}</div>
                            {entry.company_name_en && (
                              <div className="text-xs text-muted-foreground">{entry.company_name_en}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{entry.domain || '-'}</TableCell>
                        <TableCell>{entry.city || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.confidence_level >= 80 ? 'default' : 'secondary'}>
                            {entry.confidence_level}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeFromBlacklist(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الكلمات المحظورة */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>الكلمات والأنماط المحظورة</CardTitle>
                <CardDescription>الكلمات التي لا يمكن استخدامها في النطاقات</CardDescription>
              </div>
              <Dialog open={isAddPatternOpen} onOpenChange={setIsAddPatternOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة كلمة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة كلمة محظورة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>الكلمة *</Label>
                      <Input
                        value={newPattern.pattern}
                        onChange={(e) => setNewPattern(prev => ({ ...prev, pattern: e.target.value }))}
                        placeholder="عقارات"
                      />
                    </div>
                    <div>
                      <Label>النوع</Label>
                      <Select
                        value={newPattern.pattern_type}
                        onValueChange={(value) => setNewPattern(prev => ({ ...prev, pattern_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">كلمة مفتاحية</SelectItem>
                          <SelectItem value="regex">تعبير منتظم</SelectItem>
                          <SelectItem value="exact">تطابق تام</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Input
                        value={newPattern.description}
                        onChange={(e) => setNewPattern(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="سبب الحظر"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addPattern}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : patterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">لا توجد كلمات محظورة</div>
              ) : (
                <div className="grid gap-3">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">{pattern.pattern}</Badge>
                        <span className="text-sm text-muted-foreground">{pattern.description}</span>
                        <Badge variant="outline" className="text-xs">{pattern.pattern_type}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removePattern(pattern.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الإعدادات */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات النطاقات
              </CardTitle>
              <CardDescription>إدارة إعدادات التسعير والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  {/* إعدادات التسعير */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      إعدادات التسعير
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تفعيل التسعير للنطاقات الخاصة</Label>
                        <p className="text-sm text-muted-foreground">عند التفعيل، يمكنك تحديد سعر لكل طلب</p>
                      </div>
                      <Switch
                        checked={settings.pricing_enabled}
                        onCheckedChange={(checked) => updateSettings({ pricing_enabled: checked })}
                      />
                    </div>

                    {settings.pricing_enabled && (
                      <div>
                        <Label>السعر الافتراضي (ريال)</Label>
                        <Input
                          type="number"
                          value={settings.default_price}
                          onChange={(e) => updateSettings({ default_price: parseFloat(e.target.value) || 0 })}
                          className="mt-1 max-w-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* إعدادات تنبيه الأولوية */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      تنبيه أولوية المالك الأصلي
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تفعيل تنبيه الأولوية</Label>
                        <p className="text-sm text-muted-foreground">إظهار تنبيه للمستخدمين حول أولوية المالك الأصلي</p>
                      </div>
                      <Switch
                        checked={settings.priority_warning_enabled}
                        onCheckedChange={(checked) => updateSettings({ priority_warning_enabled: checked })}
                      />
                    </div>

                    {settings.priority_warning_enabled && (
                      <div>
                        <Label>نص التنبيه</Label>
                        <Textarea
                          value={settings.priority_warning_message}
                          onChange={(e) => updateSettings({ priority_warning_message: e.target.value })}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default DomainAdminPage;
