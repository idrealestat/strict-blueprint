'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isBefore, addHours } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, Clock, MapPin, User, Phone, MessageCircle,
  Plus, ChevronLeft, ChevronRight, Bell, X, Check, Edit2, Trash2,
  Video, Home, Building2, MoreVertical, Filter, Search, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerNotification } from '@/hooks/useNotificationSystem';
import CalendarTabs from '../CalendarTabs';

// Types
interface Appointment {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  date: Date;
  time: string;
  duration: number; // in minutes
  type: 'viewing' | 'meeting' | 'call' | 'video' | 'contract' | 'other';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  propertyId?: string;
  propertyTitle?: string;
  notes?: string;
  reminder: boolean;
  reminderTime: number; // minutes before
}

interface TimeSlot {
  time: string;
  available: boolean;
}

// ✅ تم إزالة البيانات الوهمية - يتم جلب المواعيد من قاعدة البيانات الحقيقية
const mockAppointments: Appointment[] = [];

const appointmentTypes = [
  { value: 'viewing', label: 'معاينة عقار', icon: Home, color: 'bg-blue-500' },
  { value: 'meeting', label: 'اجتماع', icon: Users, color: 'bg-green-500' },
  { value: 'call', label: 'مكالمة', icon: Phone, color: 'bg-yellow-500' },
  { value: 'video', label: 'مكالمة فيديو', icon: Video, color: 'bg-purple-500' },
  { value: 'contract', label: 'توقيع عقد', icon: Building2, color: 'bg-red-500' },
  { value: 'other', label: 'أخرى', icon: CalendarIcon, color: 'bg-gray-500' },
];

