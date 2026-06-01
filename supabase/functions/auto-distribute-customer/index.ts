// auto-distribute-customer
// تستقبل { customer_id, organization_user_id } وتنفّذ التوزيع وفق lead_distribution_mode
// - manual → تجاهل
// - round_robin / least_loaded / random → تعيين + سجل
// idempotent: لا تعيد التعيين إذا كان نشطاً مسبقاً
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

type Mode = 'manual' | 'round_robin' | 'least_loaded' | 'random';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const customerId: string | undefined = body.customer_id;
    const orgId: string | undefined = body.organization_user_id;

    if (!customerId || !orgId) {
      return json({ success: false, reason: 'missing_params' }, 400);
    }

    // 1) قراءة الوضع
    const { data: settings } = await admin
      .from('team_settings')
      .select('lead_distribution_mode')
      .eq('organization_user_id', orgId)
      .maybeSingle();
    const mode = ((settings as any)?.lead_distribution_mode ?? 'manual') as Mode;

    if (mode === 'manual') {
      return json({ success: false, skipped: true, mode, reason: 'manual_mode' });
    }

    // 2) idempotency
    const { data: existing } = await admin
      .from('customer_assignments')
      .select('id, assigned_to_user_id')
      .eq('organization_user_id', orgId)
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .maybeSingle();
    if (existing?.id) {
      return json({ success: false, skipped: true, mode, reason: 'already_assigned', assigned_to_user_id: existing.assigned_to_user_id });
    }

    // 3) جلب الأعضاء النشطين
    const { data: membersData } = await admin
      .from('organization_members')
      .select('member_user_id, member_name')
      .eq('organization_user_id', orgId)
      .eq('status', 'active');
    const members = (membersData ?? []).filter((m: any) => !!m.member_user_id) as Array<{ member_user_id: string; member_name: string | null }>;
    if (members.length === 0) {
      return json({ success: false, reason: 'no_active_members', mode });
    }

    // 4) اختيار العضو
    let chosen: string | null = null;
    let reason = '';

    if (mode === 'random') {
      const pick = members[Math.floor(Math.random() * members.length)];
      chosen = pick.member_user_id;
      reason = `اختيار عشوائي من ${members.length} عضو`;
    } else if (mode === 'least_loaded') {
      const { data: counts } = await admin
        .from('customer_assignments')
        .select('assigned_to_user_id')
        .eq('organization_user_id', orgId)
        .eq('is_active', true);
      const load = new Map<string, number>();
      members.forEach(m => load.set(m.member_user_id, 0));
      (counts ?? []).forEach((r: any) => {
        load.set(r.assigned_to_user_id, (load.get(r.assigned_to_user_id) ?? 0) + 1);
      });
      let min = Infinity;
      load.forEach((v, k) => {
        if (v < min && members.some(m => m.member_user_id === k)) {
          min = v;
          chosen = k;
        }
      });
      reason = `الأقل ضغطاً (${min} عميل)`;
    } else if (mode === 'round_robin') {
      const { data: lastLog } = await admin
        .from('auto_distribution_log')
        .select('assigned_to_user_id')
        .eq('organization_user_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastIdx = (lastLog as any)?.assigned_to_user_id
        ? members.findIndex(m => m.member_user_id === (lastLog as any).assigned_to_user_id)
        : -1;
      const nextIdx = (lastIdx + 1) % members.length;
      chosen = members[nextIdx].member_user_id;
      reason = `بالتناوب (${nextIdx + 1}/${members.length})`;
    }

    if (!chosen) {
      return json({ success: false, reason: 'no_member_chosen', mode });
    }

    // 5) إنشاء التعيين
    const { error: assignErr } = await admin
      .from('customer_assignments')
      .upsert(
        {
          organization_user_id: orgId,
          customer_id: customerId,
          assigned_to_user_id: chosen,
          assigned_by_user_id: orgId,
          is_active: true,
          notes: `تعيين تلقائي (${mode})`,
        },
        { onConflict: 'organization_user_id,customer_id' }
      );
    if (assignErr) {
      return json({ success: false, reason: 'assign_failed', mode, error: assignErr.message });
    }

    // 6) سجل
    await admin.from('auto_distribution_log').insert({
      organization_user_id: orgId,
      customer_id: customerId,
      assigned_to_user_id: chosen,
      distribution_mode: mode,
      reason,
      metadata: { members_count: members.length, via: 'edge' },
    });

    return json({ success: true, assigned_to_user_id: chosen, mode, reason });
  } catch (e) {
    return json({ success: false, reason: 'exception', error: String(e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}