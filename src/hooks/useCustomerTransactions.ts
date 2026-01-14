/**
 * useCustomerTransactions.ts
 * Hook لإدارة معاملات العملاء
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerTransaction {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_phone?: string;
  transaction_type: string;
  amount: number;
  status: string;
  invoice_number?: string;
  description?: string;
  related_property_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  customer_id?: string;
  customer_phone?: string;
  transaction_type: string;
  amount: number;
  status?: string;
  invoice_number?: string;
  description?: string;
  related_property_id?: string;
  metadata?: any;
}

export function useCustomerTransactions() {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionsByCustomer = useCallback((customerId?: string, customerPhone?: string) => {
    return transactions.filter(t => 
      (customerId && t.customer_id === customerId) || 
      (customerPhone && t.customer_phone === customerPhone)
    );
  }, [transactions]);

  const createTransaction = useCallback(async (input: CreateTransactionInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      const { data, error } = await supabase
        .from('customer_transactions')
        .insert({
          user_id: user.id,
          ...input
        })
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => [data, ...prev]);
      toast.success('تم إضافة المعاملة بنجاح');
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('حدث خطأ أثناء إضافة المعاملة');
      return null;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<CreateTransactionInput>) => {
    try {
      const { data, error } = await supabase
        .from('customer_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      toast.success('تم تحديث المعاملة بنجاح');
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('حدث خطأ أثناء تحديث المعاملة');
      return null;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('تم حذف المعاملة بنجاح');
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('حدث خطأ أثناء حذف المعاملة');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    fetchTransactions,
    getTransactionsByCustomer,
    createTransaction,
    updateTransaction,
    deleteTransaction
  };
}
