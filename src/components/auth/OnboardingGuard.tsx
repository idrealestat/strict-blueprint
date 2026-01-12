import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEntitlementsContext } from '@/context/EntitlementsContext';
import { useAuthContext } from '@/context/AuthContext';

interface OnboardingGuardProps {
  children: ReactNode;
}

// المسارات المسموح بها دائماً
const ALWAYS_ALLOWED = [
  '/app/login',
  '/app/logout',
  '/app/auth/callback',
  '/app/reset-password'
];

// المسارات المسموحة قبل اختيار الباقة
const ALLOWED_BEFORE_PLAN = [
  ...ALWAYS_ALLOWED,
  '/app/choose-plan'
];

// المسارات المسموحة قبل إكمال البطاقة
const ALLOWED_BEFORE_ONBOARDING = [
  ...ALLOWED_BEFORE_PLAN,
  '/app/businesscard/edit'
];

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { 
    planCode, 
    onboardingCompleted, 
    isLoading: entitlementLoading,
  } = useEntitlementsContext();

  const currentPath = location.pathname;
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // نعتبر التحميل منتهي فقط عندما ينتهي كلاهما
  const isLoading = authLoading || entitlementLoading;

  useEffect(() => {
    // لا تفعل redirect أثناء التحميل
    if (isLoading) {
      setHasRedirected(false);
      return;
    }
    
    // لا تفعل redirect إذا المستخدم غير مسجل
    if (!isAuthenticated) return;
    
    // تجنب redirect متكرر
    if (hasRedirected) return;

    // التحقق من المسارات المسموحة دائماً
    if (ALWAYS_ALLOWED.some(path => currentPath.startsWith(path))) {
      return;
    }

    // الحالة 1: لم يختر باقة بعد
    // plan_code = null يعني يحتاج اختيار باقة
    if (planCode === null) {
      if (!ALLOWED_BEFORE_PLAN.some(path => currentPath.startsWith(path))) {
        console.log('[OnboardingGuard] Redirecting to choose-plan - no plan selected');
        setHasRedirected(true);
        navigate('/app/choose-plan', { replace: true });
        return;
      }
      return;
    }

    // الحالة 2: اختار باقة لكن لم يكمل الـ onboarding
    // planCode موجود لكن onboardingCompleted = false
    if (planCode && !onboardingCompleted) {
      if (!ALLOWED_BEFORE_ONBOARDING.some(path => currentPath.startsWith(path))) {
        console.log('[OnboardingGuard] Redirecting to businesscard/edit - onboarding not complete');
        setHasRedirected(true);
        navigate('/app/businesscard/edit', { replace: true });
        return;
      }
      return;
    }

    // الحالة 3: planCode موجود و onboardingCompleted = true
    // منع الوصول لصفحة choose-plan
    if (planCode && onboardingCompleted) {
      if (currentPath === '/app/choose-plan') {
        console.log('[OnboardingGuard] Redirecting from choose-plan to dashboard - already has plan');
        setHasRedirected(true);
        navigate('/app/dashboard', { replace: true });
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    currentPath,
    planCode,
    onboardingCompleted,
    hasRedirected,
    navigate
  ]);

  // Reset redirect flag when path changes
  useEffect(() => {
    setHasRedirected(false);
  }, [currentPath]);

  // عرض مؤشر تحميل أثناء التحقق
  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
