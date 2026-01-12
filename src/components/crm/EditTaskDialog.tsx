/**
 * EditTaskDialog.tsx
 * نموذج تعديل مهمة
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  Loader2,
  Pencil,
} from "lucide-react";
import { TaskPriority, TaskStatus, CRMTask, UpdateTaskInput } from "@/hooks/useCRMTasks";
import { toast } from "sonner";

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: CRMTask | null;
  onUpdate: (taskId: string, input: UpdateTaskInput) => Promise<boolean>;
}

// تكوينات الأولوية
const priorityOptions: Array<{
  value: TaskPriority;
  labelAr: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: 'urgent_important',
    labelAr: 'مهم وعاجل',
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    value: 'important_not_urgent',
    labelAr: 'مهم وغير عاجل',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    value: 'urgent_not_important',
    labelAr: 'عاجل وغير مهم',
    icon: <Clock className="w-4 h-4 text-yellow-600" />,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  {
    value: 'not_urgent_not_important',
    labelAr: 'غير مهم وغير عاجل',
    icon: <CheckSquare className="w-4 h-4 text-gray-500" />,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
  },
];

// تكوينات الحالة
const statusOptions: Array<{
  value: TaskStatus;
  labelAr: string;
}> = [
  { value: 'pending', labelAr: 'قيد الانتظار' },
  { value: 'in_progress', labelAr: 'قيد التنفيذ' },
  { value: 'completed', labelAr: 'مكتمل' },
  { value: 'cancelled', labelAr: 'ملغي' },
];

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  isOpen,
  onClose,
  task,
  onUpdate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'not_urgent_not_important' as TaskPriority,
    status: 'pending' as TaskStatus,
    dueDate: '',
  });

  // تحميل بيانات المهمة عند فتح الدايلوج
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان المهمة');
      return;
    }

    if (!task) return;

    setIsSubmitting(true);

    try {
      const success = await onUpdate(task.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      });

      if (success) {
        toast.success('تم تحديث المهمة بنجاح');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPriority = priorityOptions.find(p => p.value === formData.priority);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Pencil className="w-5 h-5 text-[#01411C]" />
            تعديل المهمة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* عنوان المهمة */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">عنوان المهمة *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثال: متابعة العرض المقدم"
            />
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف (اختياري)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="تفاصيل إضافية عن المهمة..."
              rows={3}
            />
          </div>

          {/* الأولوية */}
          <div className="space-y-2">
            <Label>الأولوية</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskPriority }))}
            >
              <SelectTrigger className={selectedPriority?.color}>
                <SelectValue>
                  <span className="flex items-center gap-2">
                    {selectedPriority?.icon}
                    {selectedPriority?.labelAr}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.labelAr}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الحالة */}
          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* تاريخ الاستحقاق */}
          <div className="space-y-2">
            <Label htmlFor="edit-dueDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              تاريخ الاستحقاق (اختياري)
            </Label>
            <Input
              id="edit-dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim()}
            className="bg-[#01411C] hover:bg-[#065f41]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 ml-2" />
                حفظ التعديلات
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
