/**
 * AutoDistributionMount
 * يركّب Realtime listener للتوزيع التلقائي فقط لمالكي المنظمات.
 * لا يعرض أي UI.
 */
import { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { startAutoDistributionListener, stopAutoDistributionListener } from '@/lib/autoDistributionListener';

export default function AutoDistributionMount() {
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !user?.id) {
      stopAutoDistributionListener();
      return;
    }

    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', user.id)
          .maybeSingle();
        const isOrg = profile?.account_type === 'office' || profile?.account_type === 'company';
        if (!cancelled && isOrg) {
          startAutoDistributionListener(user.id);
        }
      } catch {
        /* noop */
      }
    })();

    return () => {
      cancelled = true;
      stopAutoDistributionListener();
    };
  }, [user?.id, isAuthenticated]);

  return null;
}