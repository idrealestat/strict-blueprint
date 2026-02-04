/**
 * usePublishedAdsManager.ts
 * نظام إدارة الإعلانات المنشورة مع ربط العملاء
 * محدث للعمل مع قاعدة البيانات الحقيقية
 */

import { useState, useCallback, useEffect } from 'react';
import { triggerNotification } from './useNotificationSystem';
import { syncSingleListingToDatabase } from './usePlatformListings';
import { supabase } from '@/integrations/supabase/client';
import { createNotification, triggerPublishingNotification } from '@/utils/notificationTriggers';
import { showPushNotification } from './usePushNotifications';

// ============== Phone normalization helpers (ربط العميل يعتمد عليها) ==============
const normalizePhone = (raw?: string | null): string => {
  const v = String(raw || '').trim();
  if (!v) return '';
  // اترك الأرقام فقط (مع الاحتفاظ بـ + لو موجود)
  const cleaned = v.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  // 05xxxxxxxx → 9665xxxxxxxx
  if (digits.startsWith('0') && digits.length === 10) return `966${digits.slice(1)}`;
  // 5xxxxxxxx → 9665xxxxxxxx (احتياط)
  if (digits.startsWith('5') && digits.length === 9) return `966${digits}`;
  // 9665xxxxxxxx → ثابت
  if (digits.startsWith('966') && digits.length >= 12) return digits;
  return digits;
};

const phoneVariants = (raw?: string | null): string[] => {
  const normalized = normalizePhone(raw);
  if (!normalized) return [];
  // جهّز بديل محلي 05xxxxxxx للتطابق مع أي تخزين قديم
  const local = normalized.startsWith('966') && normalized.length >= 12
    ? `0${normalized.slice(3)}`
    : normalized;
  return Array.from(new Set([raw ? String(raw).trim() : '', normalized, local].filter(Boolean)));
};

// Published Ad Interface
export interface PublishedAdData {
  id: string;
  title?: string;
  // Property Details
  propertyType: string;
  category: string;
  purpose: string;
  area: string;
  propertyCategory: string;
  platformPath: string;
  
  // Location
  locationDetails: {
    city: string;
    district: string;
    street: string;
    buildingNumber: string;
    postalCode: string;
    additionalNumber: string;
  };
  
  // Specifications
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  floors: string;
  propertyAge: string;
  furnishing: string;
  facade: string;
  streetWidth: string;
  
  // Features
  features: string[];
  customFeatures: string[];
  
  // Warranties
  warranties: {
    structuralWarranty: boolean;
    structuralYears: string;
    acWarranty: boolean;
    acYears: string;
    plumbingWarranty: boolean;
    plumbingYears: string;
    electricalWarranty: boolean;
    electricalYears: string;
    customWarranties: string[];
  };
  
  // Hashtags
  hashtags: string[];
  customHashtags: string[];
  
  // Description
  aiDescription: string;
  descriptionTone: string;
  descriptionLength: string;
  
  // Price
  price: string;
  priceType: string;
  
  // Owner Info
  ownerName: string;
  ownerPhone: string;
  ownerIdNumber?: string;
  ownerBirthDate?: string;
  ownerNationalAddress?: string;
  ownerCity?: string;
  ownerDistrict?: string;
  
  // Deed Info
  deedNumber?: string;
  deedDate?: string;
  deedCity?: string;
  
  // Ad License Info
  adLicense?: string;
  adLicenseDate?: string;
  adLicenseDuration?: string;
  
  // Media
  images?: string[];
  videos?: string[];
  tour3DUrl?: string;
  
  // Tracking for republished offers
  source?: string;
  originalTabId?: string;
  
  // Metadata
  publishedAt: string;
  linkedCustomerId?: string;
  status: 'published' | 'draft' | 'archived';
}

// Customer for CRM
export interface LinkedCustomer {
  id: string;
  name: string;
  phone: string;
  idNumber?: string;
  birthDate?: string;
  nationalAddress?: string;
  type: 'seller' | 'owner' | 'buyer' | 'renter' | 'investor' | 'other';
  status: string;
  columnId: string;
  publishedAds: PublishedAdData[];
  tabs?: any[]; // التبويبات (عروض، طلبات، مواعيد، إلخ)
  createdAt: string;
  lastContact: string;
  isNew?: boolean;
}

