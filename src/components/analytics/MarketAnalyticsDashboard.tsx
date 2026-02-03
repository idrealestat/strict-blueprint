/**
 * MarketAnalyticsDashboard.tsx
 * لوحة تحليلات السوق الشاملة
 * تعرض جميع إحصائيات التطبيق: منصة النشر، بطاقة الأعمال، الفورمات، CRM، الفرص الذكية، التقويم
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import {
  Globe, CreditCard, FileText, Users, Share2, Sparkles, Calendar,
  Eye, MessageSquare, Download, DollarSign, Phone, Mail, MapPin, Save,
  TrendingUp, TrendingDown, Send, Clock, CheckCircle, XCircle, RefreshCw,
  Building, UserCheck, UserX, Briefcase, Home, Key, Loader2, ArrowUp, ArrowDown,
  BarChart3, PieChart, Activity, Target, Zap, AlertCircle
} from 'lucide-react';
import { useMarketAnalytics } from '@/hooks/useMarketAnalytics';

// مكون البطاقة الإحصائية
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  subtext,
  trend
}: { 
  title: string; 
  value: number | string; 
  icon: any; 
  color?: string;
  subtext?: string;
  trend?: 'up' | 'down' | null;
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500',
    red: 'from-red-500 to-rose-500',
    indigo: 'from-indigo-500 to-violet-500',
    teal: 'from-teal-500 to-cyan-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
      {subtext && <div className="text-xs text-blue-500 mt-1">{subtext}</div>}
    </motion.div>
  );
};

// مكون صف الإحصائيات
const StatsRow = ({ 
  items 
}: { 
  items: Array<{ label: string; value: number | string; icon?: any; color?: string }> 
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {items.map((item, idx) => (
      <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
        {item.icon && <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color || 'text-gray-500'}`} />}
        <div className="text-lg font-bold text-gray-800 dark:text-white">{item.value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
      </div>
    ))}
  </div>
);

const MarketAnalyticsDashboard = () => {
  const { data, loading, refetch } = useMarketAnalytics();
  const [activeSection, setActiveSection] = useState('platform');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#01411C]" />
        <span className="mr-3 text-gray-600">جاري تحميل التحليلات...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>لا توجد بيانات متاحة</p>
      </div>
    );
  }

  const sections = [
    { id: 'platform', label: 'منصة النشر', icon: Globe },
    { id: 'card', label: 'بطاقة الأعمال', icon: CreditCard },
    { id: 'forms', label: 'النماذج العامة', icon: FileText },
    { id: 'crm', label: 'إدارة العملاء', icon: Users },
    { id: 'publishing', label: 'النشر على المنصات', icon: Share2 },
    { id: 'opportunities', label: 'الفرص الذكية', icon: Sparkles },
    { id: 'calendar', label: 'التقويم', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#01411C] to-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">تحليلات السوق الشاملة</h2>
            <p className="text-sm text-gray-500">إحصائيات مفصلة لجميع أقسام التطبيق</p>
          </div>
        </div>
        <button 
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-[#01411C] text-white rounded-lg hover:bg-[#015a28] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* التبويبات */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {sections.map(sec => (
            <TabsTrigger 
              key={sec.id} 
              value={sec.id}
              className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white rounded-lg text-sm"
            >
              <sec.icon className="w-4 h-4" />
              <span className="hidden md:inline">{sec.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ==================== منصة النشر العامة ==================== */}
        <TabsContent value="platform" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-blue-500" />
                إحصائيات منصة النشر العامة
                <Badge className="bg-green-500 text-white">مباشر</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* إحصائيات المشاهدات */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="المشاهدات المباشرة" value={data.publicPlatform.liveViewers} icon={Eye} color="green" />
                <StatCard title="إجمالي المشاهدات" value={data.publicPlatform.totalOfferViews} icon={Eye} color="blue" />
                <StatCard title="مشاهدات اليوم" value={data.publicPlatform.todayOfferViews} icon={Activity} color="purple" />
                <StatCard title="نقرات الأزرار" value={Object.values(data.publicPlatform.buttonClicks).reduce((a, b) => a + b, 0)} icon={Target} color="orange" />
              </div>

              {/* النقر على الأزرار */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  نقرات الأزرار
                </h4>
                <StatsRow items={[
                  { label: 'واتساب', value: data.publicPlatform.buttonClicks.whatsapp, icon: MessageSquare, color: 'text-green-500' },
                  { label: 'جدولة معاينة', value: data.publicPlatform.buttonClicks.scheduleViewing, icon: Calendar, color: 'text-blue-500' },
                  { label: 'تحميل PDF', value: data.publicPlatform.buttonClicks.downloadPdf, icon: Download, color: 'text-purple-500' },
                  { label: 'دفع عربون', value: data.publicPlatform.buttonClicks.payDeposit, icon: DollarSign, color: 'text-amber-500' },
                  { label: 'عرض سعر', value: data.publicPlatform.buttonClicks.sendPriceQuote, icon: Send, color: 'text-indigo-500' },
                  { label: 'إرسال النماذج', value: data.publicPlatform.buttonClicks.submitForms, icon: FileText, color: 'text-teal-500' },
                ]} />
              </div>

              {/* أعلى وأقل العروض */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    أكثر العروض زيارة
                  </h4>
                  <ScrollArea className="h-32">
                    {data.publicPlatform.topViewedOffers.length > 0 ? (
                      data.publicPlatform.topViewedOffers.map((offer, idx) => (
                        <div key={offer.id} className="flex items-center justify-between py-2 border-b border-green-200/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">{idx + 1}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{offer.title}</span>
                          </div>
                          <Badge variant="outline" className="text-green-600">{offer.views} مشاهدة</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">لا توجد بيانات</p>
                    )}
                  </ScrollArea>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    أقل العروض زيارة
                  </h4>
                  <ScrollArea className="h-32">
                    {data.publicPlatform.lowestViewedOffers.length > 0 ? (
                      data.publicPlatform.lowestViewedOffers.map((offer, idx) => (
                        <div key={offer.id} className="flex items-center justify-between py-2 border-b border-red-200/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{idx + 1}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{offer.title}</span>
                          </div>
                          <Badge variant="outline" className="text-red-600">{offer.views} مشاهدة</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">لا توجد بيانات</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== بطاقة الأعمال الرقمية ==================== */}
        <TabsContent value="card" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-purple-500" />
                إحصائيات بطاقة الأعمال الرقمية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="إجمالي المشاهدات" value={data.businessCard.totalViews} icon={Eye} color="purple" />
                <StatCard title="المشاهدات المباشرة" value={data.businessCard.liveViewers} icon={Activity} color="green" />
                <StatCard title="متوسط مدة المشاهدة" value={`${data.businessCard.avgViewDuration}ث`} icon={Clock} color="blue" />
                <StatCard title="إجمالي التفاعلات" value={Object.values(data.businessCard.buttonClicks).reduce((a, b) => a + b, 0)} icon={Zap} color="orange" />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  نقرات أزرار البطاقة
                </h4>
                <StatsRow items={[
                  { label: 'اتصال', value: data.businessCard.buttonClicks.call, icon: Phone, color: 'text-blue-500' },
                  { label: 'واتساب', value: data.businessCard.buttonClicks.whatsapp, icon: MessageSquare, color: 'text-green-500' },
                  { label: 'بريد إلكتروني', value: data.businessCard.buttonClicks.email, icon: Mail, color: 'text-red-500' },
                  { label: 'الموقع', value: data.businessCard.buttonClicks.location, icon: MapPin, color: 'text-amber-500' },
                  { label: 'حفظ جهة اتصال', value: data.businessCard.buttonClicks.saveContact, icon: Save, color: 'text-indigo-500' },
                  { label: 'مشاركة', value: data.businessCard.buttonClicks.share, icon: Share2, color: 'text-teal-500' },
                ]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== النماذج العامة ==================== */}
        <TabsContent value="forms" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-indigo-500" />
                إحصائيات النماذج العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* إرسال عرض */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    إرسال عرض
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الزيارات</span><span className="font-bold">{data.publicForms.sendOffer.visits}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الإرسالات</span><span className="font-bold text-green-600">{data.publicForms.sendOffer.submissions}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">إرسالات متكررة</span><span className="font-bold text-orange-600">{data.publicForms.sendOffer.repeatSubmissions}</span></div>
                  </div>
                </div>

                {/* إرسال طلب */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    إرسال طلب
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الزيارات</span><span className="font-bold">{data.publicForms.sendRequest.visits}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الإرسالات</span><span className="font-bold text-green-600">{data.publicForms.sendRequest.submissions}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">إرسالات متكررة</span><span className="font-bold text-orange-600">{data.publicForms.sendRequest.repeatSubmissions}</span></div>
                  </div>
                </div>

                {/* عرض سعر */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    عرض سعر
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الزيارات</span><span className="font-bold">{data.publicForms.priceQuote.visits}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الإرسالات</span><span className="font-bold text-green-600">{data.publicForms.priceQuote.submissions}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">إرسالات متكررة</span><span className="font-bold text-orange-600">{data.publicForms.priceQuote.repeatSubmissions}</span></div>
                  </div>
                </div>

                {/* جدولة موعد */}
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
                  <h4 className="font-semibold text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    جدولة موعد
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الزيارات</span><span className="font-bold">{data.publicForms.scheduleAppointment.visits}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الإرسالات</span><span className="font-bold text-green-600">{data.publicForms.scheduleAppointment.submissions}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">إرسالات متكررة</span><span className="font-bold text-orange-600">{data.publicForms.scheduleAppointment.repeatSubmissions}</span></div>
                  </div>
                </div>

                {/* حاسبة التمويل */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    حاسبة التمويل
                    <Badge variant="outline" className="text-xs">قريباً</Badge>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الزيارات</span><span className="font-bold">{data.publicForms.financingCalculation.visits}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الإرسالات</span><span className="font-bold text-green-600">{data.publicForms.financingCalculation.submissions}</span></div>
                  </div>
                </div>

                {/* التقييم */}
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
                  <h4 className="font-semibold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    تقييم العقار
                    <Badge variant="outline" className="text-xs">قريباً</Badge>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الزيارات</span><span className="font-bold">{data.publicForms.propertyValuation.visits}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">الإرسالات</span><span className="font-bold text-green-600">{data.publicForms.propertyValuation.submissions}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== إدارة العملاء ==================== */}
        <TabsContent value="crm" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                إحصائيات إدارة العملاء
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* إحصائيات عامة */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="العملاء الحاليين" value={data.crm.currentTotal} icon={Users} color="blue" />
                <StatCard title="إجمالي المضافين" value={data.crm.totalAdded} icon={UserCheck} color="green" />
                <StatCard title="إجمالي المحذوفين" value={data.crm.totalDeleted} icon={UserX} color="red" />
                <StatCard title="تحميلات PDF" value={data.crm.cardDetails.pdfDownloads} icon={Download} color="purple" />
              </div>

              {/* تصنيف العملاء */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  تصنيف العملاء
                </h4>
                <StatsRow items={[
                  { label: 'مشترين', value: data.crm.byType.buyers, icon: Building, color: 'text-blue-500' },
                  { label: 'بائعين', value: data.crm.byType.sellers, icon: Home, color: 'text-green-500' },
                  { label: 'مستأجرين', value: data.crm.byType.renters, icon: Key, color: 'text-purple-500' },
                  { label: 'مؤجرين', value: data.crm.byType.landlords, icon: Briefcase, color: 'text-amber-500' },
                  { label: 'مستثمرين', value: data.crm.byType.investors, icon: TrendingUp, color: 'text-indigo-500' },
                  { label: 'وسطاء', value: data.crm.byType.brokers, icon: Users, color: 'text-teal-500' },
                ]} />
              </div>

              {/* تفاصيل البطاقات */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  تفاصيل بطاقات العملاء
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-lg font-bold text-blue-600">{data.crm.cardDetails.publishedOffers}</div>
                    <div className="text-xs text-gray-500">العروض المنشورة</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-lg font-bold text-green-600">{data.crm.cardDetails.receivedOffers}</div>
                    <div className="text-xs text-gray-500">العروض المستلمة</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-lg font-bold text-purple-600">{data.crm.cardDetails.receivedRequests}</div>
                    <div className="text-xs text-gray-500">الطلبات المستلمة</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-lg font-bold text-amber-600">{data.crm.cardDetails.rentedProperties}</div>
                    <div className="text-xs text-gray-500">عقارات مؤجرة</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-lg font-bold text-teal-600">{data.crm.cardDetails.soldOrRented}</div>
                    <div className="text-xs text-gray-500">تم البيع/التأجير</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-lg font-bold text-indigo-600">{data.crm.cardDetails.priceQuotesReceived}</div>
                    <div className="text-xs text-gray-500">عروض الأسعار</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-lg font-bold text-rose-600">{data.crm.cardDetails.receiptsCreated}</div>
                    <div className="text-xs text-gray-500">سندات القبض</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== النشر على المنصات ==================== */}
        <TabsContent value="publishing" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="w-5 h-5 text-teal-500" />
                إحصائيات النشر على المنصات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="إجمالي مرات النشر" value={data.platformPublishing.totalPublishes} icon={Share2} color="teal" />
                <StatCard title="نشر ناجح" value={data.platformPublishing.successfulPublishes} icon={CheckCircle} color="green" />
                <StatCard title="نشر فاشل" value={data.platformPublishing.failedPublishes} icon={XCircle} color="red" />
                <StatCard title="الطلبات المنشورة" value={data.platformPublishing.publishedRequestsCount} icon={FileText} color="purple" />
              </div>

              {/* المنصات المتصلة */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-500" />
                  المنصات المتصلة
                </h4>
                <div className="space-y-2">
                  {data.platformPublishing.connectedPlatforms.map((platform, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{platform.name}</span>
                      {platform.published ? (
                        <Badge className="bg-green-500 text-white">تم النشر</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 border-red-500">
                          {platform.error || 'لم يتم النشر'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== الفرص الذكية ==================== */}
        <TabsContent value="opportunities" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                إحصائيات الفرص الذكية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="بطاقات مقبولة" value={data.smartOpportunities.acceptedCards} icon={CheckCircle} color="green" />
                <StatCard title="بطاقات مرفوضة" value={data.smartOpportunities.rejectedCards} icon={XCircle} color="red" />
                <StatCard title="تواصل من العروض" value={data.smartOpportunities.contactedFromOffers} icon={Phone} color="blue" />
                <StatCard title="تواصل من الطلبات" value={data.smartOpportunities.contactedFromRequests} icon={MessageSquare} color="purple" />
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">ملخص الفرص</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      تم قبول {data.smartOpportunities.acceptedCards} فرصة ورفض {data.smartOpportunities.rejectedCards} فرصة
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== التقويم والمواعيد ==================== */}
        <TabsContent value="calendar" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-indigo-500" />
                إحصائيات التقويم والمواعيد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* إحصائيات عامة */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="إجمالي المواعيد" value={data.calendar.totalAppointments} icon={Calendar} color="indigo" />
                <StatCard title="تأكيدات الوسيط" value={data.calendar.brokerConfirmations} icon={CheckCircle} color="green" />
                <StatCard title="رفض الوسيط" value={data.calendar.brokerRejections} icon={XCircle} color="red" />
                <StatCard title="رسائل اعتذار" value={data.calendar.apologyMessages} icon={MessageSquare} color="purple" />
              </div>

              {/* تفاصيل العميل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    تفاعلات العملاء
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">رفض العميل للحضور</span>
                      <span className="font-bold text-red-600">{data.calendar.customerRejections}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">إعادة جدولة من العميل</span>
                      <span className="font-bold text-orange-600">{data.calendar.customerReschedules}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    أنواع المواعيد
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">اجتماعات</span>
                      <span className="font-bold">{data.calendar.appointmentsByType.meetings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">معاينة عقار</span>
                      <span className="font-bold">{data.calendar.appointmentsByType.propertyViewings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">إعادة اتصال</span>
                      <span className="font-bold">{data.calendar.appointmentsByType.callbacks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">أخرى</span>
                      <span className="font-bold">{data.calendar.appointmentsByType.other}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketAnalyticsDashboard;
