import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ViewNotificationSettings from "./ViewNotificationSettings";

interface CollapsibleNotificationSettingsProps {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  onSettingsChange: (enabled: boolean, sound: boolean) => void;
}

export default function CollapsibleNotificationSettings({
  notificationsEnabled,
  soundEnabled,
  onSettingsChange,
}: CollapsibleNotificationSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      {/* Header - Collapsible Trigger */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
        whileTap={{ scale: 0.99 }}
      >
        <Card className="border-2 border-orange-200 bg-gradient-to-l from-orange-50 to-amber-50 hover:border-orange-300 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  notificationsEnabled ? 'bg-orange-200' : 'bg-gray-200'
                }`}>
                  {notificationsEnabled ? (
                    <Bell className="w-6 h-6 text-orange-600" />
                  ) : (
                    <BellOff className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">إعدادات الإشعارات</h3>
                  <p className="text-muted-foreground text-sm">
                    {notificationsEnabled ? 'الإشعارات مفعّلة' : 'الإشعارات معطّلة'}
                    {notificationsEnabled && (soundEnabled ? ' • الصوت مفعّل' : ' • الصوت صامت')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Quick Status Badges */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                    notificationsEnabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {notificationsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                    <span>{notificationsEnabled ? 'مفعّل' : 'معطّل'}</span>
                  </div>
                  {notificationsEnabled && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                      soundEnabled 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      <span>{soundEnabled ? 'صوت' : 'صامت'}</span>
                    </div>
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
            <div className="pt-4">
              <ViewNotificationSettings
                notificationsEnabled={notificationsEnabled}
                soundEnabled={soundEnabled}
                onSettingsChange={onSettingsChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