const statusOptions = [
  { value: 'scheduled', label: 'مجدول', color: 'bg-blue-100 text-blue-800' },
  { value: 'confirmed', label: 'مؤكد', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'مكتمل', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-800' },
  { value: 'rescheduled', label: 'معاد جدولته', color: 'bg-yellow-100 text-yellow-800' },
];

const timeSlots: string[] = [];
for (let hour = 8; hour <= 20; hour++) {
  timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
}

// Interface for linked customer
interface LinkedCustomer {
  id: string;
  name: string;
  phone: string;
}

interface CalendarAppointmentsProps {
  onBack?: () => void;
  linkedCustomer?: LinkedCustomer | null;
}

export function CalendarAppointments({ onBack, linkedCustomer }: CalendarAppointmentsProps) {
  // تحميل المواعيد من localStorage (بما في ذلك مواعيد المعاينة من صفحة العروض)
  const loadAppointmentsFromStorage = (): Appointment[] => {
    try {
      // المواعيد الأساسية
      const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      
      // مواعيد المعاينة من صفحة العروض
      const viewingAppointments = JSON.parse(localStorage.getItem('calendar_appointments') || '[]');
      
      // تحويل مواعيد المعاينة للشكل المطلوب
      const convertedViewings: Appointment[] = viewingAppointments.map((apt: any) => ({
        id: apt.id,
        title: apt.title || `معاينة: ${apt.propertyTitle}`,
        customerName: apt.clientName,
        customerPhone: apt.clientPhone,
        date: new Date(apt.date),
        time: apt.time?.replace(' ص', '').replace(' م', '') || '10:00',
        duration: 60,
        type: 'viewing' as const,
        status: apt.status === 'مؤكد' ? 'confirmed' as const : 'scheduled' as const,
        location: apt.propertyLocation,
        propertyTitle: apt.propertyTitle,
        notes: apt.notes,
        reminder: true,
        reminderTime: 30,
      }));
      
      // دمج جميع المواعيد مع إزالة التكرار بناءً على المعرف
      const allAppointments = [...mockAppointments, ...savedAppointments, ...convertedViewings];
      const uniqueAppointments = allAppointments.reduce((acc: Appointment[], current) => {
        const exists = acc.find(apt => apt.id === current.id);
        if (!exists) acc.push(current);
        return acc;
      }, []);
      
      return uniqueAppointments;
    } catch (e) {
      console.error('Error loading appointments:', e);
      return []; // ✅ حالة "أول استخدام" - لا بيانات وهمية
    }
  };

  const [appointments, setAppointments] = useState<Appointment[]>(loadAppointmentsFromStorage);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New appointment form state
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    title: '',
    customerName: '',
    customerPhone: '',
    date: new Date(),
    time: '10:00',
    duration: 60,
    type: 'viewing',
    status: 'scheduled',
    reminder: true,
    reminderTime: 30,
  });

  // Open add dialog with linked customer if provided
  useEffect(() => {
    if (linkedCustomer) {
      setNewAppointment(prev => ({
        ...prev,
        title: `موعد معاينة مع ${linkedCustomer.name}`,
        customerName: linkedCustomer.name,
        customerPhone: linkedCustomer.phone,
      }));
      setIsAddDialogOpen(true);
    }
  }, [linkedCustomer]);

  // استمع لأحداث إنشاء موعد من CRM
  useEffect(() => {
    const handleCreateAppointmentFromCRM = (event: CustomEvent) => {
      const { customerName, customerPhone } = event.detail;
      setNewAppointment(prev => ({
        ...prev,
        title: `موعد مع ${customerName}`,
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        date: new Date(),
        time: '10:00',
      }));
      setIsAddDialogOpen(true);
    };

    window.addEventListener('createAppointmentFromCRM', handleCreateAppointmentFromCRM as EventListener);
    return () => {
      window.removeEventListener('createAppointmentFromCRM', handleCreateAppointmentFromCRM as EventListener);
    };
  }, []);

  // Get week days
  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.title.includes(searchQuery) || 
                          apt.customerName.includes(searchQuery);
    const matchesType = filterType === 'all' || apt.type === filterType;
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(apt => isSameDay(new Date(apt.date), date));
  };

  // Today's appointments
  const todayAppointments = getAppointmentsForDate(new Date());
  const upcomingAppointments = filteredAppointments
    .filter(apt => !isBefore(new Date(apt.date), new Date()))
    .slice(0, 5);

  // Handle create appointment
  const handleCreateAppointment = () => {
    if (!newAppointment.title || !newAppointment.customerName) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      title: newAppointment.title!,
      customerName: newAppointment.customerName!,
      customerPhone: newAppointment.customerPhone || '',
      date: newAppointment.date || new Date(),
      time: newAppointment.time || '10:00',
      duration: newAppointment.duration || 60,
      type: (newAppointment.type as Appointment['type']) || 'viewing',
      status: 'scheduled',
      location: newAppointment.location,
      propertyTitle: newAppointment.propertyTitle,
      notes: newAppointment.notes,
      reminder: newAppointment.reminder ?? true,
      reminderTime: newAppointment.reminderTime || 30,
    };

    const updatedAppointments = [...appointments, appointment];
    setAppointments(updatedAppointments);
    
    // Save to localStorage for notification system
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    
    // Trigger notification
    triggerNotification({
      title: '📅 موعد جديد',
      message: `تم إضافة موعد "${appointment.title}" مع ${appointment.customerName}`,
      type: 'success',
      category: 'appointment',
    });

    setIsAddDialogOpen(false);
    setNewAppointment({
      title: '',
      customerName: '',
      customerPhone: '',
      date: new Date(),
      time: '10:00',
      duration: 60,
      type: 'viewing',
      status: 'scheduled',
      reminder: true,
      reminderTime: 30,
    });
    toast.success('تم إضافة الموعد بنجاح');
  };

  // Save appointments to localStorage for notification system
  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Handle delete appointment
  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
    setSelectedAppointment(null);
    toast.success('تم حذف الموعد');
  };

  // Handle status change
  const handleStatusChange = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status } : apt
    ));
    toast.success('تم تحديث حالة الموعد');
  };

  const getTypeInfo = (type: string) => {
    return appointmentTypes.find(t => t.value === type) || appointmentTypes[5];
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4 ml-2" />
                رجوع
              </Button>
            )}
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-[#D4AF37]" />
              التقويم والمواعيد
            </h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/90">
                  <Plus className="h-4 w-4 ml-2" />
                  موعد جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-right">إضافة موعد جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="mb-2 block">عنوان الموعد *</Label>
                    <Input
                      value={newAppointment.title}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="مثال: معاينة فيلا حي النرجس"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">اسم العميل *</Label>
                      <Input
                        value={newAppointment.customerName}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="اسم العميل"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">رقم الجوال</Label>
                      <Input
                        value={newAppointment.customerPhone}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+966501234567"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">التاريخ *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {newAppointment.date ? format(newAppointment.date, 'PPP', { locale: ar }) : 'اختر التاريخ'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newAppointment.date}
                            onSelect={(date) => setNewAppointment(prev => ({ ...prev, date: date || new Date() }))}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className="mb-2 block">الوقت *</Label>
                      <Select
                        value={newAppointment.time}
                        onValueChange={(value) => setNewAppointment(prev => ({ ...prev, time: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوقت" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">نوع الموعد</Label>
                      <Select
                        value={newAppointment.type}
                        onValueChange={(value) => setNewAppointment(prev => ({ ...prev, type: value as Appointment['type'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block">المدة (دقيقة)</Label>
                      <Select
                        value={newAppointment.duration?.toString()}
                        onValueChange={(value) => setNewAppointment(prev => ({ ...prev, duration: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المدة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 دقيقة</SelectItem>
                          <SelectItem value="30">30 دقيقة</SelectItem>
                          <SelectItem value="45">45 دقيقة</SelectItem>
                          <SelectItem value="60">ساعة</SelectItem>
                          <SelectItem value="90">ساعة ونصف</SelectItem>
                          <SelectItem value="120">ساعتين</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">الموقع</Label>
                    <Input
                      value={newAppointment.location}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="عنوان الموقع"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">العقار المرتبط</Label>
                    <Input
                      value={newAppointment.propertyTitle}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, propertyTitle: e.target.value }))}
                      placeholder="اسم أو رقم العقار"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">ملاحظات</Label>
                    <Textarea
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="أي ملاحظات إضافية..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button 
                      onClick={handleCreateAppointment}
                      className="bg-[#01411C] hover:bg-[#01411C]/90"
                    >
                      <Check className="h-4 w-4 ml-2" />
                      حفظ الموعد
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ملخص التقويم - 9 تبويبات (برومبت التقويم والمواعيد) */}
      <div className="container mx-auto p-6">
        <CalendarTabs />
      </div>


      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right flex items-center justify-between">
                  <span>{selectedAppointment.title}</span>
                  <Badge className={getStatusInfo(selectedAppointment.status).color}>
                    {getStatusInfo(selectedAppointment.status).label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-[#01411C]" />
                  <span>{format(new Date(selectedAppointment.date), 'EEEE، d MMMM yyyy', { locale: ar })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-[#01411C]" />
                  <span>{selectedAppointment.time} ({selectedAppointment.duration} دقيقة)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-[#01411C]" />
                  <span>{selectedAppointment.customerName}</span>
                </div>
                {selectedAppointment.customerPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-[#01411C]" />
                    <span dir="ltr">{selectedAppointment.customerPhone}</span>
                  </div>
                )}
                {selectedAppointment.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-[#01411C]" />
                    <span>{selectedAppointment.location}</span>
                  </div>
                )}
                {selectedAppointment.propertyTitle && (
                  <div className="flex items-center gap-3 text-sm">
                    <Home className="h-4 w-4 text-[#01411C]" />
                    <span>{selectedAppointment.propertyTitle}</span>
                  </div>
                )}
                {selectedAppointment.notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}
                  >
                    <Check className="h-4 w-4 ml-1" />
                    تأكيد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}
                  >
                    <Check className="h-4 w-4 ml-1" />
                    مكتمل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                  >
                    <X className="h-4 w-4 ml-1" />
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalendarAppointments;
