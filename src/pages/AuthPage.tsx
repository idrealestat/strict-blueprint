import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Lock, Eye, EyeOff, ArrowLeft,
  IdCard, Calendar, Globe, Building, UserCheck, Briefcase,
  FileText, CheckCircle, ChevronRight, ChevronLeft, Phone, Shield, Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import LocationPickerMap from '@/components/auth/LocationPickerMap';
import PhoneVerificationField from '@/components/PhoneVerificationField';

const emailSchema = z.string().email('البريد الإلكتروني غير صالح');
const passwordSchema = z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
const falLicenseSchema = z.string().min(5, 'رقم رخصة فال غير صالح');
const nationalIdSchema = z.string().regex(/^\d{10}$/, 'رقم الهوية/الإقامة يجب أن يكون 10 أرقام');

type AccountType = 'individual' | 'office' | 'company';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  firstName: string;
  secondName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  falLicenseNumber: string;
  falLicenseExpiry: string;
  accountType: AccountType;
  commercialRegNumber: string;
  commercialRegExpiry: string;
  companyName: string;
  officeLat: number | null;
  officeLng: number | null;
  officeAddress: string;
  website: string;
}

const initialData: RegistrationData = {
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  firstName: '',
  secondName: '',
  lastName: '',
  nationalId: '',
  birthDate: '',
  falLicenseNumber: '',
  falLicenseExpiry: '',
  accountType: 'individual',
  commercialRegNumber: '',
  commercialRegExpiry: '',
  companyName: '',
  officeLat: null,
  officeLng: null,
  officeAddress: '',
  website: '',
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<RegistrationData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loginTab, setLoginTab] = useState<'email' | 'phone'>('email');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPhoneVerified, setLoginPhoneVerified] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [showLoginOtp, setShowLoginOtp] = useState(false);
  const [loginOtpCountdown, setLoginOtpCountdown] = useState(0);
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
  const REGISTER_CACHE_KEY = 'wasata_register_cache_v1';
  const REMEMBER_ME_KEY = 'wasata_saved_credentials';

  const { toast } = useToast();
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  // توجيه المستخدم المسجل مباشرة أو للدعوة المعلقة
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // التحقق من وجود دعوة معلقة
      const pendingInvitation = localStorage.getItem('pendingInvitation');
      if (pendingInvitation) {
        localStorage.removeItem('pendingInvitation');
        navigate(`/join/${pendingInvitation}`);
      } else {
        navigate('/app/dashboard');
      }
    }
  }, [isAuthenticated, loading, navigate, user]);

  // استرجاع بيانات تسجيل الدخول المحفوظة (تذكرني)
  useEffect(() => {
    try {
      const savedCredentials = localStorage.getItem(REMEMBER_ME_KEY);
      if (savedCredentials) {
        const { email, password } = JSON.parse(savedCredentials);
        if (email && password) {
          setData(prev => ({ ...prev, email, password }));
          setRememberMe(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // استرجاع بيانات التسجيل المؤقتة
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REGISTER_CACHE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        data?: RegistrationData;
        currentStep?: number;
        accountType?: AccountType;
      };

      if (!parsed?.data) return;

      setIsLogin(false);
      setData({ ...initialData, ...parsed.data, accountType: (parsed.accountType ?? parsed.data.accountType ?? 'individual') as AccountType });
      setCurrentStep(typeof parsed.currentStep === 'number' ? Math.max(1, parsed.currentStep) : 1);
    } catch {
      // ignore
    }
  }, []);

  // حفظ بيانات التسجيل مؤقتاً
  useEffect(() => {
    if (isLogin) return;

    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(
          REGISTER_CACHE_KEY,
          JSON.stringify({
            data,
            currentStep,
            accountType: data.accountType,
          })
        );
      } catch {
        // ignore
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [data, currentStep, isLogin]);

  const getTotalSteps = () => {
    if (data.accountType === 'individual') return 3;
    return 4;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        try {
          emailSchema.parse(data.email);
        } catch {
          newErrors.email = 'البريد الإلكتروني غير صالح';
        }
        
        try {
          passwordSchema.parse(data.password);
        } catch {
          newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        }
        
        if (data.password !== data.confirmPassword) {
          newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
        }
        break;
        
      case 2:
        if (!data.firstName.trim()) newErrors.firstName = 'الاسم الأول مطلوب';
        if (!data.secondName.trim()) newErrors.secondName = 'الاسم الثاني مطلوب';
        if (!data.lastName.trim()) newErrors.lastName = 'الاسم الأخير مطلوب';
        
        try {
          nationalIdSchema.parse(data.nationalId);
        } catch {
          newErrors.nationalId = 'رقم الهوية/الإقامة يجب أن يكون 10 أرقام';
        }
        
        if (!data.birthDate) newErrors.birthDate = 'تاريخ الميلاد مطلوب';
        break;
        
      case 3:
        try {
          falLicenseSchema.parse(data.falLicenseNumber);
        } catch {
          newErrors.falLicenseNumber = 'رقم رخصة فال مطلوب';
        }
        
        if (!data.falLicenseExpiry) newErrors.falLicenseExpiry = 'تاريخ انتهاء الرخصة مطلوب';
        break;
        
      case 4:
        if (data.accountType !== 'individual') {
          if (!data.companyName.trim()) newErrors.companyName = 'اسم المنشأة مطلوب';
          if (!data.commercialRegNumber.trim()) newErrors.commercialRegNumber = 'رقم السجل التجاري مطلوب';
          if (!data.commercialRegExpiry) newErrors.commercialRegExpiry = 'تاريخ انتهاء السجل مطلوب';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // تسجيل الدخول بكلمة المرور فقط
  const handlePasswordLogin = async () => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(data.email);
    } catch {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    
    try {
      passwordSchema.parse(data.password);
    } catch {
      newErrors.password = 'كلمة المرور مطلوبة';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'خطأ في تسجيل الدخول',
            description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'خطأ',
            description: error.message,
            variant: 'destructive'
          });
        }
        return;
      }
      
      // حفظ بيانات الدخول إذا كان "تذكرني" مفعّل
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
          email: data.email,
          password: data.password
        }));
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
      
      toast({
        title: 'مرحباً بك!',
        description: 'تم تسجيل الدخول بنجاح'
      });
      navigate('/app/dashboard');
    } catch (error: any) {
      toast({
        title: 'خطأ غير متوقع',
        description: error?.message || 'حدث خطأ أثناء المعالجة',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePasswordLogin();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(data.email);
    } catch {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/app/reset-password`,
      });
      
      if (error) throw error;
      
      setResetEmailSent(true);
      toast({
        title: 'تم إرسال رابط إعادة التعيين',
        description: 'تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور'
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // التسجيل بـ Email + Password فقط (بدون انتظار تأكيد البريد)
  const handleRegister = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    
    try {
      // ✅ التحقق من عدم تكرار رخصة فال
      if (data.falLicenseNumber?.trim()) {
        const { data: existingFal } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('fal_license_number', data.falLicenseNumber.trim())
          .maybeSingle();
        
        if (existingFal) {
          toast({
            title: 'رخصة فال مسجلة مسبقاً',
            description: 'لا يمكنك إنشاء حساب جديد بنفس رخصة فال. لديك حساب آخر بالفعل. هل تريد تسجيل الدخول؟',
            variant: 'destructive',
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsLogin(true)}
              >
                تسجيل الدخول
              </Button>
            )
          });
          setIsLoading(false);
          return;
        }
      }
      
      // ✅ التحقق من عدم تكرار رقم الهوية
      if (data.nationalId?.trim()) {
        const { data: existingId } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('national_id', data.nationalId.trim())
          .maybeSingle();
        
        if (existingId) {
          toast({
            title: 'رقم الهوية مسجل مسبقاً',
            description: 'لا يمكنك إنشاء حساب جديد بنفس رقم الهوية. لديك حساب آخر بالفعل. هل تريد تسجيل الدخول؟',
            variant: 'destructive',
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsLogin(true)}
              >
                تسجيل الدخول
              </Button>
            )
          });
          setIsLoading(false);
          return;
        }
      }
      
      const fullName = `${data.firstName} ${data.secondName} ${data.lastName}`;
      
      // التسجيل مباشرة بدون Magic Link
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: 'المستخدم موجود بالفعل',
            description: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول',
            variant: 'destructive'
          });
          setIsLogin(true);
        } else {
          toast({
            title: 'خطأ',
            description: error.message,
            variant: 'destructive'
          });
        }
        return;
      }
      
      // تحديث ملف المستخدم بالبيانات الإضافية
      if (authData?.user) {
        const userId = authData.user.id;
        
        // 1) تحديث profiles
        await supabase.from('profiles').upsert({
          user_id: userId,
          full_name: fullName,
          phone: data.phone,
          fal_license_number: data.falLicenseNumber,
          fal_license_expiry: data.falLicenseExpiry,
          account_type: data.accountType,
          commercial_reg_number: data.accountType !== 'individual' ? data.commercialRegNumber : null,
          commercial_reg_expiry: data.accountType !== 'individual' ? data.commercialRegExpiry : null,
          company_name: data.companyName || null,
          national_id: data.nationalId,
          birth_date: data.birthDate,
          office_lat: data.officeLat,
          office_lng: data.officeLng,
          office_address: data.officeAddress || null,
          website: data.website || null,
        }, { onConflict: 'user_id' });
        
        // 2) تعيين الدور: individual = member, office = admin
        const userRole = data.accountType === 'individual' ? 'member' : 'admin';
        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: userRole,
        }, { onConflict: 'user_id' });
        
        // 3) إنشاء سجل business_cards (slug = null, published = false)
        const { error: cardError } = await supabase.from('business_cards').insert({
          user_id: userId,
          slug: null,
          published: false,
          fal_license_number: data.falLicenseNumber,
          national_id: data.nationalId,
          email: data.email,
          phone: data.phone,
          data: {
            name: fullName,
            phone: data.phone,
            email: data.email,
            company: data.companyName || '',
            title: data.accountType === 'individual' ? 'وسيط عقاري' : 'مكتب عقاري',
            fal_license: data.falLicenseNumber,
            national_id: data.nationalId,
          }
        });
        
        // تجاهل خطأ duplicate
        if (cardError && cardError.code !== '23505') {
          console.error('Business card insert error:', cardError);
        }
      }

      // تنظيف cache
      try {
        localStorage.removeItem(REGISTER_CACHE_KEY);
      } catch {
        // ignore
      }
      
      toast({
        title: 'تم التسجيل بنجاح!',
        description: 'مرحباً بك في وساطة'
      });
      
      // التوجيه لصفحة اختيار الباقة للمستخدمين الجدد
      navigate('/app/choose-plan');
    } catch (error: any) {
      toast({
        title: 'خطأ غير متوقع',
        description: error?.message || 'حدث خطأ أثناء المعالجة',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = (field: keyof RegistrationData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // عداد تنازلي لإعادة إرسال OTP تسجيل الدخول
  useEffect(() => {
    if (loginOtpCountdown <= 0) return;
    const timer = setInterval(() => setLoginOtpCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [loginOtpCountdown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>البريد الإلكتروني *</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={data.email}
                  onChange={(e) => updateData('email', e.target.value)}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={data.password}
                  onChange={(e) => updateData('password', e.target.value)}
                  className="pr-10 pl-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={data.confirmPassword}
                  onChange={(e) => updateData('confirmPassword', e.target.value)}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>الاسم الأول *</Label>
                <Input
                  placeholder="الأول"
                  value={data.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label>الاسم الثاني *</Label>
                <Input
                  placeholder="الأب"
                  value={data.secondName}
                  onChange={(e) => updateData('secondName', e.target.value)}
                />
                {errors.secondName && <p className="text-xs text-destructive">{errors.secondName}</p>}
              </div>
              <div className="space-y-2">
                <Label>اسم العائلة *</Label>
                <Input
                  placeholder="العائلة"
                  value={data.lastName}
                  onChange={(e) => updateData('lastName', e.target.value)}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>رقم الهوية / الإقامة *</Label>
              <div className="relative">
                <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="1234567890"
                  value={data.nationalId}
                  onChange={(e) => updateData('nationalId', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pr-10"
                  dir="ltr"
                  maxLength={10}
                />
              </div>
              {errors.nationalId && <p className="text-sm text-destructive">{errors.nationalId}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>تاريخ الميلاد *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={data.birthDate}
                  onChange={(e) => updateData('birthDate', e.target.value)}
                  className="pr-10"
                />
              </div>
              {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
            </div>

            <PhoneVerificationField
              phone={data.phone}
              onPhoneChange={(val) => updateData('phone', val)}
              onVerified={setPhoneVerified}
              label="رقم الجوال *"
            />
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>رقم رخصة فال *</Label>
              <div className="relative">
                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="رقم الرخصة"
                  value={data.falLicenseNumber}
                  onChange={(e) => updateData('falLicenseNumber', e.target.value)}
                  className="pr-10"
                />
              </div>
              {errors.falLicenseNumber && <p className="text-sm text-destructive">{errors.falLicenseNumber}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>تاريخ انتهاء رخصة فال *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={data.falLicenseExpiry}
                  onChange={(e) => updateData('falLicenseExpiry', e.target.value)}
                  className="pr-10"
                />
              </div>
              {errors.falLicenseExpiry && <p className="text-sm text-destructive">{errors.falLicenseExpiry}</p>}
            </div>
            
            <div className="space-y-3">
              <Label>نوع الحساب *</Label>
              <RadioGroup
                value={data.accountType}
                onValueChange={(value: AccountType) => updateData('accountType', value)}
                className="grid grid-cols-3 gap-3"
              >
                <div className="relative">
                  <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                  <Label
                    htmlFor="individual"
                    className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 transition-all"
                  >
                    <UserCheck className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">فرد</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="office" id="office" className="peer sr-only" />
                  <Label
                    htmlFor="office"
                    className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 transition-all"
                  >
                    <Briefcase className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">مكتب</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="company" id="company" className="peer sr-only" />
                  <Label
                    htmlFor="company"
                    className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 transition-all"
                  >
                    <Building className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">شركة</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </motion.div>
        );
        
      case 4:
        if (data.accountType !== 'individual') {
          return (
            <motion.div
              key="step4-company"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>اسم المنشأة *</Label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={data.accountType === 'office' ? 'اسم المكتب' : 'اسم الشركة'}
                    value={data.companyName}
                    onChange={(e) => updateData('companyName', e.target.value)}
                    className="pr-10"
                  />
                </div>
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>رقم السجل التجاري *</Label>
                <div className="relative">
                  <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="رقم السجل"
                    value={data.commercialRegNumber}
                    onChange={(e) => updateData('commercialRegNumber', e.target.value)}
                    className="pr-10"
                  />
                </div>
                {errors.commercialRegNumber && <p className="text-sm text-destructive">{errors.commercialRegNumber}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>تاريخ انتهاء السجل التجاري *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={data.commercialRegExpiry}
                    onChange={(e) => updateData('commercialRegExpiry', e.target.value)}
                    className="pr-10"
                  />
                </div>
                {errors.commercialRegExpiry && <p className="text-sm text-destructive">{errors.commercialRegExpiry}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>الموقع الإلكتروني (اختياري)</Label>
                <div className="relative">
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={data.website}
                    onChange={(e) => updateData('website', e.target.value)}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>موقع المنشأة (اختياري)</Label>
                <LocationPickerMap
                  onLocationSelect={(lat, lng) => {
                    updateData('officeLat', lat);
                    updateData('officeLng', lng);
                  }}
                  initialLat={data.officeLat || undefined}
                  initialLng={data.officeLng || undefined}
                />
              </div>
            </motion.div>
          );
        }
        return null;
        
      default:
        return null;
    }
  };


  const isValidPhoneLogin = (p: string) => {
    const clean = p.replace(/\s/g, '');
    return /^(05|5|\+966|966)\d{8}$/.test(clean);
  };

  const sendLoginOtp = async () => {
    if (!isValidPhoneLogin(loginPhone)) {
      toast({ title: 'خطأ', description: 'يرجى إدخال رقم جوال صحيح (مثال: 05xxxxxxxx)', variant: 'destructive' });
      return;
    }
    setIsSendingLoginOtp(true);
    try {
      const { data: otpData, error } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone: loginPhone, identifier: loginPhone },
      });
      if (error) throw error;
      if (otpData?.success) {
        setShowLoginOtp(true);
        setLoginOtpCountdown(60);
        toast({ title: 'تم الإرسال', description: 'تم إرسال رمز التحقق إلى جوالك' });
        if (otpData?.devMode && otpData?.devCode) {
          setLoginOtpCode(otpData.devCode);
        }
      } else {
        toast({ title: 'خطأ', description: otpData?.error || 'فشل إرسال رمز التحقق', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || 'خطأ في إرسال رمز التحقق', variant: 'destructive' });
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (loginOtpCode.length !== 6) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الرمز المكون من 6 أرقام', variant: 'destructive' });
      return;
    }
    setIsVerifyingLoginOtp(true);
    try {
      // 1) تحقق من OTP
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-otp', {
        body: { identifier: loginPhone, code: loginOtpCode, type: 'phone' },
      });
      if (verifyError) throw verifyError;
      if (!verifyData?.success) {
        toast({ title: 'خطأ', description: verifyData?.error || 'رمز التحقق غير صحيح', variant: 'destructive' });
        return;
      }

      // 2) البحث عن المستخدم بالرقم في profiles
      const cleanPhone = loginPhone.replace(/\s/g, '');
      const phoneVariants = [cleanPhone];
      if (cleanPhone.startsWith('05')) {
        phoneVariants.push('+966' + cleanPhone.slice(1));
        phoneVariants.push('966' + cleanPhone.slice(1));
      } else if (cleanPhone.startsWith('5')) {
        phoneVariants.push('0' + cleanPhone);
        phoneVariants.push('+966' + cleanPhone);
        phoneVariants.push('966' + cleanPhone);
      } else if (cleanPhone.startsWith('+966')) {
        phoneVariants.push('0' + cleanPhone.slice(4));
        phoneVariants.push(cleanPhone.slice(1));
      } else if (cleanPhone.startsWith('966')) {
        phoneVariants.push('0' + cleanPhone.slice(3));
        phoneVariants.push('+' + cleanPhone);
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .in('phone', phoneVariants)
        .limit(1)
        .maybeSingle();

      if (!profileData) {
        toast({ title: 'لا يوجد حساب', description: 'لم يتم العثور على حساب مرتبط بهذا الرقم. يرجى إنشاء حساب جديد أولاً.', variant: 'destructive' });
        return;
      }

      // 3) تسجيل الدخول عبر edge function
      const { data: loginData, error: loginError } = await supabase.functions.invoke('phone-login', {
        body: { userId: profileData.user_id, phone: loginPhone },
      });

      if (loginError) throw loginError;

      if (loginData?.access_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: loginData.access_token,
          refresh_token: loginData.refresh_token,
        });
        if (sessionError) throw sessionError;
        toast({ title: 'مرحباً بك!', description: 'تم تسجيل الدخول بنجاح' });
        navigate('/app/dashboard');
      } else {
        toast({ title: 'خطأ', description: loginData?.error || 'فشل تسجيل الدخول', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || 'حدث خطأ أثناء تسجيل الدخول', variant: 'destructive' });
    } finally {
      setIsVerifyingLoginOtp(false);
    }
  };

  const isLastStep = currentStep === getTotalSteps();


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <Building2 className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
              </CardTitle>
              <CardDescription className="mt-2">
                {isLogin 
                  ? 'سجل دخولك للوصول إلى لوحة التحكم' 
                  : `الخطوة ${currentStep} من ${getTotalSteps()}`
                }
              </CardDescription>
            </div>
            
            {!isLogin && (
              <div className="flex justify-center gap-1">
                {Array.from({ length: getTotalSteps() }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-1 rounded-full transition-colors ${
                      i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {isLogin ? (
              <>
                {/* واجهة نسيت كلمة المرور */}
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {resetEmailSent ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4 py-6"
                      >
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <Mail className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">تحقق من بريدك الإلكتروني</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            تم إرسال رابط إعادة تعيين كلمة المرور إلى<br />
                            <span className="font-medium text-foreground" dir="ltr">{data.email}</span>
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmailSent(false);
                          }}
                          className="mt-4"
                        >
                          العودة لتسجيل الدخول
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        <div className="text-center mb-4">
                          <Lock className="w-12 h-12 mx-auto text-primary mb-2" />
                          <h3 className="font-semibold">نسيت كلمة المرور؟</h3>
                          <p className="text-sm text-muted-foreground">
                            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>البريد الإلكتروني</Label>
                          <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="example@email.com"
                              value={data.email}
                              onChange={(e) => updateData('email', e.target.value)}
                              className="pr-10"
                              dir="ltr"
                              disabled={isLoading}
                            />
                          </div>
                          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                              <span>جاري الإرسال...</span>
                            </div>
                          ) : (
                            'إرسال رابط إعادة التعيين'
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          <ArrowLeft className="w-4 h-4 ml-2" />
                          العودة لتسجيل الدخول
                        </Button>
                      </>
                    )}
                  </form>
                ) : (
                  <Tabs value={loginTab} onValueChange={(v) => setLoginTab(v as 'email' | 'phone')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="email" className="gap-2">
                        <Mail className="h-4 w-4" />
                        البريد الإلكتروني
                      </TabsTrigger>
                      <TabsTrigger value="phone" className="gap-2">
                        <Phone className="h-4 w-4" />
                        رقم الجوال
                      </TabsTrigger>
                    </TabsList>

                    {/* تبويب البريد الإلكتروني */}
                    <TabsContent value="email">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label>البريد الإلكتروني</Label>
                          <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="example@email.com"
                              value={data.email}
                              onChange={(e) => updateData('email', e.target.value)}
                              className="pr-10"
                              dir="ltr"
                              disabled={isLoading}
                            />
                          </div>
                          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>كلمة المرور</Label>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs text-primary hover:underline"
                            >
                              نسيت كلمة المرور؟
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={data.password}
                              onChange={(e) => updateData('password', e.target.value)}
                              className="pr-10 pl-10"
                              dir="ltr"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded border-border"
                          />
                          <label htmlFor="remember" className="text-sm text-muted-foreground">
                            تذكرني
                          </label>
                        </div>
                        
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                              <span>جاري تسجيل الدخول...</span>
                            </div>
                          ) : (
                            'تسجيل الدخول'
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* تبويب رقم الجوال */}
                    <TabsContent value="phone">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>رقم الجوال</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="tel"
                                placeholder="05xxxxxxxx"
                                value={loginPhone}
                                onChange={(e) => {
                                  setLoginPhone(e.target.value);
                                  if (showLoginOtp) {
                                    setShowLoginOtp(false);
                                    setLoginOtpCode('');
                                  }
                                }}
                                className="pr-10"
                                dir="ltr"
                                disabled={isVerifyingLoginOtp}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={sendLoginOtp}
                              disabled={isSendingLoginOtp || !isValidPhoneLogin(loginPhone) || loginOtpCountdown > 0}
                              className="whitespace-nowrap text-xs px-3 h-10 border-primary text-primary hover:bg-primary/5"
                            >
                              {isSendingLoginOtp ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : loginOtpCountdown > 0 ? (
                                `إعادة (${loginOtpCountdown})`
                              ) : showLoginOtp ? (
                                'إعادة إرسال'
                              ) : (
                                <>
                                  <Shield className="h-3 w-3 ml-1" />
                                  إرسال رمز
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {showLoginOtp && (
                          <div className="space-y-2">
                            <Label>رمز التحقق</Label>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder="أدخل الرمز المكون من 6 أرقام"
                                value={loginOtpCode}
                                onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="flex-1 text-center tracking-widest font-mono text-lg"
                                dir="ltr"
                                maxLength={6}
                              />
                            </div>
                          </div>
                        )}

                        {showLoginOtp && (
                          <Button
                            type="button"
                            className="w-full"
                            size="lg"
                            onClick={handlePhoneLogin}
                            disabled={isVerifyingLoginOtp || loginOtpCode.length !== 6}
                          >
                            {isVerifyingLoginOtp ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>جاري التحقق...</span>
                              </div>
                            ) : (
                              'تسجيل الدخول'
                            )}
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    ليس لديك حساب؟{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-primary hover:underline font-medium"
                    >
                      إنشاء حساب جديد
                    </button>
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
                
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      <ChevronRight className="w-4 h-4 ml-2" />
                      السابق
                    </Button>
                  )}
                  
                  {isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleRegister}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                          <span>جاري التسجيل...</span>
                        </div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 ml-2" />
                          إنشاء الحساب
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1"
                    >
                      التالي
                      <ChevronLeft className="w-4 h-4 mr-2" />
                    </Button>
                  )}
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setCurrentStep(1);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
