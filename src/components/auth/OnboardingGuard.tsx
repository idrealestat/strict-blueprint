import { ReactNode, useEffect } from 'react';
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
    needsPlanSelection,
    needsOnboarding
  } = useEntitlementsContext();

  const currentPath = location.pathname;
  const isLoading = authLoading || entitlementLoading;

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // التحقق من المسارات المسموحة دائماً
    if (ALWAYS_ALLOWED.some(path => currentPath.startsWith(path))) {
      return;
    }

    // إذا لم يختر باقة بعد
    if (needsPlanSelection()) {
      if (!ALLOWED_BEFORE_PLAN.some(path => currentPath.startsWith(path))) {
        navigate('/app/choose-plan', { replace: true });
        return;
      }
    }

    // إذا اختار باقة لكن لم يكمل البطاقة
    if (planCode && needsOnboarding()) {
      if (!ALLOWED_BEFORE_ONBOARDING.some(path => currentPath.startsWith(path))) {
        navigate('/app/businesscard/edit', { replace: true });
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    currentPath,
    planCode,
    onboardingCompleted,
    needsPlanSelection,
    needsOnboarding,
    navigate
  ]);

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
