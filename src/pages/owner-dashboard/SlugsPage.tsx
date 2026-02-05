/**
 * SlugsPage.tsx
 * صفحة إدارة Slugs
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Lock, Unlock, X, Cog, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface DomainSettingsData {
  id: string;
  pricing_enabled: boolean | null;
  default_price: number | null;
  priority_warning_enabled: boolean | null;
  priority_warning_message: string | null;
}

const SlugsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [slugRegistry, setSlugRegistry] = useState<SlugRegistryEntry[]>([]);
  const [slugSearch, setSlugSearch] = useState("");
  const [slugFilter, setSlugFilter] = useState("all");
  const [domainSettings, setDomainSettings] = useState<DomainSettingsData | null>(null);
  const [slugActionDialog, setSlugActionDialog] = useState<{ open: boolean; slug: SlugRegistryEntry | null; action: string }>({ open: false, slug: null, action: "" });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: slugData } = await supabase
        .from('slug_registry')
        .select('*')
        .order('created_at', { ascending: false });
      
      setSlugRegistry(slugData || []);

      const { data: settingsData } = await supabase
        .from('domain_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      setDomainSettings(settingsData);
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

  const filteredSlugs = slugRegistry.filter(s => {
    const matchesFilter = slugFilter === 'all' || s.status === slugFilter;
    const matchesSearch = !slugSearch || s.slug.toLowerCase().includes(slugSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">متاح</Badge>;
      case 'closed': return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">مغلق</Badge>;
      case 'reserved': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">محجوز</Badge>;
      case 'blocked': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">محظور</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <OwnerDashboardLayout
      title="إدارة Slugs"
      icon={<Layers className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Domain Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="w-5 h-5 text-[#01411C]" />
              إعدادات النطاقات
            </CardTitle>
            <CardDescription>التحكم في التسعير والأولوية</CardDescription>
          </CardHeader>
          <CardContent>
            {domainSettings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">التسعير مفعّل</p>
                  <p className="font-medium">{domainSettings.pricing_enabled ? 'نعم' : 'لا'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">السعر الافتراضي</p>
                  <p className="font-medium">{domainSettings.default_price || 0} ريال</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Cog className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>لم يتم العثور على إعدادات</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slugs Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#01411C]" />
              إدارة الـ Slugs
            </CardTitle>
            <CardDescription>عرض وإدارة جميع النطاقات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="بحث بالنطاق..."
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">النطاق</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSlugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        لا توجد نطاقات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSlugs.map(slug => (
                      <TableRow key={slug.id}>
                        <TableCell className="font-medium font-mono">{slug.slug}</TableCell>
                        <TableCell>{getStatusBadge(slug.status)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(slug.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {slug.status !== 'open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 text-xs"
                                onClick={() => setSlugActionDialog({ open: true, slug, action: 'open' })}
                              >
                                <Unlock className="w-3 h-3" />
                              </Button>
                            )}
                            {slug.status !== 'closed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-600 text-xs"
                                onClick={() => setSlugActionDialog({ open: true, slug, action: 'close' })}
                              >
                                <Lock className="w-3 h-3" />
                              </Button>
                            )}
                            {slug.status !== 'blocked' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 text-xs"
                                onClick={() => setSlugActionDialog({ open: true, slug, action: 'block' })}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slug Action Dialog */}
      <Dialog open={slugActionDialog.open} onOpenChange={(v) => !v && setSlugActionDialog({ open: false, slug: null, action: "" })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {slugActionDialog.action === 'open' && 'فتح النطاق'}
              {slugActionDialog.action === 'close' && 'إغلاق النطاق'}
              {slugActionDialog.action === 'block' && 'حظر النطاق'}
            </DialogTitle>
            <DialogDescription>
              النطاق: <span className="font-bold font-mono">{slugActionDialog.slug?.slug}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugActionDialog({ open: false, slug: null, action: "" })}>
              إلغاء
            </Button>
            <Button 
              className={slugActionDialog.action === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#01411C] hover:bg-[#065f41]'}
              onClick={handleSlugAction}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerDashboardLayout>
  );
};

export default SlugsPage;
