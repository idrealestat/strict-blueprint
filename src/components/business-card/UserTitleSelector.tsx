import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserTitleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  companyName: string;
  websiteUrl: string;
  accountType: string;
}

// قائمة الأسماء الأولى الشائعة التي تتطلب موافقة الأدمن
const COMMON_FIRST_NAMES = [
  "محمد", "أحمد", "عبدالله", "سعود", "خالد", "فهد", "عمر", "علي", "سلطان", "تركي",
  "عبدالرحمن", "ناصر", "سالم", "فيصل", "ماجد", "عادل", "يوسف", "حسن", "حسين", "صالح",
  "نايف", "بندر", "راشد", "مشاري", "منصور", "سعد", "طارق", "وليد", "ياسر", "عمار"
];

const UserTitleSelector: React.FC<UserTitleSelectorProps> = ({
  value,
  onChange,
  companyName,
  websiteUrl,
  accountType
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<'available' | 'unavailable' | 'pending' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // التحقق من صيغة اليوزر تايتل
  const validateFormat = (input: string): { valid: boolean; message: string } => {
    if (!input) {
      return { valid: false, message: "" };
    }

    // لا يقبل نقطة أو شرطة
    if (input.includes('.') || input.includes('-') || input.includes('_')) {
      return { valid: false, message: "لا يسمح باستخدام النقطة أو الشرطة كفاصل" };
    }

    // يجب أن يحتوي على حروف وأرقام فقط
    const validPattern = /^[a-zA-Z0-9\u0600-\u06FF]+$/;
    if (!validPattern.test(input)) {
      return { valid: false, message: "يجب أن يحتوي على حروف وأرقام فقط" };
    }

    // التحقق من أن الاسم ليس اسم أول فقط (شائع)
    const inputLower = input.toLowerCase();
    const isCommonFirstName = COMMON_FIRST_NAMES.some(name => 
      inputLower === name.toLowerCase() || input === name
    );

    if (isCommonFirstName) {
      return { valid: false, message: "لا يمكن استخدام اسم أول شائع بدون موافقة الأدمن. أضف رقماً أو حرفاً إضافياً" };
    }

    // التحقق من أن الاسم يحتوي على رقم إذا كان اسم بسيط
    const hasNumber = /\d/.test(input);
    const isSimpleName = /^[a-zA-Z\u0600-\u06FF]+$/.test(input);
    
    if (isSimpleName && !hasNumber && input.length < 6) {
      return { valid: false, message: "يجب إضافة رقم مع الاسم القصير" };
    }

    return { valid: true, message: "" };
  };

  // استخراج اسم الدومين من الرابط
  const extractDomainName = (url: string): string => {
    try {
      const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
      const domain = cleanUrl.split('/')[0].split('.')[0];
      return domain.toLowerCase();
    } catch {
      return "";
    }
  };

  // التحقق من توفر اليوزر تايتل
  const checkAvailability = useCallback(async (userTitle: string) => {
    if (!userTitle || userTitle.length < 3) {
      setAvailability(null);
      return;
    }

    const formatValidation = validateFormat(userTitle);
    if (!formatValidation.valid) {
      setAvailability('error');
      setErrorMessage(formatValidation.message);
      return;
    }

    setIsChecking(true);
    setErrorMessage("");

    try {
      // التحقق من قاعدة البيانات
      const { data: existingCards, error } = await supabase
        .from('business_cards')
        .select('slug')
        .eq('slug', userTitle.toLowerCase());

      if (error) throw error;

      if (existingCards && existingCards.length > 0) {
        setAvailability('unavailable');
        setErrorMessage("هذا النطاق مستخدم بالفعل");
        return;
      }

      // التحقق من تطابق اسم الشركة مع الدومين
      const domainName = extractDomainName(websiteUrl);
      const userTitleLower = userTitle.toLowerCase();

      // إذا كان شركة ولديها موقع إلكتروني
      if (accountType === 'company' && websiteUrl) {
        // إذا كان اليوزر تايتل مطابق لاسم الدومين الأصلي
        if (domainName && userTitleLower === domainName) {
          // تحقق من أن اسم الشركة متوافق
          if (companyName) {
            setAvailability('available');
            toast.success("تم التحقق: النطاق متوافق مع موقعك الإلكتروني");
            return;
          }
        }
      }

      // إذا كان فرد
      if (accountType === 'individual') {
        // التحقق مما إذا كان اليوزر تايتل مشابه لدومين عقاري سعودي موجود
        // هنا نفترض أنه إذا كان الاسم مشابه جداً لاسم شركة عقارية معروفة، لن يُسمح به
        const realEstateKeywords = ['عقار', 'عقارات', 'realestate', 'property', 'aqar'];
        const containsRealEstateKeyword = realEstateKeywords.some(keyword => 
          userTitleLower.includes(keyword)
        );

        if (containsRealEstateKeyword) {
          setAvailability('pending');
          setErrorMessage("يحتاج هذا النطاق للتحقق من أنه ليس مسجلاً لشركة عقارية أخرى");
          return;
        }
      }

      // النطاق متاح
      setAvailability('available');

    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability('error');
      setErrorMessage("حدث خطأ في التحقق");
    } finally {
      setIsChecking(false);
    }
  }, [websiteUrl, companyName, accountType]);

  // التحقق عند تغيير القيمة
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailability(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, checkAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toLowerCase().trim();
    // إزالة المسافات والأحرف غير المسموحة
    newValue = newValue.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '');
    onChange(newValue);
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
    }

    switch (availability) {
      case 'available':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'unavailable':
        return <X className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = () => {
    switch (availability) {
      case 'available':
        return 'border-green-500 bg-green-50';
      case 'unavailable':
        return 'border-red-500 bg-red-50';
      case 'pending':
        return 'border-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-[#D4AF37] font-bold flex items-center gap-2">
        <Globe className="w-4 h-4" />
        اختر نطاقك الخاص
      </Label>
      
      <div className={`border-2 border-[#D4AF37] rounded-lg p-3 bg-gradient-to-r from-amber-50 to-yellow-50`}>
        <div className="flex items-center gap-2" dir="ltr">
          {/* دائرة حالة التوفر */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          
          {/* اسم الدومين الأساسي */}
          <span className="text-[#01411C] font-bold text-sm whitespace-nowrap">
            WasataAI.com/
          </span>
          
          {/* حقل الإدخال */}
          <Input
            value={value}
            onChange={handleChange}
            placeholder="اسمك أو اسم شركتك"
            className="flex-1 border-[#D4AF37] focus:ring-[#D4AF37] text-left"
            dir="ltr"
            maxLength={30}
          />
        </div>
        
        {/* رسالة الحالة */}
        {errorMessage && (
          <p className={`text-xs mt-2 text-right ${
            availability === 'available' ? 'text-green-600' : 
            availability === 'pending' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {errorMessage}
          </p>
        )}
        
        {availability === 'available' && !errorMessage && value && (
          <p className="text-xs mt-2 text-green-600 text-right">
            ✅ النطاق متاح! رابطك سيكون: WasataAI.com/{value}
          </p>
        )}
        
        {/* تعليمات */}
        <div className="mt-3 text-xs text-gray-500 text-right space-y-1">
          <p>• يجب أن يحتوي على حروف وأرقام فقط (بدون نقاط أو شرطات)</p>
          <p>• لا يمكن استخدام اسم أول شائع بمفرده</p>
          <p>• إذا كان لديك موقع إلكتروني، يمكنك استخدام نفس اسم الدومين</p>
        </div>
      </div>
    </div>
  );
};

export default UserTitleSelector;
