/**
 * PropertyRegistryPage.tsx
 * صفحة سجل العقارات المركزي - تعرض جميع العقارات المنشورة بشكل جدول
 */

import React, { useState, useEffect } from "react";
import { Database, Search, Download, RefreshCw, Filter, Eye, Copy, Check } from "lucide-react";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyRecord {
  id: string;
  listing_id: string;
  published_at: string;
  ad_license: string | null;
  ad_license_date: string | null;
  ad_license_expires_at: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_id_number: string | null;
  owner_city: string | null;
  owner_district: string | null;
  owner_national_address: string | null;
  deed_number: string | null;
  deed_date: string | null;
  deed_city: string | null;
  broker_phone: string | null;
  broker_fal_license: string | null;
  broker_name: string | null;
  property_type: string | null;
  property_title: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  google_maps_link: string | null;
  national_address: string | null;
  plus_code: string | null;
  lat: number | null;
  lng: number | null;
  price: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  purpose: string | null;
  category: string | null;
  slug: string | null;
}

const PropertyRegistryPage: React.FC = () => {
  const [records, setRecords] = useState<PropertyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<PropertyRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // جلب البيانات
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_registry')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
      setFilteredRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // فلترة البيانات
  useEffect(() => {
    let filtered = [...records];

    // فلترة بالبحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.property_title?.toLowerCase().includes(query) ||
        record.owner_name?.toLowerCase().includes(query) ||
        record.owner_phone?.includes(query) ||
        record.deed_number?.includes(query) ||
        record.broker_name?.toLowerCase().includes(query) ||
        record.city?.toLowerCase().includes(query) ||
        record.district?.toLowerCase().includes(query) ||
        record.ad_license?.includes(query)
      );
    }

    // فلترة بالمدينة
    if (cityFilter !== "all") {
      filtered = filtered.filter(record => record.city === cityFilter);
    }

    // فلترة بنوع العقار
    if (propertyTypeFilter !== "all") {
      filtered = filtered.filter(record => record.property_type === propertyTypeFilter);
    }

    setFilteredRecords(filtered);
  }, [searchQuery, cityFilter, propertyTypeFilter, records]);

  // نسخ للحافظة
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // تصدير CSV
  const exportToCSV = () => {
    const headers = [
      'تاريخ النشر', 'الوقت', 'نوع العقار', 'العنوان', 'المدينة', 'الحي',
      'السعر', 'المساحة', 'رقم الترخيص', 'اسم المالك', 'جوال المالك',
      'رقم الصك', 'تاريخ الصك', 'اسم الوسيط', 'جوال الوسيط', 'رخصة فال'
    ];

    const csvData = filteredRecords.map(record => [
      new Date(record.published_at).toLocaleDateString('ar-SA'),
      new Date(record.published_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      record.property_type || '',
      record.property_title || '',
      record.city || '',
      record.district || '',
      record.price?.toLocaleString() || '',
      record.area?.toString() || '',
      record.ad_license || '',
      record.owner_name || '',
      record.owner_phone || '',
      record.deed_number || '',
      record.deed_date || '',
      record.broker_name || '',
      record.broker_phone || '',
      record.broker_fal_license || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `property_registry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير البيانات');
  };

  // قائمة المدن الفريدة
  const uniqueCities = [...new Set(records.map(r => r.city).filter(Boolean))];
  const uniquePropertyTypes = [...new Set(records.map(r => r.property_type).filter(Boolean))];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('ar-SA'),
      time: date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <OwnerDashboardLayout
      title="سجل العقارات المركزي"
      icon={<Database className="w-5 h-5 text-emerald-600" />}
    >
      <div className="space-y-4">
        {/* شريط البحث والفلاتر */}
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* البحث */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الصك، اسم المالك، الجوال، الترخيص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* فلتر المدينة */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدن</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city!}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* فلتر نوع العقار */}
            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع العقار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {uniquePropertyTypes.map(type => (
                  <SelectItem key={type} value={type!}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* أزرار الإجراءات */}
            <Button variant="outline" size="icon" onClick={fetchRecords} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={filteredRecords.length === 0}>
              <Download className="w-4 h-4 ml-2" />
              تصدير CSV
            </Button>
          </div>

          {/* إحصائيات سريعة */}
          <div className="flex gap-4 text-sm">
            <Badge variant="secondary">
              إجمالي السجلات: {records.length}
            </Badge>
            <Badge variant="outline">
              نتائج البحث: {filteredRecords.length}
            </Badge>
          </div>
        </div>

        {/* جدول البيانات */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead className="text-right w-[80px]">#</TableHead>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                  <TableHead className="text-right">نوع العقار</TableHead>
                  <TableHead className="text-right">المدينة / الحي</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">رقم الصك</TableHead>
                  <TableHead className="text-right">المالك</TableHead>
                  <TableHead className="text-right">الوسيط</TableHead>
                  <TableHead className="text-right">الترخيص</TableHead>
                  <TableHead className="text-center w-[60px]">عرض</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      لا توجد سجلات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record, index) => {
                    const { date, time } = formatDate(record.published_at);
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                        <TableCell>
                          <div className="text-sm">{date}</div>
                          <div className="text-xs text-muted-foreground">{time}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.property_type || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.city || '-'}</div>
                          <div className="text-xs text-muted-foreground">{record.district || '-'}</div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {record.price ? `${record.price.toLocaleString()} ر.س` : '-'}
                        </TableCell>
                        <TableCell>
                          {record.deed_number ? (
                            <span className="font-mono text-xs bg-amber-50 px-2 py-1 rounded">
                              {record.deed_number}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.owner_name || '-'}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {record.owner_phone || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.broker_name || '-'}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {record.broker_phone || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.ad_license ? (
                            <span className="font-mono text-xs bg-green-50 px-2 py-1 rounded">
                              {record.ad_license}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* نافذة التفاصيل */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                تفاصيل السجل
              </DialogTitle>
            </DialogHeader>

            {selectedRecord && (
              <div className="space-y-4 text-sm">
                {/* معلومات النشر */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-bold mb-2 text-blue-800">معلومات النشر</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">التاريخ:</span>{' '}
                      {formatDate(selectedRecord.published_at).date}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الوقت:</span>{' '}
                      {formatDate(selectedRecord.published_at).time}
                    </div>
                  </div>
                </div>

                {/* معلومات الترخيص */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-bold mb-2 text-green-800">الترخيص الإعلاني</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailRow 
                      label="رقم الترخيص" 
                      value={selectedRecord.ad_license} 
                      onCopy={() => selectedRecord.ad_license && copyToClipboard(selectedRecord.ad_license, 'ad_license')}
                      copied={copiedField === 'ad_license'}
                    />
                    <div><span className="text-muted-foreground">تاريخ الإصدار:</span> {selectedRecord.ad_license_date || '-'}</div>
                    <div><span className="text-muted-foreground">تاريخ الانتهاء:</span> {selectedRecord.ad_license_expires_at || '-'}</div>
                  </div>
                </div>

                {/* معلومات المالك */}
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h4 className="font-bold mb-2 text-amber-800">معلومات المالك</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">الاسم:</span> {selectedRecord.owner_name || '-'}</div>
                    <DetailRow 
                      label="الجوال" 
                      value={selectedRecord.owner_phone} 
                      onCopy={() => selectedRecord.owner_phone && copyToClipboard(selectedRecord.owner_phone, 'owner_phone')}
                      copied={copiedField === 'owner_phone'}
                    />
                    <div><span className="text-muted-foreground">رقم الهوية:</span> {selectedRecord.owner_id_number || '-'}</div>
                    <div><span className="text-muted-foreground">المدينة:</span> {selectedRecord.owner_city || '-'}</div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">العنوان الوطني:</span> {selectedRecord.owner_national_address || '-'}
                    </div>
                  </div>
                </div>

                {/* معلومات الصك */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-bold mb-2 text-purple-800">معلومات الصك</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <DetailRow 
                      label="رقم الصك" 
                      value={selectedRecord.deed_number} 
                      onCopy={() => selectedRecord.deed_number && copyToClipboard(selectedRecord.deed_number, 'deed_number')}
                      copied={copiedField === 'deed_number'}
                    />
                    <div><span className="text-muted-foreground">التاريخ:</span> {selectedRecord.deed_date || '-'}</div>
                    <div><span className="text-muted-foreground">المدينة:</span> {selectedRecord.deed_city || '-'}</div>
                  </div>
                </div>

                {/* معلومات الوسيط */}
                <div className="bg-cyan-50 p-3 rounded-lg">
                  <h4 className="font-bold mb-2 text-cyan-800">معلومات الوسيط</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">الاسم:</span> {selectedRecord.broker_name || '-'}</div>
                    <DetailRow 
                      label="الجوال" 
                      value={selectedRecord.broker_phone} 
                      onCopy={() => selectedRecord.broker_phone && copyToClipboard(selectedRecord.broker_phone, 'broker_phone')}
                      copied={copiedField === 'broker_phone'}
                    />
                    <div><span className="text-muted-foreground">رخصة فال:</span> {selectedRecord.broker_fal_license || '-'}</div>
                  </div>
                </div>

                {/* معلومات العقار */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-bold mb-2">معلومات العقار</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">النوع:</span> {selectedRecord.property_type || '-'}</div>
                    <div><span className="text-muted-foreground">الغرض:</span> {selectedRecord.purpose || '-'}</div>
                    <div><span className="text-muted-foreground">المدينة:</span> {selectedRecord.city || '-'}</div>
                    <div><span className="text-muted-foreground">الحي:</span> {selectedRecord.district || '-'}</div>
                    <div><span className="text-muted-foreground">الشارع:</span> {selectedRecord.street || '-'}</div>
                    <div><span className="text-muted-foreground">السعر:</span> {selectedRecord.price?.toLocaleString() || '-'} ر.س</div>
                    <div><span className="text-muted-foreground">المساحة:</span> {selectedRecord.area || '-'} م²</div>
                    <div><span className="text-muted-foreground">الغرف:</span> {selectedRecord.bedrooms || '-'}</div>
                  </div>
                </div>

                {/* الموقع */}
                <div className="bg-rose-50 p-3 rounded-lg">
                  <h4 className="font-bold mb-2 text-rose-800">الموقع</h4>
                  <div className="space-y-2">
                    <div><span className="text-muted-foreground">العنوان الوطني:</span> {selectedRecord.national_address || '-'}</div>
                    <div><span className="text-muted-foreground">Plus Code:</span> {selectedRecord.plus_code || '-'}</div>
                    {selectedRecord.google_maps_link && (
                      <a 
                        href={selectedRecord.google_maps_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        فتح في خرائط جوجل ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </OwnerDashboardLayout>
  );
};

// مكون لعرض صف مع زر نسخ
const DetailRow: React.FC<{
  label: string;
  value: string | null;
  onCopy: () => void;
  copied: boolean;
}> = ({ label, value, onCopy, copied }) => (
  <div className="flex items-center gap-1">
    <span className="text-muted-foreground">{label}:</span> 
    <span className="font-mono">{value || '-'}</span>
    {value && (
      <button onClick={onCopy} className="p-1 hover:bg-white/50 rounded">
        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      </button>
    )}
  </div>
);

export default PropertyRegistryPage;
