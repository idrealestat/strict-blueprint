import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OtpVerificationProps {
  type: 'email';
  value: string;
  identifier: string;
  userId?: string;
  isVerified: boolean;
  onVerified: () => void;
}

export default function OtpVerification({
  type,
  value,
  isVerified,
  onVerified,
}: OtpVerificationProps) {
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // إرسال OTP باستخدام Supabase Auth المدمج
  const sendOtp = async () => {
    if (!value) return;

    setIsSending(true);
    try {
      // استخدام Supabase Auth signInWithOtp مباشرة
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          // لا نريد إنشاء مستخدم جديد تلقائياً
          shouldCreateUser: false,
        }
      });

      if (error) {
        // إذا كان الخطأ بسبب عدم وجود المستخدم، نحاول مع إنشاء مستخدم
        if (error.message.includes('User not found') || error.message.includes('Signups not allowed')) {
          // المستخدم غير موجود - نرسل OTP مع إنشاء مستخدم
          const { error: signupError } = await supabase.auth.signInWithOtp({
            email: value,
            options: {
              shouldCreateUser: true,
            }
          });
          
          if (signupError) throw signupError;
        } else {
          throw error;
        }
      }

      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني. تحقق من صندوق الوارد',
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
        description: error?.message || 'حدث خطأ أثناء إرسال رمز التحقق',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // التحقق من OTP باستخدام Supabase Auth
  const verifyOtp = async (codeOverride?: string) => {
    const codeToVerify = (codeOverride ?? otp).trim();
    if (codeToVerify.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: value,
        token: codeToVerify,
        type: 'email',
      });

      if (error) throw error;

      if (data?.user) {
        toast({
          title: 'تم التحقق',
          description: 'تم تفعيل البريد الإلكتروني بنجاح',
        });
        onVerified();
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // في dev mode مع ALLOW_DEV_OTP - تجاوز التحقق تلقائياً
  useEffect(() => {
    if (!value || isVerified) return;
    
    // فحص dev mode من خلال محاولة إرسال probe
    const checkDevMode = async () => {
      try {
        // نتحقق إذا كان dev mode عن طريق متغير بيئي
        // Supabase Auth لا يدعم dev mode مباشرة، لكن يمكن تفعيل auto-confirm
        // سنعتمد على إعدادات Supabase Auth
      } catch {
        // ignore
      }
    };
    
    checkDevMode();
  }, [type, value, isVerified]);

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">البريد الإلكتروني مفعّل</span>
      </div>
    );
  }

  if (!value) {
    return <div className="text-sm text-muted-foreground">أدخل البريد الإلكتروني أولاً</div>;
  }

  return (
    <div className="space-y-3">
      {!showOtpInput ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void sendOtp()} disabled={isSending} className="w-full">
          {isSending ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Mail className="w-4 h-4 ml-2" />
          )}
          إرسال رمز التفعيل للبريد
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك</p>
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