// Search customer by phone
export function findCustomerByPhone(phone: string): LinkedCustomer | null {
  const storedCustomers = localStorage.getItem('crm_customers');
  if (!storedCustomers) return null;
  
  try {
    const customers: LinkedCustomer[] = JSON.parse(storedCustomers);
    return customers.find(c => c.phone === phone || c.phone === phone.replace(/^0/, '966')) || null;
  } catch {
    return null;
  }
}

// Get all customers
export function getAllCustomers(): LinkedCustomer[] {
  const storedCustomers = localStorage.getItem('crm_customers');
  if (!storedCustomers) return [];
  
  try {
    return JSON.parse(storedCustomers);
  } catch {
    return [];
  }
}

// Save customers
export function saveCustomers(customers: LinkedCustomer[]) {
  localStorage.setItem('crm_customers', JSON.stringify(customers));
}

// Add published ad to customer
export function addPublishedAdToCustomer(customerId: string, ad: PublishedAdData): boolean {
  const customers = getAllCustomers();
  const customerIndex = customers.findIndex(c => c.id === customerId);
  
  if (customerIndex === -1) return false;
  
  if (!customers[customerIndex].publishedAds) {
    customers[customerIndex].publishedAds = [];
  }
  
  customers[customerIndex].publishedAds.push(ad);
  customers[customerIndex].lastContact = new Date().toISOString();
  saveCustomers(customers);
  
  return true;
}

// تحديث حالة تبويب العرض الأصلي في بطاقة العميل
export function updateOriginalOfferStatus(originalTabId: string, publishedAdId: string): boolean {
  if (!originalTabId) return false;
  
  try {
    const customers = getAllCustomers();
    let updated = false;
    
    // البحث في جميع العملاء عن التبويب الأصلي
    for (const customer of customers) {
      if (customer.tabs) {
        const tabIndex = customer.tabs.findIndex((t: any) => t.id === originalTabId);
        if (tabIndex !== -1) {
          // تحديث حالة التبويب
          customer.tabs[tabIndex].isPublished = true;
          customer.tabs[tabIndex].publishedAdId = publishedAdId;
          customer.tabs[tabIndex].publishedAt = new Date().toISOString();
          customer.tabs[tabIndex].status = 'published';
          updated = true;
          break;
        }
      }
    }
    
    if (updated) {
      saveCustomers(customers);
      // إرسال حدث لتحديث واجهة المستخدم
      window.dispatchEvent(new CustomEvent('offerStatusUpdated', { 
        detail: { originalTabId, publishedAdId, status: 'published' } 
      }));
    }
    
    return updated;
  } catch (error) {
    console.error('Error updating original offer status:', error);
    return false;
  }
}

// تحديث حالة تبويب الطلب الأصلي في بطاقة العميل
export function updateOriginalRequestStatus(originalTabId: string, publishedRequestId: string): boolean {
  if (!originalTabId) return false;
  
  try {
    const customers = getAllCustomers();
    let updated = false;
    
    // البحث في جميع العملاء عن التبويب الأصلي
    for (const customer of customers) {
      if (customer.tabs) {
        const tabIndex = customer.tabs.findIndex((t: any) => t.id === originalTabId);
        if (tabIndex !== -1) {
          // تحديث حالة التبويب
          customer.tabs[tabIndex].isPublished = true;
          customer.tabs[tabIndex].publishedAdId = publishedRequestId;
          customer.tabs[tabIndex].publishedAt = new Date().toISOString();
          customer.tabs[tabIndex].status = 'published';
          updated = true;
          break;
        }
      }
    }
    
    if (updated) {
      saveCustomers(customers);
      // إرسال حدث لتحديث واجهة المستخدم
      window.dispatchEvent(new CustomEvent('requestStatusUpdated', { 
        detail: { originalTabId, publishedRequestId, status: 'published' } 
      }));
    }
    
    return updated;
  } catch (error) {
    console.error('Error updating original request status:', error);
    return false;
  }
}

