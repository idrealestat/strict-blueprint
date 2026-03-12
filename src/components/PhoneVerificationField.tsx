/**
 * PhoneVerificationField.tsx
 * مكون قابل لإعادة الاستخدام للتحقق من رقم الجوال عبر OTP
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Phone, CheckCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhoneVerificationFieldProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onVerified: (verified: boolean) => void;
  identifier?: string; // userId أو معرف مؤقت
  label?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
}

export default function PhoneVerificationField({
  phone,
  onPhoneChange,
  onVerified,
  identifier,
  label = 'رقم الجوال *',
  className = '',
  inputClassName = '',
  required = true,
}: PhoneVerificationFieldProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [lastVerifiedPhone, setLastVerifiedPhone] = useState('');

  // إعادة تعيين التحقق عند تغيير الرقم
  useEffect(() => {
    if (phone !== lastVerifiedPhone && isVerified) {
      setIsVerified(false);
      setShowOtpInput(false);
      setOtpCode('');
      onVerified(false);
    }
  }, [phone, lastVerifiedPhone, isVerified, onVerified]);

  // عداد تنازلي لإعادة الإرسال
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const isValidPhone = (p: string) => {
    const clean = p.replace(/\s/g, '');
    return /^(05|5|\+966|966)\d{8}$/.test(clean);
  };

  const sendOtp = async () => {
    if (!isValidPhone(phone)) {
      toast.error('يرجى إدخال رقم جوال صحيح (مثال: 05xxxxxxxx)');
      return;
    }

    setIsSending(true);
    try {
      const effectiveIdentifier = identifier || phone;
      const { data, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone, identifier: effectiveIdentifier },
      });

      if (error) throw error;

      if (data?.success) {
        setShowOtpInput(true);
        setCountdown(60);
        toast.success('تم إرسال رمز التحقق');
        
        // وضع التطوير
        if (data?.devMode && data?.devCode) {
          setOtpCode(data.devCode);
        }
      } else {
        toast.error(data?.error || 'فشل إرسال رمز التحقق');
      }
    } catch (err: any) {
      toast.error(err?.message || 'خطأ في إرسال رمز التحقق');
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('يرجى إدخال الرمز المكون من 6 أرقام');
      return;
    }

    setIsVerifying(true);
    try {
      const effectiveIdentifier = identifier || phone;
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { identifier: effectiveIdentifier, code: otpCode, type: 'phone' },
      });

      if (error) throw error;

      if (data?.success) {
        setIsVerified(true);
        setLastVerifiedPhone(phone);
        setShowOtpInput(false);
        onVerified(true);
        toast.success('تم التحقق من رقم الجوال بنجاح ✅');
      } else {
        toast.error(data?.error || 'رمز التحقق غير صحيح');
      }
    } catch (err: any) {
      toast.error(err?.message || 'خطأ في التحقق');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {/* حقل رقم الجوال مع زر إرسال */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="05xxxxxxxx"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`pr-10 ${isVerified ? 'border-green-500 bg-green-50' : ''} ${inputClassName}`}
            dir="ltr"
            disabled={isVerified}
            required={required}
          />
        </div>

        {!isVerified ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={sendOtp}
            disabled={isSending || !isValidPhone(phone) || countdown > 0}
            className="whitespace-nowrap text-xs px-3 h-10 border-primary text-primary hover:bg-primary/5"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : countdown > 0 ? (
              `إعادة (${countdown})`
            ) : showOtpInput ? (
              'إعادة إرسال'
            ) : (
              <>
                <Shield className="h-3 w-3 ml-1" />
                تحقق
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-1 text-green-600 font-medium text-sm px-3 h-10 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>تم التحقق</span>
          </div>
        )}
      </div>

      {/* حقل إدخال OTP */}
      {showOtpInput && !isVerified && (
        <div className="flex gap-2 items-center mt-2">
          <Input
            type="text"
            placeholder="أدخل الرمز المكون من 6 أرقام"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="flex-1 text-center tracking-widest font-mono text-lg"
            dir="ltr"
            maxLength={6}
          />
          <Button
            type="button"
            onClick={verifyOtp}
            disabled={isVerifying || otpCode.length !== 6}
            className="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'تأكيد'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
