/**
 * useFalLicenseAlert Hook
 * إدارة تنبيهات رخصة فال وحساب المدة المتبقية
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FalLicenseInfo {
  licenseNumber: string | null;
  expiryDate: string | null;
  durationYears: number;
  accountType: string;
  daysRemaining: number;
  monthsRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // خلال شهر
  isExpiringVeryClose: boolean; // خلال أسبوع
  statusColor: string; // لون التدرج بناءً على الحالة
  statusMessage: string;
}

export function useFalLicenseAlert() {
  const [licenseInfo, setLicenseInfo] = useState<FalLicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // حساب المدة المتبقية واللون المتدرج
  const calculateLicenseStatus = useCallback((
    expiryDate: string | null,
    licenseNumber: string | null,
    durationYears: number,
    accountType: string
  ): FalLicenseInfo => {
    if (!expiryDate || !licenseNumber) {
      return {
        licenseNumber,
        expiryDate,
        durationYears,
        accountType,
        daysRemaining: 0,
        monthsRemaining: 0,
        isExpired: true,
        isExpiringSoon: false,
        isExpiringVeryClose: false,
        statusColor: 'text-gray-400',
        statusMessage: 'لم يتم إدخال الرخصة'
      };
    }

    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);

    const isExpired = diffDays < 0;
    const isExpiringVeryClose = !isExpired && diffDays <= 7;
    const isExpiringSoon = !isExpired && !isExpiringVeryClose && diffDays <= 30;

    // تحديد اللون المتدرج
    let statusColor = 'text-green-500'; // أخضر - جيد
    let statusMessage = '';

    if (isExpired) {
      statusColor = 'text-red-600';
      statusMessage = 'منتهية الصلاحية!';
    } else if (isExpiringVeryClose) {
      statusColor = 'text-red-500';
      statusMessage = `تنتهي خلال ${diffDays} يوم!`;
    } else if (isExpiringSoon) {
      statusColor = 'text-orange-500';
      statusMessage = `تنتهي خلال ${diffDays} يوم`;
    } else if (diffDays <= 60) {
      statusColor = 'text-yellow-500';
      statusMessage = `متبقي ${diffMonths} شهر`;
    } else if (diffDays <= 90) {
      statusColor = 'text-lime-500';
      statusMessage = `متبقي ${diffMonths} شهر`;
    } else {
      statusMessage = diffMonths >= 12 
        ? `متبقي ${Math.floor(diffMonths / 12)} سنة ${diffMonths % 12 > 0 ? `و ${diffMonths % 12} شهر` : ''}`
        : `متبقي ${diffMonths} شهر`;
    }

    return {
      licenseNumber,
      expiryDate,
      durationYears,
      accountType,
      daysRemaining: Math.max(0, diffDays),
      monthsRemaining: Math.max(0, diffMonths),
      isExpired,
      isExpiringSoon,
      isExpiringVeryClose,
      statusColor,
      statusMessage
    };
  }, []);

  // جلب بيانات الرخصة وإرسال التنبيهات
  const fetchLicenseData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // جلب من profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('fal_license_number, fal_license_expiry, fal_license_duration_years, account_type')
        .eq('user_id', user.id)
        .maybeSingle();

      // جلب من business_cards أيضاً للتأكد
      const { data: card } = await supabase
        .from('business_cards')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle();

      const cardData = card?.data as Record<string, unknown> | null;

      // دمج البيانات - الأولوية للـ profile
      const licenseNumber = profile?.fal_license_number || (cardData?.falLicense as string) || null;
      const expiryDate = profile?.fal_license_expiry || (cardData?.falExpiry as string) || null;
      const durationYears = profile?.fal_license_duration_years || (cardData?.falLicenseDuration as number) || 1;
      const accountType = profile?.account_type || (cardData?.accountType as string) || 'individual';

      const info = calculateLicenseStatus(expiryDate, licenseNumber, durationYears, accountType);
      setLicenseInfo(info);

      // إرسال تنبيهات إذا لزم الأمر
      await checkAndSendNotifications(user.id, info);

      setLoading(false);
    } catch (error) {
      console.error('[useFalLicenseAlert] Error:', error);
      setLoading(false);
    }
  }, [calculateLicenseStatus]);

  // التحقق وإرسال التنبيهات
  const checkAndSendNotifications = async (userId: string, info: FalLicenseInfo) => {
    if (!info.licenseNumber || info.isExpired) return;

    const today = new Date().toISOString().split('T')[0];
    const notificationKey = `fal_license_notification_${today}`;
    const sentNotifications = localStorage.getItem(notificationKey);
    const sent = sentNotifications ? JSON.parse(sentNotifications) : {};

    // تنبيه قبل شهر
    if (info.isExpiringSoon && !sent.monthWarning) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '⚠️ تنبيه تجديد رخصة فال',
        message: `رخصة فال رقم ${info.licenseNumber} ستنتهي خلال ${info.daysRemaining} يوم. يرجى تجديدها قبل انتهاء الصلاحية.`,
        notification_type: 'system',
        priority: 'high',
        related_entity_type: 'license'
      });
      sent.monthWarning = true;
      localStorage.setItem(notificationKey, JSON.stringify(sent));
    }

    // تنبيه قبل أسبوع
    if (info.isExpiringVeryClose && !sent.weekWarning) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '🚨 رخصة فال ستنتهي قريباً!',
        message: `تبقى ${info.daysRemaining} يوم فقط على انتهاء رخصة فال رقم ${info.licenseNumber}. قم بالتجديد فوراً لتجنب الإيقاف.`,
        notification_type: 'system',
        priority: 'urgent',
        related_entity_type: 'license'
      });
      sent.weekWarning = true;
      localStorage.setItem(notificationKey, JSON.stringify(sent));
    }
  };

  useEffect(() => {
    fetchLicenseData();

    // تحديث عند تغيير بيانات البطاقة
    const handleUpdate = () => fetchLicenseData();
    window.addEventListener('businessCardUpdated', handleUpdate);
    window.addEventListener('profileUpdated', handleUpdate);

    return () => {
      window.removeEventListener('businessCardUpdated', handleUpdate);
      window.removeEventListener('profileUpdated', handleUpdate);
    };
  }, [fetchLicenseData]);

  return { licenseInfo, loading, refetch: fetchLicenseData };
}