// Create new customer from ad data
export function createCustomerFromAd(ad: PublishedAdData): LinkedCustomer {
  const newCustomer: LinkedCustomer = {
    id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: ad.ownerName,
    phone: ad.ownerPhone,
    idNumber: ad.ownerIdNumber,
    birthDate: ad.ownerBirthDate,
    nationalAddress: ad.ownerNationalAddress,
    type: 'seller',
    status: 'جديد',
    columnId: 'new',
    publishedAds: [ad],
    createdAt: new Date().toISOString(),
    lastContact: new Date().toISOString(),
    isNew: true,
  };
  
  const customers = getAllCustomers();
  customers.push(newCustomer);
  saveCustomers(customers);
  
  return newCustomer;
}

// Hook for managing published ads
export function usePublishedAdsManager() {
  const [isProcessing, setIsProcessing] = useState(false);

  // البحث عن العميل برقم الجوال في قاعدة البيانات
  const findCustomerByPhoneInDB = useCallback(async (phone: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const variants = phoneVariants(phone);
      if (variants.length === 0) return null;

      // PostgREST .or() يدعم تكرار نفس الحقل عدة مرات
      const orParts: string[] = [];
      for (const v of variants) {
        // تجنب حقن الـ commas داخل القيمة
        const safe = v.replace(/,/g, '');
        orParts.push(`phone.eq.${safe}`, `whatsapp.eq.${safe}`);
      }

      const { data, error } = await supabase
        .from('crm_customers')
        .select('*')
        .eq('user_id', user.id)
        .or(orParts.join(','))
        .maybeSingle();

      if (error) {
        console.error('[CRM] Find by phone error:', error);
        return null;
      }

      return data;
    } catch (e) {
      console.error('[CRM] Exception:', e);
      return null;
    }
  }, []);

  // إنشاء عميل جديد في قاعدة البيانات من بيانات الإعلان
  const createCustomerFromAdInDB = useCallback(async (adData: PublishedAdData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const normalizedOwnerPhone = normalizePhone(adData.ownerPhone);

      // إعداد metadata مع بيانات المالك الإضافية
      const metadata: Record<string, any> = {
        source: 'published_ad',
        originalOwnerPhone: adData.ownerPhone || null,
        normalizedOwnerPhone: normalizedOwnerPhone || null,
        idNumber: adData.ownerIdNumber || null,
        birthDate: adData.ownerBirthDate || null,
        ownerCity: adData.locationDetails?.city || null,
        ownerDistrict: adData.locationDetails?.district || null,
        publishedAds: [adData.id],
        createdFromAd: true,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('crm_customers')
        .insert({
          user_id: user.id,
          name: adData.ownerName,
          // ✅ تخزين الهاتف بشكل موحّد قدر الإمكان لتسهيل الربط والبحث لاحقاً
          phone: normalizedOwnerPhone || adData.ownerPhone || null,
          whatsapp: normalizedOwnerPhone || adData.ownerPhone || null,
          status: 'جديد',
          priority: 'متوسط',
          source: 'نشر إعلان',
          property_type: adData.propertyType || null,
          location: adData.locationDetails?.city || null,
          tags: ['مالك', 'إعلان منشور'],
          last_contact: new Date().toISOString().split('T')[0],
          metadata,
        })
        .select()
        .single();

      if (error) {
        console.error('[CRM] Create error:', error);
        return null;
      }

      return data;
    } catch (e) {
      console.error('[CRM] Exception:', e);
      return null;
    }
  }, []);

  // إضافة الإعلان للعميل الموجود في قاعدة البيانات
  const addPublishedAdToCustomerInDB = useCallback(async (customerId: string, adData: PublishedAdData) => {
    try {
      // جلب العميل الحالي
      const { data: customer, error: fetchError } = await supabase
        .from('crm_customers')
        .select('metadata')
        .eq('id', customerId)
        .single();

      if (fetchError || !customer) {
        console.error('[CRM] Fetch error:', fetchError);
        return false;
      }

      // تحديث metadata مع الإعلان الجديد
      const currentMetadata = (customer.metadata as Record<string, any>) || {};
      const publishedAds = currentMetadata.publishedAds || [];
      publishedAds.push(adData.id);

      const updatedMetadata = {
        ...currentMetadata,
        publishedAds,
        lastPublishedAd: {
          id: adData.id,
          title: adData.title,
          publishedAt: adData.publishedAt,
        },
      };

      const { error: updateError } = await supabase
        .from('crm_customers')
        .update({ 
          metadata: updatedMetadata,
          last_contact: new Date().toISOString().split('T')[0],
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('[CRM] Update error:', updateError);
        return false;
      }

      return true;
    } catch (e) {
      console.error('[CRM] Exception:', e);
      return false;
    }
  }, []);

  // Publish ad and link to customer
  const publishAdWithCustomerLink = useCallback(async (adData: PublishedAdData): Promise<{
    success: boolean;
    customerId: string | null;
    isNewCustomer: boolean;
    message: string;
  }> => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // البحث عن العميل في قاعدة البيانات أولاً، ثم localStorage كاحتياط
      let existingCustomerDB = await findCustomerByPhoneInDB(adData.ownerPhone);
      const existingCustomerLocal = findCustomerByPhone(adData.ownerPhone);
      
      let customerId: string;
      let isNewCustomer = false;
      let customerName = adData.ownerName;
      
      if (existingCustomerDB) {
        // العميل موجود في قاعدة البيانات - إضافة الإعلان له
        customerId = existingCustomerDB.id;
        customerName = existingCustomerDB.name;
        await addPublishedAdToCustomerInDB(customerId, adData);
      } else if (existingCustomerLocal) {
        // العميل موجود في localStorage فقط
        customerId = existingCustomerLocal.id;
        customerName = existingCustomerLocal.name;
        addPublishedAdToCustomer(customerId, adData);
      } else {
        // إنشاء عميل جديد في قاعدة البيانات
        const newCustomerDB = await createCustomerFromAdInDB(adData);
        
        if (newCustomerDB) {
          customerId = newCustomerDB.id;
          isNewCustomer = true;
        } else {
          // احتياط: إنشاء في localStorage
          const newCustomerLocal = createCustomerFromAd(adData);
          customerId = newCustomerLocal.id;
          isNewCustomer = true;
        }
      }
      
      // Update ad with linked customer ID
      adData.linkedCustomerId = customerId;
      
      // Save to published ads (localStorage)
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      publishedAds.push(adData);
      localStorage.setItem('published_ads_list', JSON.stringify(publishedAds));
      
      // Mark items as new (for pulsing dot) - النقطة الحمراء النابضة
      markAsNew('published_ad', adData.id);
      markAsNew('customer', customerId);
      markAsNew('tab', 'published_ads_tab');
      // نقطة حمراء على المدينة
      const cityName = adData.locationDetails?.city || 'غير محدد';
      markAsNew('offer', `city_${cityName}`);
      
      // ========== الإشعارات الكاملة ==========
      
      // 1. إشعار في جرس الإشعارات مع صوت
      triggerNotification({
        title: '✅ تم نشر الإعلان',
        message: `تم نشر "${adData.title || adData.propertyType}" على منصتي`,
        type: 'success',
        category: 'system',
      });
      
      triggerNotification({
        title: '📋 تم إضافة العرض للعروض المنشورة',
        message: `الإعلان موجود الآن في تبويب العروض المنشورة`,
        type: 'info',
        category: 'system',
      });
      
      triggerNotification({
        title: isNewCustomer ? '👤 بطاقة مالك جديدة' : '🔗 تم الربط ببطاقة موجودة',
        message: isNewCustomer 
          ? `تم إنشاء بطاقة اسم جديدة للمالك: ${adData.ownerName}`
          : `تم ربط الإعلان ببطاقة المالك: ${customerName}`,
        type: 'success',
        category: 'customer',
      });
      
      // 2. إشعار في قاعدة البيانات (يظهر في الجرس)
      if (user) {
        await createNotification({
          userId: user.id,
          title: '🏠 تم نشر إعلان جديد',
          message: `${adData.propertyType} - ${adData.locationDetails?.city || ''} - ${adData.ownerName}`,
          notificationType: 'publishing',
          category: 'published',
          priority: 'high',
          relatedEntityType: 'listing',
          relatedEntityId: adData.id,
          actionUrl: '/app/my-platform',
          metadata: { adId: adData.id, customerId, isNewCustomer },
          sendPush: true,
          pushData: { type: 'ad_published', adTitle: adData.title },
        });

        // إشعار خاص بربط العميل
        await createNotification({
          userId: user.id,
          title: isNewCustomer ? '👤 عميل جديد من نشر إعلان' : '🔗 إعلان مرتبط بعميل',
          message: isNewCustomer
            ? `تم إنشاء بطاقة للمالك ${adData.ownerName} تلقائياً`
            : `تم إضافة الإعلان لبطاقة ${customerName}`,
          notificationType: 'crm',
          category: 'customer',
          priority: 'normal',
          relatedEntityType: 'customer',
          relatedEntityId: customerId,
          actionUrl: '/app/crm',
          metadata: { customerId, adId: adData.id, isNewCustomer },
        });
      }
      
      // 3. Push Notification
      // ✅ لا تدع إشعار الـ Push يعطل النشر (بعض البيئات تُرجع Promises بطيئة/غير مستقرة)
      await Promise.race([
        showPushNotification(
          '🏠 تم نشر إعلانك بنجاح!',
          `${adData.propertyType} في ${adData.locationDetails?.city || 'الموقع'} - ${adData.ownerName}`,
          { type: 'ad_published', adId: adData.id }
        ),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      
      // مزامنة تلقائية إلى قاعدة البيانات أولاً ثم إرسال الأحداث
      console.log('🔄 بدء مزامنة العرض إلى قاعدة البيانات:', adData.id);
      const synced = await Promise.race([
        syncSingleListingToDatabase(adData),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 8000)),
      ]);
      if (synced) {
        console.log('✅ تمت مزامنة العرض إلى قاعدة البيانات تلقائياً:', adData.id);
      } else {
        console.error('❌ فشلت مزامنة العرض إلى قاعدة البيانات:', adData.id);
      }

      // Dispatch events للتحديث الفوري بعد المزامنة
      window.dispatchEvent(new CustomEvent('adPublished', { 
        detail: { adId: adData.id, customerId, isNewCustomer } 
      }));
      
      window.dispatchEvent(new CustomEvent('newItemsAdded', { 
        detail: { type: 'ad', id: adData.id } 
      }));

      // حدث خاص للنقطة الحمراء النابضة
      window.dispatchEvent(new CustomEvent('pulsingDotUpdate', { 
        detail: { 
          type: 'new_published_ad',
          adId: adData.id,
          customerId,
          isNewCustomer,
        } 
      }));
      
      return {
        success: true,
        customerId,
        isNewCustomer,
        message: isNewCustomer 
          ? 'تم نشر الإعلان وإنشاء بطاقة مالك جديدة'
          : 'تم نشر الإعلان وربطه ببطاقة المالك الموجودة',
      };
    } catch (error) {
      console.error('Error publishing ad:', error);
      return {
        success: false,
        customerId: null,
        isNewCustomer: false,
        message: 'حدث خطأ أثناء نشر الإعلان',
      };
    } finally {
      setIsProcessing(false);
    }
  }, [findCustomerByPhoneInDB, createCustomerFromAdInDB, addPublishedAdToCustomerInDB]);

  // Get published ad by ID
  const getPublishedAd = useCallback((adId: string): PublishedAdData | null => {
    const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
    return publishedAds.find((ad: PublishedAdData) => ad.id === adId) || null;
  }, []);

  // Get all published ads
  const getAllPublishedAds = useCallback((): PublishedAdData[] => {
    return JSON.parse(localStorage.getItem('published_ads_list') || '[]');
  }, []);

  return {
    isProcessing,
    publishAdWithCustomerLink,
    getPublishedAd,
    getAllPublishedAds,
    findCustomerByPhone,
  };
}

