/**
 * DistributionLogPanel.tsx
 * سجل التوزيع التلقائي - يعرض آخر عمليات التوزيع التلقائي للعملاء
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, RefreshCw, Shuffle, Scale, Repeat, Hand } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

interface LogRow {
  id: string;
  customer_id: string;
  assigned_to_user_id: string;
  distribution_mode: string;
  reason: string | null;
  created_at: string;
}

const MODE_META: Record<string, { label: string; icon: any; color: string }> = {
  manual: { label: 'يدوي', icon: Hand, color: 'bg-gray-100 text-gray-700' },
  round_robin: { label: 'بالتناوب', icon: Repeat, color: 'bg-blue-100 text-blue-700' },
  least_loaded: { label: 'الأقل ضغطاً', icon: Scale, color: 'bg-amber-100 text-amber-700' },
  random: { label: 'عشوائي', icon: Shuffle, color: 'bg-purple-100 text-purple-700' },
};

export default function DistributionLogPanel() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('auto_distribution_log')
        .select('*')
        .eq('organization_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = (data || []) as LogRow[];
      setRows(list);

      const memberIds = Array.from(new Set(list.map(r => r.assigned_to_user_id)));
      const customerIds = Array.from(new Set(list.map(r => r.customer_id)));

      if (memberIds.length > 0) {
        const { data: members } = await (supabase as any)
          .from('organization_members')
          .select('member_user_id, member_name')
          .in('member_user_id', memberIds);
        const map: Record<string, string> = {};
        (members || []).forEach((m: any) => {
          map[m.member_user_id] = m.member_name || 'عضو';
        });
        setMemberNames(map);
      }

      if (customerIds.length > 0) {
        const { data: customers } = await (supabase as any)
          .from('crm_customers')
          .select('id, customer_name')
          .in('id', customerIds);
        const map: Record<string, string> = {};
        (customers || []).forEach((c: any) => {
          map[c.id] = c.customer_name || 'عميل';
        });
        setCustomerNames(map);
      }
    } catch (e) {
      console.error('[distribution-log] error', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-[#01411C]" />
              سجل التوزيع التلقائي
            </CardTitle>
            <CardDescription>آخر 50 عملية توزيع تلقائي</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && rows.length === 0 ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            لا توجد عمليات توزيع تلقائي بعد
          </p>
        ) : (
          rows.map(r => {
            const meta = MODE_META[r.distribution_mode] || MODE_META.manual;
            const Icon = meta.icon;
            return (
              <div key={r.id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-semibold">
                      {customerNames[r.customer_id] || 'عميل'}
                    </span>
                    <span className="text-gray-400">←</span>
                    <span className="font-semibold text-[#01411C]">
                      {memberNames[r.assigned_to_user_id] || 'عضو'}
                    </span>
                  </div>
                  <Badge className={`${meta.color} text-xs`}>
                    <Icon className="w-3 h-3 ml-1" />
                    {meta.label}
                  </Badge>
                </div>
                {r.reason && (
                  <p className="text-xs text-gray-500 mt-1">{r.reason}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(r.created_at).toLocaleString('ar-SA')}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
