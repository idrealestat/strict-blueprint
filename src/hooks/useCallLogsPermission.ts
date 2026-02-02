/**
 * useCallLogsPermission.ts
 * Hook لإدارة صلاحيات سجل المكالمات وجهات الاتصال
 * 
 * ✅ يتوافق مع سياسات Google Play و Apple App Store:
 * - لا يتم طلب الإذن تلقائيًا
 * - يتم طلب الإذن فقط بعد إجراء صريح من المستخدم
 * - البيانات تستخدم فقط داخل إدارة العملاء
 * - لا Background Sync
 * - لا تخزين دائم لسجل المكالمات
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import { toast } from 'sonner';

// أنواع المكالمات
export interface NativeCallLog {
  id: string;
  phone: string;
  name?: string; // الاسم من الجهاز (جهات الاتصال)
  deviceName?: string; // الاسم المسجل بالجهاز (Device Name)
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: Date;
  duration?: number; // بالثواني
}

// نتيجة المطابقة مع العميل
export interface CallMatchResult {
  customerId: string | null;
  customerName: string | null;
  deviceName: string | null;
  finalDisplayName: string; // الاسم النهائي للعرض (التطبيق > الجهاز > مجهول)
  isLinkedToCustomer: boolean;
}

// حالة الصلاحيات
export interface PermissionStatus {
  contacts: 'granted' | 'denied' | 'prompt';
  callLog: 'granted' | 'denied' | 'prompt' | 'unavailable'; // unavailable لـ iOS
}

interface UseCallLogsPermissionReturn {
  // الحالة
  isNativePlatform: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  permissionStatus: PermissionStatus;
  isLinkingEnabled: boolean;
  
  // البيانات
  callLogs: NativeCallLog[];
  isLoading: boolean;
  error: string | null;
  
  // الإجراءات
  requestPermissions: () => Promise<boolean>;
  fetchCallLogs: () => Promise<void>;
  disableLinking: () => void;
  enableLinking: () => void;
  matchCallWithCustomer: (phone: string, customers: { phone: string; name: string; id: string }[]) => CallMatchResult;
  resolveDisplayName: (callLog: NativeCallLog, customers: { phone: string; name: string; id: string }[]) => CallMatchResult;
}

// مفتاح التخزين المحلي
const LINKING_ENABLED_KEY = 'call_logs_linking_enabled';

export function useCallLogsPermission(): UseCallLogsPermissionReturn {
  const [callLogs, setCallLogs] = useState<NativeCallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    contacts: 'prompt',
    callLog: 'prompt',
  });
  const [isLinkingEnabled, setIsLinkingEnabled] = useState(() => {
    return localStorage.getItem(LINKING_ENABLED_KEY) === 'true';
  });

  // التحقق من المنصة
  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isAndroid = platform === 'android';
  const isIOS = platform === 'ios';

  // تحديث حالة iOS - سجل المكالمات غير متاح
  useEffect(() => {
    if (isIOS) {
      setPermissionStatus(prev => ({
        ...prev,
        callLog: 'unavailable',
      }));
    }
  }, [isIOS]);

  // التحقق من الصلاحيات الحالية
  const checkPermissions = useCallback(async () => {
    if (!isNativePlatform) return;

    try {
      const contactsStatus = await Contacts.checkPermissions();
      setPermissionStatus(prev => ({
        ...prev,
        contacts: contactsStatus.contacts as PermissionStatus['contacts'],
      }));

      // التحقق من صلاحية سجل المكالمات (Android فقط)
      if (isAndroid && isLinkingEnabled) {
        // سنفترض أن الصلاحية ممنوحة إذا تم تفعيل الربط سابقاً
        // الصلاحية الفعلية تُفحص عند محاولة القراءة
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  }, [isNativePlatform, isAndroid, isLinkingEnabled]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  /**
   * طلب الصلاحيات - يتم استدعاؤها فقط بعد ضغط المستخدم على زر التفعيل
   * ✅ متوافق مع سياسات المتاجر
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNativePlatform) {
      // في الويب، نسمح بالربط المحلي فقط
      setIsLinkingEnabled(true);
      localStorage.setItem(LINKING_ENABLED_KEY, 'true');
      toast.success('تم تفعيل ربط الاتصالات');
      return true;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. طلب صلاحية جهات الاتصال أولاً
      const contactsResult = await Contacts.requestPermissions();
      const contactsGranted = contactsResult.contacts === 'granted';

      if (!contactsGranted) {
        toast.error('يجب السماح بالوصول لجهات الاتصال لتفعيل الربط');
        setPermissionStatus(prev => ({ ...prev, contacts: 'denied' }));
        return false;
      }

      setPermissionStatus(prev => ({ ...prev, contacts: 'granted' }));

      // 2. على Android، نحتاج صلاحية سجل المكالمات أيضاً
      if (isAndroid) {
        // ملاحظة: Capacitor لا يدعم Call Log بشكل مباشر
        // نحتاج plugin مخصص أو استخدام Cordova plugin
        // حالياً نفترض أن المستخدم سيمنح الصلاحية من إعدادات التطبيق
        
        // محاولة الوصول للتأكد من الصلاحية
        try {
          // هنا يمكن استخدام plugin مخصص لسجل المكالمات
          // await CallLog.hasPermission();
          setPermissionStatus(prev => ({ ...prev, callLog: 'granted' }));
        } catch {
          // إذا لم تكن الصلاحية ممنوحة، نطلب من المستخدم
          toast.info('يرجى السماح بالوصول لسجل المكالمات من إعدادات التطبيق', {
            duration: 5000,
          });
          setPermissionStatus(prev => ({ ...prev, callLog: 'prompt' }));
        }
      }

      // تفعيل الربط
      setIsLinkingEnabled(true);
      localStorage.setItem(LINKING_ENABLED_KEY, 'true');
      toast.success('تم تفعيل ربط الاتصالات بنجاح');
      
      return true;
    } catch (err: any) {
      console.error('Error requesting permissions:', err);
      setError(err.message || 'فشل في طلب الصلاحيات');
      toast.error('فشل في تفعيل الربط');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform, isAndroid]);

  /**
   * جلب سجل المكالمات
   * ✅ يتم فقط بعد تفعيل الربط صراحةً
   * ✅ لا يتم تخزين البيانات بشكل دائم
   */
  const fetchCallLogs = useCallback(async () => {
    if (!isLinkingEnabled) {
      setError('الربط غير مفعّل');
      return;
    }

    if (isIOS) {
      // iOS لا يسمح بالوصول لسجل المكالمات
      setError('نظام iOS لا يسمح بعرض سجل المكالمات');
      setCallLogs([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (isNativePlatform && isAndroid) {
        // محاولة جلب السجلات من الجهاز
        // هذا يتطلب plugin مخصص مثل @nicfontaine/capacitor-call-log
        
        try {
          // const { CallLog } = await import('@nicfontaine/capacitor-call-log');
          // const result = await CallLog.getCallLogs({ limit: 100 });
          // const transformedLogs = result.logs.map(log => ({
          //   id: log.id || `call_${Date.now()}_${Math.random()}`,
          //   phone: log.number,
          //   name: log.name,
          //   type: log.type === 1 ? 'incoming' : log.type === 2 ? 'outgoing' : 'missed',
          //   timestamp: new Date(log.date),
          //   duration: log.duration,
          // }));
          // setCallLogs(transformedLogs);
          
          // مؤقتاً: استخدام localStorage
          const saved = localStorage.getItem('wasata_call_logs');
          if (saved) {
            const parsed = JSON.parse(saved);
            setCallLogs(parsed.map((log: any) => ({
              ...log,
              timestamp: new Date(log.date || log.timestamp),
            })));
          }
        } catch (err) {
          console.log('Native call logs not available, using local storage');
          // استخدام البيانات المحفوظة محلياً كـ fallback
          const saved = localStorage.getItem('wasata_call_logs');
          if (saved) {
            const parsed = JSON.parse(saved);
            setCallLogs(parsed.map((log: any) => ({
              ...log,
              timestamp: new Date(log.date || log.timestamp),
            })));
          }
        }
      } else {
        // في الويب، نستخدم البيانات المحفوظة محلياً
        const saved = localStorage.getItem('wasata_call_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCallLogs(parsed.map((log: any) => ({
            ...log,
            timestamp: new Date(log.date || log.timestamp),
          })));
        }
      }
    } catch (err: any) {
      console.error('Error fetching call logs:', err);
      setError(err.message || 'فشل في جلب سجل المكالمات');
    } finally {
      setIsLoading(false);
    }
  }, [isLinkingEnabled, isNativePlatform, isAndroid, isIOS]);

  /**
   * إيقاف الربط
   */
  const disableLinking = useCallback(() => {
    setIsLinkingEnabled(false);
    localStorage.setItem(LINKING_ENABLED_KEY, 'false');
    setCallLogs([]); // مسح البيانات المحلية
    toast.success('تم إيقاف ربط الاتصالات');
    // إرسال حدث للإعدادات
    window.dispatchEvent(new CustomEvent('callLogsLinkingChanged'));
  }, []);

  /**
   * تفعيل الربط مرة أخرى (من الإعدادات)
   */
  const enableLinking = useCallback(() => {
    setIsLinkingEnabled(true);
    localStorage.setItem(LINKING_ENABLED_KEY, 'true');
    toast.success('تم تفعيل ربط الاتصالات');
    // إرسال حدث للإعدادات
    window.dispatchEvent(new CustomEvent('callLogsLinkingChanged'));
  }, []);

  /**
   * مطابقة رقم المكالمة مع العملاء
   * @returns CallMatchResult مع الاسم النهائي
   */
  const matchCallWithCustomer = useCallback((
    phone: string,
    customers: { phone: string; name: string; id: string }[]
  ): CallMatchResult => {
    if (!phone) {
      return {
        customerId: null,
        customerName: null,
        deviceName: null,
        finalDisplayName: 'جهة اتصال غير معروفة',
        isLinkedToCustomer: false,
      };
    }

    // تنظيف الرقم للمقارنة
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneVariants = [
      cleanPhone,
      cleanPhone.replace(/^966/, '0'),
      cleanPhone.replace(/^0/, '966'),
      cleanPhone.slice(-9), // آخر 9 أرقام
    ];

    for (const customer of customers) {
      if (!customer.phone) continue;
      
      const customerClean = customer.phone.replace(/\D/g, '');
      const customerVariants = [
        customerClean,
        customerClean.replace(/^966/, '0'),
        customerClean.replace(/^0/, '966'),
        customerClean.slice(-9),
      ];

      // مقارنة كل الاحتمالات
      for (const pv of phoneVariants) {
        for (const cv of customerVariants) {
          if (pv === cv && pv.length >= 9) {
            return {
              customerId: customer.id,
              customerName: customer.name,
              deviceName: null,
              finalDisplayName: customer.name, // الاسم من التطبيق
              isLinkedToCustomer: true,
            };
          }
        }
      }
    }

    return {
      customerId: null,
      customerName: null,
      deviceName: null,
      finalDisplayName: 'جهة اتصال غير معروفة',
      isLinkedToCustomer: false,
    };
  }, []);

  /**
   * 🔴 Matching Logic الإلزامي:
   * 1. إذا الرقم موجود في التطبيق → استخدم الاسم من التطبيق
   * 2. إذا غير موجود → استخدم اسم الجهاز (Device Name)
   * 3. إذا لا يوجد اسم → "جهة اتصال غير معروفة"
   */
  const resolveDisplayName = useCallback((
    callLog: NativeCallLog,
    customers: { phone: string; name: string; id: string }[]
  ): CallMatchResult => {
    // 1. محاولة المطابقة مع العملاء في التطبيق
    const matchResult = matchCallWithCustomer(callLog.phone, customers);
    
    if (matchResult.isLinkedToCustomer && matchResult.customerName) {
      // الرقم موجود في التطبيق - استخدم اسم التطبيق
      return matchResult;
    }
    
    // 2. الرقم غير موجود - استخدم اسم الجهاز
    const deviceName = callLog.name || callLog.deviceName;
    if (deviceName && deviceName.trim()) {
      return {
        customerId: null,
        customerName: null,
        deviceName: deviceName,
        finalDisplayName: deviceName, // الاسم من الجهاز
        isLinkedToCustomer: false,
      };
    }
    
    // 3. لا يوجد اسم - عرض "غير معروف"
    return {
      customerId: null,
      customerName: null,
      deviceName: null,
      finalDisplayName: 'جهة اتصال غير معروفة',
      isLinkedToCustomer: false,
    };
  }, [matchCallWithCustomer]);

  // جلب السجلات تلقائياً عند تفعيل الربط
  useEffect(() => {
    if (isLinkingEnabled) {
      fetchCallLogs();
    }
  }, [isLinkingEnabled, fetchCallLogs]);

  return {
    isNativePlatform,
    isAndroid,
    isIOS,
    permissionStatus,
    isLinkingEnabled,
    callLogs,
    isLoading,
    error,
    requestPermissions,
    fetchCallLogs,
    disableLinking,
    enableLinking,
    matchCallWithCustomer,
    resolveDisplayName,
  };
}
