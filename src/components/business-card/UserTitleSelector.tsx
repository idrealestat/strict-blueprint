import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Check, X, Loader2, AlertTriangle, Clock, Crown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface UserTitleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  companyName: string;
  websiteUrl: string;
  accountType: string;
}

interface ValidationResult {
  allowed: boolean;
  status: 'available' | 'unavailable' | 'pending' | 'error';
  reason?: string;
  matched_company?: string;
  requires_approval?: boolean;
  price?: number;
}

interface DomainSettings {
  pricing_enabled: boolean;
  default_price: number;
  priority_warning_enabled: boolean;
  priority_warning_message: string;
}

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
  const [matchedCompany, setMatchedCompany] = useState("");
  const [settings, setSettings] = useState<DomainSettings | null>(null);
  const [requestPrice, setRequestPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب الإعدادات
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('domain_settings')
          .select('*')
          .limit(1)
          .single();
        
        if (!error && data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // التحقق من صيغة اليوزر تايتل الأساسية (قبل إرسال للخادم)
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

    if (input.length < 3) {
      return { valid: false, message: "يجب أن يكون الاسم 3 أحرف على الأقل" };
    }

    return { valid: true, message: "" };
  };

  // التحقق من توفر اليوزر تايتل عبر Edge Function
  const checkAvailability = useCallback(async (userTitle: string) => {
    if (!userTitle || userTitle.length < 3) {
      setAvailability(null);
      setErrorMessage("");
      setMatchedCompany("");
      setRequestPrice(null);
      return;
    }

    const formatValidation = validateFormat(userTitle);
    if (!formatValidation.valid) {
      setAvailability('error');
      setErrorMessage(formatValidation.message);
      setMatchedCompany("");
      setRequestPrice(null);
      return;
    }

    setIsChecking(true);
    setErrorMessage("");
    setMatchedCompany("");
    setRequestPrice(null);

    try {
      // استدعاء Edge Function للتحقق الذكي
      const { data, error } = await supabase.functions.invoke('validate-domain', {
        body: {
          userTitle: userTitle,
          companyName: companyName,
          websiteUrl: websiteUrl,
          accountType: accountType
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setAvailability('error');
        setErrorMessage("حدث خطأ في التحقق من النطاق");
        return;
      }

      const result = data as ValidationResult;
      setAvailability(result.status);
      
      if (result.reason) {
        setErrorMessage(result.reason);
      }
      
      if (result.matched_company) {
        setMatchedCompany(result.matched_company);
      }

      if (result.price) {
        setRequestPrice(result.price);
      }

      // إظهار رسالة توست حسب الحالة
      if (result.status === 'available') {
        toast.success("النطاق متاح للاستخدام");
      } else if (result.status === 'pending' && result.requires_approval) {
        toast.info("هذا النطاق يحتاج موافقة الإدارة");
      }

    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability('error');
      setErrorMessage("حدث خطأ في التحقق");
    } finally {
      setIsChecking(false);
    }
  }, [websiteUrl, companyName, accountType]);

  // إرسال طلب للإدارة
  const submitDomainRequest = async () => {
    if (!value) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const { error } = await supabase
        .from('domain_requests')
        .insert({
          user_id: user.id,
          requested_title: value,
          company_name: companyName || null,
          website_url: websiteUrl || null,
          account_type: accountType,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("لديك طلب سابق لهذا النطاق");
        } else {
          throw error;
        }
        return;
      }

      toast.success("تم إرسال طلبك للمراجعة، سيتم إشعارك بالنتيجة");
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error("حدث خطأ في إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  // التحقق عند تغيير القيمة (مع debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailability(value);
    }, 600);

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
      return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
    }

    switch (availability) {
      case 'available':
        return <Check className="w-5 h-5 text-emerald-500" />;
      case 'unavailable':
        return <X className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = () => {
    switch (availability) {
      case 'available':
        return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      case 'unavailable':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'pending':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      default:
        return 'border-muted';
    }
  };

  const getStatusTextColor = () => {
    switch (availability) {
      case 'available':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'unavailable':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-amber-600 dark:text-amber-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2">
        <Globe className="w-4 h-4" />
        اختر نطاقك الخاص
      </Label>
      
      <div className="border-2 border-amber-500 rounded-lg p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
        <div className="flex items-center gap-2" dir="ltr">
          {/* دائرة حالة التوفر */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          
          {/* اسم الدومين الأساسي */}
          <span className="text-primary font-bold text-sm whitespace-nowrap">
            WasataAI.com/
          </span>
          
          {/* حقل الإدخال */}
          <Input
            value={value}
            onChange={handleChange}
            placeholder="اسمك أو اسم شركتك"
            className="flex-1 border-amber-400 focus:ring-amber-500 focus:border-amber-500 text-left font-medium"
            dir="ltr"
            maxLength={30}
          />
        </div>
        
        {/* رسالة الحالة */}
        {errorMessage && (
          <div className={`text-sm mt-3 text-right p-2 rounded ${getStatusColor()}`}>
            <p className={`font-medium ${getStatusTextColor()}`}>
              {errorMessage}
            </p>
            {matchedCompany && (
              <p className={`text-xs mt-1 ${getStatusTextColor()}`}>
                الشركة المطابقة: {matchedCompany}
              </p>
            )}
          </div>
        )}
        
        {availability === 'available' && !errorMessage && value && (
          <div className="mt-3 p-2 rounded bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 text-right font-medium">
              ✅ النطاق متاح! رابطك سيكون: WasataAI.com/{value}
            </p>
          </div>
        )}

        {availability === 'pending' && (
          <div className="mt-3 space-y-3">
            <div className="p-2 rounded bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300 text-right font-medium">
                ⏳ هذا النطاق يحتاج موافقة الإدارة. يمكنك إرسال طلب للمراجعة.
              </p>
              {requestPrice && settings?.pricing_enabled && (
                <p className="text-sm text-amber-700 dark:text-amber-300 text-right mt-2 flex items-center justify-end gap-1">
                  <DollarSign className="w-4 h-4" />
                  رسوم هذا النطاق: <strong>{requestPrice} ريال</strong>
                </p>
              )}
            </div>
            
            <Button 
              onClick={submitDomainRequest} 
              disabled={isSubmitting}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 ml-2" />
              )}
              إرسال طلب للمراجعة
            </Button>
          </div>
        )}

        {/* تنبيه أولوية المالك الأصلي */}
        {settings?.priority_warning_enabled && value && (availability === 'available' || availability === 'pending') && (
          <Alert className="mt-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30">
            <Crown className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm text-right">
              {settings.priority_warning_message}
            </AlertDescription>
          </Alert>
        )}
        
        {/* تعليمات */}
        <div className="mt-4 text-xs text-muted-foreground text-right space-y-1 border-t border-amber-200 dark:border-amber-800 pt-3">
          <p className="font-medium text-foreground mb-2">📋 شروط اختيار النطاق:</p>
          <p>• يجب أن يحتوي على حروف وأرقام فقط (بدون نقاط أو شرطات)</p>
          <p>• لا يمكن استخدام اسم أول شائع بمفرده (مثل: محمد، أحمد)</p>
          <p>• لا يمكن استخدام اسم شركة عقارية سعودية مسجلة</p>
          <p>• إذا كان لديك موقع إلكتروني مسجل، يمكنك استخدام نفس اسم الدومين</p>
          <p>• الأسماء المشابهة لشركات عقارية تحتاج موافقة خاصة</p>
        </div>
      </div>
    </div>
  );
};

export default UserTitleSelector;
