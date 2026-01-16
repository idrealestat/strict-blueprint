/**
 * CalendarTabs.tsx
 * التقويم الرئيسي - مرتبط بقاعدة البيانات calendar_appointments
 */

import { useState, useEffect, useMemo } from 'react';
import { useCalendarAppointments, CalendarAppointment } from '@/hooks/useCalendarAppointments';
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, isPast, isFuture, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Settings, Plus, ChevronRight, ChevronLeft, Phone, MapPin, Clock, User, Calendar, Eye, CheckCircle, XCircle, AlertCircle, Loader2, Copy, Link, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CalendarSettingsPanel from './calendar/CalendarSettingsPanel';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tab {
  id: string;
  title: string;
  count: number;
}

const CalendarTabs = () => {
  const { user } = useAuthContext();
  const { appointments, loading } = useCalendarAppointments();
  const [activeTab, setActiveTab] = useState('today');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [slug, setSlug] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // جلب الـ slug من بطاقة الأعمال
  useEffect(() => {
    const fetchSlug = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('business_cards')
        .select('slug')
        .eq('user_id', user.id)
        .single();
      
      if (data?.slug) {
        setSlug(data.slug);
      }
    };
    
    fetchSlug();
  }, [user?.id]);

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (e) {
      toast.error('فشل في نسخ الرابط');
    }
  };

  // تصنيف المواعيد حسب التبويبات
  const categorizedAppointments = useMemo(() => {
    const today: CalendarAppointment[] = [];
    const tomorrow: CalendarAppointment[] = [];
    const week: CalendarAppointment[] = [];
    const month: CalendarAppointment[] = [];
    const upcoming: CalendarAppointment[] = [];
    const overdue: CalendarAppointment[] = [];
    const completed: CalendarAppointment[] = [];
    const confirmed: CalendarAppointment[] = [];

    appointments.forEach(apt => {
      const aptDate = new Date(apt.appointmentDate);
      
      if (apt.status === 'completed') {
        completed.push(apt);
        return;
      }
      
      if (apt.status === 'confirmed') {
        confirmed.push(apt);
      }
      
      if (isPast(aptDate) && apt.status !== 'completed') {
        overdue.push(apt);
        return;
      }
      
      if (isToday(aptDate)) {
        today.push(apt);
      } else if (isTomorrow(aptDate)) {
        tomorrow.push(apt);
      }
      
      if (isThisWeek(aptDate, { weekStartsOn: 0 })) {
        week.push(apt);
      }
      
      if (isThisMonth(aptDate)) {
        month.push(apt);
      }
      
      if (isFuture(aptDate)) {
        upcoming.push(apt);
      }
    });

    return { today, tomorrow, week, month, upcoming, overdue, completed, confirmed };
  }, [appointments]);

  const tabs: Tab[] = [
    { id: 'today', title: 'اليوم', count: categorizedAppointments.today.length },
    { id: 'tomorrow', title: 'غداً', count: categorizedAppointments.tomorrow.length },
    { id: 'week', title: 'هذا الأسبوع', count: categorizedAppointments.week.length },
    { id: 'month', title: 'هذا الشهر', count: categorizedAppointments.month.length },
    { id: 'upcoming', title: 'القادم', count: categorizedAppointments.upcoming.length },
    { id: 'overdue', title: 'متأخر', count: categorizedAppointments.overdue.length },
    { id: 'confirmed', title: 'مؤكد', count: categorizedAppointments.confirmed.length },
    { id: 'completed', title: 'مكتمل', count: categorizedAppointments.completed.length }
  ];

  const currentAppointments = useMemo(() => {
    switch (activeTab) {
      case 'today': return categorizedAppointments.today;
      case 'tomorrow': return categorizedAppointments.tomorrow;
      case 'week': return categorizedAppointments.week;
      case 'month': return categorizedAppointments.month;
      case 'upcoming': return categorizedAppointments.upcoming;
      case 'overdue': return categorizedAppointments.overdue;
      case 'confirmed': return categorizedAppointments.confirmed;
      case 'completed': return categorizedAppointments.completed;
      default: return [];
    }
  }, [activeTab, categorizedAppointments]);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400',
      broker_confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      client_rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      broker_rejected: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'مجدول',
      confirmed: 'مؤكد',
      pending: 'في الانتظار',
      cancelled: 'ملغي',
      completed: 'مكتمل',
      broker_confirmed: 'أكده الوسيط',
      client_rejected: 'رفضه العميل',
      broker_rejected: 'رفضه الوسيط',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      viewing: 'معاينة',
      meeting: 'اجتماع',
      call: 'مكالمة',
      signing: 'توقيع',
      followup: 'متابعة',
      property_viewing: 'معاينة عقار',
    };
    return labels[type] || type;
  };

  // التقويم المصغر
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = getDay(start);
    
    // إضافة أيام فارغة في البداية
    const emptyDays = Array(startDayOfWeek).fill(null);
    
    return [...emptyDays, ...days];
  }, [currentMonth]);

  const daysWithAppointments = useMemo(() => {
    return appointments.map(apt => new Date(apt.appointmentDate));
  }, [appointments]);

  const hasAppointmentOnDay = (day: Date) => {
    return daysWithAppointments.some(aptDate => isSameDay(aptDate, day));
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(new Date(apt.appointmentDate), day));
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="mr-3 text-gray-600 dark:text-gray-300">جاري تحميل المواعيد...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* رأس التقويم */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">التقويم</h3>
            <p className="text-gray-600 dark:text-gray-300">إدارة مواعيدك ({appointments.length} موعد)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              إعدادات
            </Button>
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('navigateFromAssistant', { detail: { page: 'calendar' } }))}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              موعد جديد
            </Button>
          </div>
        </div>
        
        {/* التبويبات */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2.5 rounded-lg transition-all duration-300",
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                tab.id === 'overdue' && tab.count > 0 && 'ring-2 ring-red-500'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{tab.title}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : tab.id === 'overdue' && tab.count > 0
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                )}>
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* محتوى التبويب */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* قائمة المواعيد */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white mb-4">
              مواعيد {tabs.find(t => t.id === activeTab)?.title}
            </h4>
            
            {currentAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مواعيد في هذا القسم</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {currentAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className={cn(
                      "p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer border-r-4",
                      apt.status === 'confirmed' ? 'border-green-500' :
                      apt.status === 'broker_confirmed' ? 'border-emerald-500' :
                      apt.status === 'client_rejected' ? 'border-red-500' :
                      apt.status === 'cancelled' ? 'border-gray-400' :
                      'border-blue-500',
                      apt.status === 'client_rejected' && 'animate-pulse'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-gray-800 dark:text-white">{apt.title}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusStyle(apt.status)}>
                            {getStatusLabel(apt.status)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(apt.appointmentType)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {apt.appointmentTime}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(apt.appointmentDate), 'dd/MM', { locale: ar })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {apt.customerName}
                      </span>
                      {apt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {apt.location}
                        </span>
                      )}
                    </div>

                    {apt.customerPhone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(apt.customerPhone);
                        }}
                      >
                        <Phone className="w-4 h-4 ml-1" />
                        {apt.customerPhone}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* التقويم المصغر */}
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <h5 className="font-bold text-gray-800 dark:text-white">
                {format(currentMonth, 'MMMM yyyy', { locale: ar })}
              </h5>
              <button 
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'].map((day, i) => (
                <div key={i} className="text-center text-sm text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-10" />;
                }
                
                const dayIsToday = isToday(day);
                const hasAppointment = hasAppointmentOnDay(day);
                const dayAppointments = getAppointmentsForDay(day);
                const hasNewAppointment = dayAppointments.some(a => 
                  a.status === 'client_rejected' || a.status === 'pending'
                );
                
                return (
                  <Dialog key={day.toISOString()}>
                    <DialogTrigger asChild>
                      <button
                        className={cn(
                          "relative h-10 rounded-lg flex items-center justify-center text-sm transition-all",
                          dayIsToday
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                            : hasAppointment
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {format(day, 'd')}
                        {hasAppointment && !dayIsToday && (
                          <span className={cn(
                            "absolute w-1.5 h-1.5 rounded-full bottom-1",
                            hasNewAppointment ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                          )} />
                        )}
                      </button>
                    </DialogTrigger>
                    {hasAppointment && (
                      <DialogContent className="max-w-md" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>
                            مواعيد {format(day, 'EEEE d MMMM', { locale: ar })}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          {dayAppointments.map(apt => (
                            <div 
                              key={apt.id}
                              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{apt.title}</p>
                                  <p className="text-sm text-gray-500">{apt.customerName}</p>
                                </div>
                                <Badge className={getStatusStyle(apt.status)}>
                                  {apt.appointmentTime}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                );
              })}
            </div>

            {/* روابط للنسخ */}
            {slug && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Link className="w-3 h-3" />
                  روابط سريعة للنسخ
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xs text-green-700 dark:text-green-400">رابط تذكير العميل</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => copyToClipboard(`wasataai.com/${slug}/appointmentapproval/customer/{appointmentId}`, 'customer')}
                    >
                      {copiedLink === 'customer' ? (
                        <><CheckCircle2 className="w-3 h-3 text-green-500" /> تم</>
                      ) : (
                        <><Copy className="w-3 h-3" /> نسخ</>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <span className="text-xs text-amber-700 dark:text-amber-400">رابط الاعتذار للعميل</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => copyToClipboard(`wasataai.com/${slug}/appointmentapproval/sorry`, 'sorry')}
                    >
                      {copiedLink === 'sorry' ? (
                        <><CheckCircle2 className="w-3 h-3 text-green-500" /> تم</>
                      ) : (
                        <><Copy className="w-3 h-3" /> نسخ</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog تفاصيل الموعد */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {selectedAppointment.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusStyle(selectedAppointment.status)}>
                    {getStatusLabel(selectedAppointment.status)}
                  </Badge>
                  <Badge variant="outline">
                    {getTypeLabel(selectedAppointment.appointmentType)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{format(new Date(selectedAppointment.appointmentDate), 'EEEE d MMMM yyyy', { locale: ar })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{selectedAppointment.appointmentTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{selectedAppointment.customerName}</span>
                </div>

                {selectedAppointment.customerPhone && (
                  <Button
                    onClick={() => handleCall(selectedAppointment.customerPhone)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    الاتصال بـ {selectedAppointment.customerPhone}
                  </Button>
                )}

                {selectedAppointment.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedAppointment.location}</span>
                  </div>
                )}

                {selectedAppointment.propertyTitle && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-500">العقار المرتبط</p>
                    <p className="font-medium text-blue-700 dark:text-blue-300">{selectedAppointment.propertyTitle}</p>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">ملاحظات</p>
                    <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog الإعدادات */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات التقويم والإشعارات
            </DialogTitle>
          </DialogHeader>
          <CalendarSettingsPanel onClose={() => setShowSettings(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarTabs;
