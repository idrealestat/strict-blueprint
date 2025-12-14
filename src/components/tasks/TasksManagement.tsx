/**
 * TasksManagement.tsx
 * نظام إدارة المهام مع ربط العملاء
 * Complete Tasks Management System
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { triggerNotification } from "@/hooks/useNotificationSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Search,
  Plus,
  Check,
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  User,
  Flag,
  Trash2,
  Edit,
  LayoutGrid,
  List,
  Filter,
  GripVertical,
  AlertCircle,
  Star,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

// Types
interface LinkedCustomer {
  id: string;
  name: string;
  phone: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'متابعة' | 'اتصال' | 'اجتماع' | 'مهمة' | 'تذكير' | 'أخرى';
  linkedCustomer?: LinkedCustomer;
  tags?: string[];
  createdAt: string;
  completedAt?: string;
}

interface TaskColumn {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
}

interface TasksManagementProps {
  onBack: () => void;
  linkedCustomer?: LinkedCustomer | null;
}

// Default Columns
const taskColumns: TaskColumn[] = [
  { id: 'pending', title: 'قيد الانتظار', status: 'pending', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'قيد التنفيذ', status: 'in_progress', color: 'bg-yellow-500' },
  { id: 'completed', title: 'مكتملة', status: 'completed', color: 'bg-green-500' },
  { id: 'overdue', title: 'متأخرة', status: 'overdue', color: 'bg-red-500' },
];

// Priority Config
const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-700', icon: '⚪' },
  medium: { label: 'متوسطة', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  high: { label: 'عالية', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  urgent: { label: 'عاجلة', color: 'bg-red-100 text-red-700', icon: '🔴' },
};

// Type Config
const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  'متابعة': { label: 'متابعة', color: 'bg-purple-100 text-purple-700' },
  'اتصال': { label: 'اتصال', color: 'bg-green-100 text-green-700' },
  'اجتماع': { label: 'اجتماع', color: 'bg-blue-100 text-blue-700' },
  'مهمة': { label: 'مهمة', color: 'bg-orange-100 text-orange-700' },
  'تذكير': { label: 'تذكير', color: 'bg-yellow-100 text-yellow-700' },
  'أخرى': { label: 'أخرى', color: 'bg-gray-100 text-gray-700' },
};

// Mock Tasks
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'متابعة العميل أحمد محمد',
    description: 'الاتصال للاستفسار عن قرار الشراء',
    dueDate: '2025-12-15',
    dueTime: '10:00',
    status: 'pending',
    priority: 'high',
    type: 'متابعة',
    linkedCustomer: { id: '1', name: 'أحمد محمد', phone: '0501234567' },
    createdAt: '2025-12-10',
  },
  {
    id: '2',
    title: 'إرسال عرض سعر للعميل',
    dueDate: '2025-12-14',
    status: 'in_progress',
    priority: 'urgent',
    type: 'مهمة',
    linkedCustomer: { id: '2', name: 'سارة أحمد', phone: '0559876543' },
    createdAt: '2025-12-09',
  },
  {
    id: '3',
    title: 'اجتماع مع المستثمر',
    description: 'عرض فرص الاستثمار العقاري',
    dueDate: '2025-12-16',
    dueTime: '14:00',
    status: 'pending',
    priority: 'medium',
    type: 'اجتماع',
    linkedCustomer: { id: '3', name: 'محمد علي', phone: '0541112233' },
    createdAt: '2025-12-08',
  },
  {
    id: '4',
    title: 'تجديد العقد',
    dueDate: '2025-12-10',
    status: 'overdue',
    priority: 'high',
    type: 'مهمة',
    createdAt: '2025-12-01',
  },
  {
    id: '5',
    title: 'تحديث بيانات العميل',
    dueDate: '2025-12-13',
    status: 'completed',
    priority: 'low',
    type: 'مهمة',
    completedAt: '2025-12-12',
    createdAt: '2025-12-05',
  },
];

export default function TasksManagement({ onBack, linkedCustomer }: TasksManagementProps) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTab, setActiveTab] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // New Task Form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    type: 'مهمة',
    linkedCustomerId: '',
    linkedCustomerName: '',
    linkedCustomerPhone: '',
  });

  // Open add task dialog with linked customer if provided
  useEffect(() => {
    if (linkedCustomer) {
      setNewTask(prev => ({
        ...prev,
        title: `متابعة العميل ${linkedCustomer.name}`,
        linkedCustomerId: linkedCustomer.id,
        linkedCustomerName: linkedCustomer.name,
        linkedCustomerPhone: linkedCustomer.phone,
      }));
      setShowAddTask(true);
    }
  }, [linkedCustomer]);

  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterType !== 'all' && task.type !== filterType) return false;
    return true;
  });

  // Get tasks by status
  const getTasksByStatus = (status: Task['status']) => {
    return filteredTasks.filter(task => task.status === status);
  };

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
  };

  // Handle drag & drop
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDrop = (status: Task['status']) => {
    if (!draggedTask) return;
    
    setTasks(prev => prev.map(task => 
      task.id === draggedTask 
        ? { 
            ...task, 
            status,
            completedAt: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          }
        : task
    ));
    setDraggedTask(null);
    toast.success('تم نقل المهمة بنجاح');
  };

  // Handle add task
  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error('عنوان المهمة مطلوب');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || undefined,
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
      dueTime: newTask.dueTime || undefined,
      status: 'pending',
      priority: newTask.priority as Task['priority'],
      type: newTask.type as Task['type'],
      linkedCustomer: newTask.linkedCustomerId ? {
        id: newTask.linkedCustomerId,
        name: newTask.linkedCustomerName,
        phone: newTask.linkedCustomerPhone,
      } : undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedTasks = [task, ...tasks];
    setTasks(updatedTasks);
    
    // Save to localStorage for notification system
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    // Trigger notification
    triggerNotification({
      title: '✅ مهمة جديدة',
      message: `تم إضافة المهمة "${task.title}"`,
      type: 'success',
      category: 'task',
    });

    setNewTask({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium',
      type: 'مهمة',
      linkedCustomerId: '',
      linkedCustomerName: '',
      linkedCustomerPhone: '',
    });
    setShowAddTask(false);
    toast.success('تم إضافة المهمة بنجاح');
  };

  // Save tasks to localStorage for notification system
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Toggle task status
  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return task;
    }));
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('تم حذف المهمة');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-b-4 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-2 border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              إدارة المهام
            </h1>
            
            <Button
              onClick={() => setShowAddTask(true)}
              className="bg-[#D4AF37] text-[#01411C] hover:bg-[#f1c40f]"
            >
              <Plus className="w-4 h-4 ml-2" />
              مهمة جديدة
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مهمة..."
              className="pr-10 bg-white/90 border-2 border-[#D4AF37] focus:bg-white"
            />
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card className="border-2 border-gray-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-[#01411C]">{stats.total}</p>
              <p className="text-xs text-gray-600">إجمالي المهام</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
              <p className="text-xs text-blue-600">قيد الانتظار</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.inProgress}</p>
              <p className="text-xs text-yellow-600">قيد التنفيذ</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              <p className="text-xs text-green-600">مكتملة</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
              <p className="text-xs text-red-600">متأخرة</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأولويات</SelectItem>
              <SelectItem value="urgent">🔴 عاجلة</SelectItem>
              <SelectItem value="high">🟠 عالية</SelectItem>
              <SelectItem value="medium">🔵 متوسطة</SelectItem>
              <SelectItem value="low">⚪ منخفضة</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="متابعة">متابعة</SelectItem>
              <SelectItem value="اتصال">اتصال</SelectItem>
              <SelectItem value="اجتماع">اجتماع</SelectItem>
              <SelectItem value="مهمة">مهمة</SelectItem>
              <SelectItem value="تذكير">تذكير</SelectItem>
              <SelectItem value="أخرى">أخرى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-white border-2 border-[#D4AF37] mb-4">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              كانبان
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              قائمة
            </TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {taskColumns.map((column) => (
                  <div
                    key={column.id}
                    className="w-72 flex-shrink-0 rounded-xl bg-gray-50 border-2 border-gray-200"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(column.status)}
                  >
                    {/* Column Header */}
                    <div className={`p-3 border-b-2 border-gray-200 flex items-center justify-between rounded-t-xl ${column.color}`}>
                      <h3 className="font-bold text-white">{column.title}</h3>
                      <Badge className="bg-white/20 text-white">
                        {getTasksByStatus(column.status).length}
                      </Badge>
                    </div>

                    {/* Column Content */}
                    <ScrollArea className="h-[500px] p-2">
                      <AnimatePresence>
                        {getTasksByStatus(column.status).map((task) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            draggable
                            onDragStart={() => handleDragStart(task.id)}
                            className={`
                              bg-white rounded-lg shadow-md p-3 mb-2 cursor-move
                              hover:shadow-xl transition-all duration-200
                              border-r-4 ${
                                task.priority === 'urgent' ? 'border-r-red-500' :
                                task.priority === 'high' ? 'border-r-orange-500' :
                                task.priority === 'medium' ? 'border-r-blue-500' :
                                'border-r-gray-300'
                              }
                            `}
                          >
                            {/* Task Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleTaskComplete(task.id)}
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    task.status === 'completed'
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-300 hover:border-green-500'
                                  }`}
                                >
                                  {task.status === 'completed' && <Check className="w-3 h-3" />}
                                </button>
                                <span className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                  {task.title}
                                </span>
                              </div>
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>

                            {/* Task Details */}
                            {task.description && (
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                            )}

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              <Badge className={`text-xs ${PRIORITY_CONFIG[task.priority].color}`}>
                                {PRIORITY_CONFIG[task.priority].icon} {PRIORITY_CONFIG[task.priority].label}
                              </Badge>
                              <Badge className={`text-xs ${TYPE_CONFIG[task.type].color}`}>
                                {task.type}
                              </Badge>
                            </div>

                            {/* Linked Customer */}
                            {task.linkedCustomer && (
                              <div className="flex items-center gap-2 p-2 bg-[#f0fdf4] rounded-lg mb-2">
                                <Avatar className="w-6 h-6 border border-[#D4AF37]">
                                  <AvatarFallback className="bg-[#01411C] text-white text-xs">
                                    {task.linkedCustomer.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[#01411C] truncate">{task.linkedCustomer.name}</p>
                                  <p className="text-[10px] text-gray-500" dir="ltr">{task.linkedCustomer.phone}</p>
                                </div>
                                <Link2 className="w-3 h-3 text-[#D4AF37]" />
                              </div>
                            )}

                            {/* Due Date */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{task.dueDate}</span>
                                {task.dueTime && <span>| {task.dueTime}</span>}
                              </div>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {getTasksByStatus(column.status).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">لا توجد مهام</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <Card className="border-2 border-[#D4AF37]">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                        task.status === 'completed' ? 'bg-green-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {task.status === 'completed' && <Check className="w-4 h-4" />}
                      </button>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </span>
                          <Badge className={`text-xs ${PRIORITY_CONFIG[task.priority].color}`}>
                            {PRIORITY_CONFIG[task.priority].icon}
                          </Badge>
                        </div>
                        {task.linkedCustomer && (
                          <div className="flex items-center gap-1 text-xs text-[#01411C]">
                            <User className="w-3 h-3" />
                            <span>{task.linkedCustomer.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Due Date */}
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{task.dueDate}</span>
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5 text-[#01411C]" />
              إضافة مهمة جديدة
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>عنوان المهمة *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان المهمة"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="تفاصيل المهمة..."
                rows={3}
              />
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الوقت</Label>
                <Input
                  type="time"
                  value={newTask.dueTime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Priority & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">⚪ منخفضة</SelectItem>
                    <SelectItem value="medium">🔵 متوسطة</SelectItem>
                    <SelectItem value="high">🟠 عالية</SelectItem>
                    <SelectItem value="urgent">🔴 عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select
                  value={newTask.type}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="متابعة">متابعة</SelectItem>
                    <SelectItem value="اتصال">اتصال</SelectItem>
                    <SelectItem value="اجتماع">اجتماع</SelectItem>
                    <SelectItem value="مهمة">مهمة</SelectItem>
                    <SelectItem value="تذكير">تذكير</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linked Customer */}
            {newTask.linkedCustomerId && (
              <div className="p-3 bg-[#f0fdf4] rounded-lg border-2 border-[#D4AF37]">
                <Label className="text-sm text-[#01411C] mb-2 block">العميل المرتبط</Label>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-[#D4AF37]">
                    <AvatarFallback className="bg-[#01411C] text-white">
                      {newTask.linkedCustomerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-[#01411C]">{newTask.linkedCustomerName}</p>
                    <p className="text-sm text-gray-600" dir="ltr">{newTask.linkedCustomerPhone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewTask(prev => ({
                      ...prev,
                      linkedCustomerId: '',
                      linkedCustomerName: '',
                      linkedCustomerPhone: '',
                    }))}
                    className="mr-auto text-red-500"
                  >
                    إزالة
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddTask(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleAddTask}
              className="bg-[#01411C] hover:bg-[#065f41]"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة المهمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
