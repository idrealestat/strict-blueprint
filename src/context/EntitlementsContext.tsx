import { createContext, useContext, ReactNode } from 'react';
import { useEntitlements, PlanCode, SubscriptionStatus, FeatureKey } from '@/hooks/useEntitlements';

interface EntitlementsContextType {
  planCode: PlanCode | null;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  daysRemaining: number;
  onboardingCompleted: boolean;
  isLoading: boolean;
  canUseFeature: (feature: FeatureKey) => boolean;
  needsPlanSelection: () => boolean;
  needsOnboarding: () => boolean;
  isExpired: () => boolean;
  updatePlan: (planCode: PlanCode) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  refresh: () => void;
}

const EntitlementsContext = createContext<EntitlementsContextType | undefined>(undefined);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const entitlements = useEntitlements();

  return (
    <EntitlementsContext.Provider value={entitlements}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlementsContext() {
  const context = useContext(EntitlementsContext);
  if (context === undefined) {
    throw new Error('useEntitlementsContext must be used within an EntitlementsProvider');
  }
  return context;
}

// Re-export types
export type { PlanCode, SubscriptionStatus, FeatureKey };
