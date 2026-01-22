/**
 * Hook للتدقيق والسجلات
 * يسجل من أنشأ - من عدّل - متى - لماذا
 * 
 * التوافق: المبدأ 4 - التوثيق والشفافية
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealEstateRole } from './useRealEstateRole';

export type AuditEntityType = 'listing' | 'request' | 'business_card' | 'ai_output';
export type AuditActionType = 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'ai_generate';

interface AuditLogParams {
  entityType: AuditEntityType;
  entityId: string;
  actionType: AuditActionType;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  changeReason?: string;
  isAiGenerated?: boolean;
  aiModelUsed?: string;
}

interface AuditLogEntry {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action_type: AuditActionType;
  performed_by: string;
  performed_by_role: string | null;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  is_ai_generated: boolean;
  ai_model_used: string | null;
  created_at: string;
}

export function useContentAudit() {
  const { user } = useAuth();
  const { realEstateRole } = useRealEstateRole();

  /**
   * تسجيل حدث في سجل التدقيق
   */
  const logAudit = useCallback(async (params: AuditLogParams): Promise<boolean> => {
    if (!user?.id) {
      console.warn('Cannot log audit: No authenticated user');
      return false;
    }

    try {
      const { error } = await supabase
        .from('content_audit_log')
        .insert({
          entity_type: params.entityType,
          entity_id: params.entityId,
          action_type: params.actionType,
          performed_by: user.id,
          performed_by_role: realEstateRole || null,
          field_changed: params.fieldChanged || null,
          old_value: params.oldValue || null,
          new_value: params.newValue || null,
          change_reason: params.changeReason || null,
          is_ai_generated: params.isAiGenerated || false,
          ai_model_used: params.aiModelUsed || null,
        });

      if (error) {
        console.error('Failed to log audit:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception logging audit:', error);
      return false;
    }
  }, [user?.id, realEstateRole]);

  /**
   * تسجيل توليد محتوى بالذكاء الاصطناعي
   */
  const logAiGeneration = useCallback(async (
    entityType: AuditEntityType,
    entityId: string,
    modelUsed: string,
    generatedContent: string
  ): Promise<boolean> => {
    return logAudit({
      entityType,
      entityId,
      actionType: 'ai_generate',
      isAiGenerated: true,
      aiModelUsed: modelUsed,
      newValue: generatedContent.substring(0, 500), // أول 500 حرف فقط
    });
  }, [logAudit]);

  /**
   * تسجيل نشر عقار
   */
  const logPublish = useCallback(async (
    entityId: string,
    reason?: string
  ): Promise<boolean> => {
    return logAudit({
      entityType: 'listing',
      entityId,
      actionType: 'publish',
      changeReason: reason,
    });
  }, [logAudit]);

  /**
   * تسجيل تعديل حقل
   */
  const logFieldUpdate = useCallback(async (
    entityType: AuditEntityType,
    entityId: string,
    fieldName: string,
    oldValue: string,
    newValue: string,
    reason?: string
  ): Promise<boolean> => {
    return logAudit({
      entityType,
      entityId,
      actionType: 'update',
      fieldChanged: fieldName,
      oldValue,
      newValue,
      changeReason: reason,
    });
  }, [logAudit]);

  /**
   * جلب سجلات التدقيق لكيان معين
   */
  const getAuditLogs = useCallback(async (
    entityType: AuditEntityType,
    entityId: string
  ): Promise<AuditLogEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('content_audit_log')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
      }

      return (data || []) as AuditLogEntry[];
    } catch (error) {
      console.error('Exception fetching audit logs:', error);
      return [];
    }
  }, []);

  /**
   * جلب آخر سجلات المستخدم
   */
  const getUserAuditLogs = useCallback(async (
    limit: number = 50
  ): Promise<AuditLogEntry[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('content_audit_log')
        .select('*')
        .eq('performed_by', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch user audit logs:', error);
        return [];
      }

      return (data || []) as AuditLogEntry[];
    } catch (error) {
      console.error('Exception fetching user audit logs:', error);
      return [];
    }
  }, [user?.id]);

  return {
    logAudit,
    logAiGeneration,
    logPublish,
    logFieldUpdate,
    getAuditLogs,
    getUserAuditLogs,
  };
}
