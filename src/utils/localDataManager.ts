/**
 * مدير البيانات المحلية - Local Data Manager
 * يوفر وظائف إدارة وتنظيف وتصدير البيانات المخزنة في localStorage
 */

// قائمة مفاتيح localStorage المستخدمة في التطبيق
export const LOCAL_STORAGE_KEYS = {
  // بيانات العمل الأساسية
  platformComplete: 'wasata_platform_complete',
  publishedAdsList: 'published_ads_list',
  platformVisibilityState: 'platform_visibility_state',
  
  // بيانات العملاء
  customers: 'customers',
  crmCustomers: 'crm_customers',
  
  // بطاقة الأعمال
  businessCardPrefix: 'business_card_',
  businessCardSwapPrefix: 'business_card_swap_',
  
  // المواعيد
  appointments: 'appointments',
  calendarAppointments: 'calendar_appointments',
  
  // التحليلات والتتبع
  offerViewsLog: 'offer_views_log',
  
  // سجلات الاتصالات
  callLogs: 'wasata_call_logs',
  conversationId: 'wasata_ai_conversation_id',
  
  // المسودات والمؤقت
  propertyDraft: 'wasata_property_draft',
  republishData: 'wasata_republish_data',
  
  // الصور المخزنة
  images: 'wasata_images',
  
  // الإعدادات
  publishedAds: 'wasata_published_ads',
  platformAds: 'platform_ads',
} as const;

// أنواع البيانات للتصنيف
export type DataCategory = 'business' | 'customers' | 'appointments' | 'analytics' | 'drafts' | 'settings';

interface DataCategoryInfo {
  name: string;
  nameAr: string;
  keys: string[];
  description: string;
}

export const DATA_CATEGORIES: Record<DataCategory, DataCategoryInfo> = {
  business: {
    name: 'Business Data',
    nameAr: 'بيانات العمل',
    keys: [
      LOCAL_STORAGE_KEYS.platformComplete,
      LOCAL_STORAGE_KEYS.publishedAdsList,
      LOCAL_STORAGE_KEYS.platformVisibilityState,
      LOCAL_STORAGE_KEYS.publishedAds,
      LOCAL_STORAGE_KEYS.platformAds,
    ],
    description: 'العروض العقارية وبيانات المنصة'
  },
  customers: {
    name: 'Customer Data',
    nameAr: 'بيانات العملاء',
    keys: [
      LOCAL_STORAGE_KEYS.customers,
      LOCAL_STORAGE_KEYS.crmCustomers,
    ],
    description: 'معلومات العملاء وسجلاتهم'
  },
  appointments: {
    name: 'Appointments',
    nameAr: 'المواعيد',
    keys: [
      LOCAL_STORAGE_KEYS.appointments,
      LOCAL_STORAGE_KEYS.calendarAppointments,
    ],
    description: 'جدول المواعيد والاجتماعات'
  },
  analytics: {
    name: 'Analytics',
    nameAr: 'التحليلات',
    keys: [
      LOCAL_STORAGE_KEYS.offerViewsLog,
      LOCAL_STORAGE_KEYS.callLogs,
    ],
    description: 'سجلات المشاهدات والاتصالات'
  },
  drafts: {
    name: 'Drafts',
    nameAr: 'المسودات',
    keys: [
      LOCAL_STORAGE_KEYS.propertyDraft,
      LOCAL_STORAGE_KEYS.republishData,
      LOCAL_STORAGE_KEYS.conversationId,
    ],
    description: 'المسودات والبيانات المؤقتة'
  },
  settings: {
    name: 'Settings & Images',
    nameAr: 'الإعدادات والصور',
    keys: [
      LOCAL_STORAGE_KEYS.images,
    ],
    description: 'الإعدادات والصور المحفوظة'
  },
};

/**
 * حساب حجم البيانات المخزنة
 */
