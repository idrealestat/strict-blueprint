import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SmartOpportunityAcceptance {
  id: string;
  type: 'offer_to_request' | 'request_to_offer';
  owner_user_id: string;
  other_user_id?: string;
  owner_item_id: string;
  other_item_id: string;
  similarity_score: number;
  matched_features: string[];
  source: string;
  status: 'accepted' | 'rejected' | 'pending';
  viewed_by_owner: boolean;
  owner_item_data: Record<string, any>;
  other_item_data: Record<string, any>;
  other_broker_info: {
    name?: string;
    phone?: string;
    whatsapp?: string;
    fal_license?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
}

interface RejectionRecord {
  opportunity_key: string;
  rejection_count: number;
}

export function useSmartOpportunities() {
  const { user } = useAuth();
  const [acceptances, setAcceptances] = useState<SmartOpportunityAcceptance[]>([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectedKeys, setRejectedKeys] = useState<Set<string>>(new Set());

  // جلب الفرص المرفوضة مرتين
  const fetchRejectedOpportunities = useCallback(async () => {
    if (!user) {
      setRejectedKeys(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('smart_opportunity_rejections')
        .select('opportunity_key, rejection_count')
        .eq('user_id', user.id)
        .gte('rejection_count', 2);

      if (error) throw error;

      const keys = new Set((data || []).map(r => r.opportunity_key));
      setRejectedKeys(keys);
    } catch (error) {
      console.error('Error fetching rejected opportunities:', error);
    }
  }, [user]);

  // جلب الفرص المقبولة
  const fetchAcceptances = useCallback(async () => {
    if (!user) {
      setAcceptances([]);
      setUnviewedCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('smart_opportunity_acceptances')
        .select('*')
        .eq('owner_user_id', user.id)
        .eq('status', 'accepted')
        .eq('source', 'smart_opportunities')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        ...item,
        matched_features: Array.isArray(item.matched_features) ? item.matched_features : [],
        owner_item_data: item.owner_item_data || {},
        other_item_data: item.other_item_data || {},
        other_broker_info: item.other_broker_info || {},
      })) as SmartOpportunityAcceptance[];

      setAcceptances(formatted);
      setUnviewedCount(formatted.filter(a => !a.viewed_by_owner).length);
    } catch (error) {
      console.error('Error fetching smart opportunity acceptances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // جلب عدد الفرص غير المقروءة فقط
  const fetchUnviewedCount = useCallback(async () => {
    if (!user) {
      setUnviewedCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('smart_opportunity_acceptances')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', user.id)
        .eq('status', 'accepted')
        .eq('source', 'smart_opportunities')
        .eq('viewed_by_owner', false);

      if (error) throw error;
      setUnviewedCount(count || 0);
    } catch (error) {
      console.error('Error fetching unviewed count:', error);
    }
  }, [user]);

  // تحديث حالة المشاهدة
  const markAsViewed = useCallback(async (ids?: string[]) => {
    if (!user) return;

    try {
      let query = supabase
        .from('smart_opportunity_acceptances')
        .update({ viewed_by_owner: true, updated_at: new Date().toISOString() })
        .eq('owner_user_id', user.id)
        .eq('viewed_by_owner', false);

      if (ids && ids.length > 0) {
        query = query.in('id', ids);
      }

      const { error } = await query;
      if (error) throw error;

      // تحديث الحالة المحلية
      setAcceptances(prev => 
        prev.map(a => 
          (!ids || ids.includes(a.id)) ? { ...a, viewed_by_owner: true } : a
        )
      );
      setUnviewedCount(0);
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  }, [user]);

  // قبول فرصة ذكية جديدة
  const acceptOpportunity = useCallback(async (data: {
    type: 'offer_to_request' | 'request_to_offer';
    owner_item_id: string;
    other_item_id: string;
    other_user_id?: string;
    similarity_score: number;
    matched_features: string[];
    owner_item_data: Record<string, any>;
    other_item_data: Record<string, any>;
    other_broker_info: Record<string, any>;
  }) => {
    if (!user) return null;

    try {
      const { data: inserted, error } = await supabase
        .from('smart_opportunity_acceptances')
        .insert({
          ...data,
          owner_user_id: user.id,
          source: 'smart_opportunities',
          status: 'accepted',
          viewed_by_owner: false,
        })
        .select()
        .single();

      if (error) throw error;

      // تحديث الحالة المحلية
      await fetchAcceptances();
      return inserted;
    } catch (error) {
      console.error('Error accepting opportunity:', error);
      return null;
    }
  }, [user, fetchAcceptances]);

  // رفض فرصة وتسجيلها في جدول الرفض
  const rejectOpportunity = useCallback(async (opportunityKey: string) => {
    if (!user) return;

    try {
      // محاولة تحديث عداد الرفض أو إنشاء سجل جديد
      const { data: existing } = await supabase
        .from('smart_opportunity_rejections')
        .select('id, rejection_count')
        .eq('user_id', user.id)
        .eq('opportunity_key', opportunityKey)
        .single();

      if (existing) {
        // تحديث العداد
        await supabase
          .from('smart_opportunity_rejections')
          .update({ 
            rejection_count: existing.rejection_count + 1,
            last_rejected_at: new Date().toISOString()
          })
          .eq('id', existing.id);
          
        // إذا وصل إلى 2 أو أكثر، أضفه للمجموعة المحلية
        if (existing.rejection_count + 1 >= 2) {
          setRejectedKeys(prev => new Set([...prev, opportunityKey]));
        }
      } else {
        // إنشاء سجل جديد
        await supabase
          .from('smart_opportunity_rejections')
          .insert({
            user_id: user.id,
            opportunity_key: opportunityKey,
            rejection_count: 1,
          });
      }
    } catch (error) {
      console.error('Error rejecting opportunity:', error);
    }
  }, [user]);

  // التحقق مما إذا كانت الفرصة مرفوضة نهائياً
  const isOpportunityRejected = useCallback((myListingId: string, otherListingId: string) => {
    const key = `${myListingId}-${otherListingId}`;
    return rejectedKeys.has(key);
  }, [rejectedKeys]);

  useEffect(() => {
    fetchAcceptances();
    fetchRejectedOpportunities();
  }, [fetchAcceptances, fetchRejectedOpportunities]);

  // الفرص حسب النوع
  const acceptedOffers = acceptances.filter(a => a.type === 'offer_to_request');
  const acceptedRequests = acceptances.filter(a => a.type === 'request_to_offer');

  return {
    acceptances,
    acceptedOffers,
    acceptedRequests,
    unviewedCount,
    isLoading,
    rejectedKeys,
    fetchAcceptances,
    fetchUnviewedCount,
    fetchRejectedOpportunities,
    markAsViewed,
    acceptOpportunity,
    rejectOpportunity,
    isOpportunityRejected,
  };
}
