/**
 * useSharedCustomers.ts
 * Hook لإدارة العملاء المشتركين بين أعضاء الفريق
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface SharedCustomer {
  id: string;
  organization_user_id: string;
  customer_id: string;
  assigned_to_user_id: string;
  assigned_by_user_id: string;
  original_owner_user_id: string | null;
  assignment_type: 'shared' | 'transferred' | 'temporary';
  notes: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // بيانات العميل المربوطة
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    status: string | null;
  };
  // بيانات الزميل المعين له
  assigned_to?: {
    member_name: string | null;
    member_user_id: string | null;
  };
}

export function useSharedCustomers(organizationUserId?: string) {
  const { user } = useAuthContext();
  const [sharedCustomers, setSharedCustomers] = useState<SharedCustomer[]>([]);
  const [myAssignedCustomers, setMyAssignedCustomers] = useState<SharedCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب العملاء المشتركين
  const fetchSharedCustomers = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // العملاء المعينين لي
      const { data: assigned, error: assignedError } = await supabase
        .from('shared_customers')
        .select(`
          *,
          customer:crm_customers(id, name, phone, email, status)
        `)
        .eq('assigned_to_user_id', user.id)
        .eq('status', 'active');

      if (assignedError) throw assignedError;

      // إذا كان صاحب المنظمة، جلب جميع العملاء المشتركين
      if (organizationUserId === user.id) {
        const { data: all, error: allError } = await supabase
          .from('shared_customers')
          .select(`
            *,
            customer:crm_customers(id, name, phone, email, status)
          `)
          .eq('organization_user_id', user.id);

        if (allError) throw allError;

        setSharedCustomers((all || []) as SharedCustomer[]);
      }

      setMyAssignedCustomers((assigned || []) as SharedCustomer[]);
    } catch (error) {
      console.error('[useSharedCustomers] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, organizationUserId]);

  // تعيين عميل لزميل
  const assignCustomerToMember = useCallback(async (params: {
    customerId: string;
    assignToUserId: string;
    organizationUserId: string;
    notes?: string;
    assignmentType?: 'shared' | 'transferred' | 'temporary';
  }): Promise<boolean> => {
    if (!user) return false;

    try {
      // التحقق من عدم وجود تعيين سابق
      const { data: existing } = await supabase
        .from('shared_customers')
        .select('id')
        .eq('customer_id', params.customerId)
        .eq('assigned_to_user_id', params.assignToUserId)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        toast.error('هذا العميل معين مسبقاً لهذا الزميل');
        return false;
      }

      // جلب بيانات العميل للإشعار
      const { data: customer } = await supabase
        .from('crm_customers')
        .select('name, user_id')
        .eq('id', params.customerId)
        .single();

      // إنشاء التعيين
      const { error } = await supabase.from('shared_customers').insert({
        organization_user_id: params.organizationUserId,
        customer_id: params.customerId,
        assigned_to_user_id: params.assignToUserId,
        assigned_by_user_id: user.id,
        original_owner_user_id: customer?.user_id || null,
        assignment_type: params.assignmentType || 'shared',
        notes: params.notes || null,
      });

      if (error) throw error;

      // إرسال إشعار للزميل
      await supabase.from('team_notifications').insert({
        organization_user_id: params.organizationUserId,
        recipient_user_id: params.assignToUserId,
        sender_user_id: user.id,
        notification_type: 'customer_assigned',
        title: 'تم تعيين عميل جديد لك',
        message: `قام المسؤول بتعيين العميل "${customer?.name || 'عميل'}" لك`,
        related_entity_type: 'customer',
        related_entity_id: params.customerId,
      });

      // تسجيل النشاط
      await supabase.from('team_activity_log').insert({
        organization_user_id: params.organizationUserId,
        user_id: user.id,
        activity_type: 'customer_added',
        entity_type: 'customer',
        entity_id: params.customerId,
        entity_title: customer?.name || 'عميل',
        details: {
          assigned_to: params.assignToUserId,
          assignment_type: params.assignmentType || 'shared',
        },
      });

      toast.success('تم تعيين العميل للزميل بنجاح');
      await fetchSharedCustomers();
      return true;
    } catch (error) {
      console.error('[assignCustomerToMember] Error:', error);
      toast.error('حدث خطأ أثناء تعيين العميل');
      return false;
    }
  }, [user, fetchSharedCustomers]);

  // إلغاء تعيين عميل
  const unassignCustomer = useCallback(async (sharedCustomerId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('shared_customers')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sharedCustomerId);

      if (error) throw error;

      toast.success('تم إلغاء تعيين العميل');
      await fetchSharedCustomers();
      return true;
    } catch (error) {
      console.error('[unassignCustomer] Error:', error);
      toast.error('حدث خطأ أثناء الإلغاء');
      return false;
    }
  }, [user, fetchSharedCustomers]);

  // التحقق إذا كان العميل معين لي
  const isCustomerAssignedToMe = useCallback((customerId: string): boolean => {
    return myAssignedCustomers.some(sc => sc.customer_id === customerId);
  }, [myAssignedCustomers]);

  // تحميل البيانات
  useEffect(() => {
    fetchSharedCustomers();
  }, [fetchSharedCustomers]);

  return {
    sharedCustomers,
    myAssignedCustomers,
    isLoading,
    assignCustomerToMember,
    unassignCustomer,
    isCustomerAssignedToMe,
    refresh: fetchSharedCustomers,
  };
}
