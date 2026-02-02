/**
 * useTeamManagement.ts
 * Hook لإدارة فريق المكتب/الشركة
 * يتضمن: إضافة/إزالة الزملاء، تحديث الصلاحيات، إعدادات الفريق
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

// Types
export interface OrganizationMember {
  id: string;
  organization_user_id: string;
  member_user_id: string | null;
  member_email: string | null;
  member_phone: string | null;
  member_whatsapp: string | null;
  member_fal_license: string | null;
  member_name: string | null;
  member_role: 'admin' | 'manager' | 'member';
  can_publish_properties: boolean;
  can_view_all_customers: boolean;
  can_manage_customers: boolean;
  can_view_smart_opportunities: boolean;
  can_accept_opportunities: boolean;
  can_view_analytics: boolean;
  can_manage_team: boolean;
  status: 'pending' | 'active' | 'suspended' | 'removed';
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  removed_at: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TeamSettings {
  id: string;
  organization_user_id: string;
  share_customers_enabled: boolean;
  customer_visibility: 'private' | 'shared' | 'admin_only';
  smart_opportunities_rotation: boolean;
  opportunity_timeout_hours: number;
  require_approval_for_publishing: boolean;
  notify_admin_on_customer_add: boolean;
  notify_admin_on_opportunity_action: boolean;
  notify_admin_on_property_publish: boolean;
  metadata: Record<string, any>;
}

export interface AddMemberInput {
  email?: string;
  whatsapp?: string;
  falLicense?: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  permissions?: Partial<{
    can_publish_properties: boolean;
    can_view_all_customers: boolean;
    can_manage_customers: boolean;
    can_view_smart_opportunities: boolean;
    can_accept_opportunities: boolean;
    can_view_analytics: boolean;
    can_manage_team: boolean;
  }>;
}

interface TeamManagementState {
  members: OrganizationMember[];
  settings: TeamSettings | null;
  isLoading: boolean;
  isOrganization: boolean;
  isAdmin: boolean;
  canManageTeam: boolean;
  organizationName: string | null;
}

// الصلاحيات الافتراضية حسب الدور
const DEFAULT_PERMISSIONS = {
  admin: {
    can_publish_properties: true,
    can_view_all_customers: true,
    can_manage_customers: true,
    can_view_smart_opportunities: true,
    can_accept_opportunities: true,
    can_view_analytics: true,
    can_manage_team: true,
  },
  manager: {
    can_publish_properties: true,
    can_view_all_customers: true,
    can_manage_customers: true,
    can_view_smart_opportunities: true,
    can_accept_opportunities: true,
    can_view_analytics: true,
    can_manage_team: false,
  },
  member: {
    can_publish_properties: true,
    can_view_all_customers: false,
    can_manage_customers: true,
    can_view_smart_opportunities: true,
    can_accept_opportunities: true,
    can_view_analytics: false,
    can_manage_team: false,
  },
};

export function useTeamManagement() {
  const { user } = useAuthContext();
  const [state, setState] = useState<TeamManagementState>({
    members: [],
    settings: null,
    isLoading: true,
    isOrganization: false,
    isAdmin: false,
    canManageTeam: false,
    organizationName: null,
  });

  // جلب بيانات الفريق
  const fetchTeamData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // 1. التحقق من نوع الحساب
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('account_type, company_name, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const isOrganization = profile?.account_type === 'office' || profile?.account_type === 'company';

      if (!isOrganization) {
        // التحقق إذا كان عضو في منظمة
        const { data: membership } = await supabase
          .from('organization_members')
          .select('*')
          .eq('member_user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (membership) {
          // هو عضو في منظمة، جلب بيانات المنظمة
          const isAdmin = membership.member_role === 'admin' || membership.can_manage_team;
          
          const { data: members } = await supabase
            .from('organization_members')
            .select('*')
            .eq('organization_user_id', membership.organization_user_id)
            .neq('status', 'removed');

          const { data: settings } = await supabase
            .from('team_settings')
            .select('*')
            .eq('organization_user_id', membership.organization_user_id)
            .maybeSingle();

          setState({
            members: (members || []) as OrganizationMember[],
            settings: settings as TeamSettings | null,
            isLoading: false,
            isOrganization: false,
            isAdmin,
            canManageTeam: isAdmin,
            organizationName: null,
          });
        } else {
          setState({
            members: [],
            settings: null,
            isLoading: false,
            isOrganization: false,
            isAdmin: false,
            canManageTeam: false,
            organizationName: null,
          });
        }
        return;
      }

      // 2. جلب أعضاء الفريق
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_user_id', user.id)
        .neq('status', 'removed');

      if (membersError) throw membersError;

      // 3. جلب إعدادات الفريق
      let { data: settings, error: settingsError } = await supabase
        .from('team_settings')
        .select('*')
        .eq('organization_user_id', user.id)
        .maybeSingle();

      // إنشاء إعدادات افتراضية إذا لم تكن موجودة
      if (!settings && !settingsError) {
        const { data: newSettings, error: createError } = await supabase
          .from('team_settings')
          .insert({
            organization_user_id: user.id,
          })
          .select()
          .single();

        if (!createError) {
          settings = newSettings;
        }
      }

      setState({
        members: (members || []) as OrganizationMember[],
        settings: settings as TeamSettings | null,
        isLoading: false,
        isOrganization: true,
        isAdmin: true,
        canManageTeam: true,
        organizationName: profile?.company_name || profile?.full_name || null,
      });
    } catch (error) {
      console.error('[useTeamManagement] Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [user]);

  // إضافة عضو جديد
  const addMember = useCallback(async (input: AddMemberInput): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

    try {
      // التحقق من وجود العضو مسبقاً
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('organization_user_id', user.id)
        .or(`member_email.eq.${input.email},member_whatsapp.eq.${input.whatsapp},member_fal_license.eq.${input.falLicense}`)
        .maybeSingle();

      if (existingMember) {
        if (existingMember.status === 'removed') {
          // إعادة تفعيل العضو
          await supabase
            .from('organization_members')
            .update({ status: 'pending', removed_at: null })
            .eq('id', existingMember.id);
        } else {
          return { success: false, error: 'هذا الزميل مضاف مسبقاً' };
        }
      }

      // البحث عن المستخدم الموجود
      let memberUserId: string | null = null;

      if (input.email) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('fal_license_number', input.falLicense)
          .maybeSingle();

        if (existingUser) {
          memberUserId = existingUser.user_id;
        }
      }

      // الحصول على الصلاحيات الافتراضية حسب الدور
      const defaultPerms = DEFAULT_PERMISSIONS[input.role];
      const permissions = { ...defaultPerms, ...input.permissions };

      // إضافة العضو
      const { data, error } = await supabase
        .from('organization_members')
        .insert({
          organization_user_id: user.id,
          member_user_id: memberUserId,
          member_email: input.email || null,
          member_whatsapp: input.whatsapp || null,
          member_fal_license: input.falLicense || null,
          member_name: input.name,
          member_role: input.role,
          ...permissions,
          invited_by: user.id,
          status: memberUserId ? 'active' : 'pending',
          accepted_at: memberUserId ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // إرسال إشعار للعضو إذا كان مسجل
      if (memberUserId) {
        await supabase.from('team_notifications').insert({
          organization_user_id: user.id,
          recipient_user_id: memberUserId,
          sender_user_id: user.id,
          notification_type: 'member_invited',
          title: 'تمت إضافتك كزميل',
          message: `تم إضافتك كزميل في ${state.organizationName || 'المنظمة'}`,
          metadata: { role: input.role },
        });
      }

      toast.success('تم إضافة الزميل بنجاح');
      await fetchTeamData();
      return { success: true };
    } catch (error: any) {
      console.error('[addMember] Error:', error);
      return { success: false, error: error.message || 'حدث خطأ أثناء الإضافة' };
    }
  }, [user, state.organizationName, fetchTeamData]);

  // إزالة عضو
  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({
          status: 'removed',
          removed_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_user_id', user.id);

      if (error) throw error;

      toast.success('تم إزالة الزميل');
      await fetchTeamData();
      return true;
    } catch (error) {
      console.error('[removeMember] Error:', error);
      toast.error('حدث خطأ أثناء الإزالة');
      return false;
    }
  }, [user, fetchTeamData]);

  // تحديث صلاحيات عضو
  const updateMemberPermissions = useCallback(async (
    memberId: string,
    permissions: Partial<OrganizationMember>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({
          ...permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_user_id', user.id);

      if (error) throw error;

      toast.success('تم تحديث الصلاحيات');
      await fetchTeamData();
      return true;
    } catch (error) {
      console.error('[updateMemberPermissions] Error:', error);
      toast.error('حدث خطأ أثناء التحديث');
      return false;
    }
  }, [user, fetchTeamData]);

  // تحديث إعدادات الفريق
  const updateTeamSettings = useCallback(async (
    updates: Partial<TeamSettings>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_user_id', user.id);

      if (error) throw error;

      toast.success('تم تحديث الإعدادات');
      await fetchTeamData();
      return true;
    } catch (error) {
      console.error('[updateTeamSettings] Error:', error);
      toast.error('حدث خطأ أثناء تحديث الإعدادات');
      return false;
    }
  }, [user, fetchTeamData]);

  // البحث عن مستخدم بالواتساب أو الايميل
  const searchUser = useCallback(async (query: string): Promise<{
    found: boolean;
    user?: { name: string; falLicense: string; email?: string };
  }> => {
    if (!query || query.length < 3) return { found: false };

    try {
      // البحث بالايميل
      if (query.includes('@')) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, fal_license_number')
          .ilike('user_id', `%${query}%`)
          .maybeSingle();

        // البحث في auth.users غير متاح مباشرة، نستخدم business_cards
        const { data: card } = await supabase
          .from('business_cards')
          .select('data, fal_license_number')
          .eq('email', query)
          .maybeSingle();

        if (card) {
          const cardData = card.data as any;
          return {
            found: true,
            user: {
              name: cardData?.name || 'غير معروف',
              falLicense: card.fal_license_number || '',
              email: query,
            },
          };
        }
      }

      // البحث برقم رخصة فال
      const { data: profileByFal } = await supabase
        .from('profiles')
        .select('full_name, fal_license_number')
        .eq('fal_license_number', query)
        .maybeSingle();

      if (profileByFal) {
        return {
          found: true,
          user: {
            name: profileByFal.full_name || 'غير معروف',
            falLicense: profileByFal.fal_license_number || '',
          },
        };
      }

      // البحث برقم الهاتف/الواتساب
      const { data: profileByPhone } = await supabase
        .from('profiles')
        .select('full_name, fal_license_number, phone')
        .eq('phone', query)
        .maybeSingle();

      if (profileByPhone) {
        return {
          found: true,
          user: {
            name: profileByPhone.full_name || 'غير معروف',
            falLicense: profileByPhone.fal_license_number || '',
          },
        };
      }

      return { found: false };
    } catch (error) {
      console.error('[searchUser] Error:', error);
      return { found: false };
    }
  }, []);

  // تحميل البيانات
  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // الاشتراك في التحديثات الحية
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('team-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_user_id=eq.${user.id}`,
        },
        () => {
          fetchTeamData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTeamData]);

  return {
    ...state,
    addMember,
    removeMember,
    updateMemberPermissions,
    updateTeamSettings,
    searchUser,
    refreshTeam: fetchTeamData,
  };
}
