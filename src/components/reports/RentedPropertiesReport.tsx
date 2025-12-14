import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Calendar, 
  User, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileDown,
  RefreshCw,
  Bell,
  Mail
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RentedProperty {
  id: string;
  propertyTitle: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  tenantName: string;
  contractStartDate: string;
  contractEndDate: string;
  contractDuration: number;
  monthlyRent: number;
  status: 'active' | 'expiring_soon' | 'expired';
  daysRemaining: number;
}

const RentedPropertiesReport: React.FC = () => {
  const [properties, setProperties] = useState<RentedProperty[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - في التطبيق الحقيقي ستأتي من قاعدة البيانات
  useEffect(() => {
    const mockProperties: RentedProperty[] = [
      {
        id: '1',
        propertyTitle: 'فيلا فاخرة في حي النرجس',
        location: 'الرياض - حي النرجس',
        ownerName: 'محمد أحمد العتيبي',
        ownerEmail: 'mohammed@example.com',
        ownerPhone: '0501234567',
        tenantName: 'خالد سعيد',
        contractStartDate: '2024-01-15',
        contractEndDate: '2025-01-15',
        contractDuration: 12,
        monthlyRent: 8000,
        status: 'expiring_soon',
        daysRemaining: 32
      },
      {
        id: '2',
        propertyTitle: 'شقة مفروشة في العليا',
        location: 'الرياض - حي العليا',
        ownerName: 'عبدالله محمد الشمري',
        ownerEmail: 'abdullah@example.com',
        ownerPhone: '0559876543',
        tenantName: 'أحمد فهد',
        contractStartDate: '2024-03-01',
        contractEndDate: '2025-03-01',
        contractDuration: 12,
        monthlyRent: 4500,
        status: 'active',
        daysRemaining: 78
      },
      {
        id: '3',
        propertyTitle: 'مكتب تجاري في طريق الملك فهد',
        location: 'الرياض - طريق الملك فهد',
        ownerName: 'سعد عبدالرحمن',
        ownerEmail: 'saad@example.com',
        ownerPhone: '0561112233',
        tenantName: 'شركة الأمل للتجارة',
        contractStartDate: '2023-12-01',
        contractEndDate: '2024-12-01',
        contractDuration: 12,
        monthlyRent: 15000,
        status: 'expired',
        daysRemaining: 0
      },
      {
        id: '4',
        propertyTitle: 'شقة في حي الياسمين',
        location: 'الرياض - حي الياسمين',
        ownerName: 'فهد سليمان',
        ownerEmail: 'fahad@example.com',
        ownerPhone: '0544445555',
        tenantName: 'ناصر العنزي',
        contractStartDate: '2024-06-01',
        contractEndDate: '2025-06-01',
        contractDuration: 12,
        monthlyRent: 3500,
        status: 'active',
        daysRemaining: 170
      }
    ];
    setProperties(mockProperties);
  }, []);

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'expired') {
      return <Badge className="bg-red-500 text-white">منتهي</Badge>;
    } else if (daysRemaining <= 30) {
      return <Badge className="bg-red-500 text-white animate-pulse">ينتهي خلال شهر</Badge>;
    } else if (daysRemaining <= 60) {
      return <Badge className="bg-amber-500 text-white">ينتهي خلال شهرين</Badge>;
    } else {
      return <Badge className="bg-emerald-500 text-white">نشط</Badge>;
    }
  };

  const filteredProperties = properties.filter(prop => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'expiring' && prop.daysRemaining > 60) return false;
      if (filterStatus === 'expired' && prop.status !== 'expired') return false;
      if (filterStatus === 'active' && (prop.status === 'expired' || prop.daysRemaining <= 60)) return false;
    }
    return true;
  });

  const sendNotification = async (property: RentedProperty, notificationType: 'two_months' | 'one_month' | 'expired') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-rental-notification', {
        body: {
          ownerEmail: property.ownerEmail,
          ownerName: property.ownerName,
          propertyTitle: property.propertyTitle,
          contractEndDate: property.contractEndDate,
          daysRemaining: property.daysRemaining,
          notificationType,
          propertyLocation: property.location,
          tenantName: property.tenantName
        }
      });

      if (error) throw error;

      toast({
        title: "تم إرسال الإشعار",
        description: `تم إرسال إشعار البريد الإلكتروني إلى ${property.ownerName}`,
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال الإشعار",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    // Export to CSV
    const headers = ['العقار', 'الموقع', 'المالك', 'المستأجر', 'تاريخ الانتهاء', 'المتبقي', 'الإيجار الشهري'];
    const rows = filteredProperties.map(p => [
      p.propertyTitle,
      p.location,
      p.ownerName,
      p.tenantName,
      p.contractEndDate,
      `${p.daysRemaining} يوم`,
      `${p.monthlyRent} ريال`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_العقارات_المؤجرة_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "تم تصدير التقرير",
      description: "تم تحميل ملف CSV بنجاح",
    });
  };

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === 'active' && p.daysRemaining > 60).length,
    expiringSoon: properties.filter(p => p.daysRemaining <= 60 && p.daysRemaining > 0).length,
    expired: properties.filter(p => p.status === 'expired').length,
    totalRent: properties.reduce((sum, p) => sum + p.monthlyRent, 0)
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#01411C]">تقرير العقارات المؤجرة</h1>
          <p className="text-muted-foreground">متابعة عقود التأجير وتواريخ الانتهاء</p>
        </div>
        <Button onClick={exportReport} className="bg-[#01411C] hover:bg-[#01411C]/90">
          <FileDown className="w-4 h-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="w-8 h-8 mx-auto text-[#01411C] mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي العقارات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-sm text-muted-foreground">عقود نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</p>
            <p className="text-sm text-muted-foreground">تنتهي قريباً</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            <p className="text-sm text-muted-foreground">منتهية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 mx-auto text-[#D4AF37] mb-2 font-bold text-xl">﷼</div>
            <p className="text-2xl font-bold text-[#D4AF37]">{stats.totalRent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">إجمالي الإيجار الشهري</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فلترة حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع العقارات</SelectItem>
            <SelectItem value="active">النشطة</SelectItem>
            <SelectItem value="expiring">تنتهي قريباً</SelectItem>
            <SelectItem value="expired">منتهية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        {filteredProperties.map(property => (
          <Card key={property.id} className={`
            ${property.status === 'expired' ? 'border-red-300 bg-red-50' : ''}
            ${property.daysRemaining <= 30 && property.status !== 'expired' ? 'border-red-300 bg-red-50' : ''}
            ${property.daysRemaining <= 60 && property.daysRemaining > 30 ? 'border-amber-300 bg-amber-50' : ''}
          `}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{property.propertyTitle}</h3>
                    {getStatusBadge(property.status, property.daysRemaining)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {property.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      المالك: {property.ownerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      المستأجر: {property.tenantName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      ينتهي: {property.contractEndDate}
                    </span>
                    <span className={`font-bold ${property.daysRemaining <= 30 ? 'text-red-600' : property.daysRemaining <= 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      المتبقي: {property.daysRemaining > 0 ? `${property.daysRemaining} يوم` : 'منتهي'}
                    </span>
                    <span className="text-[#D4AF37] font-bold">
                      {property.monthlyRent.toLocaleString()} ريال/شهر
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendNotification(property, property.daysRemaining <= 30 ? 'one_month' : 'two_months')}
                    disabled={isLoading}
                    className="border-[#01411C] text-[#01411C] hover:bg-[#01411C] hover:text-white"
                  >
                    <Mail className="w-4 h-4 ml-1" />
                    إرسال تنبيه
                  </Button>
                  {property.status === 'expired' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => sendNotification(property, 'expired')}
                      disabled={isLoading}
                    >
                      <Bell className="w-4 h-4 ml-1" />
                      إشعار انتهاء
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد عقارات مؤجرة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RentedPropertiesReport;
