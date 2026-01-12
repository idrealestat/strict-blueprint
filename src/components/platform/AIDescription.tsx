/**
 * AIDescription.tsx
 * مكون توليد الوصف والعنوان الذكي بالذكاء الاصطناعي
 * تصميم فاخر مع زر ذهبي، مودال احترافي، عناوين متعددة، و3 اقتراحات للوصف
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wand2, 
  RefreshCw, 
  Copy, 
  CheckCircle, 
  Sparkles, 
  X,
  Loader2,
  MapPin,
  AlertCircle,
  Type,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PropertyFeatures, AIDescriptionResponse } from "@/types/owners";
import { supabase } from "@/integrations/supabase/client";

// واجهة الاستجابة المحدثة مع العناوين
interface AIGenerationResponse extends AIDescriptionResponse {
  titleSuggestions: string[]; // عناوين مقترحة متعددة
}

interface AIDescriptionProps {
  mode: 'sale' | 'rent' | 'buy-request' | 'rent-request';
  city?: string;
  district?: string;
  propertyType?: string;
  features?: PropertyFeatures;
  price?: number;
  currentDescription?: string;
  currentTitle?: string;
  onDescriptionSelect: (description: string) => void;
  onTitleSelect?: (title: string) => void; // دالة اختيار العنوان
  className?: string;
  // خيارات إضافية للتحكم
  style?: 'احترافي' | 'تسويقي' | 'فاخر';
  length?: 'قصير' | 'متوسط' | 'طويل';
  language?: 'عربي' | 'انجليزي' | 'عربي انجليزي';
  brokerPhone?: string;
  adLicense?: string;
}

export default function AIDescription({
  mode,
  city,
  district,
  propertyType,
  features,
  price,
  currentDescription,
  currentTitle,
  onDescriptionSelect,
  onTitleSelect,
  className = "",
  style = 'احترافي',
  length = 'متوسط',
  language = 'عربي',
  brokerPhone,
  adLicense
}: AIDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string>('');
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'titles' | 'descriptions'>('titles');

  // دالة توليد العناوين والأوصاف
  const generateContent = useCallback(async () => {
    if (!propertyType) {
      toast.error('يرجى تحديد نوع العقار أولاً');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // الحصول على جلسة المستخدم
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('يرجى تسجيل الدخول أولاً');
        setError('يرجى تسجيل الدخول لاستخدام التوليد الذكي');
        setIsLoading(false);
        return;
      }

      // تحديد الغرض بناءً على الوضع
      const purposeMap = {
        'sale': 'للبيع',
        'rent': 'للإيجار',
        'buy-request': 'مطلوب للشراء',
        'rent-request': 'مطلوب للإيجار'
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-property-description`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            propertyData: {
              propertyType,
              category: features?.category || '',
              purpose: purposeMap[mode],
              city,
              district,
              price: price?.toString() || '',
              area: features?.area?.toString() || '',
              bedrooms: features?.bedrooms?.toString() || '',
              bathrooms: features?.bathrooms?.toString() || '',
              livingRooms: features?.livingRooms?.toString() || '',
              councils: features?.councils?.toString() || '',
              floors: features?.floors?.toString() || '',
              floorNumber: features?.floorNumber?.toString() || '',
              cornerType: features?.cornerType || '',
              furnishing: features?.furnishing || '',
              propertyAge: features?.propertyAge?.toString() || '',
              streetWidth: features?.streetWidth?.toString() || '',
              facade: features?.facade || '',
              acUnits: features?.airConditioners?.toString() || '',
              balconies: features?.balconies?.toString() || '',
              entrances: features?.entrances || '',
              warehouses: features?.warehouses?.toString() || '',
              curtains: features?.curtains?.toString() || '',
              hasLaundryRoom: features?.hasLaundryRoom || false,
              hasExtraKitchen: features?.hasExtraKitchen || false,
              extraKitchenAppliances: features?.extraKitchenAppliances || '',
              features: features?.customFeatures || [],
              warranties: features?.warranties || [],
              descriptionStyle: style,
              descriptionLength: length,
              descriptionLanguage: language,
              brokerPhone: brokerPhone || '',
              adLicense: adLicense || '',
              generateMultiple: true,
              generateTitles: true,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في توليد المحتوى');
      }

      const data = await response.json();
      
      // إنشاء الاستجابة المنسقة
      const mainDescription = data.description || '';
      const purpose = purposeMap[mode];
      
      // توليد عناوين متعددة
      const titleSuggestions: string[] = [];
      
      // عنوان 1: رسمي
      titleSuggestions.push(
        `${propertyType} ${purpose} - ${city || ''} حي ${district || ''}`
      );
      
      // عنوان 2: تسويقي مع المساحة
      if (features?.area) {
        titleSuggestions.push(
          `${propertyType} فاخر ${purpose} | ${features.area} م² - ${district || city || ''}`
        );
      }
      
      // عنوان 3: مع عدد الغرف
      if (features?.bedrooms) {
        titleSuggestions.push(
          `${propertyType} ${features.bedrooms} غرف ${purpose} في ${city || ''}`
        );
      }
      
      // عنوان 4: مختصر وجذاب
      titleSuggestions.push(
        `✨ ${propertyType} مميز ${purpose} - ${district || city || ''}`
      );
      
      // عنوان 5: مع السعر
      if (price) {
        const formattedPrice = price >= 1000000 
          ? `${(price / 1000000).toFixed(1)} مليون` 
          : `${(price / 1000).toFixed(0)} ألف`;
        titleSuggestions.push(
          `${propertyType} ${purpose} بـ ${formattedPrice} ريال - ${city || ''}`
        );
      }

      // توليد اقتراحات وصف إضافية
      const descriptionSuggestions: string[] = [];
      
      // الاقتراح الأول: نسخة مختصرة
      if (mainDescription.length > 200) {
        const shortVersion = mainDescription.split('\n').slice(0, 4).join('\n');
        descriptionSuggestions.push(shortVersion);
      }
      
      // الاقتراح الثاني: التركيز على المميزات
      if (features?.customFeatures && features.customFeatures.length > 0) {
        const featuresFocused = `✨ ${propertyType} ${purpose} في ${city || ''} - ${district || ''}\n\n🏠 المميزات الرئيسية:\n${features.customFeatures.slice(0, 5).map(f => `• ${f}`).join('\n')}\n\n📞 للتواصل والاستفسار`;
        descriptionSuggestions.push(featuresFocused);
      }
      
      // الاقتراح الثالث: نسخة تسويقية قصيرة
      const marketingShort = `🌟 ${propertyType} ${purpose}\n📍 ${city || ''} - ${district || ''}\n${features?.area ? `📐 المساحة: ${features.area} م²` : ''}\n${features?.bedrooms ? `🛏️ ${features.bedrooms} غرف نوم` : ''}\n${price ? `💰 ${price.toLocaleString()} ريال` : ''}\n\n📲 تواصل معنا الآن!`;
      descriptionSuggestions.push(marketingShort);

      // أحياء مقترحة
      const neighborhoodSuggestions = getNeighborhoodSuggestions(city || '');

      setSuggestions({
        title: titleSuggestions[0],
        titleSuggestions: titleSuggestions.filter(t => t.trim()),
        description: mainDescription,
        suggestions: descriptionSuggestions,
        neighborhoods: neighborhoodSuggestions
      });

      // تعبئة الحقول تلقائياً بدون فتح نافذة منبثقة
      const bestTitle = titleSuggestions[0];
      const bestDescription = mainDescription;
      
      setSelectedTitle(bestTitle);
      setSelectedDescription(bestDescription);
      
      // تطبيق الاختيار مباشرة
      if (bestTitle && onTitleSelect) {
        onTitleSelect(bestTitle);
      }
      if (bestDescription) {
        onDescriptionSelect(bestDescription);
      }
      
      toast.success('تم توليد العنوان والوصف تلقائياً');

    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      toast.error(err instanceof Error ? err.message : 'فشل في توليد المحتوى');
    } finally {
      setIsLoading(false);
    }
  }, [propertyType, mode, city, district, features, price, style, length, language, brokerPhone, adLicense]);

  // دالة نسخ النص
  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('تم النسخ');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('فشل في نسخ النص');
    }
  }, []);

  // دالة تأكيد الاختيار
  const confirmSelection = useCallback(() => {
    if (selectedTitle && onTitleSelect) {
      onTitleSelect(selectedTitle);
    }
    if (selectedDescription) {
      onDescriptionSelect(selectedDescription);
    }
    setIsOpen(false);
    toast.success('تم اختيار العنوان والوصف بنجاح');
  }, [selectedTitle, selectedDescription, onTitleSelect, onDescriptionSelect]);

  // دالة الحصول على اقتراحات الأحياء
  const getNeighborhoodSuggestions = (cityName: string): string[] => {
    const neighborhoods: Record<string, string[]> = {
      'الرياض': ['النرجس', 'الملقا', 'العليا', 'الياسمين', 'حطين', 'الصحافة'],
      'جدة': ['الحمراء', 'الشاطئ', 'النزهة', 'الروضة', 'الربوة', 'المروة'],
      'مكة': ['العزيزية', 'الشوقية', 'العوالي', 'الكعكية', 'الحمراء'],
      'المدينة': ['العزيزية', 'قربان', 'الفيصلية', 'الراية', 'العنابس'],
      'الدمام': ['الفيصلية', 'الشاطئ', 'النور', 'الروضة', 'المزروعية'],
      'الخبر': ['الحزام الذهبي', 'العقربية', 'الثقبة', 'الخبر الشمالية'],
    };
    return neighborhoods[cityName] || ['الحي الأول', 'الحي الثاني', 'المنطقة المركزية'];
  };

  return (
    <>
      {/* زر توليد المحتوى الذكي - تصميم ذهبي فاخر */}
      <motion.div className={className}>
        <Button
          onClick={generateContent}
          disabled={isLoading || !propertyType}
          className="w-full relative overflow-hidden group bg-gradient-to-r from-[#D4AF37] via-[#f1c40f] to-[#D4AF37] hover:from-[#c9a227] hover:via-[#e0b40e] hover:to-[#c9a227] text-[#01411C] font-bold shadow-lg transition-all duration-300"
          size="lg"
        >
          {/* خلفية متحركة */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: isLoading ? '100%' : '-100%' }}
            transition={{ repeat: isLoading ? Infinity : 0, duration: 1.5, ease: 'linear' }}
          />
          
          <span className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري توليد العناوين والأوصاف...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>توليد العنوان والوصف بالذكاء الاصطناعي</span>
                <Sparkles className="w-4 h-4 animate-pulse" />
              </>
            )}
          </span>
        </Button>
      </motion.div>

      {/* المودال الفاخر */}
      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-gradient-to-b from-[#f0fdf4] to-white border-2 border-[#D4AF37]/30">
              {/* رأس المودال */}
              <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#01411C]" />
                    </div>
                    <span>المحتوى الذكي بالذكاء الاصطناعي</span>
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </DialogHeader>

              {/* تبويبات العناوين والأوصاف */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'titles' | 'descriptions')} className="flex-1">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-2 bg-[#01411C]/10">
                    <TabsTrigger 
                      value="titles" 
                      className="flex items-center gap-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white"
                    >
                      <Type className="w-4 h-4" />
                      العناوين ({suggestions?.titleSuggestions?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="descriptions"
                      className="flex items-center gap-2 data-[state=active]:bg-[#01411C] data-[state=active]:text-white"
                    >
                      <FileText className="w-4 h-4" />
                      الأوصاف ({(suggestions?.suggestions?.length || 0) + 1})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="max-h-[50vh] p-6">
                  {error ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                      <p className="text-red-600 font-medium mb-4">{error}</p>
                      <Button onClick={generateContent} variant="outline">
                        <RefreshCw className="w-4 h-4 ml-2" />
                        إعادة المحاولة
                      </Button>
                    </motion.div>
                  ) : suggestions ? (
                    <>
                      {/* تبويب العناوين */}
                      <TabsContent value="titles" className="mt-0 space-y-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <h3 className="font-bold text-[#01411C] mb-4 flex items-center gap-2">
                            <Type className="w-5 h-5 text-[#D4AF37]" />
                            اختر عنواناً للإعلان
                          </h3>
                          <div className="grid gap-3">
                            {suggestions.titleSuggestions?.map((title, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedTitle(title)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                  selectedTitle === title
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md'
                                    : 'border-gray-200 hover:border-[#D4AF37]/50 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      selectedTitle === title 
                                        ? 'bg-[#D4AF37] text-[#01411C]' 
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <p className="text-gray-800 font-medium">{title}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(title, index);
                                    }}
                                    className="text-[#01411C] hover:text-[#D4AF37] shrink-0"
                                  >
                                    {copiedIndex === index ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                                {selectedTitle === title && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center gap-1 mt-2 text-[#01411C] text-sm font-medium"
                                  >
                                    <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                                    محدد
                                  </motion.div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </TabsContent>

                      {/* تبويب الأوصاف */}
                      <TabsContent value="descriptions" className="mt-0 space-y-6">
                        {/* الوصف الرئيسي */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-[#01411C] flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                              الوصف الرئيسي
                            </h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(suggestions.description, 100)}
                              className="text-[#01411C] hover:text-[#D4AF37]"
                            >
                              {copiedIndex === 100 ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <div
                            onClick={() => setSelectedDescription(suggestions.description)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              selectedDescription === suggestions.description
                                ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md'
                                : 'border-gray-200 hover:border-[#D4AF37]/50 bg-white'
                            }`}
                          >
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                              {suggestions.description}
                            </pre>
                            {selectedDescription === suggestions.description && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 mt-3 text-[#01411C] text-sm font-medium"
                              >
                                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                                محدد
                              </motion.div>
                            )}
                          </div>
                        </motion.div>

                        {/* الاقتراحات الإضافية */}
                        {suggestions.suggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <h3 className="font-bold text-[#01411C] mb-3 flex items-center gap-2">
                              <RefreshCw className="w-5 h-5 text-[#065f41]" />
                              اقتراحات بديلة ({suggestions.suggestions.length})
                            </h3>
                            <div className="grid gap-3">
                              {suggestions.suggestions.map((suggestion, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + index * 0.1 }}
                                  onClick={() => setSelectedDescription(suggestion)}
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                    selectedDescription === suggestion
                                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md'
                                      : 'border-gray-200 hover:border-[#D4AF37]/50 bg-white'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed flex-1">
                                      {suggestion}
                                    </pre>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(suggestion, 101 + index);
                                      }}
                                      className="text-[#01411C] hover:text-[#D4AF37] shrink-0"
                                    >
                                      {copiedIndex === 101 + index ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                  {selectedDescription === suggestion && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="flex items-center gap-1 mt-3 text-[#01411C] text-sm font-medium"
                                    >
                                      <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                                      محدد
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* الأحياء المقترحة */}
                        {suggestions.neighborhoods.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <h3 className="font-bold text-[#01411C] mb-3 flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-[#065f41]" />
                              أحياء مقترحة في {city}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.neighborhoods.map((neighborhood, index) => (
                                <motion.span
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.6 + index * 0.05 }}
                                  className="px-3 py-1.5 bg-[#f0fdf4] border border-[#01411C]/20 rounded-full text-sm text-[#01411C] hover:bg-[#01411C] hover:text-white cursor-pointer transition-colors"
                                >
                                  {neighborhood}
                                </motion.span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </TabsContent>
                    </>
                  ) : null}
                </ScrollArea>
              </Tabs>

              {/* تذييل المودال - ملخص الاختيارات */}
              {suggestions && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 pt-4 border-t bg-gray-50/80"
                >
                  {/* ملخص الاختيارات */}
                  <div className="mb-4 p-3 bg-white rounded-lg border space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Type className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-gray-500">العنوان:</span>
                      <span className="font-medium text-[#01411C] truncate flex-1">
                        {selectedTitle || 'لم يتم اختيار عنوان'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-gray-500">الوصف:</span>
                      <span className="font-medium text-[#01411C] truncate flex-1">
                        {selectedDescription ? `${selectedDescription.substring(0, 50)}...` : 'لم يتم اختيار وصف'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={generateContent}
                      disabled={isLoading}
                      className="border-[#01411C] text-[#01411C] hover:bg-[#01411C] hover:text-white"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 ml-2" />
                      )}
                      توليد محتوى جديد
                    </Button>
                    <Button
                      onClick={confirmSelection}
                      disabled={!selectedTitle && !selectedDescription}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#f1c40f] text-[#01411C] font-bold hover:from-[#c9a227] hover:to-[#e0b40e] shadow-md px-8"
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      استخدام المحدد
                    </Button>
                  </div>
                </motion.div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
