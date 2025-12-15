/**
 * AdPublishingSections.tsx
 * أقسام النشر الإعلاني الكاملة
 * حسب PUBLISH_AD_SECTIONS_COMPLETE_PROMPT.md
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Users,
  DollarSign,
  Share2,
  Palette,
  BarChart3,
  Eye,
  Send,
  Sparkles,
  Globe,
  Calendar,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";

// ===================== أنواع الإعلانات =====================
const AD_TYPES = [
  { id: 'image', name: 'صورة', icon: '🖼️' },
  { id: 'video', name: 'فيديو', icon: '🎬' },
  { id: 'carousel', name: 'عرض شرائح', icon: '🎠' },
  { id: 'story', name: 'قصة', icon: '📱' },
  { id: 'collection', name: 'مجموعة', icon: '🗂️' },
  { id: 'instant', name: 'فوري', icon: '⚡' },
];

// ===================== أنواع القنوات =====================
const CHANNEL_TYPES = [
  { id: 'facebook', name: 'فيسبوك', icon: '📘', color: 'blue', bg_color: 'bg-blue-100', avg_cpc: 2.5 },
  { id: 'instagram', name: 'انستغرام', icon: '📷', color: 'pink', bg_color: 'bg-pink-100', avg_cpc: 3.2 },
  { id: 'twitter', name: 'تويتر/X', icon: '🐦', color: 'sky', bg_color: 'bg-sky-100', avg_cpc: 2.0 },
  { id: 'snapchat', name: 'سناب شات', icon: '👻', color: 'yellow', bg_color: 'bg-yellow-100', avg_cpc: 1.8 },
  { id: 'tiktok', name: 'تيك توك', icon: '🎵', color: 'gray', bg_color: 'bg-gray-100', avg_cpc: 1.5 },
  { id: 'google_ads', name: 'إعلانات جوجل', icon: '🔍', color: 'green', bg_color: 'bg-green-100', avg_cpc: 1.8 },
];

// ===================== Props =====================
interface AdPublishingSectionsProps {
  onBack: () => void;
}

// ===================== المكون الرئيسي =====================
export default function AdPublishingSections({ onBack }: AdPublishingSectionsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('create');

  // حالة قسم إنشاء الإعلان
  const [adType, setAdType] = useState('image');
  const [campaign, setCampaign] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [callToAction, setCallToAction] = useState('learn_more');

  // حالة قسم الجمهور المستهدف
  const [location, setLocation] = useState<string[]>(['riyadh']);
  const [ageRange, setAgeRange] = useState([18, 45]);
  const [gender, setGender] = useState('all');
  const [interests, setInterests] = useState<string[]>(['technology', 'business']);
  const [languages, setLanguages] = useState<string[]>(['ar']);

  // حالة قسم الميزانية والجدولة
  const [budgetType, setBudgetType] = useState('daily');
  const [totalBudget, setTotalBudget] = useState(5000);
  const [dailyBudget, setDailyBudget] = useState(1000);
  const [scheduleType, setScheduleType] = useState('continuous');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bidStrategy, setBidStrategy] = useState('lowest_cost');

  // حالة قسم القنوات والمنصات
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['facebook', 'instagram']);
  const [placement, setPlacement] = useState('feed');
  const [deviceTargeting, setDeviceTargeting] = useState('all');
  const [connectionTypes, setConnectionTypes] = useState<string[]>(['wifi', 'cellular']);

  // حالة قسم المحتوى والإبداع
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#3B82F6');
  const [fontStyle, setFontStyle] = useState('modern');
  const [contentCallToAction, setContentCallToAction] = useState('');

  // خيارات الخطوط
  const fontStyles = [
    { id: 'modern', name: 'حديث', font: 'font-sans' },
    { id: 'classic', name: 'كلاسيكي', font: 'font-serif' },
    { id: 'elegant', name: 'أنيق', font: 'font-mono' },
    { id: 'bold', name: 'عريض', font: 'font-bold' }
  ];
  
  // ألوان العلامة التجارية
  const brandColors = [
    { id: 'blue', value: '#3B82F6', name: 'أزرق' },
    { id: 'green', value: '#10B981', name: 'أخضر' },
    { id: 'purple', value: '#8B5CF6', name: 'بنفسجي' },
    { id: 'red', value: '#EF4444', name: 'أحمر' },
    { id: 'orange', value: '#F59E0B', name: 'برتقالي' },
    { id: 'wasata', value: '#01411C', name: 'وساطة' }
  ];
  
  // إجراءات الدعوة للمحتوى
  const contentCallToActionOptions = [
    { id: 'shop_now', text: 'تسوق الآن', color: 'bg-red-500' },
    { id: 'learn_more', text: 'تعرف أكثر', color: 'bg-blue-500' },
    { id: 'sign_up', text: 'سجل الآن', color: 'bg-green-500' },
    { id: 'download', text: 'حمل التطبيق', color: 'bg-purple-500' },
    { id: 'contact_us', text: 'اتصل بنا', color: 'bg-amber-500' }
  ];
  
  // معاينة الإعلان
  const adPreview = {
    headline: headline || 'عنوان إعلانك الجذاب هنا',
    description: description || 'وصف مختصر وجذاب للإعلان يشرح الفوائد والتفاصيل المهمة للمستخدم',
    callToAction: contentCallToActionOptions.find(cta => cta.id === contentCallToAction)?.text || 'تعرف أكثر'
  };

  // ===================== البيانات الثابتة =====================
  
  // الحملات المتاحة
  const campaigns = [
    { id: 'camp1', name: 'حملة الصيف 2024', budget: 50000, status: 'active' },
    { id: 'camp2', name: 'عروض الأعياد', budget: 30000, status: 'active' },
    { id: 'camp3', name: 'ترويج المنتجات الجديدة', budget: 75000, status: 'planned' }
  ];

  // إجراءات الدعوة
  const callToActions = [
    { id: 'learn_more', text: 'تعرف أكثر', icon: '📚' },
    { id: 'shop_now', text: 'تسوق الآن', icon: '🛒' },
    { id: 'sign_up', text: 'سجل الآن', icon: '📝' },
    { id: 'download', text: 'حمل التطبيق', icon: '📱' },
    { id: 'contact_us', text: 'اتصل بنا', icon: '📞' },
    { id: 'book_now', text: 'احجز الآن', icon: '📅' }
  ];

  // المدن
  const cities = [
    { id: 'riyadh', name: 'الرياض', population: '7.6 مليون' },
    { id: 'jeddah', name: 'جدة', population: '4.7 مليون' },
    { id: 'dammam', name: 'الدمام', population: '1.5 مليون' },
    { id: 'mecca', name: 'مكة', population: '2.4 مليون' },
    { id: 'medina', name: 'المدينة', population: '1.5 مليون' }
  ];

  // الاهتمامات
  const interestOptions = [
    { id: 'technology', name: 'تقنية', icon: '💻' },
    { id: 'business', name: 'أعمال', icon: '💼' },
    { id: 'sports', name: 'رياضة', icon: '⚽' },
    { id: 'travel', name: 'سفر', icon: '✈️' },
    { id: 'food', name: 'طعام', icon: '🍕' },
    { id: 'fashion', name: 'موضة', icon: '👕' },
    { id: 'health', name: 'صحة', icon: '💊' },
    { id: 'education', name: 'تعليم', icon: '🎓' }
  ];

  // اللغات
  const languageOptions = [
    { id: 'ar', name: 'العربية', native: 'العربية' },
    { id: 'en', name: 'الإنجليزية', native: 'English' },
    { id: 'ur', name: 'الأردية', native: 'اردو' },
    { id: 'fr', name: 'الفرنسية', native: 'Français' }
  ];

  // أنواع الميزانية
  const budgetTypes = [
    { id: 'daily', name: 'يومية', description: 'ميزانية يومية ثابتة' },
    { id: 'lifetime', name: 'إجمالية', description: 'ميزانية إجمالية للحملة' }
  ];

  // استراتيجيات المزايدة
  const bidStrategies = [
    { id: 'lowest_cost', name: 'أقل تكلفة', description: 'تحقيق النتائج بأقل تكلفة' },
    { id: 'target_cost', name: 'تكلفة مستهدفة', description: 'الحفاظ على تكلفة ثابتة للتحويل' },
    { id: 'max_conversions', name: 'أقصى تحويلات', description: 'تحقيق أكبر عدد من التحويلات' },
    { id: 'max_clicks', name: 'أقصى نقرات', description: 'الحصول على أكبر عدد من النقرات' }
  ];

  // أنواع الجدولة
  const scheduleTypes = [
    { id: 'continuous', name: 'مستمر', description: 'تشغيل مستمر حتى نفاد الميزانية' },
    { id: 'scheduled', name: 'مجدول', description: 'تشغيل في أوقات محددة' },
    { id: 'accelerated', name: 'مسرع', description: 'إنفاق سريع للميزانية' }
  ];

  // تقدير حجم الجمهور
  const audienceSize = 245000;

  // تقدير النتائج
  const estimatedResults = {
    impressions: 125000,
    clicks: 2500,
    conversions: 125,
    cpc: 2.0,
    ctr: 2.0,
    conversionRate: 5.0
  };

  // التبويبات
  const tabs = [
    { id: 'create', label: 'إنشاء الإعلان', icon: Sparkles },
    { id: 'audience', label: 'الجمهور المستهدف', icon: Users },
    { id: 'budget', label: 'الميزانية والجدولة', icon: DollarSign },
    { id: 'channels', label: 'القنوات والمنصات', icon: Share2 },
    { id: 'content', label: 'المحتوى والإبداع', icon: Palette },
    { id: 'analytics', label: 'التحليل والتتبع', icon: BarChart3 },
  ];

  // ===================== دوال المساعدة =====================

  const handlePublish = () => {
    toast.success('تم نشر الإعلان بنجاح!');
    // TODO: حفظ البيانات في قاعدة البيانات
  };

  const handleSaveDraft = () => {
    toast.info('تم حفظ المسودة');
  };

  // ===================== العرض =====================
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* رأس الصفحة */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-[#D4AF37] text-[#01411C] hover:bg-[#01411C] hover:text-white"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              رجوع
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-2 rounded-xl">
                  <Target className="w-5 h-5" />
                </span>
                نظام النشر الإعلاني
              </h1>
              <p className="text-gray-600">إدارة الحملات والإعلانات الرقمية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="border-gray-300"
            >
              حفظ كمسودة
            </Button>
            <Button
              onClick={handlePublish}
              className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-white"
            >
              <Send className="w-4 h-4 ml-2" />
              نشر الإعلان
            </Button>
          </div>
        </div>

        {/* خطوات الإنشاء */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`rounded-xl p-4 text-center ${currentStep >= 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            <div className="text-2xl font-bold mb-1">1</div>
            <div className="font-medium">المعلومات الأساسية</div>
          </div>
          <div className={`rounded-xl p-4 text-center ${currentStep >= 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            <div className="text-2xl font-bold mb-1">2</div>
            <div className="font-medium">الجمهور المستهدف</div>
          </div>
          <div className={`rounded-xl p-4 text-center ${currentStep >= 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            <div className="text-2xl font-bold mb-1">3</div>
            <div className="font-medium">النشر والمتابعة</div>
          </div>
        </div>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-2 bg-white border-2 border-[#D4AF37] mb-6 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ===================== قسم إنشاء الإعلان ===================== */}
        <TabsContent value="create">
          <div className="space-y-6">
            {/* عنوان القسم */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">إنشاء إعلان جديد</h2>
                  <p className="text-blue-100">ابدأ بإنشاء إعلانك الاحترافي</p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>

            {/* نموذج إنشاء الإعلان */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* العمود الأيسر */}
                <div className="space-y-6">
                  {/* نوع الإعلان */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      نوع الإعلان
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {AD_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setAdType(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
                            adType === type.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-2xl mb-2">{type.icon}</span>
                          <span className="text-sm font-medium">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* الحملة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحملة الإعلانية
                    </label>
                    <select
                      value={campaign}
                      onChange={(e) => setCampaign(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر حملة إعلانية</option>
                      {campaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.name} - {camp.budget.toLocaleString()} ريال
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* إجراء الدعوة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      إجراء الدعوة
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {callToActions.map((cta) => (
                        <button
                          key={cta.id}
                          onClick={() => setCallToAction(cta.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center ${
                            callToAction === cta.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-lg mb-1">{cta.icon}</span>
                          <span className="text-xs">{cta.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* العمود الأيمن */}
                <div className="space-y-6">
                  {/* العنوان */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان الإعلان
                    </label>
                    <Input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="اكتب عنواناً جذاباً للإعلان..."
                      className="w-full"
                      maxLength={100}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-left">
                      {headline.length}/100 حرف
                    </div>
                  </div>

                  {/* الوصف */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      وصف الإعلان
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اكتب وصفاً مفصلاً للإعلان..."
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-left">
                      {description.length}/500 حرف
                    </div>
                  </div>

                  {/* معاينة سريعة */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      معاينة سريعة
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600">🏢</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">اسم الشركة</div>
                          <div className="text-xs text-gray-500">ساعة واحدة</div>
                        </div>
                      </div>
                      {headline && (
                        <div className="font-bold text-gray-900 mb-2">{headline}</div>
                      )}
                      {description && (
                        <div className="text-sm text-gray-700 mb-3">{description}</div>
                      )}
                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                        {callToActions.find(cta => cta.id === callToAction)?.text}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التنقل */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onBack}
                className="px-6 py-3"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button
                onClick={() => {
                  setActiveTab('audience');
                  setCurrentStep(2);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
              >
                التالي: الجمهور المستهدف
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===================== قسم الجمهور المستهدف ===================== */}
        <TabsContent value="audience">
          <div className="space-y-6">
            {/* عنوان القسم */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">الجمهور المستهدف</h2>
                  <p className="text-purple-100">حدد جمهورك بدقة لتحقيق أفضل النتائج</p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>

            {/* إحصائيات الجمهور */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">تقدير حجم الجمهور</h3>
                  <p className="text-gray-600">بناءً على التحديدات الحالية</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">
                    {audienceSize.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">شخص متوقع</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-sm text-purple-600 mb-1">التغطية</div>
                  <div className="text-2xl font-bold text-purple-800">45%</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-sm text-blue-600 mb-1">متوسط العمر</div>
                  <div className="text-2xl font-bold text-blue-800">32</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-sm text-green-600 mb-1">التكلفة المتوقعة</div>
                  <div className="text-2xl font-bold text-green-800">0.85 ريال</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="text-sm text-amber-600 mb-1">جودة التطابق</div>
                  <div className="text-2xl font-bold text-amber-800">عالية</div>
                </div>
              </div>
            </div>

            {/* نموذج تحديد الجمهور */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* العمود الأيسر */}
                <div className="space-y-6">
                  {/* الموقع الجغرافي */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      الموقع الجغرافي
                    </label>
                    <div className="space-y-2">
                      {cities.map((city) => (
                        <label key={city.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={location.includes(city.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setLocation([...location, city.id]);
                                } else {
                                  setLocation(location.filter(l => l !== city.id));
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{city.name}</div>
                              <div className="text-xs text-gray-500">{city.population} نسمة</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">+24500</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* النوع */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      النوع
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setGender('all')}
                        className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center ${
                          gender === 'all'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mb-1">👥</span>
                        <span className="text-xs">الكل</span>
                      </button>
                      <button
                        onClick={() => setGender('male')}
                        className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center ${
                          gender === 'male'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mb-1">👨</span>
                        <span className="text-xs">رجال</span>
                      </button>
                      <button
                        onClick={() => setGender('female')}
                        className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center ${
                          gender === 'female'
                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mb-1">👩</span>
                        <span className="text-xs">نساء</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* العمود الأيمن */}
                <div className="space-y-6">
                  {/* نطاق العمر */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      نطاق العمر: {ageRange[0]} - {ageRange[1]} سنة
                    </label>
                    <div className="px-4">
                      <input
                        type="range"
                        min="13"
                        max="65"
                        step="1"
                        value={ageRange[0]}
                        onChange={(e) => setAgeRange([Number(e.target.value), ageRange[1]])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <input
                        type="range"
                        min="13"
                        max="65"
                        step="1"
                        value={ageRange[1]}
                        onChange={(e) => setAgeRange([ageRange[0], Number(e.target.value)])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mt-2"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>13 سنة</span>
                      <span>25 سنة</span>
                      <span>40 سنة</span>
                      <span>65 سنة</span>
                    </div>
                  </div>

                  {/* الاهتمامات */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      الاهتمامات
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {interestOptions.map((interest) => (
                        <button
                          key={interest.id}
                          onClick={() => {
                            if (interests.includes(interest.id)) {
                              setInterests(interests.filter(i => i !== interest.id));
                            } else {
                              setInterests([...interests, interest.id]);
                            }
                          }}
                          className={`p-2 rounded-lg border transition-all duration-200 flex flex-col items-center ${
                            interests.includes(interest.id)
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-lg">{interest.icon}</span>
                          <span className="text-xs mt-1">{interest.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* اللغات */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      اللغات
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {languageOptions.map((lang) => (
                        <label key={lang.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={languages.includes(lang.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLanguages([...languages, lang.id]);
                              } else {
                                setLanguages(languages.filter(l => l !== lang.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div>
                            <div className="text-sm font-medium">{lang.name}</div>
                            <div className="text-xs text-gray-500">{lang.native}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التنقل */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab('create');
                  setCurrentStep(1);
                }}
                className="px-6 py-3"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button
                onClick={() => {
                  setActiveTab('budget');
                  setCurrentStep(3);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white"
              >
                التالي: الميزانية والجدولة
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===================== قسم الميزانية والجدولة ===================== */}
        <TabsContent value="budget">
          <div className="space-y-6">
            {/* عنوان القسم */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">الميزانية والجدولة</h2>
                  <p className="text-green-100">حدد ميزانيتك وجدول الإعلان</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            {/* تقدير النتائج */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">تقدير النتائج</h3>
                  <p className="text-gray-600">بناءً على الميزانية والإعدادات الحالية</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {estimatedResults.conversions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">تحويل متوقع</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">الانطباعات</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {estimatedResults.impressions.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">النقرات</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {estimatedResults.clicks.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">تكلفة النقرة</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {estimatedResults.cpc.toFixed(2)} ريال
                  </div>
                </div>
              </div>
            </div>

            {/* نموذج الميزانية والجدولة */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* العمود الأيسر */}
                <div className="space-y-6">
                  {/* نوع الميزانية */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      نوع الميزانية
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {budgetTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setBudgetType(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                            budgetType === type.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-gray-900 mb-1">{type.name}</div>
                          <div className="text-xs text-gray-600">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* الميزانية */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {budgetType === 'daily' ? 'الميزانية اليومية' : 'الميزانية الإجمالية'}
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="100"
                        max="100000"
                        step="100"
                        value={budgetType === 'daily' ? dailyBudget : totalBudget}
                        onChange={(e) => {
                          if (budgetType === 'daily') {
                            setDailyBudget(Number(e.target.value));
                          } else {
                            setTotalBudget(Number(e.target.value));
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>100 ريال</span>
                        <span>50,000 ريال</span>
                        <span>100,000 ريال</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {(budgetType === 'daily' ? dailyBudget : totalBudget).toLocaleString()} ريال
                        </div>
                        <div className="text-sm text-gray-600">
                          {budgetType === 'daily'
                            ? `إجمالي ${(dailyBudget * 30).toLocaleString()} ريال لمدة 30 يوم`
                            : `يومياً ${Math.round(totalBudget / 30).toLocaleString()} ريال`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* العمود الأيمن */}
                <div className="space-y-6">
                  {/* نوع الجدولة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      نوع الجدولة
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {scheduleTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setScheduleType(type.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                            scheduleType === type.id
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">{type.name}</div>
                          <div className="text-xs text-gray-600">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* التواريخ */}
                  {scheduleType === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تاريخ البداية
                        </label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تاريخ النهاية
                        </label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* استراتيجية المزايدة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      استراتيجية المزايدة
                    </label>
                    <div className="space-y-2">
                      {bidStrategies.map((strategy) => (
                        <label key={strategy.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="bidStrategy"
                              checked={bidStrategy === strategy.id}
                              onChange={() => setBidStrategy(strategy.id)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{strategy.name}</div>
                              <div className="text-xs text-gray-600">{strategy.description}</div>
                            </div>
                          </div>
                          {strategy.id === 'lowest_cost' && (
                            <div className="text-sm text-green-600">مستحسن</div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التنقل */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab('audience');
                  setCurrentStep(2);
                }}
                className="px-6 py-3"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button
                onClick={() => setActiveTab('channels')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white"
              >
                التالي: القنوات والمنصات
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===================== قسم القنوات والمنصات الكامل ===================== */}
        <TabsContent value="channels">
          <div className="space-y-6">
            {/* عنوان القسم */}
            <div className="bg-gradient-to-r from-amber-600 to-yellow-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">القنوات والمنصات</h2>
                  <p className="text-amber-100">اختر منصات النشر وإعدادات العرض</p>
                </div>
                <div className="text-4xl">📢</div>
              </div>
            </div>

            {/* أداء القنوات */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">مقارنة أداء القنوات</h3>
                <button className="text-amber-600 hover:text-amber-800 text-sm font-medium">
                  عرض التفاصيل →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">القناة</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">معدل النقر</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">تكلفة النقرة</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الوصول</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">التوصية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { channel: 'facebook', ctr: 1.2, cpc: 2.5, reach: 50000 },
                      { channel: 'instagram', ctr: 1.8, cpc: 3.2, reach: 45000 },
                      { channel: 'google_ads', ctr: 3.5, cpc: 1.8, reach: 75000 }
                    ].map((perf) => {
                      const channelConfig = CHANNEL_TYPES.find(c => c.id === perf.channel);
                      return (
                        <tr key={perf.channel} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 justify-end">
                              <div className={`w-10 h-10 ${channelConfig?.bg_color} rounded-lg flex items-center justify-center`}>
                                <span className="text-lg">{channelConfig?.icon}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">{channelConfig?.name}</div>
                                <div className="text-xs text-gray-500">{selectedChannels.includes(perf.channel) ? 'محدد' : 'غير محدد'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-right">
                              <div className="font-bold text-green-600">{perf.ctr}%</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-right">
                              <div className="font-bold text-blue-600">{perf.cpc.toFixed(2)} ريال</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-right">
                              <div className="font-bold text-purple-600">{perf.reach.toLocaleString()}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`text-right font-bold ${
                              perf.channel === 'google_ads' ? 'text-green-600' :
                              perf.channel === 'facebook' ? 'text-amber-600' :
                              'text-blue-600'
                            }`}>
                              {perf.channel === 'google_ads' ? 'مستحسن' :
                               perf.channel === 'facebook' ? 'جيد' : 'متوسط'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* نموذج القنوات والإعدادات */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* العمود الأيسر */}
                <div className="space-y-6">
                  {/* اختيار القنوات */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      اختيار القنوات
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {CHANNEL_TYPES.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => {
                            if (selectedChannels.includes(channel.id)) {
                              setSelectedChannels(selectedChannels.filter(c => c !== channel.id));
                            } else {
                              setSelectedChannels([...selectedChannels, channel.id]);
                            }
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center ${
                            selectedChannels.includes(channel.id)
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-2xl mb-2">{channel.icon}</span>
                          <span className="text-sm font-medium">{channel.name}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {channel.avg_cpc?.toFixed(2)} ريال
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* أنواع الأجهزة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      أنواع الأجهزة المستهدفة
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'all', name: 'الكل', icon: '📱💻' },
                        { id: 'mobile', name: 'جوال فقط', icon: '📱' },
                        { id: 'desktop', name: 'كمبيوتر فقط', icon: '💻' }
                      ].map((device) => (
                        <button
                          key={device.id}
                          onClick={() => setDeviceTargeting(device.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center ${
                            deviceTargeting === device.id
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-lg mb-1">{device.icon}</span>
                          <span className="text-xs">{device.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* العمود الأيمن */}
                <div className="space-y-6">
                  {/* أماكن العرض */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      أماكن العرض
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'feed', name: 'الرئيسية', description: 'في شريط الأخبار' },
                        { id: 'story', name: 'القصص', description: 'في قصص المنصة' },
                        { id: 'video', name: 'الفيديو', description: 'ضمن الفيديوهات' },
                        { id: 'search', name: 'البحث', description: 'في نتائج البحث' },
                        { id: 'marketplace', name: 'السوق', description: 'في سوق المنصة' },
                        { id: 'messenger', name: 'المحادثات', description: 'ضمن المراسلة' }
                      ].map((place) => (
                        <button
                          key={place.id}
                          onClick={() => setPlacement(place.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                            placement === place.id
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">{place.name}</div>
                          <div className="text-xs text-gray-600">{place.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* أنواع الاتصال */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      أنواع الاتصال
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'wifi', name: 'واي فاي', icon: '📶', perf: '+35% أداء' },
                        { id: 'cellular', name: 'خلوي', icon: '📡', perf: '+20% أداء' },
                        { id: 'all', name: 'الكل', icon: '🌐', perf: 'متوسط' }
                      ].map((connection) => (
                        <label key={connection.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={connectionTypes.includes(connection.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConnectionTypes([...connectionTypes, connection.id]);
                                } else {
                                  setConnectionTypes(connectionTypes.filter(c => c !== connection.id));
                                }
                              }}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{connection.icon}</span>
                              <span className="font-medium text-gray-900">{connection.name}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{connection.perf}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* إعدادات متقدمة */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">إعدادات متقدمة</label>
                      <button className="text-sm text-amber-600 hover:text-amber-800">عرض الكل</button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">عرض على الشبكات الممولة</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">توسيع جمهور مشابه</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التنقل */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setActiveTab('budget')} className="px-6 py-3">
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button onClick={() => setActiveTab('content')} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-white">
                التالي: المحتوى والإبداع
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===================== قسم المحتوى والإبداع الكامل ===================== */}
        <TabsContent value="content">
          <div className="space-y-6">
            {/* عنوان القسم */}
            <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">المحتوى والإبداع</h2>
                  <p className="text-red-100">صمم محتوى إعلانك بشكل إبداعي</p>
                </div>
                <div className="text-4xl">🎨</div>
              </div>
            </div>

            {/* معاينة الإعلان */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">معاينة الإعلان</h3>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">📱 جوال</button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">💻 كمبيوتر</button>
                  <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">🎬 فيديو</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* المحرر */}
                <div className="space-y-6">
                  {/* الصورة الرئيسية */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">الصورة الرئيسية</label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('primary-image-input')?.click()}
                    >
                      {primaryImage ? (
                        <div className="relative">
                          <img src={primaryImage} alt="الصورة الرئيسية" className="w-full h-48 object-cover rounded-lg" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPrimaryImage(null); }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-4xl mb-2">🖼️</div>
                          <div className="text-gray-600 mb-2">اسحب وأفلت صورة هنا</div>
                          <div className="text-sm text-gray-500">أو انقر للاختيار</div>
                          <div className="text-xs text-gray-400 mt-2">الحجم الموصى: 1200x628 بكسل</div>
                        </>
                      )}
                      <input 
                        id="primary-image-input"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setPrimaryImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </div>
                  </div>

                  {/* الصور الثانوية */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">الصور الإضافية (اختياري)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((index) => (
                        <div 
                          key={index} 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                          onClick={() => document.getElementById(`secondary-image-${index}`)?.click()}
                        >
                          {secondaryImages[index] ? (
                            <div className="relative">
                              <img src={secondaryImages[index]} alt={`صورة ${index + 1}`} className="w-full h-24 object-cover rounded" />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newImages = [...secondaryImages];
                                  newImages.splice(index, 1);
                                  setSecondaryImages(newImages);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white text-xs p-0.5 rounded-full"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="text-xl">➕</div>
                              <div className="text-xs text-gray-500 mt-1">إضافة</div>
                            </>
                          )}
                          <input 
                            id={`secondary-image-${index}`}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const newImages = [...secondaryImages];
                                  newImages[index] = reader.result as string;
                                  setSecondaryImages(newImages);
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* رابط الفيديو */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رابط الفيديو (اختياري)</label>
                    <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                </div>

                {/* المعاينة */}
                <div>
                  <div className="bg-gray-900 rounded-xl p-6">
                    {/* محاكاة هاتف */}
                    <div className="bg-gray-800 rounded-2xl p-4 mx-auto max-w-xs">
                      {/* رأس المحاكاة */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-white text-sm">9:41</div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                      </div>

                      {/* محتوى الإعلان */}
                      <div className="bg-white rounded-xl overflow-hidden">
                        {/* الصورة */}
                        {primaryImage ? (
                          <img src={primaryImage} alt="معاينة الإعلان" className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl">🖼️</div>
                              <div className="text-gray-600 text-sm">صورة الإعلان</div>
                            </div>
                          </div>
                        )}

                        {/* المحتوى النصي */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: brandColor }}></div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">اسم العلامة</div>
                              <div className="text-xs text-gray-500">ساعة واحدة</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className={`font-bold text-gray-900 ${fontStyles.find(f => f.id === fontStyle)?.font || ''}`}>
                              {adPreview.headline}
                            </div>
                            <div className="text-sm text-gray-700">{adPreview.description}</div>
                          </div>

                          {/* إجراء الدعوة */}
                          <button 
                            className={`w-full mt-4 py-2 text-white rounded-lg font-medium ${contentCallToActionOptions.find(cta => cta.id === contentCallToAction)?.color || 'bg-blue-500'}`}
                            style={!contentCallToAction ? { backgroundColor: brandColor } : {}}
                          >
                            {adPreview.callToAction}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* نقاط الجودة */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-green-600 text-sm">نصوص</div>
                      <div className="font-bold text-green-800">{headline ? '9/10' : '5/10'}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-blue-600 text-sm">صور</div>
                      <div className="font-bold text-blue-800">{primaryImage ? '8/10' : '3/10'}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <div className="text-purple-600 text-sm">إبداع</div>
                      <div className="font-bold text-purple-800">{fontStyle !== 'modern' ? '9/10' : '7/10'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أدوات التخصيص */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* العمود الأيسر */}
                <div className="space-y-6">
                  {/* النصوص */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الرئيسي</label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="اكتب عنواناً جذاباً..."
                      maxLength={100}
                    />
                    <div className="text-xs text-gray-400 mt-1 text-left">{headline.length}/100</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اكتب وصفاً مفصلاً..."
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-400 mt-1 text-left">{description.length}/500</div>
                  </div>
                </div>

                {/* العمود الأيمن */}
                <div className="space-y-6">
                  {/* التخصيص */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">لون العلامة التجارية</label>
                    <div className="grid grid-cols-6 gap-2">
                      {brandColors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setBrandColor(color.value)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            brandColor === color.value ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                      <input 
                        type="color" 
                        value={brandColor} 
                        onChange={(e) => setBrandColor(e.target.value)} 
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" 
                        title="لون مخصص"
                      />
                    </div>
                  </div>

                  {/* نمط الخط */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">نمط الخط</label>
                    <div className="grid grid-cols-4 gap-2">
                      {fontStyles.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setFontStyle(font.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                            fontStyle === font.id
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${font.font}`}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* إجراء الدعوة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">إجراء الدعوة</label>
                    <div className="grid grid-cols-5 gap-2">
                      {contentCallToActionOptions.map((cta) => (
                        <button
                          key={cta.id}
                          onClick={() => setContentCallToAction(cta.id)}
                          className={`p-2 rounded-lg border transition-all duration-200 text-center ${
                            contentCallToAction === cta.id
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-full h-8 ${cta.color} rounded mb-1 flex items-center justify-center text-white text-xs`}>
                            {cta.text.charAt(0)}
                          </div>
                          <div className="text-xs">{cta.text}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التنقل */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setActiveTab('channels')} className="px-6 py-3">
                <ArrowRight className="w-4 h-4 ml-2" />
                رجوع
              </Button>
              <Button onClick={() => setActiveTab('analytics')} className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white">
                التالي: التحليل والتتبع
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===================== قسم التحليل والتتبع ===================== */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">التحليل والتتبع</h2>
                  <p className="text-amber-100">راقب أداء إعلاناتك</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-12">
                قريباً: لوحة تحليلات متقدمة
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
