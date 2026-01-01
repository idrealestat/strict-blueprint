import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Star, 
  Eye,
  Clock,
  Zap,
  Award,
  Target,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SmartAlert {
  id: string;
  type: 'success' | 'warning' | 'info' | 'trending';
  title: string;
  description: string;
  timestamp: Date;
  offerId?: string;
  offerTitle?: string;
  value?: number;
  previousValue?: number;
  isRead: boolean;
}

interface SmartAlertsPanelProps {
  offers: Array<{
    id: string;
    title: string;
    views: number;
    requests: number;
    city?: string;
  }>;
  onAlertClick?: (offerId: string) => void;
}

export default function SmartAlertsPanel({ offers, onAlertClick }: SmartAlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate smart alerts based on offer performance
  useEffect(() => {
    const generateAlerts = () => {
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
          isRead: false,
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
          isRead: false,
        });
      }

      // Low performing offers warning
      const lowPerformers = offers.filter(o => o.views < 50 && o.views > 0);
      if (lowPerformers.length > 0) {
        newAlerts.push({
          id: 'low-performers',
          type: 'warning',
          title: 'عروض تحتاج اهتمام',
          description: `${lowPerformers.length} عروض بمشاهدات منخفضة - قد تحتاج لتحسين العرض أو الصور`,
          timestamp: new Date(now.getTime() - 2 * 60 * 60000),
          isRead: false,
        });
      }

      // Conversion rate alert
      const highConversion = offers.filter(o => o.views > 0 && (o.requests / o.views) > 0.1);
      if (highConversion.length > 0) {
        newAlerts.push({
          id: 'high-conversion',
          type: 'success',
          title: 'معدل تحويل ممتاز',
          description: `${highConversion.length} عروض بمعدل تحويل أعلى من 10%`,
          timestamp: new Date(now.getTime() - 3 * 60 * 60000),
          isRead: true,
        });
      }

      // Daily summary
      const totalViews = offers.reduce((sum, o) => sum + o.views, 0);
      const totalRequests = offers.reduce((sum, o) => sum + o.requests, 0);
      newAlerts.push({
        id: 'daily-summary',
        type: 'info',
        title: 'ملخص اليوم',
        description: `إجمالي المشاهدات: ${totalViews.toLocaleString()} | إجمالي الطلبات: ${totalRequests.toLocaleString()}`,
        timestamp: new Date(now.getTime() - 4 * 60 * 60000),
        isRead: true,
      });

      // Zero views alert
      const zeroViews = offers.filter(o => o.views === 0);
      if (zeroViews.length > 0) {
        newAlerts.push({
          id: 'zero-views',
          type: 'warning',
          title: 'عروض بدون مشاهدات',
          description: `${zeroViews.length} عروض لم تحظ بأي مشاهدة - تأكد من نشرها بشكل صحيح`,
          timestamp: new Date(now.getTime() - 5 * 60 * 60000),
          isRead: true,
        });
      }

      setAlerts(newAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      setUnreadCount(newAlerts.filter(a => !a.isRead).length);
    };

    if (offers.length > 0) {
      generateAlerts();
    }
  }, [offers]);

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, isRead: true } : a
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    setUnreadCount(0);
  };

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'success':
        return <Award className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'info':
        return <Eye className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertStyle = (type: SmartAlert['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'trending':
        return 'border-blue-200 bg-blue-50';
      case 'info':
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `منذ ${diff} دقيقة`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
    return `منذ ${Math.floor(diff / 1440)} يوم`;
  };

  return (
    <div className="w-full">
      {/* Header - Collapsible Trigger */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
        whileTap={{ scale: 0.99 }}
      >
        <Card className="border-2 border-purple-200 bg-gradient-to-l from-purple-50 to-indigo-50 hover:border-purple-300 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl bg-purple-200 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">التنبيهات الذكية</h3>
                  <p className="text-muted-foreground text-sm">
                    {unreadCount > 0 ? `${unreadCount} تنبيهات جديدة` : 'لا توجد تنبيهات جديدة'} • {alerts.length} إجمالي
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Alert Type Badges */}
                <div className="hidden sm:flex items-center gap-2">
                  {alerts.filter(a => a.type === 'success').length > 0 && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      {alerts.filter(a => a.type === 'success').length} نجاح
                    </Badge>
                  )}
                  {alerts.filter(a => a.type === 'warning').length > 0 && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                      {alerts.filter(a => a.type === 'warning').length} تحذير
                    </Badge>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-6 h-6 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {/* Header with mark all as read */}
              {unreadCount > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    تحديد الكل كمقروء
                  </Button>
                </div>
              )}

              {/* Alerts List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(alert.id);
                      if (alert.offerId && onAlertClick) {
                        onAlertClick(alert.offerId);
                      }
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${getAlertStyle(alert.type)} ${
                      !alert.isRead ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold ${!alert.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {alert.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(alert.timestamp)}
                            </span>
                            {!alert.isRead && (
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                        {alert.offerTitle && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            <Target className="w-3 h-3 ml-1" />
                            {alert.offerTitle}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد تنبيهات حالياً</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
