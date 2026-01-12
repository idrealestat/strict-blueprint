/**
 * useTaskReminders.ts
 * Hook لفحص المهام المستحقة وإرسال تذكيرات
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { triggerTaskReminderNotification } from '@/utils/notificationTriggers';

interface CRMTaskRow {
  id: string;
  user_id: string;
  customer_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTaskReminders() {
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkDueTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // جلب المهام غير المكتملة التي لها تاريخ استحقاق
      const { data: tasks, error } = await supabase
        .from('crm_tasks')
        .select('*, crm_customers(name)')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .not('due_date', 'is', null);

      if (error || !tasks) return;

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      for (const task of tasks as (CRMTaskRow & { crm_customers: { name: string } | null })[]) {
        if (!task.due_date) continue;

        const dueDate = new Date(task.due_date);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        const taskKey = `task_${task.id}`;
        
        // حساب الفارق بالساعات
        const diffMs = dueDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // المهام المتأخرة
        if (dueDateStr < today && !notifiedTasksRef.current.has(`${taskKey}_overdue`)) {
          notifiedTasksRef.current.add(`${taskKey}_overdue`);
          await triggerTaskReminderNotification(user.id, {
            taskId: task.id,
            taskTitle: task.title,
            dueDate: task.due_date,
            reminderType: 'overdue',
            customerName: task.crm_customers?.name,
            priority: task.priority,
          });
        }
        
        // المهام المستحقة اليوم (خلال 24 ساعة)
        else if (dueDateStr === today) {
          // تنبيه قبل 1 ساعة
          if (diffHours <= 1 && diffHours > 0 && !notifiedTasksRef.current.has(`${taskKey}_due_now`)) {
            notifiedTasksRef.current.add(`${taskKey}_due_now`);
            await triggerTaskReminderNotification(user.id, {
              taskId: task.id,
              taskTitle: task.title,
              dueDate: task.due_date,
              reminderType: 'due_now',
              customerName: task.crm_customers?.name,
              priority: task.priority,
            });
          }
          // تنبيه قبل 4 ساعات
          else if (diffHours <= 4 && diffHours > 1 && !notifiedTasksRef.current.has(`${taskKey}_upcoming`)) {
            notifiedTasksRef.current.add(`${taskKey}_upcoming`);
            await triggerTaskReminderNotification(user.id, {
              taskId: task.id,
              taskTitle: task.title,
              dueDate: task.due_date,
              reminderType: 'upcoming',
              customerName: task.crm_customers?.name,
              priority: task.priority,
            });
          }
        }
        
        // المهام المستحقة غداً - تنبيه مبكر
        else if (diffHours <= 24 && diffHours > 0 && !notifiedTasksRef.current.has(`${taskKey}_tomorrow`)) {
          notifiedTasksRef.current.add(`${taskKey}_tomorrow`);
          await triggerTaskReminderNotification(user.id, {
            taskId: task.id,
            taskTitle: task.title,
            dueDate: task.due_date,
            reminderType: 'upcoming',
            customerName: task.crm_customers?.name,
            priority: task.priority,
          });
        }
      }
    } catch (error) {
      console.error('[TaskReminders] Error checking due tasks:', error);
    }
  }, []);

  // بدء الفحص الدوري
  useEffect(() => {
    // فحص فوري عند التحميل
    checkDueTasks();

    // فحص كل 5 دقائق
    checkIntervalRef.current = setInterval(checkDueTasks, 5 * 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkDueTasks]);

  return {
    checkDueTasks,
    resetNotifiedTasks: () => notifiedTasksRef.current.clear(),
  };
}
