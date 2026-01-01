/**
 * NotificationsSidebar.tsx
 * شريط الإشعارات الجانبي مع نظام التذكير بالمهام والمواعيد + التنبيهات الذكية للعروض
 */

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Bell, Check, Trash2, Clock, Volume2, VolumeX, 
  Calendar, CheckCircle, AlertCircle, Info, Star,
  ChevronRight, Settings, Home, Phone, ExternalLink,
  TrendingUp, TrendingDown, Award, AlertTriangle, Eye, Zap, Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { useNotificationSystem, SystemNotification } from "@/hooks/useNotificationSystem";
import { useViewingNotifications, ViewingAppointment } from "@/hooks/useViewingNotifications";
import ViewingNotificationModal from "./ViewingNotificationModal";

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

// Smart Alert Interface
interface SmartAlert {
  id: string;
  type: 'success' | 'warning' | 'info' | 'trending';
  title: string;
  description: string;
  timestamp: Date;
  offerId?: string;
  offerTitle?: string;
  value?: number;
  isRead: boolean;
}

export default function NotificationsSidebar({
  isOpen,
  onClose,
  onNavigate,
}: NotificationsSidebarProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [viewingModalOpen, setViewingModalOpen] = useState(false);
  const [selectedViewingAppointment, setSelectedViewingAppointment] = useState<ViewingAppointment | null>(null);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [smartAlertsRead, setSmartAlertsRead] = useState<Set<string>>(new Set());

  // Navigate to notification settings
  const goToNotificationSettings = () => {
    navigate('/notification-settings');
    onClose();
  };

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

  // Initialize viewing notifications hook
  const viewingNotifications = useViewingNotifications();

  // Generate Smart Alerts from offers data
  useEffect(() => {
    const generateSmartAlerts = () => {
      try {
        const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
        if (!Array.isArray(publishedAds) || publishedAds.length === 0) return;

        const offers = publishedAds.map((ad: any) => ({
          id: ad.id,
          title: ad.title || `${ad.propertyType} في ${ad.locationDetails?.district || ad.locationDetails?.city || 'موقع غير محدد'}`,
          views: ad.views || 0,
          requests: ad.requests || 0,
          city: ad.locationDetails?.city || 'غير محدد',
        }));

        const newAlerts: SmartAlert[] = [];
        const now = new Date();

        // Sort offers by views
        const sortedByViews = [...offers].sort((a, b) => b.views - a.views);
        const sortedByRequests = [...offers].sort((a, b) => b.requests - a.requests);

        // Top performer alert
        if (sortedByViews.length > 0 && sortedByViews[0].views > 100) {
          newAlerts.push({
            id: 'top-performer',
            type: 'success',
            title: 'عرض متميز!',
            description: `"${sortedByViews[0].title}" يتصدر قائمة المشاهدات بـ ${sortedByViews[0].views.toLocaleString()} مشاهدة`,
            timestamp: new Date(now.getTime() - 30 * 60000),
            offerId: sortedByViews[0].id,
            offerTitle: sortedByViews[0].title,
            value: sortedByViews[0].views,
            isRead: smartAlertsRead.has('top-performer'),
          });
        }

        // Most requested alert
        if (sortedByRequests.length > 0 && sortedByRequests[0].requests > 10) {
          newAlerts.push({
            id: 'most-requested',
            type: 'trending',
            title: 'طلب مرتفع',
            description: `"${sortedByRequests[0].title}" يحظى باهتمام كبير - ${sortedByRequests[0].requests} طلب`,
            timestamp: new Date(now.getTime() - 60 * 60000),
            offerId: sortedByRequests[0].id,
            offerTitle: sortedByRequests[0].title,
            value: sortedByRequests[0].requests,
            isRead: smartAlertsRead.has('most-requested'),
          });
        }

        // Low performing offers warning
        const lowPerformers = offers.filter((o: any) => o.views < 50 && o.views > 0);
        if (lowPerformers.length > 0) {
          newAlerts.push({
            id: 'low-performers',
            type: 'warning',
            title: 'عروض تحتاج اهتمام',
            description: `${lowPerformers.length} عروض بمشاهدات منخفضة - قد تحتاج لتحسين العرض أو الصور`,
            timestamp: new Date(now.getTime() - 2 * 60 * 60000),
            isRead: smartAlertsRead.has('low-performers'),
          });
        }

        // High conversion rate alert
        const highConversion = offers.filter((o: any) => o.views > 0 && (o.requests / o.views) > 0.1);
        if (highConversion.length > 0) {
          newAlerts.push({
            id: 'high-conversion',
            type: 'success',
            title: 'معدل تحويل ممتاز',
            description: `${highConversion.length} عروض بمعدل تحويل أعلى من 10%`,
            timestamp: new Date(now.getTime() - 3 * 60 * 60000),
            isRead: smartAlertsRead.has('high-conversion'),
          });
        }

        // Daily summary
        const totalViews = offers.reduce((sum: number, o: any) => sum + o.views, 0);
        const totalRequests = offers.reduce((sum: number, o: any) => sum + o.requests, 0);
        if (totalViews > 0 || totalRequests > 0) {
          newAlerts.push({
            id: 'daily-summary',
            type: 'info',
            title: 'ملخص اليوم',
            description: `إجمالي المشاهدات: ${totalViews.toLocaleString()} | إجمالي الطلبات: ${totalRequests.toLocaleString()}`,
            timestamp: new Date(now.getTime() - 4 * 60 * 60000),
            isRead: smartAlertsRead.has('daily-summary'),
          });
        }

        // Zero views alert
        const zeroViews = offers.filter((o: any) => o.views === 0);
        if (zeroViews.length > 0) {
          newAlerts.push({
            id: 'zero-views',
            type: 'warning',
            title: 'عروض بدون مشاهدات',
            description: `${zeroViews.length} عروض لم تحظ بأي مشاهدة - تأكد من نشرها بشكل صحيح`,
            timestamp: new Date(now.getTime() - 5 * 60 * 60000),
            isRead: smartAlertsRead.has('zero-views'),
          });
        }

        setSmartAlerts(newAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } catch (error) {
        console.error('Error generating smart alerts:', error);
      }
    };

    generateSmartAlerts();
    
    // Listen for offer updates
    const handleUpdate = () => generateSmartAlerts();
    window.addEventListener('offerViewed', handleUpdate);
    window.addEventListener('publishedAdSaved', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('offerViewed', handleUpdate);
      window.removeEventListener('publishedAdSaved', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [smartAlertsRead]);

  const markSmartAlertAsRead = (alertId: string) => {
    setSmartAlertsRead(prev => new Set([...prev, alertId]));
  };

  const unreadSmartAlertsCount = useMemo(() => {
    return smartAlerts.filter(a => !a.isRead).length;
  }, [smartAlerts]);

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
    if (activeTab === "offers") return false; // Handled separately with smart alerts
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

    // Navigate based on action type
    if (notification.actionType?.startsWith('task') && onNavigate) {
      onNavigate('tasks', { taskId: notification.relatedId });
      onClose();
    } else if (notification.actionType?.startsWith('appointment') && onNavigate) {
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
                    onClick={goToNotificationSettings}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title="إعدادات الإشعارات"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
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

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white/10 rounded-lg p-3 mb-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {soundEnabled ? (
                          <Volume2 className="w-5 h-5 text-[#D4AF37]" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm">صوت التنبيه</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={testSound}
                          className="text-xs text-white/70 hover:text-white hover:bg-white/10"
                        >
                          اختبار
                        </Button>
                        <Switch
                          checked={soundEnabled}
                          onCheckedChange={toggleSound}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 bg-white/10 w-full">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C]"
                  >
                    الكل
                  </TabsTrigger>
                  <TabsTrigger 
                    value="unread"
                    className="text-xs data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C]"
                  >
                    غير مقروءة
                  </TabsTrigger>
                  <TabsTrigger 
                    value="offers"
                    className="text-xs data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C] relative"
                  >
                    العروض
                    {unreadSmartAlertsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadSmartAlertsCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tasks"
                    className="text-xs data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C]"
                  >
                    المهام
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appointments"
                    className="text-xs data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#01411C]"
                  >
                    المواعيد
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Smart Alerts (for offers tab) */}
              {activeTab === "offers" ? (
                smartAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Zap className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">لا توجد تنبيهات ذكية</p>
                    <p className="text-sm">ستظهر التنبيهات عند وجود عروض منشورة</p>
                  </div>
                ) : (
                  smartAlerts.map((alert) => {
                    const getAlertIcon = () => {
                      switch (alert.type) {
                        case 'success': return <Award className="w-5 h-5 text-green-600" />;
                        case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
                        case 'trending': return <TrendingUp className="w-5 h-5 text-blue-600" />;
                        case 'info': return <Eye className="w-5 h-5 text-gray-600" />;
                      }
                    };
                    const getAlertStyle = () => {
                      switch (alert.type) {
                        case 'success': return 'border-green-200 bg-green-50';
                        case 'warning': return 'border-amber-200 bg-amber-50';
                        case 'trending': return 'border-blue-200 bg-blue-50';
                        case 'info': return 'border-gray-200 bg-gray-50';
                      }
                    };
                    
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                          alert.isRead ? "opacity-70" : ""
                        } ${getAlertStyle()}`}
                        onClick={() => markSmartAlertAsRead(alert.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getAlertStyle()}`}>
                            {getAlertIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-bold text-sm text-[#01411C]">{alert.title}</h4>
                              {!alert.isRead && (
                                <Badge className="bg-[#D4AF37] text-[#01411C] text-xs px-1.5 py-0.5">جديد</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(alert.timestamp)}</span>
                            </div>
                            {alert.offerTitle && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                <Target className="w-3 h-3 ml-1" />
                                {alert.offerTitle}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )
              ) : filteredNotifications.length === 0 ? (
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
                              <button className="flex items-center gap-1 text-xs text-[#01411C] hover:underline">
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
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex-1 text-xs border-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/10"
                >
                  <Check className="w-3 h-3 ml-1" />
                  قراءة الكل
                </Button>
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
