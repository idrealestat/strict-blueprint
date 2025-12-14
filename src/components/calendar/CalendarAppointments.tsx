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

// Mock data
const mockAppointments: Appointment[] = [
  {
    id: '1',
    title: 'معاينة فيلا الياسمين',
    customerName: 'أحمد محمد السعيد',
    customerPhone: '+966501234567',
    date: new Date(),
    time: '10:00',
    duration: 60,
    type: 'viewing',
    status: 'confirmed',
    location: 'حي الياسمين، الرياض',
    propertyTitle: 'فيلا فاخرة 400 م²',
    notes: 'العميل مهتم جداً، يرجى التأكد من جاهزية العقار',
    reminder: true,
    reminderTime: 30,
  },
  {
    id: '2',
    title: 'اجتماع توقيع العقد',
    customerName: 'سارة أحمد العمري',
    customerPhone: '+966551234567',
    date: new Date(),
    time: '14:00',
    duration: 90,
    type: 'contract',
    status: 'scheduled',
    location: 'مكتب الشركة',
    notes: 'إحضار جميع المستندات المطلوبة',
    reminder: true,
    reminderTime: 60,
  },
  {
    id: '3',
    title: 'مكالمة متابعة',
    customerName: 'خالد عبدالله',
    customerPhone: '+966551234567',
    date: addDays(new Date(), 1),
    time: '11:00',
    duration: 30,
    type: 'call',
    status: 'scheduled',
    reminder: true,
    reminderTime: 15,
  },
  {
    id: '4',
    title: 'جولة افتراضية',
    customerName: 'فهد السالم',
    customerPhone: '+966501234567',
    date: addDays(new Date(), 2),
    time: '16:00',
    duration: 45,
    type: 'video',
    status: 'confirmed',
    propertyTitle: 'شقة فاخرة النرجس',
    reminder: true,
    reminderTime: 30,
  },
];

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
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
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

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Mini Calendar */}
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="pointer-events-auto"
                  locale={ar}
                />
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#01411C]" />
                  مواعيد اليوم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map(apt => {
                    const typeInfo = getTypeInfo(apt.type);
                    return (
                      <div
                        key={apt.id}
                        className="p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setSelectedAppointment(apt)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("w-2 h-2 rounded-full", typeInfo.color)} />
                          <span className="text-sm font-medium">{apt.time}</span>
                        </div>
                        <p className="text-sm truncate">{apt.title}</p>
                        <p className="text-xs text-muted-foreground">{apt.customerName}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد مواعيد اليوم
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#01411C]" />
                  التصفية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs mb-1 block">نوع الموعد</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {appointmentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">الحالة</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Calendar View */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedDate(prev => addDays(prev, -7))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">
                      {format(selectedDate, 'MMMM yyyy', { locale: ar })}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedDate(prev => addDays(prev, 7))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      اليوم
                    </Button>
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                      <TabsList className="h-8">
                        <TabsTrigger value="day" className="text-xs px-3">يوم</TabsTrigger>
                        <TabsTrigger value="week" className="text-xs px-3">أسبوع</TabsTrigger>
                        <TabsTrigger value="month" className="text-xs px-3">شهر</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Week View */}
                {viewMode === 'week' && (
                  <div className="grid grid-cols-7 divide-x divide-x-reverse">
                    {getWeekDays().map((day, index) => {
                      const dayAppointments = getAppointmentsForDate(day);
                      const isCurrentDay = isToday(day);
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            "min-h-[400px] p-2",
                            isCurrentDay && "bg-[#01411C]/5"
                          )}
                        >
                          <div className={cn(
                            "text-center mb-2 p-2 rounded-lg",
                            isCurrentDay && "bg-[#01411C] text-white"
                          )}>
                            <p className="text-xs">{format(day, 'EEEE', { locale: ar })}</p>
                            <p className="text-lg font-bold">{format(day, 'd')}</p>
                          </div>
                          <ScrollArea className="h-[340px]">
                            <div className="space-y-1">
                              {dayAppointments.map(apt => {
                                const typeInfo = getTypeInfo(apt.type);
                                const statusInfo = getStatusInfo(apt.status);
                                
                                return (
                                  <div
                                    key={apt.id}
                                    onClick={() => setSelectedAppointment(apt)}
                                    className={cn(
                                      "p-2 rounded-lg cursor-pointer transition-all hover:shadow-md text-white text-xs",
                                      typeInfo.color
                                    )}
                                  >
                                    <div className="flex items-center gap-1 mb-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{apt.time}</span>
                                    </div>
                                    <p className="font-medium truncate">{apt.title}</p>
                                    <p className="opacity-80 truncate">{apt.customerName}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Day View */}
                {viewMode === 'day' && (
                  <div className="p-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold">
                        {format(selectedDate, 'EEEE، d MMMM yyyy', { locale: ar })}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {timeSlots.filter((_, i) => i % 2 === 0).map(slot => {
                        const slotAppointments = getAppointmentsForDate(selectedDate)
                          .filter(apt => apt.time === slot);
                        
                        return (
                          <div key={slot} className="flex gap-4 min-h-[60px]">
                            <div className="w-16 text-sm text-muted-foreground pt-2">
                              {slot}
                            </div>
                            <div className="flex-1 border-t pt-2">
                              {slotAppointments.map(apt => {
                                const typeInfo = getTypeInfo(apt.type);
                                return (
                                  <div
                                    key={apt.id}
                                    onClick={() => setSelectedAppointment(apt)}
                                    className={cn(
                                      "p-3 rounded-lg cursor-pointer text-white mb-1",
                                      typeInfo.color
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{apt.title}</span>
                                      <span className="text-sm opacity-80">{apt.duration} دقيقة</span>
                                    </div>
                                    <p className="text-sm opacity-80">{apt.customerName}</p>
                                    {apt.location && (
                                      <p className="text-xs opacity-70 flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {apt.location}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Month View */}
                {viewMode === 'month' && (
                  <div className="p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="w-full pointer-events-auto"
                      locale={ar}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
