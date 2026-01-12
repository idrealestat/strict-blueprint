/**
 * AddTaskDialog.tsx
 * نموذج إنشاء مهمة جديدة مرتبطة بعميل
 * ⚠️ تحذير: هذا الملف محمي - لا تعدله بدون إذن صريح من صاحب المشروع
 */

import React, { useState } from "react";
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
} from "lucide-react";
import { useCRMTasks, TaskPriority } from "@/hooks/useCRMTasks";
import { toast } from "sonner";

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onTaskCreated?: () => void;
}

// تكوينات الأولوية
const priorityOptions: Array<{
  value: TaskPriority;
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: 'urgent_important',
    label: 'Urgent & Important',
    labelAr: 'مهم وعاجل',
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    value: 'important_not_urgent',
    label: 'Important, Not Urgent',
    labelAr: 'مهم وغير عاجل',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    value: 'urgent_not_important',
    label: 'Urgent, Not Important',
    labelAr: 'عاجل وغير مهم',
    icon: <Clock className="w-4 h-4 text-yellow-600" />,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  {
    value: 'not_urgent_not_important',
    label: 'Not Urgent, Not Important',
    labelAr: 'غير مهم وغير عاجل',
    icon: <CheckSquare className="w-4 h-4 text-gray-500" />,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
  },
];

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  onTaskCreated,
}) => {
  const { createTask } = useCRMTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'not_urgent_not_important' as TaskPriority,
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان المهمة');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createTask({
        customer_id: customerId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      });

      if (result) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          priority: 'not_urgent_not_important',
          dueDate: '',
        });
        onTaskCreated?.();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'not_urgent_not_important',
      dueDate: '',
    });
    onClose();
  };

  const selectedPriority = priorityOptions.find(p => p.value === formData.priority);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="w-5 h-5 text-[#01411C]" />
            إضافة مهمة جديدة
          </DialogTitle>
          <p className="text-sm text-gray-500">للعميل: {customerName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* عنوان المهمة */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المهمة *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثال: متابعة العرض المقدم"
              autoFocus
            />
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea
              id="description"
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
            
            {/* شرح الأولوية */}
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {formData.priority === 'urgent_important' && '🔴 يجب التنفيذ فوراً - الأولوية القصوى'}
              {formData.priority === 'important_not_urgent' && '🟠 مهم ويمكن جدولته - خطط له'}
              {formData.priority === 'urgent_not_important' && '🟡 عاجل لكن يمكن تفويضه'}
              {formData.priority === 'not_urgent_not_important' && '⚪ يمكن تأجيله أو إلغاؤه'}
            </div>
          </div>

          {/* تاريخ الاستحقاق */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              تاريخ الاستحقاق (اختياري)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
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
                إضافة المهمة
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
