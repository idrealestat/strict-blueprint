/**
 * RecentCallsColumn.tsx
 * عمود الاتصالات الأخيرة في إدارة العملاء (Kanban)
 * 
 * ✅ يعرض الاتصالات كبطاقات اسم مطابقة للأعمدة الأخرى
 * ✅ يربط الأرقام بالعملاء الموجودين تلقائياً
 * ✅ يدعم إنشاء عميل جديد من المكالمة
 * ✅ متوافق مع سياسات المتاجر
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  UserPlus,
  User,
  Clock,
  RefreshCw,
  AlertCircle,
  Link2Off,
  Apple,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NativeCallLog } from '@/hooks/useCallLogsPermission';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface RecentCallsColumnProps {
  // البيانات
  callLogs: NativeCallLog[];
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  
  // حالة المنصة
  isIOS: boolean;
  isLinkingEnabled: boolean;
  
  // الإجراءات
  onRefresh: () => void;
  onDisableLinking: () => void;
  onCallCardClick: (callLog: NativeCallLog, matchedCustomer: Customer | null) => void;
  onCreateCustomer: (phone: string, name?: string) => void;
}

// أيقونة نوع المكالمة
const CallTypeIcon = ({ type }: { type: NativeCallLog['type'] }) => {
  switch (type) {
    case 'incoming':
      return <PhoneIncoming className="w-4 h-4 text-green-600" />;
    case 'outgoing':
      return <PhoneOutgoing className="w-4 h-4 text-blue-600" />;
    case 'missed':
      return <PhoneMissed className="w-4 h-4 text-red-600" />;
    default:
      return <Phone className="w-4 h-4 text-gray-600" />;
  }
};

// تنسيق الوقت
const formatCallTime = (timestamp: Date): string => {
  if (isToday(timestamp)) {
    return format(timestamp, 'HH:mm', { locale: ar });
  } else if (isYesterday(timestamp)) {
    return 'أمس ' + format(timestamp, 'HH:mm', { locale: ar });
  } else {
    return format(timestamp, 'd MMM', { locale: ar });
  }
};

// تنسيق المدة
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds === 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// نوع المكالمة بالعربي
const getCallTypeLabel = (type: NativeCallLog['type']): string => {
  switch (type) {
    case 'incoming': return 'واردة';
    case 'outgoing': return 'صادرة';
    case 'missed': return 'فائتة';
    default: return 'مكالمة';
  }
};

// لون نوع المكالمة
const getCallTypeColor = (type: NativeCallLog['type']): string => {
  switch (type) {
    case 'incoming': return 'bg-green-50 text-green-700 border-green-200';
    case 'outgoing': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'missed': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function RecentCallsColumn({
  callLogs,
  customers,
  isLoading,
  error,
  isIOS,
  isLinkingEnabled,
  onRefresh,
  onDisableLinking,
  onCallCardClick,
  onCreateCustomer,
}: RecentCallsColumnProps) {
  
  // مطابقة المكالمات مع العملاء
  const matchedCalls = useMemo(() => {
    return callLogs.map(call => {
      const cleanPhone = call.phone.replace(/\D/g, '');
      const phoneVariants = [
        cleanPhone,
        cleanPhone.replace(/^966/, '0'),
        cleanPhone.replace(/^0/, '966'),
        cleanPhone.slice(-9),
      ];

      let matchedCustomer: Customer | null = null;

      for (const customer of customers) {
        if (!customer.phone) continue;
        
        const customerClean = customer.phone.replace(/\D/g, '');
        const customerVariants = [
          customerClean,
          customerClean.replace(/^966/, '0'),
          customerClean.replace(/^0/, '966'),
          customerClean.slice(-9),
        ];

        for (const pv of phoneVariants) {
          for (const cv of customerVariants) {
            if (pv === cv && pv.length >= 9) {
              matchedCustomer = customer;
              break;
            }
          }
          if (matchedCustomer) break;
        }
        if (matchedCustomer) break;
      }

      return {
        ...call,
        matchedCustomer,
        displayName: matchedCustomer?.name || call.name || 'جهة اتصال غير معروفة',
      };
    });
  }, [callLogs, customers]);

  // عرض رسالة iOS
  if (isIOS && isLinkingEnabled) {
    return (
      <div className="flex-shrink-0 w-72 bg-amber-50/50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Apple className="w-4 h-4 text-amber-700" />
          </div>
          <h3 className="font-semibold text-amber-900">iOS</h3>
        </div>
        
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-amber-700 mb-4">
            نظام iOS لا يسمح بعرض سجل المكالمات
          </p>
          <p className="text-xs text-amber-600 mb-4">
            يمكنك ربط جهات الاتصال فقط مع العملاء الحاليين
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onDisableLinking}
            className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Link2Off className="w-4 h-4" />
            إيقاف الربط
          </Button>
        </div>
      </div>
    );
  }

  // عرض خطأ
  if (error && isLinkingEnabled) {
    return (
      <div className="flex-shrink-0 w-72 bg-red-50/50 rounded-xl border border-red-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-700" />
          </div>
          <h3 className="font-semibold text-red-900">خطأ</h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-2 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // العمود الرئيسي
  return (
    <div className="flex-shrink-0 w-72 bg-gradient-to-b from-violet-50/80 to-violet-100/50 rounded-xl border border-violet-200 flex flex-col max-h-full">
      {/* Header */}
      <div className="p-3 border-b border-violet-200 bg-violet-100/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center">
              <Phone className="w-4 h-4 text-violet-700" />
            </div>
            <div>
              <h3 className="font-semibold text-violet-900 text-sm">الاتصالات الأخيرة</h3>
              <span className="text-xs text-violet-600">
                {matchedCalls.length} اتصال
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 text-violet-600 hover:bg-violet-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDisableLinking}
              className="h-8 w-8 text-violet-600 hover:bg-violet-200"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Call Cards */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          <AnimatePresence>
            {matchedCalls.length === 0 && !isLoading ? (
              <div className="text-center py-8">
                <Phone className="w-10 h-10 text-violet-300 mx-auto mb-2" />
                <p className="text-sm text-violet-500">لا توجد اتصالات</p>
              </div>
            ) : (
              matchedCalls.map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`cursor-pointer hover:shadow-md transition-all border-r-4 ${
                      call.matchedCustomer 
                        ? 'border-r-green-500 bg-green-50/30' 
                        : 'border-r-violet-400 bg-white'
                    }`}
                    onClick={() => onCallCardClick(call, call.matchedCustomer)}
                  >
                    <CardContent className="p-3">
                      {/* الصف الأول: الاسم والأيقونة */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className={`text-xs ${
                              call.matchedCustomer 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-violet-100 text-violet-700'
                            }`}>
                              {call.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate text-foreground">
                              {call.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate" dir="ltr">
                              {call.phone}
                            </p>
                          </div>
                        </div>
                        
                        <CallTypeIcon type={call.type} />
                      </div>
                      
                      {/* الصف الثاني: المعلومات */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${getCallTypeColor(call.type)}`}
                          >
                            {getCallTypeLabel(call.type)}
                          </Badge>
                          
                          {call.duration && call.duration > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatDuration(call.duration)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatCallTime(call.timestamp)}
                        </div>
                      </div>
                      
                      {/* زر إنشاء عميل - يظهر فقط للأرقام غير المربوطة */}
                      {!call.matchedCustomer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs gap-1 text-violet-600 hover:bg-violet-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateCustomer(call.phone, call.name);
                          }}
                        >
                          <UserPlus className="w-3 h-3" />
                          إنشاء عميل جديد
                        </Button>
                      )}
                      
                      {/* مؤشر العميل المربوط */}
                      {call.matchedCustomer && (
                        <div className="mt-2 pt-2 border-t border-green-100">
                          <div className="flex items-center gap-1 text-[10px] text-green-600">
                            <User className="w-3 h-3" />
                            <span>مربوط بـ: {call.matchedCustomer.name}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
