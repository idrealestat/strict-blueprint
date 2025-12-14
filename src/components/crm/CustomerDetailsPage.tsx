/**
 * CustomerDetailsPage.tsx
 * صفحة تفاصيل العميل الكاملة - 8 تبويبات
 * Complete Customer Details Page with 8 Tabs
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Building2,
  MapPin,
  DollarSign,
  User,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  FileText,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Star,
  Share2,
  Send,
  Tag,
  Briefcase,
  Activity,
  History,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  company?: string;
  type?: 'buyer' | 'seller' | 'renter' | 'owner' | 'investor' | 'other';
  interestLevel?: 'hot' | 'warm' | 'cold' | 'moderate';
  propertyType?: string;
  budget?: string;
  location?: string;
  notes?: string;
  source?: string;
  status: string;
  columnId: string;
  tags?: string[];
  image?: string;
  profileImage?: string;
  createdAt: string;
  lastContact?: string;
  nextFollowUp?: string;
}

interface ActivityLog {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'note' | 'status_change';
  description: string;
  timestamp: string;
  user?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface LinkedProperty {
  id: string;
  title: string;
  type: string;
  price: string;
  location: string;
  status: 'active' | 'sold' | 'rented';
}

interface CustomerDetailsPageProps {
  customer: Customer;
  onBack: () => void;
  onUpdate: (customer: Customer) => void;
}

// Mock activity logs
const mockActivityLogs: ActivityLog[] = [
  { id: '1', type: 'call', description: 'اتصال للاستفسار عن الفلل المتاحة', timestamp: '2024-01-20 10:30', user: 'أحمد' },
  { id: '2', type: 'whatsapp', description: 'إرسال صور لعقار جديد', timestamp: '2024-01-19 14:00', user: 'أحمد' },
  { id: '3', type: 'meeting', description: 'معاينة فيلا في حي النرجس', timestamp: '2024-01-18 09:00', user: 'أحمد' },
  { id: '4', type: 'note', description: 'العميل يفضل الطابق الأرضي', timestamp: '2024-01-17 16:30', user: 'أحمد' },
  { id: '5', type: 'status_change', description: 'تم نقل العميل إلى مرحلة التفاوض', timestamp: '2024-01-16 11:00', user: 'النظام' },
];

// Mock tasks
const mockTasks: Task[] = [
  { id: '1', title: 'متابعة العرض المقدم', description: 'الاتصال للاستفسار عن قرار العميل', dueDate: '2024-01-25', status: 'pending', priority: 'high' },
  { id: '2', title: 'إرسال عقد إيجار', description: 'تجهيز وإرسال العقد للتوقيع', dueDate: '2024-01-22', status: 'completed', priority: 'medium' },
  { id: '3', title: 'تحديث بيانات العميل', dueDate: '2024-01-28', status: 'pending', priority: 'low' },
];

// Mock reminders
const mockReminders: Reminder[] = [
  { id: '1', title: 'اتصال عاجل للتأكيد', description: 'الاتصال بالعميل لتأكيد موعد توقيع العقد غداً', date: '2024-01-19', completed: false, priority: 'high' },
  { id: '2', title: 'إرسال تفاصيل التأمين', description: 'إرسال عروض التأمين من الشركات المختلفة للعقار', date: '2024-01-21', completed: false, priority: 'medium' },
  { id: '3', title: 'تجهيز أوراق البنك', description: 'تجميع وتجهيز جميع الأوراق المطلوبة للتمويل البنكي', date: '2024-01-18', completed: true, priority: 'medium' },
  { id: '4', title: 'جدولة المعاينة النهائية', description: 'ترتيب موعد المعاينة النهائية للعقار مع خبير التقييم', date: '2024-01-25', completed: false, priority: 'low' },
];

// Mock linked properties
const mockLinkedProperties: LinkedProperty[] = [
  { id: '1', title: 'فيلا مودرن في حي النرجس', type: 'فيلا', price: '2,500,000 ريال', location: 'الرياض - النرجس', status: 'active' },
  { id: '2', title: 'شقة 3 غرف في العليا', type: 'شقة', price: '850,000 ريال', location: 'الرياض - العليا', status: 'sold' },
];

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  'buyer': 'مشتري',
  'seller': 'بائع',
  'renter': 'مستأجر',
  'owner': 'مالك',
  'investor': 'مستثمر',
  'other': 'آخر',
};

const INTEREST_LEVEL_LABELS: Record<string, { text: string; icon: string; color: string }> = {
  'hot': { text: 'ساخن', icon: '🔥', color: 'bg-red-100 text-red-700' },
  'warm': { text: 'دافئ', icon: '☀️', color: 'bg-orange-100 text-orange-700' },
  'moderate': { text: 'متوسط', icon: '🌤️', color: 'bg-blue-100 text-blue-700' },
  'cold': { text: 'بارد', icon: '❄️', color: 'bg-gray-100 text-gray-700' },
};

const ACTIVITY_TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  'call': { icon: Phone, color: 'bg-green-100 text-green-600' },
  'whatsapp': { icon: MessageSquare, color: 'bg-green-100 text-green-600' },
  'email': { icon: Mail, color: 'bg-blue-100 text-blue-600' },
  'meeting': { icon: Calendar, color: 'bg-purple-100 text-purple-600' },
  'note': { icon: FileText, color: 'bg-yellow-100 text-yellow-600' },
  'status_change': { icon: Activity, color: 'bg-gray-100 text-gray-600' },
};

export default function CustomerDetailsPage({ customer, onBack, onUpdate }: CustomerDetailsPageProps) {
  // استخدام التبويب من بيانات العميل إذا تم تحديده (مثلاً من المساعد الذكي)
  const initialTab = (customer as any).activeTab || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer>(customer);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [linkedProperties, setLinkedProperties] = useState<LinkedProperty[]>(mockLinkedProperties);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'medium' });
  const [newReminder, setNewReminder] = useState({ title: '', description: '', date: '', priority: 'medium' });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality - saves after 2 seconds of inactivity
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    setHasUnsavedChanges(true);
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (isEditing) {
        setIsSaving(true);
        onUpdate(editedCustomer);
        
        setTimeout(() => {
          setIsSaving(false);
          setHasUnsavedChanges(false);
          toast.success('تم الحفظ تلقائياً', { duration: 1500 });
        }, 500);
      }
    }, 2000);
  }, [editedCustomer, isEditing, onUpdate]);

  // Trigger auto-save when edited customer changes
  useEffect(() => {
    if (isEditing && editedCustomer !== customer) {
      triggerAutoSave();
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editedCustomer, isEditing, customer, triggerAutoSave]);

  // Handle delete customer
  const handleDeleteCustomer = () => {
    setShowDeleteConfirm(true);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = () => {
    // TODO: Implement actual delete logic with backend
    toast.success('تم حذف العميل بنجاح');
    setShowDeleteConfirm(false);
    onBack();
  };

  // Handle save (manual)
  const handleSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    onUpdate(editedCustomer);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    toast.success('تم حفظ التغييرات بنجاح');
  };

  // Handle add note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: ActivityLog = {
      id: Date.now().toString(),
      type: 'note',
      description: newNote,
      timestamp: new Date().toLocaleString('ar-SA'),
      user: 'أنت',
    };
    
    setActivityLogs([note, ...activityLogs]);
    setNewNote('');
    setShowAddNote(false);
    toast.success('تم إضافة الملاحظة');
  };

  // Handle add task
  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate,
      status: 'pending',
      priority: newTask.priority as Task['priority'],
    };
    
    setTasks([task, ...tasks]);
    setNewTask({ title: '', description: '', dueDate: '', priority: 'medium' });
    setShowAddTask(false);
    toast.success('تم إضافة المهمة');
  };

  // Toggle task status
  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  // Handle add reminder
  const handleAddReminder = () => {
    if (!newReminder.title.trim()) return;
    
    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      description: newReminder.description,
      date: newReminder.date,
      completed: false,
      priority: newReminder.priority as Reminder['priority'],
    };
    
    setReminders([reminder, ...reminders]);
    setNewReminder({ title: '', description: '', date: '', priority: 'medium' });
    setShowAddReminder(false);
    toast.success('تم إضافة التذكير');
  };

  // Toggle reminder status
  const toggleReminderStatus = (reminderId: string) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, completed: !reminder.completed }
        : reminder
    ));
  };

  const interestLevel = INTEREST_LEVEL_LABELS[customer.interestLevel || 'moderate'];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] border-b-4 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-2 border-[#D4AF37] bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">تفاصيل العميل</h1>
              
              {/* Auto-save indicator */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  {isSaving ? (
                    <span className="text-xs text-[#D4AF37] flex items-center gap-1 animate-pulse">
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-ping"></div>
                      جاري الحفظ...
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span className="text-xs text-yellow-300 flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                      تغييرات غير محفوظة
                    </span>
                  ) : (
                    <span className="text-xs text-green-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      محفوظ
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={() => {
                      if (autoSaveTimeoutRef.current) {
                        clearTimeout(autoSaveTimeoutRef.current);
                      }
                      setEditedCustomer(customer);
                      setIsEditing(false);
                      setHasUnsavedChanges(false);
                    }}
                    variant="outline"
                    className="border-[#D4AF37] text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4 ml-1" />
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-[#D4AF37] text-[#01411C] hover:bg-[#f1c40f]"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 ml-1" />
                    حفظ
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-[#D4AF37] text-white hover:bg-white/20"
                >
                  <Edit className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Customer Profile Card */}
      <div className="container mx-auto px-4 py-6">
        <Card className="border-2 border-[#D4AF37] bg-gradient-to-r from-white to-[#f0fdf4] shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-[#D4AF37] shadow-lg">
                {customer.profileImage && <AvatarImage src={customer.profileImage} />}
                <AvatarFallback className="bg-[#01411C] text-white text-2xl font-bold">
                  {customer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-[#01411C]">{customer.name}</h2>
                  <Badge className={interestLevel.color}>
                    {interestLevel.icon} {interestLevel.text}
                  </Badge>
                  <Badge variant="outline" className="text-[#01411C] border-[#01411C]">
                    {CUSTOMER_TYPE_LABELS[customer.type || 'other']}
                  </Badge>
                </div>

                {customer.company && (
                  <p className="text-gray-600 mb-2 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {customer.company}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-[#01411C]" />
                    <span dir="ltr">{customer.phone}</span>
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-[#01411C]" />
                      {customer.email}
                    </span>
                  )}
                  {customer.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#01411C]" />
                      {customer.location}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(`https://wa.me/${customer.phone}`, '_blank')}
                >
                  <MessageSquare className="w-4 h-4 ml-2" />
                  واتساب
                </Button>
                <Button
                  className="bg-[#01411C] hover:bg-[#065f41]"
                  onClick={() => window.location.href = `tel:${customer.phone}`}
                >
                  <Phone className="w-4 h-4 ml-2" />
                  اتصال
                </Button>
                <Button
                  variant="outline"
                  className="border-[#D4AF37]"
                  onClick={() => toast.info('سيتم فتح نموذج جدولة موعد')}
                >
                  <Calendar className="w-4 h-4 ml-2" />
                  جدولة موعد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 md:grid-cols-11 w-full bg-white border-2 border-[#D4AF37] mb-4">
            <TabsTrigger value="overview" className="text-xs">📊 نظرة شاملة</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">💬 التفاعلات</TabsTrigger>
            <TabsTrigger value="reminders" className="text-xs">⏰ التذكيرات</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">📈 التحليلات</TabsTrigger>
            <TabsTrigger value="properties" className="text-xs">العقارات</TabsTrigger>
            <TabsTrigger value="rented" className="text-xs">🏠 عقار مؤجر</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">المهام</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">الملاحظات</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">المستندات</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">السجل</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">الإعدادات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* إحصائيات سريعة - Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {activityLogs.length}
                    </div>
                    <div className="text-sm text-gray-600">التفاعلات</div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {linkedProperties.length}
                    </div>
                    <div className="text-sm text-gray-600">العقارات</div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {customer.tags?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">العلامات</div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {reminders.filter(r => !r.completed).length}
                    </div>
                    <div className="text-sm text-gray-600">تذكيرات نشطة</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      <User className="w-5 h-5" />
                      المعلومات الأساسية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label>الاسم</Label>
                          <Input
                            value={editedCustomer.name}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>الجوال</Label>
                          <Input
                            value={editedCustomer.phone}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <Label>البريد الإلكتروني</Label>
                          <Input
                            value={editedCustomer.email || ''}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <Label>الشركة</Label>
                          <Input
                            value={editedCustomer.company || ''}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, company: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">الاسم</span>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">الجوال</span>
                          <span className="font-medium" dir="ltr">{customer.phone}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">البريد الإلكتروني</span>
                          <span className="font-medium">{customer.email || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">الشركة</span>
                          <span className="font-medium">{customer.company || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">المصدر</span>
                          <span className="font-medium">{customer.source || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">تاريخ الإضافة</span>
                          <span className="font-medium">{customer.createdAt}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* التفضيلات والمتطلبات */}
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      التفضيلات والمتطلبات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label>نوع العقار</Label>
                          <Input
                            value={editedCustomer.propertyType || ''}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, propertyType: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>الميزانية</Label>
                          <Input
                            value={editedCustomer.budget || ''}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, budget: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>الموقع المطلوب</Label>
                          <Input
                            value={editedCustomer.location || ''}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, location: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">نوع العقار المفضل</span>
                          <span className="font-medium">{customer.propertyType || 'شقة سكنية'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">الميزانية</span>
                          <span className="font-medium text-[#01411C]">{customer.budget || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">الموقع المطلوب</span>
                          <span className="font-medium">{customer.location || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">عدد الغرف</span>
                          <span className="font-medium">3-4 غرف</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">المساحة المطلوبة</span>
                          <span className="font-medium">150-200 متر مربع</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* سجل الزيارات */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    سجل الزيارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">شقة في حي الياسمين</div>
                        <div className="text-sm text-gray-600">4 غرف، 180 متر</div>
                      </div>
                      <div className="text-sm text-gray-500">2024-01-12</div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium">فيلا في حي النرجس</div>
                        <div className="text-sm text-gray-600">5 غرف، 350 متر</div>
                      </div>
                      <div className="text-sm text-gray-500">2024-01-08</div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-medium">شقة في حي الملقا</div>
                        <div className="text-sm text-gray-600">3 غرف، 140 متر</div>
                      </div>
                      <div className="text-sm text-gray-500">2024-01-05</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* تقييم العميل */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    تقييم العميل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">9.2</div>
                      <div className="text-sm text-gray-600">جدية الشراء</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">8.7</div>
                      <div className="text-sm text-gray-600">سهولة التعامل</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600 mb-1">9.5</div>
                      <div className="text-sm text-gray-600">الالتزام بالمواعيد</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes & Tags */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      ملاحظات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editedCustomer.notes || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, notes: e.target.value })}
                        rows={4}
                      />
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        {customer.notes || 'لا توجد ملاحظات'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* العلامات */}
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      العلامات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {customer.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="bg-green-50">مهتم بالشراء</Badge>
                      <Badge variant="outline" className="bg-yellow-50">يفضل الدفع النقدي</Badge>
                      <Badge variant="outline" className="bg-purple-50">عميل VIP</Badge>
                      <Badge variant="outline" className="bg-red-50">يحتاج متابعة</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  سجل النشاطات
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddNote(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة ملاحظة
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {activityLogs.map((log) => {
                      const activityType = ACTIVITY_TYPE_ICONS[log.type];
                      const Icon = activityType.icon;
                      return (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-full ${activityType.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800">{log.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{log.timestamp}</span>
                              {log.user && (
                                <>
                                  <span>•</span>
                                  <span>{log.user}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  العقارات المرتبطة
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  ربط عقار
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {linkedProperties.map((property) => (
                    <Card key={property.id} className="border">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-[#01411C]">{property.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span>{property.type}</span>
                            <span>•</span>
                            <span>{property.location}</span>
                            <span>•</span>
                            <span className="font-medium text-[#D4AF37]">{property.price}</span>
                          </div>
                        </div>
                        <Badge className={property.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {property.status === 'active' ? 'نشط' : property.status === 'sold' ? 'مباع' : 'مؤجر'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {linkedProperties.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد عقارات مرتبطة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rented Properties Tab - تبويب عقار مؤجر */}
          <TabsContent value="rented">
            <Card className="border-2 border-[#D4AF37]">
              <CardHeader className="bg-gradient-to-r from-[#01411C]/5 to-[#D4AF37]/5">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  العقارات المؤجرة للمالك
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Mock rented properties for this owner */}
                <div className="space-y-4">
                  {/* Rented Property 1 */}
                  <div className="p-4 border-2 border-emerald-200 rounded-lg bg-emerald-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">فيلا في حي النرجس</h4>
                          <Badge className="bg-emerald-500 text-white">نشط</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            الرياض - حي النرجس
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            المستأجر: خالد سعيد
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            بداية العقد: 2024-01-15
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-red-500" />
                            نهاية العقد: 2025-01-15
                          </span>
                          <span className="text-emerald-600 font-bold">
                            المتبقي: 32 يوم
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] font-bold text-lg">8,000 ريال/شهر</span>
                          <span className="text-gray-500">| مدة العقد: 12 شهر</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="border-[#01411C] text-[#01411C]">
                          <FileText className="w-4 h-4 ml-1" />
                          عرض العقد
                        </Button>
                        <Button size="sm" className="bg-[#01411C]">
                          <Send className="w-4 h-4 ml-1" />
                          إرسال تنبيه
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Rented Property 2 */}
                  <div className="p-4 border-2 border-amber-200 rounded-lg bg-amber-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">شقة في حي العليا</h4>
                          <Badge className="bg-amber-500 text-white animate-pulse">ينتهي قريباً</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            الرياض - حي العليا
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            المستأجر: أحمد فهد
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            بداية العقد: 2023-12-01
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-red-500" />
                            نهاية العقد: 2024-12-01
                          </span>
                          <span className="text-amber-600 font-bold">
                            المتبقي: 15 يوم
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] font-bold text-lg">4,500 ريال/شهر</span>
                          <span className="text-gray-500">| مدة العقد: 12 شهر</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="border-[#01411C] text-[#01411C]">
                          <FileText className="w-4 h-4 ml-1" />
                          عرض العقد
                        </Button>
                        <Button size="sm" variant="destructive">
                          <AlertTriangle className="w-4 h-4 ml-1" />
                          إشعار عاجل
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Rented Property 3 - Expired */}
                  <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">مكتب تجاري في طريق الملك فهد</h4>
                          <Badge className="bg-red-500 text-white">منتهي</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            الرياض - طريق الملك فهد
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            المستأجر: شركة الأمل للتجارة
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            بداية العقد: 2023-12-01
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <Calendar className="w-4 h-4" />
                            انتهى في: 2024-12-01
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] font-bold text-lg">15,000 ريال/شهر</span>
                          <span className="text-gray-500">| مدة العقد: 12 شهر</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          تجديد العقد
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-500">
                          إخلاء العقار
                        </Button>
                        <Button size="sm" variant="outline">
                          طلب مهلة
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600">3</div>
                      <div className="text-sm text-gray-600">إجمالي العقارات</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">1</div>
                      <div className="text-sm text-gray-600">عقود نشطة</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">1</div>
                      <div className="text-sm text-gray-600">تنتهي قريباً</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#D4AF37]/10 border-[#D4AF37]">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">27,500</div>
                      <div className="text-sm text-gray-600">إجمالي الإيجار الشهري</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  المهام
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddTask(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  مهمة جديدة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-500">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>
                      </div>
                      <Badge className={
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </Badge>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد مهام</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab - تبويب التذكيرات */}
          <TabsContent value="reminders">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  إدارة التذكيرات والمهام
                </CardTitle>
                <Button size="sm" className="bg-[#01411C] hover:bg-[#065f41]" onClick={() => setShowAddReminder(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  تذكير جديد
                </Button>
              </CardHeader>
              <CardContent>
                {reminders.length > 0 ? (
                  <div className="space-y-3">
                    {reminders.map((reminder) => (
                      <Card
                        key={reminder.id}
                        className={`${
                          reminder.completed
                            ? 'border-green-300 bg-green-50/50'
                            : reminder.priority === 'high'
                            ? 'border-red-300 bg-red-50/50'
                            : reminder.priority === 'medium'
                            ? 'border-orange-300 bg-orange-50/50'
                            : 'border-blue-300 bg-blue-50/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className={`font-medium ${
                                reminder.completed ? 'line-through text-gray-500' : 'text-[#01411C]'
                              }`}>
                                {reminder.title}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {reminder.date}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    reminder.completed
                                      ? 'bg-green-100 text-green-700'
                                      : reminder.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : reminder.priority === 'medium'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {reminder.completed ? 'مكتمل' : reminder.priority === 'high' ? 'عاجل' : reminder.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 ${
                                  reminder.completed
                                    ? 'text-green-600 hover:bg-green-50'
                                    : reminder.priority === 'high'
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-orange-600 hover:bg-orange-50'
                                }`}
                                onClick={() => toggleReminderStatus(reminder.id)}
                              >
                                {reminder.completed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">لا توجد تذكيرات حالياً</p>
                    <Button variant="outline" className="border-[#D4AF37] text-[#01411C]" onClick={() => setShowAddReminder(true)}>
                      إضافة أول تذكير
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab - تبويب التحليلات */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#01411C]">تحليلات العميل</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">نشاط العميل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">85%</div>
                      <div className="text-xs text-gray-600">معدل التفاعل</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">احتمالية الإغلاق</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">72%</div>
                      <div className="text-xs text-gray-600">بناءً على النشاط</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">قيمة العميل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">2.4M</div>
                      <div className="text-xs text-gray-600">ريال سعودي</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm">مدة المتابعة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">45</div>
                      <div className="text-xs text-gray-600">يوم</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* تحليل سلوك العميل */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#01411C]" />
                    تحليل سلوك العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-gray-600">مكالمات هاتفية</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-sm text-gray-600">رسائل واتساب</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">5</div>
                      <div className="text-sm text-gray-600">زيارات ميدانية</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* الأهداف والإنجازات */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#01411C]" />
                    الأهداف والإنجازات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>هدف الإغلاق الشهري</span>
                      <span className="text-green-600 font-bold">75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>التفاعل مع العميل</span>
                      <span className="text-blue-600 font-bold">90%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>جودة المتابعة</span>
                      <span className="text-purple-600 font-bold">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* التوقعات المستقبلية */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#01411C]" />
                    التوقعات المستقبلية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-lg font-bold text-yellow-700 mb-2">
                        احتمالية الشراء خلال 30 يوم
                      </div>
                      <div className="text-3xl font-bold text-yellow-600">68%</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-lg font-bold text-red-700 mb-2">
                        مخاطر فقدان العميل
                      </div>
                      <div className="text-3xl font-bold text-red-600">15%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الملاحظات
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddNote(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  ملاحظة جديدة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLogs.filter(l => l.type === 'note').map((note) => (
                    <div key={note.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-gray-800">{note.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{note.timestamp}</span>
                        {note.user && <span>- {note.user}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  المستندات
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  رفع مستند
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد مستندات</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <History className="w-5 h-5" />
                  سجل التغييرات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLogs.filter(l => l.type === 'status_change').map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-gray-800">{log.description}</p>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-[#01411C] flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  الإعدادات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-red-700">حذف العميل</p>
                    <p className="text-sm text-red-500">حذف العميل وجميع بياناته نهائياً</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDeleteCustomer}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">أرشفة العميل</p>
                    <p className="text-sm text-gray-500">نقل العميل للأرشيف</p>
                  </div>
                  <Button variant="outline" size="sm">
                    أرشفة
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">مشاركة بطاقة العميل</p>
                    <p className="text-sm text-gray-500">إنشاء رابط لمشاركة بيانات العميل</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 ml-1" />
                    مشاركة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* أزرار الإجراءات - مثبتة في الأسفل */}
      <div className="sticky bottom-0 border-t-2 border-[#D4AF37] bg-gradient-to-r from-gray-50 to-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-[#D4AF37]"
            >
              <Edit className="w-4 h-4 ml-1" />
              تعديل
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(customer, null, 2));
                toast.success('تم نسخ بيانات العميل');
              }}
            >
              <FileText className="w-4 h-4 ml-1" />
              نسخ
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.info('سيتم فتح نموذج المشاركة')}
            >
              <Share2 className="w-4 h-4 ml-1" />
              مشاركة
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              إغلاق
            </Button>
            <Button 
              className="bg-[#01411C] hover:bg-[#065f41]"
              onClick={() => window.location.href = `tel:${customer.phone}`}
            >
              <Phone className="w-4 h-4 ml-1" />
              اتصال فوري
            </Button>
          </div>
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة ملاحظة</DialogTitle>
          </DialogHeader>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="اكتب ملاحظتك هنا..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNote(false)}>إلغاء</Button>
            <Button onClick={handleAddNote} className="bg-[#01411C]">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مهمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان المهمة *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div>
              <Label>تاريخ الاستحقاق</Label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>إلغاء</Button>
            <Button onClick={handleAddTask} className="bg-[#01411C]">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddReminder} onOpenChange={setShowAddReminder}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة تذكير</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان التذكير *</Label>
              <Input
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                placeholder="مثال: متابعة العميل"
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                placeholder="تفاصيل التذكير..."
              />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
              />
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={newReminder.priority} onValueChange={(v) => setNewReminder({ ...newReminder, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عاجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddReminder(false)}>إلغاء</Button>
            <Button onClick={handleAddReminder} className="bg-[#01411C]">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              تأكيد حذف العميل
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العميل "{customer.name}"؟
              <br />
              <span className="text-red-500 font-medium">
                هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بيانات العميل نهائياً.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
