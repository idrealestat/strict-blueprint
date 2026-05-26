import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, Mail, Phone, IdCard, FileText, 
  ArrowLeft, CheckCircle, Loader2, AlertCircle, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import OtpVerification from '@/components/auth/OtpVerification';

// تم تعطيل التحقق بالجوال - نستخدم البريد فقط
type VerificationMethod = 'email';
type IdentityMethod = 'fal_license' | 'national_id';

interface RecoveryState {
  step: number;
  verificationMethod: VerificationMethod;
  identityMethod: IdentityMethod;
  email: string;
  phone: string;
  falLicense: string;
  nationalId: string;
  verificationComplete: boolean;
  foundCard: any | null;
}

export default function RecoverDomainPage() {
  const [state, setState] = useState<RecoveryState>({
    step: 1,
    verificationMethod: 'email',
    identityMethod: 'fal_license',
    email: '',
    phone: '',
    falLicense: '',
    nationalId: '',
    verificationComplete: false,
    foundCard: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpVerified, setOtpVerified] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const updateState = (updates: Partial<RecoveryState>) => {
    setState(prev => ({ ...prev, ...updates }));
    // Clear related errors
    Object.keys(updates).forEach(key => {
      setErrors(prev => ({ ...prev, [key]: '' }));
    });
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (state.verificationMethod === 'email') {
      if (!state.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
        newErrors.email = 'البريد الإلكتروني غير صالح';
      }
    } else {
      if (!state.phone || !/^(05|5|\+966|966)\d{8}$/.test(state.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'رقم الجوال غير صالح';
      }
    }

    if (state.identityMethod === 'fal_license') {
      if (!state.falLicense || state.falLicense.length < 5) {
        newErrors.falLicense = 'رقم رخصة فال غير صالح';
      }
    } else {
      if (!state.nationalId || !/^\d{10}$/.test(state.nationalId)) {
        newErrors.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const searchForCard = async () => {
    if (!validateStep1()) return;

    setIsSearching(true);
    try {
      let data: any = null;
      let error: any = null;

      if (state.identityMethod === 'fal_license') {
        const res = await supabase
          .from('business_cards')
          .select('*')
          .eq('fal_license_number', state.falLicense)
          .eq('email', state.email)
          .maybeSingle();
        data = res.data; error = res.error;
      } else {
        // رقم الهوية في جدول خاص. نستدعي RPC آمنة.
        const { data: match, error: rpcError } = await supabase.rpc('find_card_for_recovery', {
          p_national_id: state.nationalId,
          p_email: state.email,
        });
        if (rpcError) { error = rpcError; }
        else if (match && match.length > 0) {
          const cardId = match[0].card_id;
          const res = await supabase
            .from('business_cards')
            .select('*')
            .eq('id', cardId)
            .maybeSingle();
          data = res.data; error = res.error;
        }
      }

      if (error) {
        console.error('Search error:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء البحث',
          variant: 'destructive',
        });
        return;
      }

      if (!data) {
        toast({
          title: 'لم يتم العثور على بطاقة',
          description: 'لا توجد بطاقة أعمال مرتبطة بهذه البيانات. تأكد من صحة المعلومات.',
          variant: 'destructive',
        });
        return;
      }

      updateState({ foundCard: data, step: 2 });
      toast({
        title: 'تم العثور على بطاقة!',
        description: `النطاق: ${data.slug || 'غير محدد'}`,
      });
    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRecovery = async () => {
    if (!otpVerified) {
      toast({
        title: 'التحقق مطلوب',
        description: 'يرجى تفعيل البريد الإلكتروني أولاً',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recover-domain', {
        body: {
          cardId: state.foundCard.id,
          verificationMethod: state.verificationMethod,
          identityMethod: state.identityMethod,
          email: state.email,
          phone: state.phone,
          falLicense: state.falLicense,
          nationalId: state.nationalId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'تم الاسترداد بنجاح!',
          description: 'تم ربط النطاق بحسابك. يرجى تسجيل الدخول.',
        });
        navigate('/app/login');
      } else {
        throw new Error(data?.error || 'فشل الاسترداد');
      }
    } catch (err: any) {
      console.error('Recovery error:', err);
      toast({
        title: 'خطأ في الاسترداد',
        description: err.message || 'حدث خطأ أثناء استرداد النطاق',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* التحقق عبر البريد الإلكتروني فقط */}
      <div className="space-y-3">
        <Label className="text-base font-medium">التحقق عبر البريد الإلكتروني</Label>
        <p className="text-sm text-muted-foreground">
          سيتم إرسال رمز التحقق إلى بريدك الإلكتروني المسجل
        </p>
      </div>

      {/* حقل البريد الإلكتروني */}
      <div className="space-y-2">
        <Label>البريد الإلكتروني المسجل</Label>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="example@email.com"
            value={state.email}
            onChange={(e) => updateState({ email: e.target.value })}
            className="pr-10"
            dir="ltr"
          />
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      {/* اختيار طريقة إثبات الهوية */}
      <div className="space-y-3">
        <Label className="text-base font-medium">إثبات الملكية</Label>
        <RadioGroup
          value={state.identityMethod}
          onValueChange={(v) => updateState({ identityMethod: v as IdentityMethod })}
          className="grid grid-cols-2 gap-3"
        >
          <Label
            htmlFor="fal-method"
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              state.identityMethod === 'fal_license' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="fal_license" id="fal-method" />
            <FileText className="w-5 h-5 text-primary" />
            <span>رخصة فال</span>
          </Label>
          <Label
            htmlFor="id-method"
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              state.identityMethod === 'national_id' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="national_id" id="id-method" />
            <IdCard className="w-5 h-5 text-primary" />
            <span>بطاقة الأحوال</span>
          </Label>
        </RadioGroup>
      </div>

      {/* حقل الإدخال حسب طريقة إثبات الهوية */}
      {state.identityMethod === 'fal_license' ? (
        <div className="space-y-2">
          <Label>رقم رخصة فال</Label>
          <div className="relative">
            <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="أدخل رقم رخصة فال"
              value={state.falLicense}
              onChange={(e) => updateState({ falLicense: e.target.value })}
              className="pr-10"
              dir="ltr"
            />
          </div>
          {errors.falLicense && <p className="text-sm text-destructive">{errors.falLicense}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>رقم الهوية الوطنية / الإقامة</Label>
          <div className="relative">
            <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="أدخل رقم الهوية (10 أرقام)"
              value={state.nationalId}
              onChange={(e) => updateState({ nationalId: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="pr-10"
              dir="ltr"
              maxLength={10}
            />
          </div>
          {errors.nationalId && <p className="text-sm text-destructive">{errors.nationalId}</p>}
        </div>
      )}

      <Button
        onClick={searchForCard}
        disabled={isSearching}
        className="w-full"
        size="lg"
      >
        {isSearching ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            جاري البحث...
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4 ml-2" />
            البحث عن النطاق
          </>
        )}
      </Button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* معلومات البطاقة المكتشفة */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">تم العثور على بطاقة أعمال</span>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>النطاق: <span className="font-medium text-foreground">{state.foundCard?.slug || 'غير محدد'}</span></p>
          {state.foundCard?.data?.name && (
            <p>الاسم: <span className="font-medium text-foreground">{state.foundCard.data.name}</span></p>
          )}
        </div>
      </div>

      {/* التحقق من الهوية */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <Label className="text-base font-medium">تأكيد الهوية</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          لتأكيد ملكيتك للنطاق، يرجى التحقق من البريد الإلكتروني المسجل.
        </p>

        <div className="p-4 border rounded-lg">
          <OtpVerification
            type="email"
            value={state.email}
            identifier={state.email}
            isVerified={otpVerified}
            onVerified={() => setOtpVerified(true)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => updateState({ step: 1, foundCard: null })}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 ml-2" />
          رجوع
        </Button>
        <Button
          onClick={handleRecovery}
          disabled={!otpVerified || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الاسترداد...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 ml-2" />
              استرداد النطاق
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">استرداد النطاق</CardTitle>
              <CardDescription>
                استرجع نطاقك باستخدام رخصة فال أو بطاقة الأحوال
              </CardDescription>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {state.step === 1 ? renderStep1() : renderStep2()}
              </AnimatePresence>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => navigate('/app/login')}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4 ml-1" />
                  العودة لتسجيل الدخول
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
