import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Phone, 
  IdCard, Calendar, MapPin, Globe, Building, UserCheck, Briefcase,
  FileText, CheckCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import LocationPickerMap from '@/components/auth/LocationPickerMap';
import OtpVerification from '@/components/auth/OtpVerification';

const emailSchema = z.string().email('البريد الإلكتروني غير صالح');
const passwordSchema = z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
const phoneSchema = z.string().regex(/^(05|5|\+966|966)\d{8}$/, 'رقم الجوال غير صالح');
const falLicenseSchema = z.string().min(5, 'رقم رخصة فال غير صالح');
const nationalIdSchema = z.string().regex(/^\d{10}$/, 'رقم الهوية/الإقامة يجب أن يكون 10 أرقام');

type AccountType = 'individual' | 'office' | 'company';

interface RegistrationData {
  // الخطوة 1: بيانات الحساب
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  
  // الخطوة 2: البيانات الشخصية
  firstName: string;
  secondName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  
  // الخطوة 3: بيانات الرخصة
  falLicenseNumber: string;
  falLicenseExpiry: string;
  accountType: AccountType;
  
  // الخطوة 4: بيانات المنشأة (اختياري)
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
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<RegistrationData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [tempIdentifier, setTempIdentifier] = useState<string | null>(null);

  const REGISTER_CACHE_KEY = 'wasata_register_cache_v1';

