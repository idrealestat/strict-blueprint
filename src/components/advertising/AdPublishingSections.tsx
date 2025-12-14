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

        {/* ===================== قسم القنوات والمنصات ===================== */}
        <TabsContent value="channels">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">القنوات والمنصات</h2>
                  <p className="text-indigo-100">اختر منصات النشر المناسبة</p>
                </div>
                <div className="text-4xl">📢</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'facebook', name: 'فيسبوك', icon: '📘', users: '2.9B' },
                  { id: 'instagram', name: 'انستغرام', icon: '📷', users: '2.0B' },
                  { id: 'twitter', name: 'تويتر/X', icon: '🐦', users: '450M' },
                  { id: 'snapchat', name: 'سناب شات', icon: '👻', users: '750M' },
                  { id: 'tiktok', name: 'تيك توك', icon: '🎵', users: '1.5B' },
                  { id: 'google', name: 'إعلانات جوجل', icon: '🔍', users: '8.5B' },
                ].map((platform) => (
                  <div
                    key={platform.id}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all"
                  >
                    <div className="text-center">
                      <span className="text-4xl">{platform.icon}</span>
                      <div className="font-bold text-gray-900 mt-2">{platform.name}</div>
                      <div className="text-sm text-gray-500">{platform.users} مستخدم</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===================== قسم المحتوى والإبداع ===================== */}
        <TabsContent value="content">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-600 to-rose-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">المحتوى والإبداع</h2>
                  <p className="text-pink-100">صمم محتوى إعلاني جذاب</p>
                </div>
                <div className="text-4xl">🎨</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-12">
                قريباً: أدوات تصميم المحتوى الإبداعي
              </p>
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
