/**
 * useAutoDistribute.ts
 * منطق التوزيع التلقائي للعملاء الجدد على أعضاء الفريق
 * - يقرأ وضع التوزيع من team_settings.lead_distribution_mode
 * - يدعم: round_robin | least_loaded | random | manual
 * - يكتب في customer_assignments + auto_distribution_log
 * - لا يعدّل crm_customers
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

export type DistributionMode = 'manual' | 'round_robin' | 'least_loaded' | 'random';

interface DistributeResult {
  success: boolean;
  assignedTo?: string;
  mode?: DistributionMode;
  reason?: string;
  skipped?: boolean;
}

export function useAutoDistribute() {
  const { user } = useAuthContext();

  const distributeCustomer = useCallback(
    async (customerId: string): Promise<DistributeResult> => {
      if (!user?.id) return { success: false, reason: 'no_user' };

      // 1) قراءة الوضع
      let mode: DistributionMode = 'manual';
      try {
        const { data } = await (supabase as any)
          .from('team_settings')
          .select('lead_distribution_mode')
          .eq('organization_user_id', user.id)
          .maybeSingle();
        if (data?.lead_distribution_mode) mode = data.lead_distribution_mode as DistributionMode;
      } catch {
        const local = sessionStorage.getItem('wasata_lead_distribution_mode');
        if (local) mode = local as DistributionMode;
      }

      if (mode === 'manual') {
        return { success: false, skipped: true, mode, reason: 'manual_mode' };
      }

      // 2) جلب الأعضاء النشطين
      const { data: membersData, error: mErr } = await (supabase as any)
        .from('organization_members')
        .select('member_user_id, member_name')
        .eq('organization_user_id', user.id)
        .eq('status', 'active');
      if (mErr || !membersData || membersData.length === 0) {
        return { success: false, reason: 'no_active_members', mode };
      }
      const members = (membersData as Array<{ member_user_id: string; member_name: string | null }>)
        .filter(m => !!m.member_user_id);
      if (members.length === 0) return { success: false, reason: 'no_active_members', mode };

      // 3) التحقق من عدم وجود تعيين سابق لنفس العميل
      const { data: existing } = await (supabase as any)
        .from('customer_assignments')
        .select('id')
        .eq('organization_user_id', user.id)
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .maybeSingle();
      if (existing?.id) {
        return { success: false, skipped: true, mode, reason: 'already_assigned' };
      }

      // 4) اختيار العضو حسب الوضع
      let chosenUserId: string | null = null;
      let reason = '';

      if (mode === 'random') {
        const pick = members[Math.floor(Math.random() * members.length)];
        chosenUserId = pick.member_user_id;
        reason = `اختيار عشوائي من ${members.length} عضو`;
      } else if (mode === 'least_loaded') {
        const { data: counts } = await (supabase as any)
          .from('customer_assignments')
          .select('assigned_to_user_id')
          .eq('organization_user_id', user.id)
          .eq('is_active', true);
        const loadMap = new Map<string, number>();
        members.forEach(m => loadMap.set(m.member_user_id, 0));
        (counts || []).forEach((r: any) => {
          loadMap.set(r.assigned_to_user_id, (loadMap.get(r.assigned_to_user_id) || 0) + 1);
        });
        let minLoad = Infinity;
        loadMap.forEach((v, k) => {
          if (v < minLoad && members.some(m => m.member_user_id === k)) {
            minLoad = v;
            chosenUserId = k;
          }
        });
        reason = `الأقل ضغطاً (${minLoad} عميل حالياً)`;
      } else if (mode === 'round_robin') {
        // آخر سجل توزيع → نختار العضو التالي
        const { data: lastLog } = await (supabase as any)
          .from('auto_distribution_log')
          .select('assigned_to_user_id')
          .eq('organization_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastIdx = lastLog?.assigned_to_user_id
          ? members.findIndex(m => m.member_user_id === lastLog.assigned_to_user_id)
          : -1;
        const nextIdx = (lastIdx + 1) % members.length;
        chosenUserId = members[nextIdx].member_user_id;
        reason = `بالتناوب (الموقع ${nextIdx + 1} من ${members.length})`;
      }

      if (!chosenUserId) return { success: false, reason: 'no_member_chosen', mode };

      // 5) إنشاء التعيين
      const { error: assignErr } = await (supabase as any)
        .from('customer_assignments')
        .upsert(
          {
            organization_user_id: user.id,
            customer_id: customerId,
            assigned_to_user_id: chosenUserId,
            assigned_by_user_id: user.id,
            is_active: true,
            notes: `تعيين تلقائي (${mode})`,
          },
          { onConflict: 'organization_user_id,customer_id' }
        );
      if (assignErr) {
        return { success: false, reason: 'assign_failed', mode };
      }

      // 6) كتابة السجل
      await (supabase as any).from('auto_distribution_log').insert({
        organization_user_id: user.id,
        customer_id: customerId,
        assigned_to_user_id: chosenUserId,
        distribution_mode: mode,
        reason,
        metadata: { members_count: members.length },
      });

      return { success: true, assignedTo: chosenUserId, mode, reason };
    },
    [user?.id]
  );

  return { distributeCustomer };
}
