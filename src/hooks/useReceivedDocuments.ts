/**
 * useReceivedDocuments.ts
 * Hook for managing received documents from public forms
 * Uses Supabase instead of localStorage for security
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ReceivedDocument {
  id: string;
  user_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  document_type: string;
  property_type: string | null;
  city: string | null;
  district: string | null;
  notes: string | null;
  data: Json;
  status: string | null;
  is_read: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  document_type: string;
  property_type?: string;
  city?: string;
  district?: string;
  notes?: string;
  data?: Record<string, any>;
  status?: string;
}

// Legacy localStorage key for migration
const LEGACY_KEY = 'received_documents';

export function useReceivedDocuments() {
  const { user } = useAuthContext();
  const [documents, setDocuments] = useState<ReceivedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Migrate localStorage data to DB (one-time)
  const migrateLocalData = useCallback(async () => {
    if (!user) return;

    const migrationKey = `received_docs_migrated_${user.id}`;
    if (localStorage.getItem(migrationKey)) return;

    try {
      const data = localStorage.getItem(LEGACY_KEY);
      if (!data) {
        localStorage.setItem(migrationKey, 'true');
        return;
      }

      const legacyDocs = JSON.parse(data);
      if (!Array.isArray(legacyDocs) || legacyDocs.length === 0) {
        localStorage.setItem(migrationKey, 'true');
        return;
      }

      console.log(`[ReceivedDocuments] Migrating ${legacyDocs.length} documents from localStorage...`);

      const toInsert = legacyDocs.map((doc: any) => ({
        user_id: user.id,
        customer_name: doc.customerName || doc.customer_name || null,
        customer_phone: doc.customerPhone || doc.customer_phone || null,
        customer_email: doc.customerEmail || doc.customer_email || null,
        document_type: doc.type || doc.document_type || 'unknown',
        property_type: doc.propertyType || doc.property_type || null,
        city: doc.city || null,
        district: doc.district || null,
        notes: doc.notes || null,
        data: doc.data || doc,
        status: doc.status || 'pending',
        is_read: doc.isRead || doc.is_read || false,
      }));

      const { error } = await supabase
        .from('received_documents')
        .insert(toInsert);

      if (error) {
        console.error('[ReceivedDocuments] Migration error:', error);
      } else {
        console.log(`[ReceivedDocuments] Successfully migrated ${toInsert.length} documents`);
        localStorage.setItem(migrationKey, 'true');
        localStorage.removeItem(LEGACY_KEY);
        toast.success(`تم ترحيل ${toInsert.length} مستند من البيانات المحلية`);
      }
    } catch (e) {
      console.error('[ReceivedDocuments] Migration parse error:', e);
    }
  }, [user]);

  // Fetch documents from DB
  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('received_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ReceivedDocuments] Fetch error:', error);
      setError(error.message);
    } else {
      setDocuments(data || []);
    }

    setLoading(false);
  }, [user]);

  // Create document
  const createDocument = useCallback(async (input: CreateDocumentInput): Promise<ReceivedDocument | null> => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    const { data, error } = await supabase
      .from('received_documents')
      .insert({
        user_id: user.id,
        customer_name: input.customer_name || null,
        customer_phone: input.customer_phone || null,
        customer_email: input.customer_email || null,
        document_type: input.document_type,
        property_type: input.property_type || null,
        city: input.city || null,
        district: input.district || null,
        notes: input.notes || null,
        data: input.data || {},
        status: input.status || 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[ReceivedDocuments] Create error:', error);
      toast.error('فشل في حفظ المستند');
      return null;
    }

    setDocuments(prev => [data, ...prev]);
    return data;
  }, [user]);

  // Mark as read
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('received_documents')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('[ReceivedDocuments] Mark read error:', error);
      return false;
    }

    setDocuments(prev => prev.map(d => d.id === id ? { ...d, is_read: true } : d));
    return true;
  }, []);

  // Update status
  const updateStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
    const { error } = await supabase
      .from('received_documents')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[ReceivedDocuments] Update status error:', error);
      return false;
    }

    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    return true;
  }, []);

  // Delete document
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('received_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ReceivedDocuments] Delete error:', error);
      return false;
    }

    setDocuments(prev => prev.filter(d => d.id !== id));
    return true;
  }, []);

  // Get unread count
  const unreadCount = documents.filter(d => !d.is_read).length;

  // Get documents by type
  const getByType = useCallback((type: string) => {
    return documents.filter(d => d.document_type === type);
  }, [documents]);

  // Initialize
  useEffect(() => {
    if (user) {
      migrateLocalData().then(() => fetchDocuments());
    } else {
      setDocuments([]);
      setLoading(false);
    }
  }, [user, migrateLocalData, fetchDocuments]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('received_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'received_documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => {
              const newDoc = payload.new as ReceivedDocument;
              if (prev.find(d => d.id === newDoc.id)) return prev;
              return [newDoc, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev =>
              prev.map(d => d.id === (payload.new as ReceivedDocument).id ? payload.new as ReceivedDocument : d)
            );
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev =>
              prev.filter(d => d.id !== (payload.old as { id: string }).id)
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
    documents,
    loading,
    error,
    unreadCount,
    createDocument,
    markAsRead,
    updateStatus,
    deleteDocument,
    getByType,
    refetch: fetchDocuments,
  };
}