// التحقق من وجود العرض مسبقاً (في العروض و/أو إدارة العملاء)
export interface DuplicateCheckResult {
  existsInOffers: boolean;
  existsInCustomers: boolean;
  customerName?: string;
  offerId?: string;
}

export function checkDuplicateAd(adData: {
  ownerPhone?: string;
  ownerIdNumber?: string;
  deedNumber?: string;
  propertyType?: string;
  city?: string;
  district?: string;
  area?: string;
}): DuplicateCheckResult {
  const result: DuplicateCheckResult = {
    existsInOffers: false,
    existsInCustomers: false,
  };

  // التحقق في العروض المنشورة
  const publishedAds: PublishedAdData[] = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
  
  // البحث عن عرض مطابق (نفس رقم الصك أو نفس الجوال + نوع العقار + الموقع)
  const matchingAd = publishedAds.find((ad: PublishedAdData) => {
    // تطابق رقم الصك
    if (adData.deedNumber && ad.deedNumber && adData.deedNumber === ad.deedNumber) {
      return true;
    }
    // تطابق الجوال + نوع العقار + المدينة + الحي + المساحة
    if (adData.ownerPhone && ad.ownerPhone === adData.ownerPhone &&
        adData.propertyType && ad.propertyType === adData.propertyType &&
        adData.city && ad.locationDetails?.city === adData.city &&
        adData.district && ad.locationDetails?.district === adData.district &&
        adData.area && ad.area === adData.area) {
      return true;
    }
    return false;
  });

  if (matchingAd) {
    result.existsInOffers = true;
    result.offerId = matchingAd.id;
  }

  // التحقق في إدارة العملاء
  const customers = getAllCustomers();
  const matchingCustomer = customers.find((c: LinkedCustomer) => {
    // تطابق رقم الجوال
    if (adData.ownerPhone && c.phone === adData.ownerPhone) {
      // التحقق إذا كان لديه نفس العرض
      if (c.publishedAds?.some((pa: PublishedAdData) => {
        if (adData.deedNumber && pa.deedNumber && adData.deedNumber === pa.deedNumber) {
          return true;
        }
        if (adData.propertyType && pa.propertyType === adData.propertyType &&
            adData.city && pa.locationDetails?.city === adData.city &&
            adData.district && pa.locationDetails?.district === adData.district &&
            adData.area && pa.area === adData.area) {
          return true;
        }
        return false;
      })) {
        return true;
      }
    }
    return false;
  });

  if (matchingCustomer) {
    result.existsInCustomers = true;
    result.customerName = matchingCustomer.name;
  }

  return result;
}

