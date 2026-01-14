/**
 * useCallLogs.ts
 * Hook لجلب سجل المكالمات من الجهاز أو إدخالها يدوياً
 */

import { useState, useEffect } from 'react';

export interface CallLog {
  id: string;
  phone: string;
  name?: string;
  time: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration?: string;
  date: Date;
}

// البيانات المحفوظة محلياً
const STORAGE_KEY = 'wasata_call_logs';

export function useCallLogs() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNativeAvailable, setIsNativeAvailable] = useState(false);

  // تحميل السجلات من localStorage
  useEffect(() => {
    const loadLogs = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCallLogs(parsed.map((log: any) => ({
            ...log,
            date: new Date(log.date)
          })));
        }
      } catch (error) {
        console.error('Error loading call logs:', error);
      }
      setIsLoading(false);
    };

    // التحقق من وجود Capacitor
    if (typeof (window as any).Capacitor !== 'undefined') {
      setIsNativeAvailable(true);
      // محاولة جلب السجلات من الجهاز
      loadNativeCallLogs();
    } else {
      loadLogs();
    }
  }, []);

  // جلب السجلات من الجهاز (يعمل فقط في تطبيق Capacitor)
  const loadNativeCallLogs = async () => {
    try {
      // هذا يتطلب تثبيت @nicfontaine/capacitor-call-log
      // أو إضافة مخصصة للوصول لسجل المكالمات
      console.log('Attempting to load native call logs...');
      
      // للتشغيل على الجهاز فقط
      // const { CallLog } = await import('@nicfontaine/capacitor-call-log');
      // const result = await CallLog.getCallLogs({ limit: 50 });
      // setCallLogs(transformNativeLogs(result.logs));
      
      // حالياً نستخدم البيانات المحفوظة
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCallLogs(parsed.map((log: any) => ({
          ...log,
          date: new Date(log.date)
        })));
      }
    } catch (error) {
      console.log('Native call logs not available, using local storage');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCallLogs(parsed.map((log: any) => ({
          ...log,
          date: new Date(log.date)
        })));
      }
    }
    setIsLoading(false);
  };

  // حفظ السجلات
  const saveLogs = (logs: CallLog[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    setCallLogs(logs);
  };

  // إضافة مكالمة جديدة
  const addCallLog = (call: Omit<CallLog, 'id' | 'date'>) => {
    const newCall: CallLog = {
      ...call,
      id: `call_${Date.now()}`,
      date: new Date()
    };
    const updated = [newCall, ...callLogs];
    saveLogs(updated);
    return newCall;
  };

  // حذف مكالمة
  const deleteCallLog = (id: string) => {
    const updated = callLogs.filter(log => log.id !== id);
    saveLogs(updated);
  };

  // استيراد من CSV
  const importFromCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newLogs: CallLog[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2) continue;
        
        const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('رقم') || h.includes('جوال'));
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('اسم'));
        const typeIndex = headers.findIndex(h => h.includes('type') || h.includes('نوع'));
        const durationIndex = headers.findIndex(h => h.includes('duration') || h.includes('مدة'));
        const timeIndex = headers.findIndex(h => h.includes('time') || h.includes('وقت'));
        
        const phone = values[phoneIndex >= 0 ? phoneIndex : 0]?.trim();
        if (!phone) continue;
        
        newLogs.push({
          id: `csv_${Date.now()}_${i}`,
          phone,
          name: nameIndex >= 0 ? values[nameIndex]?.trim() : undefined,
          type: typeIndex >= 0 ? (values[typeIndex]?.trim() as any) : 'incoming',
          duration: durationIndex >= 0 ? values[durationIndex]?.trim() : undefined,
          time: timeIndex >= 0 ? values[timeIndex]?.trim() : 'مستورد',
          date: new Date()
        });
      }
      
      const updated = [...newLogs, ...callLogs];
      saveLogs(updated);
      return newLogs.length;
    } catch (error) {
      console.error('Error importing CSV:', error);
      return 0;
    }
  };

  // تصدير إلى CSV
  const exportToCSV = () => {
    const headers = ['الرقم,الاسم,النوع,المدة,الوقت'];
    const rows = callLogs.map(log => 
      `${log.phone},${log.name || ''},${log.type},${log.duration || ''},${log.time}`
    );
    return [headers, ...rows].join('\n');
  };

  // مسح جميع السجلات
  const clearAllLogs = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCallLogs([]);
  };

  // ✅ تم إزالة إضافة البيانات الوهمية - يتم تسجيل المكالمات الحقيقية فقط
  const addSampleData = () => {
    // لا يتم إضافة بيانات وهمية
    return 0;
  };

  return {
    callLogs,
    isLoading,
    isNativeAvailable,
    addCallLog,
    deleteCallLog,
    importFromCSV,
    exportToCSV,
    clearAllLogs,
    addSampleData,
    refreshLogs: loadNativeCallLogs
  };
}
