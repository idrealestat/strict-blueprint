/**
 * NotificationsSidebar.tsx
 * شريط الإشعارات الجانبي مع نظام التذكير بالمهام والمواعيد وإشعارات النطاقات والفرص الذكية
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Bell, Check, Trash2, Clock, Volume2, VolumeX, 
  Calendar, CheckCircle, AlertCircle, Info, Star,
  ChevronRight, Settings, Home, Phone,
  Zap, BellOff, Globe, Shield, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Card, CardContent } from "./ui/card";
import { useNotificationSystem, SystemNotification } from "@/hooks/useNotificationSystem";
import { useViewingNotifications, ViewingAppointment } from "@/hooks/useViewingNotifications";
import { useDomainNotifications, DomainNotification } from "@/hooks/useDomainNotifications";
import { useSmartOpportunityNotifications } from "@/hooks/useSmartOpportunityNotifications";
import { openBriefingManually } from "@/hooks/useDailyBriefing";
import ViewingNotificationModal from "./ViewingNotificationModal";
import { CollapsibleNotificationSettings, SmartAlertsPanel } from "@/components/offers";

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string, params?: any) => void;
  offers?: Array<{
    id: string;
    title: string;
    views: number;
    requests: number;
    city?: string;
  }>;
}

export default function NotificationsSidebar({
  isOpen,
  onClose,
  onNavigate,
  offers = [],
}: NotificationsSidebarProps) {
  const navigate = useNavigate();
  // All hooks must be called at the top level, unconditionally, in the same order
  const [activeTab, setActiveTab] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [viewingModalOpen, setViewingModalOpen] = useState(false);
  const [selectedViewingAppointment, setSelectedViewingAppointment] = useState<ViewingAppointment | null>(null);
  
  // Notification settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    soundEnabled,
    toggleSound,
    testSound,
  } = useNotificationSystem();

  // Domain notifications hook
  const {
    notifications: domainNotifications,
    unreadCount: domainUnreadCount,
    markAsRead: markDomainAsRead,
    markAllAsRead: markAllDomainAsRead,
  } = useDomainNotifications();

  // Smart opportunities notifications hook
  const {
    opportunities: smartOpportunities,
    unreadCount: smartOpportunitiesUnreadCount,
    markAsRead: markSmartOpportunityAsRead,
    markAllAsRead: markAllSmartOpportunitiesAsRead,
  } = useSmartOpportunityNotifications();

  // Initialize viewing notifications hook - must be called unconditionally
  const viewingNotifications = useViewingNotifications();

  // Calculate total unread count
  const totalUnreadCount = unreadCount + domainUnreadCount + smartOpportunitiesUnreadCount;

  // Listen for viewing reminder events
  useEffect(() => {
    const handleViewingReminder = (event: CustomEvent) => {
      const notification = event.detail;
      const appointment = notification?.appointment || notification?.detail?.appointment;
      if (appointment) {
        setSelectedViewingAppointment(appointment);
        setViewingModalOpen(true);
      }
    };

    window.addEventListener('viewingReminder', handleViewingReminder as EventListener);
    return () => {
      window.removeEventListener('viewingReminder', handleViewingReminder as EventListener);
    };
  }, []);

  // Filter notifications by tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    if (activeTab === "tasks") return n.category === "task";
    if (activeTab === "appointments") return n.category === "appointment";
    if (activeTab === "domains") return false; // Domain notifications are handled separately
    return true;
  });

  // Get type styles
  const getTypeStyles = (notification: SystemNotification) => {
    switch (notification.type) {
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          dot: "bg-red-500",
          icon: AlertCircle,
          iconColor: "text-red-500"
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          dot: "bg-yellow-500",
          icon: AlertCircle,
          iconColor: "text-yellow-500"
        };
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          dot: "bg-green-500",
          icon: CheckCircle,
          iconColor: "text-green-500"
        };
      case "reminder":
        return {
          bg: "bg-purple-50 border-purple-200",
          dot: "bg-purple-500",
          icon: Bell,
          iconColor: "text-purple-500"
        };
      case "task":
        return {
          bg: "bg-blue-50 border-blue-200",
          dot: "bg-blue-500",
          icon: CheckCircle,
          iconColor: "text-blue-500"
        };
      case "appointment":
        return {
          bg: "bg-orange-50 border-orange-200",
          dot: "bg-orange-500",
          icon: Calendar,
          iconColor: "text-orange-500"
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-200",
          dot: "bg-blue-500",
          icon: Info,
          iconColor: "text-blue-500"
        };
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: SystemNotification) => {
    markAsRead(notification.id);

    // ✅ الموجز الصباحي: افتح نفس النافذة بـ snapshot من السجل
    if (notification.actionType === 'daily_briefing') {
      openBriefingManually(notification.relatedId);
      onClose();
      return;
    }

    if (!onNavigate) return;

    // ✅ Offers/CRM notifications: افتح بطاقة العميل مباشرة (بدون أي صفحة وسيطة)
    if (notification.actionType === 'offer') {
      const meta = (notification.metadata && typeof notification.metadata === 'object') ? notification.metadata : {};
      const customerId = (meta as any).customerId as string | undefined;

      if (customerId) {
        // ✅ افتح تفاصيل العميل مباشرة - الـ event listener في App.tsx يتولى التوجيه تلقائياً
        window.dispatchEvent(new CustomEvent('openCustomerDetails', {
          detail: { customerId, activeTab: 'offers' },
        }));
        onClose();
        return;
      }

      // fallback: فقط افتح إدارة العملاء
      onNavigate('customer-management-72');
      onClose();
      return;
    }

    // Existing: tasks / appointments
    if (notification.actionType?.startsWith('task')) {
      onNavigate('tasks', { taskId: notification.relatedId });
      onClose();
    } else if (notification.actionType?.startsWith('appointment')) {
      onNavigate('calendar', { appointmentId: notification.relatedId });
      onClose();
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return new Date(date).toLocaleDateString('ar-SA');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Sidebar */}
          <motion.div
            dir="rtl"
            className="fixed top-0 left-0 z-50 h-full w-[95%] md:w-[420px] bg-white shadow-2xl border-r-4 border-[#D4AF37] flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] text-white border-b-2 border-[#D4AF37]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center relative">
                    <Bell className="w-6 h-6 text-[#D4AF37]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">الإشعارات</h3>
                    <p className="text-xs text-white/70">
                      {unreadCount} إشعارات غير مقروءة
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Settings Panel - إعدادات الإشعارات والتنبيهات الذكية */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white rounded-xl p-4 mb-2 space-y-4 max-h-[60vh] overflow-y-auto"
                  >
                    {/* إعدادات الإشعارات القابلة للطي */}
                    <CollapsibleNotificationSettings
                      notificationsEnabled={notificationsEnabled}
                      soundEnabled={soundEnabled}
                      onSettingsChange={(enabled, sound) => {
                        setNotificationsEnabled(enabled);
                        if (sound !== soundEnabled) {
                          toggleSound();
                        }
                      }}
                    />
                    
                    {/* لوحة التنبيهات الذكية */}
                    <SmartAlertsPanel offers={offers} />
                    
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-6 bg-transparent w-full gap-1">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs text-[#D4AF37] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C] data-[state=active]:rounded-md data-[state=active]:font-bold"
                  >
                    الكل
                  </TabsTrigger>
                  <TabsTrigger 
                    value="unread"
                    className="text-xs text-white data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C] data-[state=active]:rounded-md data-[state=active]:font-bold relative"
                  >
                    غير مقروءة
                    {totalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="opportunities"
                    className="text-xs text-[#D4AF37] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C] data-[state=active]:rounded-md data-[state=active]:font-bold relative"
                  >
                    الفرص
                    {smartOpportunitiesUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
                        {smartOpportunitiesUnreadCount > 9 ? '9+' : smartOpportunitiesUnreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tasks"
                    className="text-xs text-white data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C] data-[state=active]:rounded-md data-[state=active]:font-bold"
                  >
                    المهام
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appointments"
                    className="text-xs text-[#D4AF37] data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C] data-[state=active]:rounded-md data-[state=active]:font-bold"
                  >
                    المواعيد
                  </TabsTrigger>
                  <TabsTrigger 
                    value="domains"
                    className="text-xs text-white data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C] data-[state=active]:rounded-md data-[state=active]:font-bold relative"
                  >
                    النطاقات
                    {domainUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {domainUnreadCount > 9 ? '9+' : domainUnreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Smart Opportunities Tab */}
              {activeTab === "opportunities" ? (
                smartOpportunities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Sparkles className="w-16 h-16 mb-4 opacity-30 text-amber-300" />
                    <p className="text-lg font-medium">لا توجد فرص ذكية جديدة</p>
                    <p className="text-sm text-center px-4">ستظهر إشعارات الفرص المطابقة لعروضك وطلباتك هنا</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2 border-amber-400 text-amber-600"
                      onClick={() => {
                        navigate('/app/smart-opportunities');
                        onClose();
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      تصفح الفرص الذكية
                    </Button>
                  </div>
                ) : (
                  smartOpportunities.map((opportunity) => (
                    <motion.div
                      key={opportunity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                        opportunity.is_read
                          ? "bg-gray-50 border-gray-200 opacity-70"
                          : "bg-amber-50 border-amber-200"
                      }`}
                      onClick={() => {
                        markSmartOpportunityAsRead(opportunity.id);
                        navigate('/app/smart-opportunities');
                        onClose();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          opportunity.is_read ? 'bg-gray-200' : 'bg-amber-100'
                        }`}>
                          <Sparkles className={`w-5 h-5 ${opportunity.is_read ? 'text-gray-400' : 'text-amber-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`font-bold text-sm ${opportunity.is_read ? 'text-gray-500' : 'text-[#01411C]'}`}>
                              {opportunity.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {!opportunity.is_read && (
                                <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
                                  جديد
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs border-emerald-400 text-emerald-600">
                                {opportunity.similarity_score}%
                              </Badge>
                            </div>
                          </div>
                          <p className={`text-sm mb-2 ${opportunity.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
                            {opportunity.message}
                          </p>
                          {opportunity.other_broker_name && (
                            <p className="text-xs text-gray-500 mb-1">
                              الوسيط: {opportunity.other_broker_name}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(new Date(opportunity.created_at))}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )
              ) : activeTab === "domains" ? (
                domainNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Globe className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">لا توجد إشعارات نطاقات</p>
                    <p className="text-sm">ستظهر إشعارات طلبات النطاقات هنا</p>
                  </div>
                ) : (
                  domainNotifications.map((notification) => {
                    const getNotificationStyle = (type: string) => {
                      switch (type) {
                        case 'approval':
                          return { bg: 'bg-green-50 border-green-200', icon: CheckCircle, iconColor: 'text-green-500' };
                        case 'rejection':
                          return { bg: 'bg-red-50 border-red-200', icon: AlertCircle, iconColor: 'text-red-500' };
                        case 'revocation':
                          return { bg: 'bg-orange-50 border-orange-200', icon: Shield, iconColor: 'text-orange-500' };
                        default:
                          return { bg: 'bg-blue-50 border-blue-200', icon: Globe, iconColor: 'text-blue-500' };
                      }
                    };
                    
                    const style = getNotificationStyle(notification.notification_type);
                    const Icon = style.icon;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                          notification.is_read
                            ? "bg-gray-50 border-gray-200 opacity-70"
                            : style.bg
                        }`}
                        onClick={() => {
                          markDomainAsRead(notification.id);
                          if (notification.request_id) {
                            navigate(`/domain-requests/${notification.request_id}`);
                            onClose();
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.is_read ? 'bg-gray-200' : style.bg
                          }`}>
                            <Icon className={`w-5 h-5 ${notification.is_read ? 'text-gray-400' : style.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className={`font-bold text-sm ${notification.is_read ? 'text-gray-500' : 'text-[#01411C]'}`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <Badge className="bg-[#D4AF37] text-[#01411C] text-xs px-1.5 py-0.5">
                                  جديد
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm mb-2 ${notification.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(new Date(notification.created_at))}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )
              ) : (
                /* Regular Notifications */
                filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Bell className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">لا توجد إشعارات</p>
                    <p className="text-sm">ستظهر الإشعارات الجديدة هنا</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => {
                    const styles = getTypeStyles(notification);
                    const Icon = styles.icon;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        layout
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                          notification.read
                            ? "bg-gray-50 border-gray-200 opacity-70"
                            : styles.bg
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.read ? 'bg-gray-200' : `${styles.bg}`
                          }`}>
                            <Icon className={`w-5 h-5 ${notification.read ? 'text-gray-400' : styles.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className={`font-bold text-sm ${notification.read ? 'text-gray-500' : 'text-[#01411C]'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <Badge className="bg-[#D4AF37] text-[#01411C] text-xs px-1.5 py-0.5">
                                    جديد
                                  </Badge>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className={`text-sm mb-2 ${notification.read ? 'text-gray-400' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(notification.createdAt)}</span>
                              </div>
                              {notification.actionType && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  className="flex items-center gap-1 text-xs text-[#01411C] hover:underline"
                                >
                                  <span>عرض</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )
              )}
            </div>


            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'domains') {
                      markAllDomainAsRead();
                    } else if (activeTab === 'opportunities') {
                      markAllSmartOpportunitiesAsRead();
                    } else {
                      markAllAsRead();
                    }
                  }}
                  disabled={
                    activeTab === 'domains' 
                      ? domainUnreadCount === 0 
                      : activeTab === 'opportunities'
                        ? smartOpportunitiesUnreadCount === 0
                        : unreadCount === 0
                  }
                  className="flex-1 text-xs border-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/10"
                >
                  <Check className="w-3 h-3 ml-1" />
                  قراءة الكل
                </Button>
                {activeTab !== 'domains' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteAllNotifications}
                    disabled={notifications.length === 0}
                    className="flex-1 text-xs border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 ml-1" />
                    حذف الكل
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Viewing Notification Modal */}
      <ViewingNotificationModal
        isOpen={viewingModalOpen}
        onClose={() => {
          setViewingModalOpen(false);
          setSelectedViewingAppointment(null);
        }}
        appointment={selectedViewingAppointment}
      />
    </AnimatePresence>
  );
}
