/**
 * AIDescription.tsx
 * مكون توليد الوصف والعنوان الذكي بالذكاء الاصطناعي
 * تعبئة تلقائية مباشرة بدون نافذة منبثقة
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Wand2, 
  Loader2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PropertyFeatures } from "@/types/owners";
import { supabase } from "@/integrations/supabase/client";

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
  onTitleSelect?: (title: string) => void;
  className?: string;
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
  onDescriptionSelect,
  onTitleSelect,
  className = "",
  style = 'احترافي',
  length = 'متوسط',
  language = 'عربي',
  brokerPhone,
  adLicense
}: AIDescriptionProps) {
  const [isLoading, setIsLoading] = useState(false);

  // دالة توليد العناوين والأوصاف - تعبئة مباشرة
  const generateContent = useCallback(async () => {
    if (!propertyType) {
      toast.error('يرجى تحديد نوع العقار أولاً');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('يرجى تسجيل الدخول أولاً');
        setIsLoading(false);
        return;
      }

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
      const mainDescription = data.description || '';
      const purpose = purposeMap[mode];
      
      // توليد العنوان الأفضل
      const generatedTitle = `${propertyType} ${purpose} - ${city || ''} حي ${district || ''}`;
      
      // تعبئة الحقول مباشرة
      if (generatedTitle && onTitleSelect) {
        onTitleSelect(generatedTitle);
      }
      if (mainDescription) {
        onDescriptionSelect(mainDescription);
      }
      
      toast.success('تم توليد العنوان والوصف تلقائياً');

    } catch (err) {
      console.error('Error generating content:', err);
      toast.error(err instanceof Error ? err.message : 'فشل في توليد المحتوى');
    } finally {
      setIsLoading(false);
    }
  }, [propertyType, mode, city, district, features, price, style, length, language, brokerPhone, adLicense, onDescriptionSelect, onTitleSelect]);

  return (
    <motion.div className={className}>
      <Button
        onClick={generateContent}
        disabled={isLoading || !propertyType}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-[#D4AF37] via-[#f1c40f] to-[#D4AF37] hover:from-[#c9a227] hover:via-[#e0b40e] hover:to-[#c9a227] text-[#01411C] font-bold shadow-lg transition-all duration-300"
        size="lg"
      >
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
              <span>جاري توليد العنوان والوصف...</span>
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
  );
}
