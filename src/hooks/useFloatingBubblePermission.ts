/**
 * useFloatingBubblePermission.ts
 * 🔴 هوك للتحكم في صلاحيات وظهور المساعد الذكي كـ Floating Bubble
 * 
 * - يتحكم المالك في تفعيل/تعطيل الخاصية من لوحة التحكم
 * - Android: Floating Bubble Overlay (يتطلب SYSTEM_ALERT_WINDOW)
 * - iOS: زر دائري داخل التطبيق فقط
 * - لا يطلب أي صلاحيات إذا الخاصية معطلة من المالك
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { FloatingBubble } from '@/utils/floatingBubble';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { toast } from 'sonner';

interface FloatingBubbleState {
  // هل الخاصية مفعلة من لوحة تحكم المالك
  isOwnerEnabled: boolean;
  // هل الصلاحية ممنوحة (Android فقط)
  hasPermission: boolean;
  // هل الفقاعة نشطة حالياً
  isActive: boolean;
  // هل المستخدم فعّل الخاصية من إعداداته
  isUserEnabled: boolean;
  // النظام الأساسي
  platform: 'android' | 'ios' | 'web';
  // جاري التحميل
  isLoading: boolean;
}

interface FloatingBubbleActions {
  // طلب صلاحية العرض فوق التطبيقات (Android فقط)
  requestPermission: () => Promise<boolean>;
  // تفعيل الفقاعة
  enableBubble: () => Promise<boolean>;
  // تعطيل الفقاعة
  disableBubble: () => Promise<boolean>;
  // تبديل حالة الفقاعة
  toggleBubble: () => Promise<boolean>;
  // تحديث الحالة
  refreshState: () => Promise<void>;
}

export function useFloatingBubblePermission(): FloatingBubbleState & FloatingBubbleActions {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  
  const [state, setState] = useState<FloatingBubbleState>({
    isOwnerEnabled: true,
    hasPermission: false,
    isActive: false,
    isUserEnabled: false,
    platform: 'web',
    isLoading: true,
  });

  // تحديد النظام الأساسي
  const getPlatform = (): 'android' | 'ios' | 'web' => {
    if (!Capacitor.isNativePlatform()) return 'web';
    return Capacitor.getPlatform() as 'android' | 'ios';
  };

  // تحديث الحالة
  const refreshState = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    const platform = getPlatform();
    const isOwnerEnabled = flags.floating_bubble_enabled ?? true;
    const isUserEnabled = localStorage.getItem('floating_bubble_user_enabled') !== 'false';
    
    let hasPermission = false;
    let isActive = false;

    // Android: التحقق من الصلاحيات والحالة
    if (platform === 'android' && isOwnerEnabled) {
      hasPermission = await FloatingBubble.checkPermission();
      isActive = await FloatingBubble.isActive();
    }

    // iOS/Web: لا صلاحيات مطلوبة
    if (platform === 'ios' || platform === 'web') {
      hasPermission = true;
      isActive = isUserEnabled && isOwnerEnabled;
    }

    setState({
      isOwnerEnabled,
      hasPermission,
      isActive,
      isUserEnabled,
      platform,
      isLoading: false,
    });
  }, [flags.floating_bubble_enabled]);

  // تحديث الحالة عند تغيير الأعلام
  useEffect(() => {
    if (!flagsLoading) {
      refreshState();
    }
  }, [flagsLoading, refreshState]);

  // الاستماع لتغييرات المالك (Realtime)
  useEffect(() => {
    const handleOwnerSettingsChanged = () => {
      refreshState();
    };

    window.addEventListener('floatingBubbleOwnerChanged', handleOwnerSettingsChanged);
    return () => {
      window.removeEventListener('floatingBubbleOwnerChanged', handleOwnerSettingsChanged);
    };
  }, [refreshState]);

  // طلب صلاحية العرض فوق التطبيقات (Android فقط)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (state.platform !== 'android') {
      return true; // iOS/Web لا تحتاج صلاحيات
    }

    if (!state.isOwnerEnabled) {
      toast.error('هذه الخاصية غير مفعلة حالياً');
      return false;
    }

    const opened = await FloatingBubble.requestPermission();
    if (opened) {
      toast.info('يرجى تفعيل صلاحية العرض فوق التطبيقات ثم العودة للتطبيق');
    }
    return opened;
  }, [state.platform, state.isOwnerEnabled]);

  // تفعيل الفقاعة
  const enableBubble = useCallback(async (): Promise<boolean> => {
    if (!state.isOwnerEnabled) {
      toast.error('هذه الخاصية غير مفعلة من الإعدادات العامة');
      return false;
    }

    if (state.platform === 'android') {
      if (!state.hasPermission) {
        const granted = await requestPermission();
        if (!granted) return false;
        
        // انتظر حتى يعود المستخدم
        toast.info('عد للتطبيق بعد منح الصلاحية');
        return false;
      }

      const result = await FloatingBubble.show();
      if (result.success) {
        localStorage.setItem('floating_bubble_user_enabled', 'true');
        localStorage.removeItem('floating_bubble_user_explicitly_disabled');
        setState(prev => ({ ...prev, isActive: true, isUserEnabled: true }));
        toast.success('تم تفعيل المساعد الذكي العائم');
        return true;
      } else if (result.needsPermission) {
        await requestPermission();
        return false;
      } else {
        toast.error(result.message);
        return false;
      }
    }

    // iOS/Web: تفعيل مباشر
    localStorage.setItem('floating_bubble_user_enabled', 'true');
    localStorage.removeItem('floating_bubble_user_explicitly_disabled');
    setState(prev => ({ ...prev, isActive: true, isUserEnabled: true }));
    window.dispatchEvent(new CustomEvent('floatingBubbleUserChanged'));
    toast.success('تم تفعيل المساعد الذكي');
    return true;
  }, [state, requestPermission]);

  // تعطيل الفقاعة
  const disableBubble = useCallback(async (): Promise<boolean> => {
    if (state.platform === 'android') {
      const result = await FloatingBubble.hide();
      if (result.success) {
        localStorage.setItem('floating_bubble_user_enabled', 'false');
        localStorage.setItem('floating_bubble_user_explicitly_disabled', 'true');
        toast.success('تم تعطيل المساعد الذكي العائم');
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    }

    // iOS/Web
    localStorage.setItem('floating_bubble_user_enabled', 'false');
    localStorage.setItem('floating_bubble_user_explicitly_disabled', 'true');
    window.dispatchEvent(new CustomEvent('floatingBubbleUserChanged'));
    toast.success('تم تعطيل المساعد الذكي');
    return true;
  }, [state.platform]);

  // تبديل حالة الفقاعة
  const toggleBubble = useCallback(async (): Promise<boolean> => {
    if (state.isActive) {
      return disableBubble();
    } else {
      return enableBubble();
    }
  }, [state.isActive, enableBubble, disableBubble]);

  return {
    ...state,
    requestPermission,
    enableBubble,
    disableBubble,
    toggleBubble,
    refreshState,
  };
}

export default useFloatingBubblePermission;