export function getStorageSize(): { used: number; usedFormatted: string; percentage: number } {
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
  }
  
  // localStorage limit is typically 5-10MB
  const maxSize = 5 * 1024 * 1024; // 5MB
  const percentage = (totalSize / maxSize) * 100;
  
  let usedFormatted: string;
  if (totalSize < 1024) {
    usedFormatted = `${totalSize} B`;
  } else if (totalSize < 1024 * 1024) {
    usedFormatted = `${(totalSize / 1024).toFixed(2)} KB`;
  } else {
    usedFormatted = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
  }
  
  return { used: totalSize, usedFormatted, percentage };
}

/**
 * الحصول على معلومات البيانات المخزنة
 */
export function getStorageInfo(): { 
  totalKeys: number; 
  categories: Record<DataCategory, { count: number; size: number }>;
  businessCardKeys: string[];
} {
  const categories: Record<DataCategory, { count: number; size: number }> = {
    business: { count: 0, size: 0 },
    customers: { count: 0, size: 0 },
    appointments: { count: 0, size: 0 },
    analytics: { count: 0, size: 0 },
    drafts: { count: 0, size: 0 },
    settings: { count: 0, size: 0 },
  };
  
  const businessCardKeys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const value = localStorage.getItem(key) || '';
    const size = key.length + value.length;
    
    // Check for business card keys
    if (key.startsWith(LOCAL_STORAGE_KEYS.businessCardPrefix)) {
      businessCardKeys.push(key);
      categories.settings.count++;
      categories.settings.size += size;
      continue;
    }
    
    // Categorize by known keys
    for (const [category, info] of Object.entries(DATA_CATEGORIES)) {
      if (info.keys.includes(key)) {
        categories[category as DataCategory].count++;
        categories[category as DataCategory].size += size;
        break;
      }
    }
  }
  
  return {
    totalKeys: localStorage.length,
    categories,
    businessCardKeys,
  };
}

/**
 * تصدير جميع البيانات
 */
export function exportAllData(): string {
  const data: Record<string, any> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const value = localStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : null;
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    data,
  }, null, 2);
}

/**
 * تصدير فئة معينة من البيانات
 */
export function exportCategoryData(category: DataCategory): string {
  const categoryInfo = DATA_CATEGORIES[category];
  const data: Record<string, any> = {};
  
  for (const key of categoryInfo.keys) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
      }
    } catch {
      data[key] = localStorage.getItem(key);
    }
  }
  
  // Include business card keys for settings category
  if (category === 'settings') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_KEYS.businessCardPrefix)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            data[key] = JSON.parse(value);
          }
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
  }
  
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    category: categoryInfo.nameAr,
    data,
  }, null, 2);
}

/**
 * مسح فئة معينة من البيانات
 */
