/**
 * useTeamAnalytics.ts
 * Hook لتحليلات أداء الفريق - للمسؤولين فقط
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

export interface MemberActivity {
  userId: string;
  memberName: string;
  role: string;
  stats: {
    customersAdded: number;
    customersContacted: number;
    opportunitiesAccepted: number;
    opportunitiesRejected: number;
    propertiesPublished: number;
    offersCreated: number;
    requestsCreated: number;
    callsMade: number;
    meetingsScheduled: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
  }>;
}

export interface TeamAnalyticsData {
  totalMembers: number;
  activeMembers: number;
  totalCustomers: number;
  sharedCustomers: number;
  totalOpportunities: number;
  acceptedOpportunities: number;
  totalProperties: number;
  memberActivities: MemberActivity[];
  activityTimeline: Array<{
    date: string;
    activities: number;
  }>;
}

export function useTeamAnalytics(organizationUserId?: string) {
  const { user } = useAuthContext();
  const [data, setData] = useState<TeamAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // آخر 30 يوم
    end: new Date(),
  });

  // جلب التحليلات
  const fetchAnalytics = useCallback(async () => {
    if (!user || !organizationUserId) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. جلب أعضاء الفريق
      const { data: members } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_user_id', organizationUserId)
        .neq('status', 'removed');

      const activeMembers = (members || []).filter(m => m.status === 'active');

      // 2. جلب سجل النشاط
      const { data: activities } = await supabase
        .from('team_activity_log')
        .select('*')
        .eq('organization_user_id', organizationUserId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      // 3. جلب العملاء المشتركين
      const { data: sharedCustomers } = await supabase
        .from('shared_customers')
        .select('id')
        .eq('organization_user_id', organizationUserId)
        .eq('status', 'active');

      // 4. حساب إحصائيات كل عضو
      const memberActivities: MemberActivity[] = [];

      for (const member of activeMembers) {
        if (!member.member_user_id) continue;

        const memberActs = (activities || []).filter(
          a => a.user_id === member.member_user_id
        );

        const stats = {
          customersAdded: memberActs.filter(a => a.activity_type === 'customer_added').length,
          customersContacted: memberActs.filter(a => a.activity_type === 'customer_contacted').length,
          opportunitiesAccepted: memberActs.filter(a => a.activity_type === 'opportunity_accepted').length,
          opportunitiesRejected: memberActs.filter(a => a.activity_type === 'opportunity_rejected').length,
          propertiesPublished: memberActs.filter(a => a.activity_type === 'property_published').length,
          offersCreated: memberActs.filter(a => a.activity_type === 'offer_created').length,
          requestsCreated: memberActs.filter(a => a.activity_type === 'request_created').length,
          callsMade: memberActs.filter(a => a.activity_type === 'call_made').length,
          meetingsScheduled: memberActs.filter(a => a.activity_type === 'meeting_scheduled').length,
        };

        const recentActivities = memberActs.slice(0, 10).map(a => ({
          id: a.id,
          type: a.activity_type,
          title: a.entity_title || '',
          timestamp: a.created_at,
        }));

        memberActivities.push({
          userId: member.member_user_id,
          memberName: member.member_name || 'غير معروف',
          role: member.member_role,
          stats,
          recentActivities,
        });
      }

      // 5. حساب الجدول الزمني للنشاط
      const activityTimeline: Array<{ date: string; activities: number }> = [];
      const activityByDate = new Map<string, number>();

      for (const activity of activities || []) {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        activityByDate.set(date, (activityByDate.get(date) || 0) + 1);
      }

      activityByDate.forEach((count, date) => {
        activityTimeline.push({ date, activities: count });
      });

      activityTimeline.sort((a, b) => a.date.localeCompare(b.date));

      // 6. جلب إحصائيات الفرص الذكية
      const { data: opportunities } = await supabase
        .from('smart_opportunity_rotation')
        .select('id, status')
        .eq('organization_user_id', organizationUserId);

      setData({
        totalMembers: (members || []).length,
        activeMembers: activeMembers.length,
        totalCustomers: 0, // يمكن حسابها لاحقاً
        sharedCustomers: (sharedCustomers || []).length,
        totalOpportunities: (opportunities || []).length,
        acceptedOpportunities: (opportunities || []).filter(o => o.status === 'accepted').length,
        totalProperties: 0, // يمكن حسابها لاحقاً
        memberActivities,
        activityTimeline,
      });
    } catch (error) {
      console.error('[useTeamAnalytics] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, organizationUserId, dateRange]);

  // تحميل البيانات
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    isLoading,
    dateRange,
    setDateRange,
    refresh: fetchAnalytics,
  };
}
