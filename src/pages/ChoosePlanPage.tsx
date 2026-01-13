import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, User, Check, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEntitlementsContext, PlanCode } from '@/context/EntitlementsContext';
import { supabase } from '@/integrations/supabase/client';

const plans: {
  code: PlanCode;
  title: string;
  description: string;
  icon: typeof User;
  features: string[];
  color: string;
}[] = [
  {
    code: 'INDIVIDUAL',
    title: 'باقة الأفراد',
    description: 'للوسيط العقاري المستقل',
    icon: User,
    features: [
      'بطاقة أعمال رقمية',
      'إدارة العملاء (CRM)',
      'نماذج استقبال الطلبات',
      'إدارة العروض والطلبات',
      'نشر العقارات',
      'تحليلات أساسية',
      'مساعد ذكي أساسي'
    ],
    color: 'from-blue-500 to-blue-600'
  },
  {
    code: 'OFFICE',
    title: 'باقة المكتب',
    description: 'للمكاتب والشركات العقارية',
    icon: Building2,
    features: [
      'جميع ميزات باقة الأفراد',
      'مساعد ذكي متقدم',
      'إدارة فريق العمل',
      'نشر مركزي للعقارات',
      'صلاحيات متعددة',
      'تقارير متقدمة'
    ],
    color: 'from-emerald-500 to-emerald-600'
  }
];

export default function ChoosePlanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePlan, daysRemaining, planCode, isLoading } = useEntitlementsContext();
  const [isSubmitting, setIsSubmitting] = useState<PlanCode | null>(null);

  // إذا المستخدم لديه باقة مسبقاً، أعده للداشبورد
  useEffect(() => {
    if (!isLoading && planCode) {
      console.log('[ChoosePlanPage] User already has plan, redirecting to dashboard');
      navigate('/app/dashboard', { replace: true });
    }
  }, [planCode, isLoading, navigate]);

  const handleSelectPlan = async (selectedPlanCode: PlanCode) => {
    setIsSubmitting(selectedPlanCode);
    
    try {
      const success = await updatePlan(selectedPlanCode);
      
      if (success) {
        // إذا اختار باقة المكتب، نحدث نوع الحساب إلى office
        if (selectedPlanCode === 'OFFICE') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ account_type: 'office' })
              .eq('user_id', user.id);
          }
        }
        
        toast({
          title: 'تم اختيار الباقة بنجاح!',
          description: `مرحباً بك في ${selectedPlanCode === 'INDIVIDUAL' ? 'باقة الأفراد' : 'باقة المكتب'}`,
        });
        navigate('/app/businesscard/edit');
      } else {
        throw new Error('فشل في تحديث الباقة');
      }
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        description: 'لم نتمكن من حفظ اختيارك. حاول مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  // لا تعرض الصفحة إذا التحميل جاري أو المستخدم لديه باقة
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* شارة التجربة المجانية */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full px-4 py-2 mb-6"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">
              شهر مجاني • {daysRemaining} يوم متبقي
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </motion.div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            اختر نوع حسابك
          </h1>
          <p className="text-muted-foreground text-lg">
            استمتع بتجربة مجانية لمدة 30 يوم بدون أي دفع
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <Card className="relative h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
                {/* شريط الباقة */}
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${plan.color} rounded-t-lg`} />
                
                <CardHeader className="text-center pt-8">
                  <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.title}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* قائمة الميزات */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* زر الاختيار */}
                  <Button
                    onClick={() => handleSelectPlan(plan.code)}
                    disabled={isSubmitting !== null}
                    className={`w-full h-12 text-base font-medium bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity`}
                  >
                    {isSubmitting === plan.code ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري الحفظ...</span>
                      </div>
                    ) : (
                      'اختيار هذه الباقة'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ملاحظة */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          يمكنك الترقية أو تغيير الباقة في أي وقت من إعدادات حسابك
        </motion.p>
      </div>
    </div>
  );
}
