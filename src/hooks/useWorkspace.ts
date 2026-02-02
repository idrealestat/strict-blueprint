/**
 * useWorkspace.ts
 * Hook لإدارة مساحة العمل والتبديل بين الحسابات
 * 
 * المنطق:
 * - إذا كان المستخدم مضاف كزميل في شركة/مكتب → يمكنه إنشاء حساب شخصي خاص
 * - إذا كان لديه حساب شخصي وتم إضافته → يمكنه التبديل بين الحسابين
 * - لا يمكن لشخص واحد أن يكون لديه حسابين فرديين برخصة فال واحدة
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

interface WorkspaceMembership {
  id: string;
  user_id: string;
  organization_user_id: string;
  organization_name: string;
  organization_type: 'office' | 'company';
  role: 'admin' | 'member' | 'viewer';
  fal_license_number: string;
  status: 'pending' | 'active' | 'suspended' | 'removed';
  invited_at: string;
  accepted_at: string | null;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  account_type: string | null;
  fal_license_number: string | null;
  avatar_url: string | null;
}

interface WorkspaceAccount {
  id: string;
  type: 'personal' | 'organization';
  name: string;
  accountType: string | null;
  falLicenseNumber: string | null;
  avatarUrl: string | null;
  organizationType?: 'office' | 'company';
  role?: string;
  isActive: boolean;
}

interface WorkspaceState {
  // الحساب الشخصي للمستخدم
  personalAccount: UserProfile | null;
  // العضويات في شركات/مكاتب
  memberships: WorkspaceMembership[];
  // قائمة جميع الحسابات المتاحة للتبديل
  availableAccounts: WorkspaceAccount[];
  // الحساب النشط حالياً
  activeAccountId: string | null;
  // هل المستخدم مضاف في شركة/مكتب؟
  isAddedToOrganization: boolean;
  // هل لديه حساب شخصي بالفعل؟
  hasPersonalAccount: boolean;
  // هل يمكنه إنشاء حساب شخصي جديد؟
  canCreatePersonalAccount: boolean;
  // حالة التحميل
  isLoading: boolean;
  // رسالة للعرض
  message: string | null;
}

export function useWorkspace() {
  const { user } = useAuthContext();
  const [state, setState] = useState<WorkspaceState>({
    personalAccount: null,
    memberships: [],
    availableAccounts: [],
    activeAccountId: null,
    isAddedToOrganization: false,
    hasPersonalAccount: false,
    canCreatePersonalAccount: false,
    isLoading: true,
    message: null,
  });

  // جلب بيانات مساحة العمل
  const fetchWorkspaceData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // 1. جلب الملف الشخصي للمستخدم
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, company_name, account_type, fal_license_number, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // 2. جلب العضويات في الشركات/المكاتب
      const { data: memberships, error: membershipsError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      const activeMemberships = (memberships || []) as WorkspaceMembership[];

      // 3. تحديد الحالة
      const hasPersonalAccount = profile?.account_type === 'individual';
      const isAddedToOrganization = activeMemberships.length > 0;

      // 4. تحديد إذا كان يمكنه إنشاء حساب شخصي
      // يمكنه إنشاء حساب شخصي فقط إذا كان مضاف في شركة/مكتب وليس لديه حساب شخصي بالفعل
      const canCreatePersonalAccount = isAddedToOrganization && !hasPersonalAccount;

      // 5. بناء قائمة الحسابات المتاحة
      const accounts: WorkspaceAccount[] = [];

      // إضافة الحساب الشخصي إذا كان موجوداً
      if (profile) {
        accounts.push({
          id: profile.user_id,
          type: 'personal',
          name: profile.full_name || profile.company_name || 'حسابي',
          accountType: profile.account_type,
          falLicenseNumber: profile.fal_license_number,
          avatarUrl: profile.avatar_url,
          isActive: true, // الحساب الحالي نشط دائماً
        });
      }

      // إضافة حسابات الشركات/المكاتب
      for (const membership of activeMemberships) {
        accounts.push({
          id: membership.organization_user_id,
          type: 'organization',
          name: membership.organization_name,
          accountType: membership.organization_type,
          falLicenseNumber: membership.fal_license_number,
          avatarUrl: null,
          organizationType: membership.organization_type,
          role: membership.role,
          isActive: false,
        });
      }

      // 6. تحديد الرسالة المناسبة
      let message: string | null = null;
      if (!isAddedToOrganization && hasPersonalAccount) {
        message = 'لديك حساب بالفعل برخصة فال. ستتمكن من الدخول هنا في حال تم إضافتك كمستخدم أو زميل في مكتب أو شركة.';
      }

      // 7. جلب الحساب النشط من التخزين المحلي
      const storedActiveAccount = localStorage.getItem('activeWorkspaceAccount');
      const activeAccountId = storedActiveAccount || user.id;

      setState({
        personalAccount: profile,
        memberships: activeMemberships,
        availableAccounts: accounts,
        activeAccountId,
        isAddedToOrganization,
        hasPersonalAccount,
        canCreatePersonalAccount,
        isLoading: false,
        message,
      });
    } catch (error) {
      console.error('[useWorkspace] Error fetching data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        message: 'حدث خطأ أثناء تحميل بيانات مساحة العمل',
      }));
    }
  }, [user]);

  // التبديل إلى حساب آخر
  const switchAccount = useCallback(async (accountId: string) => {
    // حفظ الحساب النشط في التخزين المحلي
    localStorage.setItem('activeWorkspaceAccount', accountId);
    
    setState(prev => ({
      ...prev,
      activeAccountId: accountId,
      availableAccounts: prev.availableAccounts.map(acc => ({
        ...acc,
        isActive: acc.id === accountId,
      })),
    }));

    // يمكن إضافة منطق إضافي هنا لتحديث السياق أو إعادة تحميل البيانات
    return true;
  }, []);

  // إنشاء حساب شخصي جديد (عند الضغط على إنشاء حساب من مساحة العمل)
  const createPersonalAccount = useCallback(async () => {
    if (!state.canCreatePersonalAccount) {
      return { success: false, error: 'لا يمكنك إنشاء حساب شخصي في الوقت الحالي' };
    }

    // هنا يتم التوجيه لصفحة إنشاء الحساب الشخصي
    // أو فتح نموذج إنشاء الحساب
    return { success: true, redirect: '/app/businesscard/edit?mode=personal' };
  }, [state.canCreatePersonalAccount]);

  // تحميل البيانات عند تغيير المستخدم
  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // الاشتراك في التغييرات الحية
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWorkspaceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWorkspaceData]);

  return {
    ...state,
    switchAccount,
    createPersonalAccount,
    refreshWorkspace: fetchWorkspaceData,
  };
}
