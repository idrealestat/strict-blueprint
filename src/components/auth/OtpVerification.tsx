import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OtpVerificationProps {
  type: 'email' | 'phone';
  value: string;
  /**
   * معرف ثابت لربط كود التفعيل قبل إنشاء المستخدم (email/phone).
   * مطلوب لتفادي تمرير قيم مثل 'temp' أو '' كـ userId.
   */
  identifier: string;
  userId?: string;
  isVerified: boolean;
  onVerified: () => void;
}

export default function OtpVerification({
  type,
  value,
  identifier,
  userId,
  isVerified,
  onVerified,
}: OtpVerificationProps) {
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const sendOtp = async (opts?: { probe?: boolean }) => {
    if (!value) return;

    const probe = !!opts?.probe;

    setIsSending(!probe);
    try {
      const functionName = type === 'email' ? 'send-email-otp' : 'send-phone-otp';
      const safeUserId = userId && userId.trim().length > 0 ? userId : undefined;

      const payload =
        type === 'email'
          ? { email: value, identifier, ...(safeUserId ? { userId: safeUserId } : {}), ...(probe ? { probe: true } : {}) }
          : { phone: value, identifier, ...(safeUserId ? { userId: safeUserId } : {}), ...(probe ? { probe: true } : {}) };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) throw error;

      if (data?.devMode) {
        console.log('OTP_DEV_MODE', { type, devMode: true });
      }

      // في وضع التطوير: ملء OTP + تحقق تلقائي (لا نتركها لمجرد تعبئة الحقل)
      if (data?.success && data?.devMode && data?.devCode) {
        setOtp(data.devCode);
        setShowOtpInput(true);

        toast({
          title: 'وضع التطوير',
          description: 'تم ملء رمز التحقق تلقائياً وسيتم التحقق الآن',
        });

        // Auto-submit verify
        window.setTimeout(() => {
          void verifyOtp(data.devCode);
        }, 0);

        return;
      }

      // إن كان probe في الإنتاج: لا نظهر واجهة إدخال ولا نبدأ عداد
      if (probe) {
        // data.devMode === false
        console.log('OTP_DEV_MODE', { type, devMode: false });
        return;
      }

      // إنتاج / أو dev بدون devCode
      toast({
        title: 'تم الإرسال',
        description:
          type === 'email' ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'تم إرسال رمز التحقق إلى رقم جوالك',
      });

      setShowOtpInput(true);

      // بدء العد التنازلي (60 ثانية)
      setCountdown(60);
      const timer = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال رمز التحقق',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async (codeOverride?: string) => {
    const codeToVerify = (codeOverride ?? otp).trim();
    if (codeToVerify.length !== 6) return;

    setIsVerifying(true);
    try {
      const safeUserId = userId && userId.trim().length > 0 ? userId : undefined;

      const { error } = await supabase.functions.invoke('verify-otp', {
        body: { identifier, code: codeToVerify, type, ...(safeUserId ? { userId: safeUserId } : {}) },
      });

      if (error) throw error;

      console.log('OTP_VERIFIED', { type });

      toast({
        title: 'تم التحقق',
        description: type === 'email' ? 'تم تفعيل البريد الإلكتروني بنجاح' : 'تم تفعيل رقم الجوال بنجاح',
      });

      onVerified();
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'رمز التحقق غير صحيح',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // عند دخول خطوة التفعيل: نفحص devMode بدون إرسال فعلي في الإنتاج.
  useEffect(() => {
    if (!value || isVerified) return;
    void sendOtp({ probe: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, value, isVerified]);

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">{type === 'email' ? 'البريد الإلكتروني مفعّل' : 'رقم الجوال مفعّل'}</span>
      </div>
    );
  }

  if (!value) {
    return <div className="text-sm text-muted-foreground">{type === 'email' ? 'أدخل البريد الإلكتروني أولاً' : 'أدخل رقم الجوال أولاً'}</div>;
  }

  return (
    <div className="space-y-3">
      {!showOtpInput ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void sendOtp()} disabled={isSending} className="w-full">
          {isSending ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : type === 'email' ? (
            <Mail className="w-4 h-4 ml-2" />
          ) : (
            <Phone className="w-4 h-4 ml-2" />
          )}
          {type === 'email' ? 'إرسال رمز التفعيل للبريد' : 'إرسال رمز التفعيل للجوال'}
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">أدخل الرمز المكون من 6 أرقام</p>
            <InputOTP maxLength={6} value={otp} onChange={setOtp} className="justify-center" dir="ltr">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={() => void verifyOtp()} disabled={otp.length !== 6 || isVerifying} className="flex-1">
              {isVerifying ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-2" />}
              تحقق
            </Button>

            <Button type="button" variant="outline" onClick={() => void sendOtp()} disabled={countdown > 0 || isSending}>
              {countdown > 0 ? <span className="text-sm">{countdown}s</span> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
