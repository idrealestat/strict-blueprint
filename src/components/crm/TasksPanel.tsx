/**
 * TasksPanel.tsx
 * لوحة المهام المرتبطة ببطاقات العملاء
 */

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  AlertCircle,
  Check,
  User,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditTaskDialog from "./EditTaskDialog";
import { CRMTask, UpdateTaskInput, TaskPriority, TaskStatus } from "@/hooks/useCRMTasks";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  customerId?: string;
  customerName?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onUpdateTask: (taskId: string, input: UpdateTaskInput) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  customers: Array<{ id: string; name: string }>;
}

// تكوينات الأولوية
const priorityConfig: Record<TaskPriority, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  order: number;
}> = {
  urgent_important: {
    label: 'مهم وعاجل',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    order: 1,
  },
  important_not_urgent: {
    label: 'مهم وغير عاجل',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
    order: 2,
  },
  urgent_not_important: {
    label: 'عاجل وغير مهم',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    icon: <Clock className="w-4 h-4 text-yellow-600" />,
    order: 3,
  },
  not_urgent_not_important: {
    label: 'غير مهم وغير عاجل',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    icon: <CheckSquare className="w-4 h-4 text-gray-500" />,
    order: 4,
  },
};

const TasksPanel: React.FC<TasksPanelProps> = ({
  isOpen,
  onClose,
  tasks,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  customers,
}) => {
  const [editingTask, setEditingTask] = useState<CRMTask | null>(null);

  // ترتيب المهام حسب الأولوية ثم الحالة
  const sortedTasks = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // ترتيب المهام النشطة حسب الأولوية
    activeTasks.sort((a, b) => {
      const orderA = priorityConfig[a.priority]?.order || 5;
      const orderB = priorityConfig[b.priority]?.order || 5;
      return orderA - orderB;
    });

    return { active: activeTasks, completed: completedTasks };
  }, [tasks]);

  // إحصائيات المهام
  const stats = useMemo(() => ({
    total: tasks.length,
    urgent: tasks.filter(t => t.priority === 'urgent_important' && t.status !== 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  // الحصول على اسم العميل
  const getCustomerName = (customerId?: string) => {
    if (!customerId) return null;
    return customers.find(c => c.id === customerId)?.name || 'عميل محذوف';
  };

  // تحويل Task إلى CRMTask للتعديل
  const convertToCRMTask = (task: Task): CRMTask => ({
    id: task.id,
    user_id: '',
    customer_id: task.customerId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate,
    completed_at: task.completedAt,
    created_at: task.createdAt,
    updated_at: task.createdAt,
  });

  // رندر بطاقة المهمة
  const renderTaskCard = (task: Task) => {
    const config = priorityConfig[task.priority];
    const isCompleted = task.status === 'completed';
    const customerName = getCustomerName(task.customerId);

    return (
      <div
        key={task.id}
        className={`
          p-3 rounded-lg border transition-all
          ${isCompleted 
            ? 'bg-gray-50 border-gray-200 opacity-60' 
            : `${config.bgColor} ${config.borderColor}`
          }
        `}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
            className="mt-1"
          />

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!isCompleted && config.icon}
              <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-400' : config.color}`}>
                {task.title}
              </h4>
            </div>

            {task.description && (
              <p className={`text-sm mb-2 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs">
              {/* العميل */}
              {customerName && (
                <Badge variant="outline" className="gap-1 py-0 text-[10px]">
                  <User className="w-3 h-3" />
                  {customerName}
                </Badge>
              )}

              {/* الأولوية */}
              {!isCompleted && (
                <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor} py-0 text-[10px]`}>
                  {config.label}
                </Badge>
              )}

              {/* تاريخ الاستحقاق */}
              {task.dueDate && !isCompleted && (
                <Badge variant="outline" className="gap-1 py-0 text-[10px]">
                  <Clock className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                </Badge>
              )}

              {/* تاريخ الإنجاز */}
              {isCompleted && task.completedAt && (
                <span className="text-gray-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {new Date(task.completedAt).toLocaleDateString('ar-SA')}
                </span>
              )}
            </div>
          </div>

          {/* أزرار التحرير والحذف */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingTask(convertToCRMTask(task))}>
                <Pencil className="w-4 h-4 ml-2" />
                تعديل
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من حذف المهمة "{task.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteTask(task.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      حذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden" dir="rtl">
        {/* الهيدر */}
        <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] p-4 border-b-2 border-[#D4AF37]">
          <DialogHeader className="text-white">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
              المهام
            </DialogTitle>
          </DialogHeader>

          {/* الإحصائيات */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <span className="text-xl font-bold text-[#D4AF37]">{stats.total}</span>
              <p className="text-xs text-white/80">الكل</p>
            </div>
            <div className="bg-red-500/20 rounded-lg p-2 text-center">
              <span className="text-xl font-bold text-red-300">{stats.urgent}</span>
              <p className="text-xs text-white/80">عاجل</p>
            </div>
            <div className="bg-yellow-500/20 rounded-lg p-2 text-center">
              <span className="text-xl font-bold text-yellow-300">{stats.pending}</span>
              <p className="text-xs text-white/80">قيد الانتظار</p>
            </div>
            <div className="bg-green-500/20 rounded-lg p-2 text-center">
              <span className="text-xl font-bold text-green-300">{stats.completed}</span>
              <p className="text-xs text-white/80">مكتمل</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[450px]">
          <div className="p-4 space-y-6">
            {/* المهام النشطة */}
            {sortedTasks.active.length > 0 ? (
              <div className="space-y-2">
                {sortedTasks.active.map(renderTaskCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد مهام نشطة</p>
                <p className="text-xs mt-1">أضف مهام من تفاصيل العميل</p>
              </div>
            )}

            {/* المهام المكتملة */}
            {sortedTasks.completed.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  المهام المكتملة ({sortedTasks.completed.length})
                </h3>
                {sortedTasks.completed.map(renderTaskCard)}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onUpdate={onUpdateTask}
      />
    </Dialog>
  );
};

export default TasksPanel;
