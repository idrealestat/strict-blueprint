import { ReactNode } from 'react';
import { useEntitlementsContext, FeatureKey } from '@/context/EntitlementsContext';

interface FeatureGateProps {
  /** مفتاح الميزة المطلوبة */
  feature: FeatureKey;
  /** المحتوى الذي يظهر إذا كانت الميزة مسموحة */
  children: ReactNode;
  /** محتوى بديل يظهر إذا لم تكن الميزة مسموحة (اختياري) */
  fallback?: ReactNode;
  /** إذا كان true، يخفي المحتوى تماماً بدلاً من عرض البديل */
  hideOnly?: boolean;
}

/**
 * مكون لإخفاء/إظهار الميزات حسب صلاحيات المستخدم
 * 
 * @example
 * <FeatureGate feature="team_management">
 *   <TeamManagementPanel />
 * </FeatureGate>
 * 
 * @example
 * <FeatureGate feature="ai_assistant_advanced" fallback={<UpgradePrompt />}>
 *   <AdvancedAIChat />
 * </FeatureGate>
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null,
  hideOnly = true 
}: FeatureGateProps) {
  const { canUseFeature, isLoading } = useEntitlementsContext();

  // أثناء التحميل، لا نعرض شيء
  if (isLoading) {
    return null;
  }

  // إذا كانت الميزة مسموحة
  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  // إذا hideOnly = true، لا نعرض شيء
  if (hideOnly) {
    return null;
  }

  // عرض المحتوى البديل
  return <>{fallback}</>;
}

/**
 * Hook للتحقق من صلاحية ميزة معينة
 */
export function useFeatureAccess(feature: FeatureKey): {
  hasAccess: boolean;
  isLoading: boolean;
} {
  const { canUseFeature, isLoading } = useEntitlementsContext();
  
  return {
    hasAccess: canUseFeature(feature),
    isLoading
  };
}

/**
 * مكون يظهر رسالة ترقية للميزات غير المتاحة
 */
export function UpgradePrompt({ 
  feature,
  message = 'هذه الميزة غير متاحة في باقتك الحالية'
}: { 
  feature: FeatureKey;
  message?: string;
}) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
