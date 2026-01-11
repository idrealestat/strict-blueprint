/**
 * useCRMCustomers.ts
 * نظام إدارة العملاء - CRM Customer Management Hook
 * 
 * يستبدل localStorage بقاعدة البيانات الحقيقية
 * مع دعم الترحيل التلقائي للبيانات المحلية
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import { trackEvent } from './useEventTracker';
import type { Json } from '@/integrations/supabase/types';
import type { Tables } from '@/integrations/supabase/types';

// Use the database type directly
export type CRMCustomer = Tables<'crm_customers'>;

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  company?: string;
  status?: string;
  priority?: string;
  property_type?: string;
  budget?: string;
  location?: string;
  notes?: string;
  source?: string;
  tags?: string[];
  next_follow_up?: string;
  metadata?: Json;
}

// localStorage keys to migrate
const LEGACY_KEYS = ['crm_customers', 'customers', 'linked_customers'];

export function useCRMCustomers() {
  const { user } = useAuthContext();
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Migrate localStorage data to DB (one-time)
  const migrateLocalData = useCallback(async () => {
    if (!user) return;

    const migrationKey = `crm_migrated_${user.id}`;
    if (localStorage.getItem(migrationKey)) return;

    let legacyCustomers: any[] = [];

    // Collect from all legacy keys
    for (const key of LEGACY_KEYS) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            legacyCustomers = [...legacyCustomers, ...parsed];
          }
        }
      } catch (e) {
        console.warn(`[CRM] Failed to parse ${key}:`, e);
      }
    }

    if (legacyCustomers.length === 0) {
      localStorage.setItem(migrationKey, 'true');
      return;
    }

    console.log(`[CRM] Migrating ${legacyCustomers.length} customers from localStorage...`);

    // Dedupe by phone
    const seen = new Set<string>();
    const unique = legacyCustomers.filter(c => {
      const key = c.phone || c.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Insert to DB
    const toInsert = unique.map(c => ({
      user_id: user.id,
      name: c.name || 'غير معروف',
      phone: c.phone || null,
      email: c.email || null,
      whatsapp: c.whatsapp || c.phone || null,
      company: c.company || null,
      status: c.status || 'جديد',
      priority: c.priority || 'متوسط',
      property_type: c.propertyType || c.property_type || null,
      budget: c.budget || null,
      location: c.location || null,
      notes: c.notes || null,
      source: c.source || 'ترحيل',
      tags: c.tags || [],
      next_follow_up: c.nextFollowUp || c.next_follow_up || null,
      last_contact: c.lastContact || c.last_contact || null,
      metadata: { legacyId: c.id, migratedAt: new Date().toISOString() } as Json,
    }));

    const { error } = await supabase
      .from('crm_customers')
      .insert(toInsert);

    if (error) {
      console.error('[CRM] Migration error:', error);
    } else {
      console.log(`[CRM] Successfully migrated ${toInsert.length} customers`);
      localStorage.setItem(migrationKey, 'true');
      // Clear legacy data
      LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
      toast.success(`تم ترحيل ${toInsert.length} عميل من البيانات المحلية`);
    }
  }, [user]);

  // Fetch customers from DB
  const fetchCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CRM] Fetch error:', error);
      setError(error.message);
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  }, [user]);

  // Create customer
  const createCustomer = useCallback(async (input: CreateCustomerInput): Promise<CRMCustomer | null> => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    const { data, error } = await supabase
      .from('crm_customers')
      .insert({
        user_id: user.id,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        whatsapp: input.whatsapp || input.phone || null,
        company: input.company || null,
        status: input.status || 'جديد',
        priority: input.priority || 'متوسط',
        property_type: input.property_type || null,
        budget: input.budget || null,
        location: input.location || null,
        notes: input.notes || null,
        source: input.source || 'يدوي',
        tags: input.tags || [],
        next_follow_up: input.next_follow_up || null,
        last_contact: new Date().toISOString().split('T')[0],
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[CRM] Create error:', error);
      toast.error('فشل في إضافة العميل');
      return null;
    }

    // Track event
    await trackEvent({
      eventName: 'customer_create',
      entityType: 'customer',
      entityId: data.id,
      channel: 'in_app_admin',
      metadata: { source: input.source },
    });

    setCustomers(prev => [data, ...prev]);
    toast.success('تم إضافة العميل بنجاح');
    return data;
  }, [user]);

  // Update customer
  const updateCustomer = useCallback(async (
    id: string, 
    updates: Partial<CreateCustomerInput>
  ): Promise<CRMCustomer | null> => {
    const updateData: Record<string, any> = { ...updates };
    
    const { data, error } = await supabase
      .from('crm_customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[CRM] Update error:', error);
      toast.error('فشل في تحديث العميل');
      return null;
    }

    // Track event
    await trackEvent({
      eventName: 'customer_update',
      entityType: 'customer',
      entityId: id,
      channel: 'in_app_admin',
      metadata: { updatedFields: Object.keys(updates) },
    });

    setCustomers(prev => prev.map(c => c.id === id ? data : c));
    return data;
  }, []);

  // Delete customer
  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('crm_customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[CRM] Delete error:', error);
      toast.error('فشل في حذف العميل');
      return false;
    }

    setCustomers(prev => prev.filter(c => c.id !== id));
    toast.success('تم حذف العميل');
    return true;
  }, []);

  // Find customer by phone
  const findByPhone = useCallback(async (phone: string): Promise<CRMCustomer | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('user_id', user.id)
      .or(`phone.eq.${phone},whatsapp.eq.${phone}`)
      .maybeSingle();

    if (error) {
      console.error('[CRM] Find by phone error:', error);
      return null;
    }

    return data;
  }, [user]);

  // Find or create customer
  const findOrCreate = useCallback(async (input: CreateCustomerInput): Promise<CRMCustomer | null> => {
    if (input.phone) {
      const existing = await findByPhone(input.phone);
      if (existing) return existing;
    }
    return createCustomer(input);
  }, [findByPhone, createCustomer]);

  // Update last contact
  const updateLastContact = useCallback(async (id: string): Promise<void> => {
    await supabase
      .from('crm_customers')
      .update({ last_contact: new Date().toISOString().split('T')[0] })
      .eq('id', id);
  }, []);

  // Initialize
  useEffect(() => {
    if (user) {
      migrateLocalData().then(() => fetchCustomers());
    } else {
      setCustomers([]);
      setLoading(false);
    }
  }, [user, migrateLocalData, fetchCustomers]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('crm_customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_customers',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomers(prev => {
              const newCustomer = payload.new as CRMCustomer;
              // Avoid duplicates
              if (prev.find(c => c.id === newCustomer.id)) return prev;
              return [newCustomer, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setCustomers(prev => 
              prev.map(c => c.id === (payload.new as CRMCustomer).id ? payload.new as CRMCustomer : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setCustomers(prev => 
              prev.filter(c => c.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findByPhone,
    findOrCreate,
    updateLastContact,
    refetch: fetchCustomers,
  };
}
