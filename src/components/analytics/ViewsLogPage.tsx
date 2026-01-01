/**
 * ViewsLogPage.tsx
 * صفحة سجل المشاهدات التفصيلي مع الفلترة
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VisitorsHeatMap from './VisitorsHeatMap';
import { 
  Eye, 
  Search, 
  Calendar, 
  MapPin, 
  Smartphone, 
  Monitor, 
  Globe,
  Clock,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ArrowRight,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

interface ViewLog {
  id: string;
  offerId: string;
  offerTitle?: string;
  city?: string;
  country?: string;
  device: string;
  browser: string;
  os: string;
  screenSize: string;
  timestamp: string;
  ip?: string;
  interaction?: boolean;
  interactionType?: string;
}

interface ViewsLogPageProps {
  onBack?: () => void;
}

const ViewsLogPage: React.FC<ViewsLogPageProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<ViewLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // تحميل السجلات
  const loadLogs = () => {
    setIsLoading(true);
    try {
      const viewsLog = JSON.parse(localStorage.getItem('offer_views_log') || '[]');
      const formattedLogs: ViewLog[] = viewsLog.map((log: any, index: number) => ({
        id: `log_${index}_${log.timestamp}`,
        offerId: log.offerId || 'unknown',
        offerTitle: log.offerTitle,
        city: log.city,
        country: log.country,
        device: log.device || 'غير معروف',
        browser: log.browser || 'غير معروف',
        os: log.os || 'غير معروف',
        screenSize: log.screenSize || 'غير معروف',
        timestamp: log.timestamp,
        ip: log.ip,
        interaction: log.interaction,
        interactionType: log.interactionType,
      }));
      
      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('خطأ في تحميل السجلات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // استخراج قائمة العروض للفلترة
  const uniqueOffers = useMemo(() => {
    const offers = new Map<string, string>();
    logs.forEach(log => {
      if (log.offerId && log.offerTitle) {
        offers.set(log.offerId, log.offerTitle);
      }
    });
    return Array.from(offers.entries());
  }, [logs]);

  // الفلترة
  const filteredLogs = useMemo(() => {
    const now = new Date();
    
    return logs.filter(log => {
      // فلتر البحث
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          log.offerTitle,
          log.city,
          log.country,
          log.device,
          log.browser,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(query)) return false;
      }

      // فلتر التاريخ
      if (dateFilter !== 'all' && log.timestamp) {
        const logDate = new Date(log.timestamp);
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (dateFilter) {
          case 'today': if (diffDays > 1) return false; break;
          case 'week': if (diffDays > 7) return false; break;
          case 'month': if (diffDays > 30) return false; break;
        }
      }

      // فلتر الجهاز
      if (deviceFilter !== 'all') {
        const isMobile = log.device.includes('هاتف') || log.device.includes('iPhone') || log.device.includes('Android');
        if (deviceFilter === 'mobile' && !isMobile) return false;
        if (deviceFilter === 'desktop' && isMobile) return false;
      }

      // فلتر العرض
      if (offerFilter !== 'all' && log.offerId !== offerFilter) return false;

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [logs, searchQuery, dateFilter, deviceFilter, offerFilter, sortOrder]);

  // تصدير CSV
  const exportCSV = () => {
    const headers = ['التاريخ', 'العرض', 'المدينة', 'الدولة', 'الجهاز', 'المتصفح', 'النظام'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('ar-SA'),
      log.offerTitle || log.offerId,
      log.city || 'غير معروف',
      log.country || 'غير معروف',
      log.device,
      log.browser,
      log.os,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `views_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير السجل');
  };

  // مسح السجلات
  const clearLogs = () => {
    if (confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
      localStorage.setItem('offer_views_log', '[]');
      setLogs([]);
      toast.success('تم مسح السجلات');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes('هاتف') || device.includes('iPhone') || device.includes('Android')) {
      return <Smartphone className="w-4 h-4 text-blue-500" />;
    }
    return <Monitor className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#01411C] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="border-2 bg-white/10 text-white hover:bg-white/20 border-[#D4AF37]"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة
              </Button>
            )}
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6" />
              سجل المشاهدات
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={exportCSV}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20 border-white/30"
              >
                <Download className="w-4 h-4 ml-1" />
                تصدير
              </Button>
              <Button
                onClick={clearLogs}
                variant="outline"
                size="sm"
                className="bg-red-500/20 text-white hover:bg-red-500/40 border-red-500/50"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                مسح
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="list" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              <Eye className="w-4 h-4 ml-2" />
              قائمة المشاهدات
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              <MapPin className="w-4 h-4 ml-2" />
              الخريطة الحرارية
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* فلاتر البحث */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="بحث في السجلات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>

                  <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                    <SelectTrigger className="w-32">
                      <Calendar className="w-4 h-4 ml-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="week">أسبوع</SelectItem>
                      <SelectItem value="month">شهر</SelectItem>
                      <SelectItem value="all">الكل</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={deviceFilter} onValueChange={(v: any) => setDeviceFilter(v)}>
                    <SelectTrigger className="w-32">
                      <Smartphone className="w-4 h-4 ml-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأجهزة</SelectItem>
                      <SelectItem value="mobile">موبايل</SelectItem>
                      <SelectItem value="desktop">كمبيوتر</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={offerFilter} onValueChange={setOfferFilter}>
                    <SelectTrigger className="w-48">
                      <Building className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="كل العروض" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل العروض</SelectItem>
                      {uniqueOffers.map(([id, title]) => (
                        <SelectItem key={id} value={id}>{title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  >
                    <Clock className="w-4 h-4 ml-1" />
                    {sortOrder === 'newest' ? 'الأحدث' : 'الأقدم'}
                  </Button>

                  <Button variant="outline" size="sm" onClick={loadLogs}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span>عرض {filteredLogs.length} من {logs.length} سجل</span>
                </div>
              </CardContent>
            </Card>

            {/* قائمة السجلات */}
            <Card className="border-2 border-gray-200">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredLogs.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">
                        <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>لا توجد سجلات مطابقة للفلاتر</p>
                      </div>
                    ) : (
                      filteredLogs.map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.02 }}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          <div className="flex items-center gap-4">
                            {/* أيقونة الجهاز */}
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              {getDeviceIcon(log.device)}
                            </div>

                            {/* المعلومات الرئيسية */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {log.offerTitle || `عرض #${log.offerId.slice(-6)}`}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {log.city || 'غير معروف'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {log.browser}
                                </span>
                              </div>
                            </div>

                            {/* الوقت والتفاعل */}
                            <div className="text-left">
                              <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                              {log.interaction && (
                                <Badge className="bg-green-100 text-green-700 text-xs mt-1">
                                  {log.interactionType || 'تفاعل'}
                                </Badge>
                              )}
                            </div>

                            {/* سهم التوسيع */}
                            {expandedLog === log.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          {/* التفاصيل الموسعة */}
                          <AnimatePresence>
                            {expandedLog === log.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
                              >
                                <div>
                                  <span className="text-gray-500 block">الجهاز:</span>
                                  <span className="font-medium">{log.device}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">نظام التشغيل:</span>
                                  <span className="font-medium">{log.os}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">دقة الشاشة:</span>
                                  <span className="font-medium">{log.screenSize}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">الدولة:</span>
                                  <span className="font-medium">{log.country || 'غير معروف'}</span>
                                </div>
                                {log.ip && (
                                  <div>
                                    <span className="text-gray-500 block">IP:</span>
                                    <span className="font-medium font-mono text-xs">{log.ip}</span>
                                  </div>
                                )}
                                <div className="col-span-2">
                                  <span className="text-gray-500 block">التاريخ الكامل:</span>
                                  <span className="font-medium">
                                    {new Date(log.timestamp).toLocaleString('ar-SA', { 
                                      dateStyle: 'full', 
                                      timeStyle: 'medium' 
                                    })}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <VisitorsHeatMap className="w-full" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ViewsLogPage;