// New items tracking for pulsing dot
const NEW_ITEMS_KEY = 'new_items_tracking';

export interface NewItemsTracking {
  [key: string]: {
    id: string;
    type: 'published_ad' | 'customer' | 'tab' | 'offer';
    addedAt: string;
  };
}

export function getNewItems(): NewItemsTracking {
  try {
    return JSON.parse(localStorage.getItem(NEW_ITEMS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function markAsNew(type: 'published_ad' | 'customer' | 'tab' | 'offer', id: string) {
  const items = getNewItems();
  const key = `${type}_${id}`;
  items[key] = {
    id,
    type,
    addedAt: new Date().toISOString(),
  };
  localStorage.setItem(NEW_ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('newItemAdded', { detail: { type, id } }));
}

export function markAsViewed(type: 'published_ad' | 'customer' | 'tab' | 'offer' | 'request', id: string) {
  const items = getNewItems();
  const key = `${type}_${id}`;
  delete items[key];
  localStorage.setItem(NEW_ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('itemViewed', { detail: { type, id } }));
}

export function isNew(type: 'published_ad' | 'customer' | 'tab' | 'offer' | 'request', id: string): boolean {
  const items = getNewItems();
  const key = `${type}_${id}`;
  return !!items[key];
}

// Hook for pulsing dot
export function usePulsingDot(type: 'published_ad' | 'customer' | 'tab' | 'offer' | 'request', id: string) {
  const [showDot, setShowDot] = useState(false);

  useEffect(() => {
    const checkNew = () => {
      setShowDot(isNew(type, id));
    };
    
    checkNew();
    
    const handleNewItem = () => checkNew();
    const handleViewed = () => checkNew();
    
    window.addEventListener('newItemAdded', handleNewItem);
    window.addEventListener('itemViewed', handleViewed);
    
    return () => {
      window.removeEventListener('newItemAdded', handleNewItem);
      window.removeEventListener('itemViewed', handleViewed);
    };
  }, [type, id]);

  const markViewed = useCallback(() => {
    markAsViewed(type, id);
    setShowDot(false);
  }, [type, id]);

  return { showDot, markViewed };
}
