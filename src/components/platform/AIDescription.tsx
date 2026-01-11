/**
 * AIDescription.tsx
 * مكون توليد الوصف الذكي بالذكاء الاصطناعي
 * تصميم فاخر مع زر ذهبي، مودال احترافي، و3 اقتراحات
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
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PropertyFeatures, AIDescriptionResponse } from "@/types/owners";

interface AIDescriptionProps {
  mode: 'sale' | 'rent' | 'buy-request' | 'rent-request';
  city?: string;
  district?: string;
  propertyType?: string;
  features?: PropertyFeatures;
  price?: number;
  currentDescription?: string;
  onDescriptionSelect: (description: string) => void;
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
  onDescriptionSelect,
  className = "",
  style = 'احترافي',
  length = 'متوسط',
  language = 'عربي',
  brokerPhone,
  adLicense
}: AIDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIDescriptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // دالة توليد الأوصاف
  const generateDescriptions = useCallback(async () => {
    if (!propertyType) {
      toast.error('يرجى تحديد نوع العقار أولاً');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            propertyData: {
              propertyType,
              purpose: purposeMap[mode],
              city,
              district,
              area: features?.area?.toString() || '',
              bedrooms: features?.bedrooms?.toString() || '',
              bathrooms: features?.bathrooms?.toString() || '',
              livingRooms: features?.livingRooms?.toString() || '',
              councils: features?.councils?.toString() || '',
              floors: features?.floors?.toString() || '',
              furnishing: features?.furnishing || '',
              propertyAge: features?.propertyAge?.toString() || '',
              streetWidth: features?.streetWidth?.toString() || '',
              facade: features?.facade || '',
              acUnits: features?.airConditioners?.toString() || '',
              balconies: features?.balconies?.toString() || '',
              entrances: features?.entrances || '',
              features: features?.customFeatures || [],
              warranties: features?.warranties || [],
              descriptionStyle: style,
              descriptionLength: length,
              descriptionLanguage: language,
              brokerPhone: brokerPhone || '',
              adLicense: adLicense || '',
              generateMultiple: true, // طلب توليد اقتراحات متعددة
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في توليد الوصف');
      }

      const data = await response.json();
      
      // إنشاء الاستجابة المنسقة
      const mainDescription = data.description || '';
      
      // توليد اقتراحات إضافية محاكاة (في المستقبل يمكن تحسينها من الباكند)
      const suggestionsList: string[] = [];
      
      // الاقتراح الأول: نسخة مختصرة
      if (mainDescription.length > 200) {
        const shortVersion = mainDescription.split('\n').slice(0, 4).join('\n');
        suggestionsList.push(shortVersion);
      }
      
      // الاقتراح الثاني: التركيز على المميزات
      if (features?.customFeatures && features.customFeatures.length > 0) {
        const featuresFocused = `✨ ${propertyType} ${purposeMap[mode]} في ${city || ''} - ${district || ''}\n\n🏠 المميزات الرئيسية:\n${features.customFeatures.slice(0, 5).map(f => `• ${f}`).join('\n')}\n\n📞 للتواصل والاستفسار`;
        suggestionsList.push(featuresFocused);
      }
      
      // الاقتراح الثالث: نسخة تسويقية قصيرة
      const marketingShort = `🌟 ${propertyType} ${purposeMap[mode]}\n📍 ${city || ''} - ${district || ''}\n${features?.area ? `📐 المساحة: ${features.area} م²` : ''}\n${features?.bedrooms ? `🛏️ ${features.bedrooms} غرف نوم` : ''}\n${price ? `💰 ${price.toLocaleString()} ريال` : ''}\n\n📲 تواصل معنا الآن!`;
      suggestionsList.push(marketingShort);

      // أحياء مقترحة
      const neighborhoodSuggestions = getNeighborhoodSuggestions(city || '');

      setSuggestions({
        title: `${propertyType} ${purposeMap[mode]} - ${city || ''} ${district || ''}`,
        description: mainDescription,
        suggestions: suggestionsList,
        neighborhoods: neighborhoodSuggestions
      });

      setSelectedSuggestion(mainDescription);
      setIsOpen(true);

    } catch (err) {
      console.error('Error generating description:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      toast.error(err instanceof Error ? err.message : 'فشل في توليد الوصف');
    } finally {
      setIsLoading(false);
    }
  }, [propertyType, mode, city, district, features, price, style, length, language, brokerPhone, adLicense]);

  // دالة نسخ النص
  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('تم نسخ الوصف');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('فشل في نسخ النص');
    }
  }, []);

  // دالة تأكيد الاختيار
  const confirmSelection = useCallback(() => {
    if (selectedSuggestion) {
      onDescriptionSelect(selectedSuggestion);
      setIsOpen(false);
      toast.success('تم اختيار الوصف بنجاح');
    }
  }, [selectedSuggestion, onDescriptionSelect]);

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
      {/* زر توليد الوصف الذكي - تصميم ذهبي فاخر */}
      <motion.div className={className}>
        <Button
          onClick={generateDescriptions}
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
                <span>جاري توليد الأوصاف...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>توليد الوصف بالذكاء الاصطناعي</span>
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
                    <span>الوصف الذكي بالذكاء الاصطناعي</span>
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
                {suggestions && (
                  <p className="text-white/80 mt-2 text-sm">{suggestions.title}</p>
                )}
              </DialogHeader>

              <ScrollArea className="max-h-[60vh] p-6">
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-red-600 font-medium mb-4">{error}</p>
                    <Button onClick={generateDescriptions} variant="outline">
                      <RefreshCw className="w-4 h-4 ml-2" />
                      إعادة المحاولة
                    </Button>
                  </motion.div>
                ) : suggestions ? (
                  <div className="space-y-6">
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
                          onClick={() => copyToClipboard(suggestions.description, 0)}
                          className="text-[#01411C] hover:text-[#D4AF37]"
                        >
                          {copiedIndex === 0 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div
                        onClick={() => setSelectedSuggestion(suggestions.description)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedSuggestion === suggestions.description
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-md'
                            : 'border-gray-200 hover:border-[#D4AF37]/50 bg-white'
                        }`}
                      >
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                          {suggestions.description}
                        </pre>
                        {selectedSuggestion === suggestions.description && (
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
                              onClick={() => setSelectedSuggestion(suggestion)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                selectedSuggestion === suggestion
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
                                    copyToClipboard(suggestion, index + 1);
                                  }}
                                  className="text-[#01411C] hover:text-[#D4AF37] shrink-0"
                                >
                                  {copiedIndex === index + 1 ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              {selectedSuggestion === suggestion && (
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
                  </div>
                ) : null}
              </ScrollArea>

              {/* تذييل المودال */}
              {suggestions && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 pt-4 border-t bg-gray-50/80 flex items-center justify-between gap-4"
                >
                  <Button
                    variant="outline"
                    onClick={generateDescriptions}
                    disabled={isLoading}
                    className="border-[#01411C] text-[#01411C] hover:bg-[#01411C] hover:text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 ml-2" />
                    )}
                    توليد أوصاف جديدة
                  </Button>
                  <Button
                    onClick={confirmSelection}
                    disabled={!selectedSuggestion}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#f1c40f] text-[#01411C] font-bold hover:from-[#c9a227] hover:to-[#e0b40e] shadow-md px-8"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    استخدام الوصف المحدد
                  </Button>
                </motion.div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