export function clearCategoryData(category: DataCategory): void {
  const categoryInfo = DATA_CATEGORIES[category];
  
  for (const key of categoryInfo.keys) {
    localStorage.removeItem(key);
  }
  
  // Clear business card keys for settings category
  if (category === 'settings') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_KEYS.businessCardPrefix) || 
          key?.startsWith(LOCAL_STORAGE_KEYS.businessCardSwapPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * مسح جميع البيانات
 */
export function clearAllData(): void {
  localStorage.clear();
}

/**
 * مسح البيانات الحساسة (PII) فقط - يُستخدم عند تسجيل الخروج
 * يحافظ على التفضيلات غير الحساسة مثل الثيم والإعدادات
 * SECURITY: This function clears sensitive customer/personal data on logout
 * to prevent data exposure on shared devices
 */
export function clearSensitiveData(): void {
  // بيانات العملاء الحساسة
  const sensitiveKeys = [
    LOCAL_STORAGE_KEYS.customers,
    LOCAL_STORAGE_KEYS.crmCustomers,
    LOCAL_STORAGE_KEYS.appointments,
    LOCAL_STORAGE_KEYS.calendarAppointments,
    LOCAL_STORAGE_KEYS.offerViewsLog,
    LOCAL_STORAGE_KEYS.callLogs,
    LOCAL_STORAGE_KEYS.platformComplete,
    LOCAL_STORAGE_KEYS.publishedAdsList,
    LOCAL_STORAGE_KEYS.publishedAds,
    LOCAL_STORAGE_KEYS.platformAds,
    'received_documents',
    'client_submissions',
    'linked_customers',
  ];
  
  // مسح المفاتيح الحساسة المعروفة
  sensitiveKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // مسح بطاقات الأعمال المؤقتة
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // مسح بيانات بطاقات الأعمال وبيانات الترحيب ومفاتيح CRM
      if (
        key.startsWith(LOCAL_STORAGE_KEYS.businessCardPrefix) ||
        key.startsWith(LOCAL_STORAGE_KEYS.businessCardSwapPrefix) ||
        key.startsWith('welcome_shown_') ||
        key.startsWith('crm_migrated_') ||
        key.includes('wasata_business_card') ||
        key.includes('_documents') ||
        key.includes('_customers')
      ) {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // مسح sessionStorage أيضاً
  sessionStorage.clear();
  
  console.log('[Security] Sensitive data cleared on logout');
}

/**
 * مسح البيانات القديمة (أقدم من عدد أيام معين)
 */
export function clearOldData(daysOld: number = 30): { cleared: number; keys: string[] } {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const clearedKeys: string[] = [];
  
  // Clear old analytics data
  try {
    const viewsLog = localStorage.getItem(LOCAL_STORAGE_KEYS.offerViewsLog);
    if (viewsLog) {
      const logs = JSON.parse(viewsLog);
      const filteredLogs = logs.filter((log: any) => {
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
      });
      
      if (filteredLogs.length < logs.length) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.offerViewsLog, JSON.stringify(filteredLogs));
        clearedKeys.push(`${LOCAL_STORAGE_KEYS.offerViewsLog} (${logs.length - filteredLogs.length} entries)`);
      }
    }
  } catch (e) {
    console.error('Error clearing old views log:', e);
  }
  
  // Clear old call logs
  try {
    const callLogs = localStorage.getItem(LOCAL_STORAGE_KEYS.callLogs);
    if (callLogs) {
      const logs = JSON.parse(callLogs);
      const filteredLogs = logs.filter((log: any) => {
        const logDate = new Date(log.timestamp || log.date);
        return logDate >= cutoffDate;
      });
      
      if (filteredLogs.length < logs.length) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.callLogs, JSON.stringify(filteredLogs));
        clearedKeys.push(`${LOCAL_STORAGE_KEYS.callLogs} (${logs.length - filteredLogs.length} entries)`);
      }
    }
  } catch (e) {
    console.error('Error clearing old call logs:', e);
  }
  
  // Clear drafts older than the cutoff
  const draftKeys = [LOCAL_STORAGE_KEYS.propertyDraft, LOCAL_STORAGE_KEYS.republishData];
  for (const key of draftKeys) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.savedAt || parsed.createdAt) {
          const savedDate = new Date(parsed.savedAt || parsed.createdAt);
          if (savedDate < cutoffDate) {
            localStorage.removeItem(key);
            clearedKeys.push(key);
          }
        }
      }
    } catch (e) {
      // If can't parse, leave it alone
    }
  }
  
  return { cleared: clearedKeys.length, keys: clearedKeys };
}

/**
 * تنزيل البيانات كملف JSON
 */
export function downloadDataAsFile(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * استيراد البيانات من ملف JSON
 */
export function importData(jsonString: string): { success: boolean; keysImported: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.data || parsed;
    
    let keysImported = 0;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      keysImported++;
    }
    
    return { success: true, keysImported };
  } catch (e) {
    return { 
      success: false, 
      keysImported: 0, 
      error: e instanceof Error ? e.message : 'خطأ في استيراد البيانات' 
    };
  }
}

/**
 * فحص صحة البيانات المخزنة
 */
export function validateStoredData(): { valid: boolean; corrupted: string[] } {
  const corrupted: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const value = localStorage.getItem(key);
    if (!value) continue;
    
    // Try to parse JSON data
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        JSON.parse(value);
      } catch {
        corrupted.push(key);
      }
    }
  }
  
  return { valid: corrupted.length === 0, corrupted };
}

/**
 * إصلاح البيانات التالفة
 */
export function repairCorruptedData(): { repaired: number; removed: string[] } {
  const { corrupted } = validateStoredData();
  
  for (const key of corrupted) {
    localStorage.removeItem(key);
  }
  
  return { repaired: corrupted.length, removed: corrupted };
}
