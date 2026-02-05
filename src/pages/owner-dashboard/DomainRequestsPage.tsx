/**
 * DomainRequestsPage.tsx
 * صفحة طلبات النطاقات
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Search, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import OwnerDashboardLayout from "./OwnerDashboardLayout";

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

const DomainRequestsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState("all");
  const [requestSearch, setRequestSearch] = useState("");
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: DomainRequest | null }>({ open: false, request: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: DomainRequest | null; reason: string }>({ open: false, request: null, reason: "" });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: requestsData } = await supabase
        .from('domain_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      setRequests(requestsData || []);
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

  const handleApproveRequest = async () => {
    if (!approveDialog.request) return;
    const request = approveDialog.request;

    try {
      const { error: updateError } = await supabase
        .from('domain_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      const { error: cardError } = await supabase
        .from('business_cards')
        .update({ slug: request.requested_title })
        .eq('user_id', request.user_id);

      if (cardError) throw cardError;

      const { error: registryError } = await supabase
        .from('slug_registry')
        .upsert({
          slug: request.requested_title,
          status: 'closed',
          owner_user_id: request.user_id,
          notes: 'تمت الموافقة عبر لوحة المالك'
        }, { onConflict: 'slug' });

      if (registryError) throw registryError;

      toast.success('تمت الموافقة على الطلب بنجاح');
      setApproveDialog({ open: false, request: null });
      fetchData();
    } catch (error: any) {
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

  const filteredRequests = requests.filter(r => {
    const matchesFilter = requestFilter === 'all' || r.status === requestFilter;
    const matchesSearch = !requestSearch || 
      r.requested_title.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.company_name || '').toLowerCase().includes(requestSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">قيد الانتظار</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">مُعتمد</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <OwnerDashboardLayout
      title="طلبات النطاقات"
      icon={<Clock className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#01411C]" />
            طلبات الـ Slugs
          </CardTitle>
          <CardDescription>مراجعة والموافقة على طلبات النطاقات</CardDescription>
        </CardHeader>
        <CardContent>
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
                <SelectItem value="approved">مُعتمد</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">النطاق المطلوب</TableHead>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      لا توجد طلبات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(request => (
                    <TableRow key={request.id} className={request.priority_level ? 'bg-amber-50' : ''}>
                      <TableCell className="font-medium font-mono">{request.requested_title}</TableCell>
                      <TableCell>{request.company_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 text-green-600 hover:bg-green-100 text-xs"
                              onClick={() => setApproveDialog({ open: true, request })}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 text-red-600 hover:bg-red-100 text-xs"
                              onClick={() => setRejectDialog({ open: true, request, reason: "" })}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(v) => !v && setApproveDialog({ open: false, request: null })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الموافقة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من الموافقة على النطاق: <span className="font-bold">{approveDialog.request?.requested_title}</span>؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, request: null })}>
              إلغاء
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveRequest}>
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(v) => !v && setRejectDialog({ open: false, request: null, reason: "" })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>
              رفض النطاق: <span className="font-bold">{rejectDialog.request?.requested_title}</span>
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
              رفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerDashboardLayout>
  );
};

export default DomainRequestsPage;
