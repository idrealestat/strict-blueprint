/**
 * useCustomerAssignments.ts
 * إدارة تعيين عملاء CRM لأعضاء الفريق (المرحلة 1)
 * - لا يعدّل useCRMCustomers الأصلي
 * - يقرأ/يكتب فقط على جدول customer_assignments
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface CustomerAssignment {
  id: string;
  organization_user_id: string;
  customer_id: string;
  assigned_to_user_id: string;
  assigned_by_user_id: string;
  assigned_at: string;
  is_active: boolean;
  notes: string | null;
}

export function useCustomerAssignments(organizationUserId?: string | null) {
  const { user } = useAuthContext();
  const [assignments, setAssignments] = useState<CustomerAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = organizationUserId || user?.id || null;

  const fetchAssignments = useCallback(async () => {
    if (!orgId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_assignments' as any)
      .select('*')
      .eq('organization_user_id', orgId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('[customer_assignments] fetch error', error);
      setAssignments([]);
    } else {
      setAssignments((data as any) || []);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Realtime
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`customer_assignments_${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_assignments', filter: `organization_user_id=eq.${orgId}` },
        () => fetchAssignments()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, fetchAssignments]);

  const assignCustomer = useCallback(
    async (customerId: string, memberUserId: string, notes?: string) => {
      if (!user || !orgId) return false;
      const { error } = await supabase
        .from('customer_assignments' as any)
        .upsert(
          {
            organization_user_id: orgId,
            customer_id: customerId,
            assigned_to_user_id: memberUserId,
            assigned_by_user_id: user.id,
            is_active: true,
            notes: notes || null,
          },
          { onConflict: 'organization_user_id,customer_id' }
        );
      if (error) {
        console.error('[customer_assignments] assign error', error);
        toast.error('تعذّر تعيين العميل');
        return false;
      }
      toast.success('تم تعيين العميل بنجاح');
      return true;
    },
    [user, orgId]
  );

  const unassignCustomer = useCallback(
    async (customerId: string) => {
      if (!orgId) return false;
      const { error } = await supabase
        .from('customer_assignments' as any)
        .delete()
        .eq('organization_user_id', orgId)
        .eq('customer_id', customerId);
      if (error) {
        toast.error('تعذّر إلغاء التعيين');
        return false;
      }
      toast.success('تم إلغاء التعيين');
      return true;
    },
    [orgId]
  );

  // Helpers
  const getAssignmentFor = useCallback(
    (customerId: string) => assignments.find((a) => a.customer_id === customerId) || null,
    [assignments]
  );

  const getAssignedCustomerIdsForMember = useCallback(
    (memberUserId: string) =>
      assignments.filter((a) => a.assigned_to_user_id === memberUserId).map((a) => a.customer_id),
    [assignments]
  );

  return {
    assignments,
    loading,
    refetch: fetchAssignments,
    assignCustomer,
    unassignCustomer,
    getAssignmentFor,
    getAssignedCustomerIdsForMember,
  };
}