/**
 * useCRMTasks.ts
 * Hook لإدارة مهام CRM
 * ⚠️ تحذير: هذا الملف محمي - لا تعدله بدون إذن صريح من صاحب المشروع
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TaskPriority = 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'not_urgent_not_important';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CRMTask {
  id: string;
  user_id: string;
  customer_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  customer_id?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
}

export function useCRMTasks() {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب المهام
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTasks([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // تحويل البيانات للنوع الصحيح
      const typedData: CRMTask[] = (data || []).map(item => ({
        ...item,
        priority: item.priority as TaskPriority,
        status: item.status as TaskStatus,
        customer_id: item.customer_id || undefined,
        description: item.description || undefined,
        due_date: item.due_date || undefined,
        completed_at: item.completed_at || undefined,
      }));

      setTasks(typedData);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // إنشاء مهمة جديدة
  const createTask = useCallback(async (input: CreateTaskInput): Promise<CRMTask | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      const { data, error } = await supabase
        .from('crm_tasks')
        .insert({
          user_id: user.id,
          customer_id: input.customer_id,
          title: input.title,
          description: input.description,
          priority: input.priority || 'not_urgent_not_important',
          due_date: input.due_date,
        })
        .select()
        .single();

      if (error) throw error;

      // تحويل البيانات للنوع الصحيح
      const typedTask: CRMTask = {
        ...data,
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        customer_id: data.customer_id || undefined,
        description: data.description || undefined,
        due_date: data.due_date || undefined,
        completed_at: data.completed_at || undefined,
      };

      setTasks(prev => [typedTask, ...prev]);
      toast.success('تم إنشاء المهمة بنجاح');
      return typedTask;
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast.error('فشل في إنشاء المهمة');
      return null;
    }
  }, []);

  // تحديث مهمة
  const updateTask = useCallback(async (taskId: string, input: UpdateTaskInput): Promise<boolean> => {
    try {
      const updateData: any = { ...input };
      
      // إذا تم تغيير الحالة إلى مكتمل، نضيف تاريخ الإكمال
      if (input.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('crm_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, ...updateData, updated_at: new Date().toISOString() } 
          : t
      ));

      return true;
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast.error('فشل في تحديث المهمة');
      return false;
    }
  }, []);

  // تبديل حالة الإكمال
  const toggleComplete = useCallback(async (taskId: string, completed: boolean): Promise<boolean> => {
    return updateTask(taskId, {
      status: completed ? 'completed' : 'pending',
    });
  }, [updateTask]);

  // حذف مهمة
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('crm_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('تم حذف المهمة');
      return true;
    } catch (err: any) {
      console.error('Error deleting task:', err);
      toast.error('فشل في حذف المهمة');
      return false;
    }
  }, []);

  // جلب مهام عميل معين
  const getTasksByCustomer = useCallback((customerId: string) => {
    return tasks.filter(t => t.customer_id === customerId);
  }, [tasks]);

  // جلب المهام حسب الأولوية
  const getTasksByPriority = useCallback((priority: TaskPriority) => {
    return tasks.filter(t => t.priority === priority && t.status !== 'completed');
  }, [tasks]);

  // التحميل الأولي
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
    getTasksByCustomer,
    getTasksByPriority,
  };
}