  const { toast } = useToast();
  const { signIn, signUp, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/app/businesscard/edit');
    }
  }, [isAuthenticated, loading, navigate]);

  // استرجاع بيانات التسجيل إن وُجدت ولم يكتمل التسجيل
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

      // إذا كان المستخدم لم يصل لمرحلة النجاح/التحويل، نعيد فتح وضع التسجيل مع نفس البيانات
      setIsLogin(false);
      setData({ ...initialData, ...parsed.data, accountType: (parsed.accountType ?? parsed.data.accountType ?? 'individual') as AccountType });
      setCurrentStep(typeof parsed.currentStep === 'number' ? Math.max(1, parsed.currentStep) : 1);
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // حفظ بيانات التسجيل بشكل مؤقت (debounced) بدون التأثير على التوجيه أو isAuthenticated
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
        // ignore storage errors
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [REGISTER_CACHE_KEY, data, currentStep, isLogin]);

  const getTotalSteps = () => {
    if (data.accountType === 'individual') return 4;
    return 5; // للمكاتب والشركات
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
        
        try {
          phoneSchema.parse(data.phone.replace(/\s/g, ''));
        } catch {
          newErrors.phone = 'رقم الجوال غير صالح';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const { error } = await signIn(data.email, data.password);
      
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
      
      toast({
        title: 'مرحباً بك!',
        description: 'تم تسجيل الدخول بنجاح'
      });
      // Redirect to businesscard edit page after login
      navigate('/app/businesscard/edit');
    } catch (error) {
      toast({
        title: 'خطأ غير متوقع',
        description: 'حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateStep(currentStep)) return;
    
    // التحقق من تفعيل البريد والجوال
    if (!emailVerified) {
      toast({
        title: 'تفعيل البريد مطلوب',
        description: 'يرجى تفعيل البريد الإلكتروني قبل إكمال التسجيل',
        variant: 'destructive'
      });
      return;
    }
    
    if (!phoneVerified) {
      toast({
        title: 'تفعيل الجوال مطلوب',
        description: 'يرجى تفعيل رقم الجوال قبل إكمال التسجيل',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const fullName = `${data.firstName} ${data.secondName} ${data.lastName}`;
      
      const { data: authData, error } = await signUp(data.email, data.password, fullName);
      
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
      
      // تحديث ملف المستخدم بالبيانات الإضافية وإنشاء بطاقة أعمال وتعيين الدور
      if (authData?.user) {
        const { supabase } = await import('@/integrations/supabase/client');
        const userId = authData.user.id;
        
        // 1) تحديث جدول profiles
        await supabase.from('profiles').update({
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
          email_verified: emailVerified,
          phone_verified: phoneVerified,
        }).eq('user_id', userId);
        
        // 2) تعيين الدور بناءً على نوع الحساب
        // office/company → admin | individual → user | owner يُحدد يدوياً لاحقاً
        const userRole = data.accountType === 'individual' ? 'user' : 'admin';
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: userId,
          role: userRole,
        });
        
        if (roleError && !roleError.message?.includes('duplicate')) {
          console.error('Error assigning role:', roleError);
        }
        
        // 3) إنشاء سجل مبدئي في business_cards بدون slug
        // slug = NULL - سيختاره المستخدم لاحقاً في /app/businesscard/edit
        const { error: bcError } = await supabase.from('business_cards').insert({
          user_id: userId,
          slug: null, // ❌ لا slug تلقائي - يختاره المستخدم
          published: false,
          data: {
            name: fullName,
            phone: data.phone,
            email: data.email,
            company: data.companyName || '',
            title: data.accountType === 'individual' ? 'وسيط عقاري' : 'مكتب عقاري',
          }
        });
        
        if (bcError) {
          console.error('Error creating business card:', bcError);
        }
        
        setCreatedUserId(userId);
      }
      
      toast({
        title: 'تم التسجيل بنجاح!',
        description: 'مرحباً بك في وساطة'
      });

      // تنظيف بيانات التسجيل المؤقتة بعد نجاح التسجيل
      try {
        localStorage.removeItem(REGISTER_CACHE_KEY);
      } catch {
        // ignore
      }
      
      // Set flag to show welcome dialog and redirect to businesscard edit page
      localStorage.setItem('show_welcome_dialog', 'true');
      navigate('/app/businesscard/edit');
    } catch (error) {
      toast({
        title: 'خطأ غير متوقع',
        description: 'حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى',
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
              <Label>رقم الجوال *</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={data.phone}
                  onChange={(e) => updateData('phone', e.target.value)}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
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
        // للأفراد - خطوة التفعيل
        return renderVerificationStep();
        
      case 5:
        return renderVerificationStep();
        
      default:
        return null;
    }
  };

  const renderVerificationStep = () => (
    <motion.div
      key="verification"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-4">
        <CheckCircle className="w-12 h-12 mx-auto text-primary mb-2" />
        <h3 className="font-semibold">تفعيل الحساب</h3>
        <p className="text-sm text-muted-foreground">قم بتفعيل بريدك الإلكتروني ورقم جوالك</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="font-medium">تفعيل البريد الإلكتروني</span>
          </div>
          <p className="text-sm text-muted-foreground">{data.email}</p>
          <OtpVerification
            type="email"
            value={data.email}
            identifier={data.email}
            userId={createdUserId ?? undefined}
            isVerified={emailVerified}
            onVerified={() => setEmailVerified(true)}
          />
        </div>
        
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-primary" />
            <span className="font-medium">تفعيل رقم الجوال</span>
          </div>
          <p className="text-sm text-muted-foreground" dir="ltr">{data.phone}</p>
          <OtpVerification
            type="phone"
            value={data.phone}
            identifier={data.phone}
            userId={createdUserId ?? undefined}
            isVerified={phoneVerified}
            onVerified={() => setPhoneVerified(true)}
          />
        </div>
      </div>
    </motion.div>
  );

  const isLastStep = currentStep === getTotalSteps();
  const isVerificationStep = (data.accountType === 'individual' && currentStep === 4) || currentStep === 5;

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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني أو رقم الجوال</Label>
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
                  <Label>كلمة المرور</Label>
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
                
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>جاري المعالجة...</span>
                    </div>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
                
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <ChevronRight className="w-4 h-4 ml-1" />
                      السابق
                    </Button>
                  )}
                  
                  {isVerificationStep ? (
                    <Button
                      type="button"
                      onClick={handleRegister}
                      className="flex-1"
                      disabled={isLoading || !emailVerified || !phoneVerified}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                          <span>جاري التسجيل...</span>
                        </div>
                      ) : (
                        <>
                          إكمال التسجيل
                          <CheckCircle className="w-4 h-4 mr-1" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      التالي
                      <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setCurrentStep(1);
                  setData(initialData);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={isLoading}
              >
                {isLogin ? (
                  <>ليس لديك حساب؟ <span className="text-primary font-medium">سجل الآن</span></>
                ) : (
                  <>لديك حساب بالفعل؟ <span className="text-primary font-medium">سجل دخولك</span></>
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
