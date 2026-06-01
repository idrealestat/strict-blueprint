/**
 * autoDistributionListener.ts
 * Realtime listener — يبدأ فقط لمالكي المنظمات (account_type = office/company)
 * يستمع لـ INSERT على crm_customers حيث user_id = orgId
 * ثم يستدعي Edge Function auto-distribute-customer
 * لا يعدّل crm_customers ولا useCRMCustomers.
 */
import { supabase } from '@/integrations/supabase/client';

let activeChannel: ReturnType<typeof supabase.channel> | null = null;
let activeOrgId: string | null = null;

export function startAutoDistributionListener(orgUserId: string) {
  if (activeOrgId === orgUserId && activeChannel) return; // مفعّل بالفعل
  stopAutoDistributionListener();

  activeOrgId = orgUserId;
  activeChannel = supabase
    .channel(`auto-distribute-${orgUserId}`)
    .on(
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'crm_customers',
        filter: `user_id=eq.${orgUserId}`,
      },
      async (payload: any) => {
        const newRow = payload?.new;
        if (!newRow?.id) return;
        try {
          const { data, error } = await supabase.functions.invoke('auto-distribute-customer', {
            body: { customer_id: newRow.id, organization_user_id: orgUserId },
          });
          if (error) {
            // eslint-disable-next-line no-console
            console.warn('[autoDistribution] invoke error', error);
          } else if ((data as any)?.success) {
            // eslint-disable-next-line no-console
            console.info('[autoDistribution] assigned', data);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[autoDistribution] exception', e);
        }
      }
    )
    .subscribe();
}

export function stopAutoDistributionListener() {
  if (activeChannel) {
    try {
      supabase.removeChannel(activeChannel);
    } catch {
      /* noop */
    }
  }
  activeChannel = null;
  activeOrgId = null;
}