/**
 * useCustomerInteractions.ts
 * Hook لإدارة تفاعلات العملاء
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerInteraction {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_phone?: string;
  interaction_type: string;
  description?: string;
  sentiment?: string;
  duration_seconds?: number;
  outcome?: string;
  metadata?: any;
  created_at: string;
}

export interface CreateInteractionInput {
  customer_id?: string;
  customer_phone?: string;
  interaction_type: string;
  description?: string;
  sentiment?: string;
  duration_seconds?: number;
  outcome?: string;
  metadata?: any;
}

export function useCustomerInteractions() {
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getInteractionsByCustomer = useCallback((customerId?: string, customerPhone?: string) => {
    return interactions.filter(i => 
      (customerId && i.customer_id === customerId) || 
      (customerPhone && i.customer_phone === customerPhone)
    );
  }, [interactions]);

  const getRecentInteractions = useCallback((customerId?: string, customerPhone?: string, limit = 3) => {
    return getInteractionsByCustomer(customerId, customerPhone).slice(0, limit);
  }, [getInteractionsByCustomer]);

  const createInteraction = useCallback(async (input: CreateInteractionInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      const { data, error } = await supabase
        .from('customer_interactions')
        .insert({
          user_id: user.id,
          ...input
        })
        .select()
        .single();

      if (error) throw error;
      
      setInteractions(prev => [data, ...prev]);
      toast.success('تم تسجيل التفاعل بنجاح');
      return data;
    } catch (error) {
      console.error('Error creating interaction:', error);
      toast.error('حدث خطأ أثناء تسجيل التفاعل');
      return null;
    }
  }, []);

  const deleteInteraction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_interactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInteractions(prev => prev.filter(i => i.id !== id));
      toast.success('تم حذف التفاعل بنجاح');
      return true;
    } catch (error) {
      console.error('Error deleting interaction:', error);
      toast.error('حدث خطأ أثناء حذف التفاعل');
      return false;
    }
  }, []);

  // حساب إحصائيات التفاعلات للتحليلات
  const getInteractionStats = useCallback((customerId?: string, customerPhone?: string) => {
    const customerInteractions = getInteractionsByCustomer(customerId, customerPhone);
    
    const totalInteractions = customerInteractions.length;
    const callsCount = customerInteractions.filter(i => i.interaction_type === 'call').length;
    const meetingsCount = customerInteractions.filter(i => i.interaction_type === 'meeting').length;
    const whatsappCount = customerInteractions.filter(i => i.interaction_type === 'whatsapp').length;
    const emailsCount = customerInteractions.filter(i => i.interaction_type === 'email').length;
    
    const positiveCount = customerInteractions.filter(i => i.sentiment === 'إيجابي').length;
    const negativeCount = customerInteractions.filter(i => i.sentiment === 'سلبي').length;
    
    // حساب معدل النشاط (التفاعلات في آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentInteractions = customerInteractions.filter(i => 
      new Date(i.created_at) >= thirtyDaysAgo
    ).length;
    
    // احتمالية الإغلاق بناءً على التفاعلات الإيجابية والاجتماعات
    const closingProbability = Math.min(
      100,
      Math.round((positiveCount * 15 + meetingsCount * 25 + callsCount * 5) / Math.max(1, totalInteractions) * 100)
    );
    
    // معدل النشاط
    const activityRate = Math.min(100, Math.round((recentInteractions / 10) * 100));
    
    return {
      totalInteractions,
      callsCount,
      meetingsCount,
      whatsappCount,
      emailsCount,
      positiveCount,
      negativeCount,
      recentInteractions,
      closingProbability,
      activityRate
    };
  }, [getInteractionsByCustomer]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  return {
    interactions,
    loading,
    fetchInteractions,
    getInteractionsByCustomer,
    getRecentInteractions,
    createInteraction,
    deleteInteraction,
    getInteractionStats
  };
}
