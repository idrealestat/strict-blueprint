import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield, Check, X, Clock, Plus, Trash2, Search, 
  Building2, Globe, AlertTriangle, RefreshCw, FileText
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

const DomainAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [patterns, setPatterns] = useState<ForbiddenPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // حالات الحوارات
  const [isAddBlacklistOpen, setIsAddBlacklistOpen] = useState(false);
  const [isAddPatternOpen, setIsAddPatternOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DomainRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

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

  // الموافقة على طلب
  const approveRequest = async (request: DomainRequest) => {
    try {
      const { error } = await supabase
        .from('domain_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success("تمت الموافقة على الطلب");
      setSelectedRequest(null);
      setAdminNotes("");
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

      toast.success("تم رفض الطلب");
      setSelectedRequest(null);
      setRejectionReason("");
      setAdminNotes("");
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error("حدث خطأ في الرفض");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 ml-1" />قيد المراجعة</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"><Check className="w-3 h-3 ml-1" />موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">إدارة النطاقات</h1>
            <p className="text-muted-foreground">مراجعة طلبات النطاقات وإدارة القائمة السوداء</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            طلبات النطاقات
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {requests.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            القائمة السوداء ({blacklist.length})
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            الكلمات المحظورة ({patterns.length})
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
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
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
                                    <div>
                                      <Label>ملاحظات الإدارة (اختياري)</Label>
                                      <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="أضف ملاحظات..."
                                      />
                                    </div>
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
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
      </Tabs>
    </div>
  );
};

export default DomainAdminPage;
