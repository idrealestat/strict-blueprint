/**
 * NotificationsSidebar.tsx
 * شريط الإشعارات الجانبي
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Check, Trash2, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "عميل جديد",
    message: "تم إضافة عميل جديد: أحمد محمد",
    time: "منذ 5 دقائق",
    type: "success",
    read: false,
  },
  {
    id: "2",
    title: "موعد قادم",
    message: "لديك موعد معاينة بعد ساعة",
    time: "منذ 30 دقيقة",
    type: "warning",
    read: false,
  },
  {
    id: "3",
    title: "صفقة مكتملة",
    message: "تم إتمام صفقة بيع فيلا بنجاح",
    time: "منذ ساعة",
    type: "success",
    read: true,
  },
  {
    id: "4",
    title: "تحديث النظام",
    message: "تم تحديث النظام بنجاح إلى الإصدار الجديد",
    time: "منذ ساعتين",
    type: "info",
    read: true,
  },
];

export default function NotificationsSidebar({
  isOpen,
  onClose,
  onNavigate,
}: NotificationsSidebarProps) {
  const unreadCount = SAMPLE_NOTIFICATIONS.filter((n) => !n.read).length;

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
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
            className="fixed top-0 left-0 z-50 h-full w-[90%] md:w-[380px] bg-white shadow-2xl border-r-4 border-[#D4AF37] flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] text-white border-b-2 border-[#D4AF37]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold">الإشعارات</h3>
                    <p className="text-xs text-white/70">
                      {unreadCount} إشعارات غير مقروءة
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {SAMPLE_NOTIFICATIONS.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                    notification.read
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-[#D4AF37]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getTypeColor(
                        notification.type
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-[#01411C] text-sm">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <Badge className="bg-[#D4AF37] text-[#01411C] text-xs">
                            جديد
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-[#D4AF37] text-[#01411C]"
                >
                  <Check className="w-3 h-3 ml-1" />
                  قراءة الكل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
    </AnimatePresence>
  );
}
