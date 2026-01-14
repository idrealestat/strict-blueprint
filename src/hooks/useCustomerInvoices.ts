/**
 * useCustomerInvoices.ts
 * Hook لإدارة فواتير وسندات قبض العملاء
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerInvoice {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_phone?: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date?: string;
  paid_date?: string;
  description?: string;
  related_transaction_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  customer_id?: string;
  customer_phone?: string;
  invoice_number: string;
  amount: number;
  status?: string;
  due_date?: string;
  paid_date?: string;
  description?: string;
  related_transaction_id?: string;
  metadata?: any;
}

export function useCustomerInvoices() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvoicesByCustomer = useCallback((customerId?: string, customerPhone?: string) => {
    return invoices.filter(inv => 
      (customerId && inv.customer_id === customerId) || 
      (customerPhone && inv.customer_phone === customerPhone)
    );
  }, [invoices]);

  const createInvoice = useCallback(async (input: CreateInvoiceInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      const { data, error } = await supabase
        .from('customer_invoices')
        .insert({
          user_id: user.id,
          ...input
        })
        .select()
        .single();

      if (error) throw error;
      
      setInvoices(prev => [data, ...prev]);
      toast.success('تم إنشاء الفاتورة بنجاح');
      return data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('حدث خطأ أثناء إنشاء الفاتورة');
      return null;
    }
  }, []);

  const updateInvoice = useCallback(async (id: string, updates: Partial<CreateInvoiceInput>) => {
    try {
      const { data, error } = await supabase
        .from('customer_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setInvoices(prev => prev.map(inv => inv.id === id ? data : inv));
      toast.success('تم تحديث الفاتورة بنجاح');
      return data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('حدث خطأ أثناء تحديث الفاتورة');
      return null;
    }
  }, []);

  const markAsPaid = useCallback(async (id: string) => {
    return updateInvoice(id, {
      status: 'مدفوعة',
      paid_date: new Date().toISOString().split('T')[0]
    });
  }, [updateInvoice]);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.success('تم حذف الفاتورة بنجاح');
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('حدث خطأ أثناء حذف الفاتورة');
      return false;
    }
  }, []);

  // إحصائيات الفواتير
  const getInvoiceStats = useCallback((customerId?: string, customerPhone?: string) => {
    const customerInvoices = getInvoicesByCustomer(customerId, customerPhone);
    
    const totalAmount = customerInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const paidAmount = customerInvoices
      .filter(inv => inv.status === 'مدفوعة')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const pendingAmount = customerInvoices
      .filter(inv => inv.status === 'معلقة')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const overdueAmount = customerInvoices
      .filter(inv => inv.status === 'متأخرة')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    
    return {
      totalInvoices: customerInvoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      paidCount: customerInvoices.filter(inv => inv.status === 'مدفوعة').length,
      pendingCount: customerInvoices.filter(inv => inv.status === 'معلقة').length,
      overdueCount: customerInvoices.filter(inv => inv.status === 'متأخرة').length
    };
  }, [getInvoicesByCustomer]);

  // توليد رقم فاتورة جديد
  const generateInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${count.toString().padStart(3, '0')}`;
  }, [invoices.length]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    fetchInvoices,
    getInvoicesByCustomer,
    createInvoice,
    updateInvoice,
    markAsPaid,
    deleteInvoice,
    getInvoiceStats,
    generateInvoiceNumber
  };
}
