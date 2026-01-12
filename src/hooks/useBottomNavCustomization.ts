/**
 * useBottomNavCustomization.ts
 * Hook لإدارة تخصيص أزرار الشريط السفلي
 */

import { useState, useEffect, useCallback } from 'react';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

export type BottomNavButtonId = 
  | 'home'                    // الرئيسية - ثابت
  | 'add-customer'            // إضافة عميل - ثابت
  | 'publish-ad'              // نشر إعلان
  | 'quick-calculator'        // حاسبة سريعة
  | 'smart-opportunities'     // الفرص الذكية
  | 'calendar'                // التقويم والمواعيد
  | 'my-platform'             // منصتي
  | 'offers-tab'              // تبويب العروض
  | 'requests-tab'            // تبويب الطلبات
  | 'market-analytics'        // تحليلات السوق
  | 'team-management'         // إدارة الفريق
  | 'publishing-platforms';   // النشر على المنصات

export interface BottomNavButton {
  id: BottomNavButtonId;
  label: string;
  isFixed: boolean;
  position: 'right' | 'right-center' | 'center' | 'left-center' | 'left';
  featureFlagKey?: keyof import('@/context/FeatureFlagsContext').FeatureFlags;
}

// الأزرار المتاحة للتخصيص
export const AVAILABLE_BUTTONS: Omit<BottomNavButton, 'position'>[] = [
  { id: 'home', label: 'الرئيسية', isFixed: true },
  { id: 'add-customer', label: 'إضافة عميل', isFixed: true },
  { id: 'publish-ad', label: 'نشر إعلان', isFixed: false },
  { id: 'quick-calculator', label: 'حاسبة سريعة', isFixed: false, featureFlagKey: 'quick_calculator_enabled' },
  { id: 'smart-opportunities', label: 'الفرص الذكية', isFixed: false },
  { id: 'calendar', label: 'التقويم والمواعيد', isFixed: false },
  { id: 'my-platform', label: 'منصتي', isFixed: false },
  { id: 'offers-tab', label: 'العروض', isFixed: false, featureFlagKey: 'offers_requests_enabled' },
  { id: 'requests-tab', label: 'الطلبات', isFixed: false, featureFlagKey: 'offers_requests_enabled' },
  { id: 'market-analytics', label: 'تحليلات السوق', isFixed: false },
  { id: 'team-management', label: 'إدارة الفريق', isFixed: false, featureFlagKey: 'right_slider_team_management_enabled' },
  { id: 'publishing-platforms', label: 'النشر على المنصات', isFixed: false, featureFlagKey: 'publishing_enabled' },
];

export interface BottomNavConfig {
  right: BottomNavButtonId;
  'right-center': BottomNavButtonId;
  center: BottomNavButtonId;
  'left-center': BottomNavButtonId;
  left: BottomNavButtonId;
}

// الإعداد الافتراضي للأزرار
const DEFAULT_BUTTON_CONFIG: BottomNavConfig = {
  right: 'home',
  'right-center': 'publish-ad',
  center: 'add-customer',
  'left-center': 'quick-calculator',
  left: 'smart-opportunities',
};

const STORAGE_KEY = 'bottom_nav_customization';

export function useBottomNavCustomization() {
  const { flags } = useFeatureFlags();
  const [config, setConfig] = useState<BottomNavConfig>(DEFAULT_BUTTON_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // تحميل الإعدادات من localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...DEFAULT_BUTTON_CONFIG, ...parsed } as BottomNavConfig);
      }
    } catch (e) {
      console.error('Error loading bottom nav config:', e);
    }
    setIsLoaded(true);
  }, []);

  // حفظ الإعدادات
  const saveConfig = useCallback((newConfig: BottomNavConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  }, []);

  // تحديث زر معين
  const updateButton = useCallback((position: keyof BottomNavConfig, buttonId: BottomNavButtonId) => {
    // لا يمكن تغيير الأزرار الثابتة
    if (position === 'right' || position === 'center') {
      return;
    }
    
    const newConfig = { ...config, [position]: buttonId };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  // إعادة الإعدادات الافتراضية
  const resetToDefault = useCallback(() => {
    saveConfig(DEFAULT_BUTTON_CONFIG);
  }, [saveConfig]);

  // الحصول على الأزرار المتاحة للاستبدال (مع مراعاة feature flags)
  const getAvailableButtonsForPosition = useCallback((position: keyof BottomNavConfig) => {
    if (position === 'right' || position === 'center') {
      return [];
    }

    return AVAILABLE_BUTTONS.filter(btn => {
      // استبعاد الأزرار الثابتة
      if (btn.isFixed) return false;
      
      // التحقق من feature flags
      if (btn.featureFlagKey && !flags[btn.featureFlagKey]) {
        return false;
      }
      
      return true;
    });
  }, [flags]);

  // الحصول على معلومات الزر
  const getButtonInfo = useCallback((buttonId: BottomNavButtonId) => {
    return AVAILABLE_BUTTONS.find(btn => btn.id === buttonId);
  }, []);

  // التحقق مما إذا كان الزر يجب أن يكون مخفياً (بسبب feature flags)
  const isButtonHidden = useCallback((buttonId: BottomNavButtonId) => {
    const button = AVAILABLE_BUTTONS.find(btn => btn.id === buttonId);
    if (!button) return true;
    if (button.featureFlagKey && !flags[button.featureFlagKey]) {
      return true;
    }
    return false;
  }, [flags]);

  return {
    config,
    isLoaded,
    updateButton,
    resetToDefault,
    getAvailableButtonsForPosition,
    getButtonInfo,
    isButtonHidden,
    AVAILABLE_BUTTONS,
  };
}
