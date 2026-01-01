/**
 * usePublishedAdsManager.ts
 * نظام إدارة الإعلانات المنشورة مع ربط العملاء
 */

import { useState, useCallback, useEffect } from 'react';
import { triggerNotification } from './useNotificationSystem';
import { syncSingleListingToDatabase } from './usePlatformListings';

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
  
  // Deed Info
  deedNumber?: string;
  deedDate?: string;
  deedCity?: string;
  
  // Media
  images?: string[];
  videos?: string[];
  tour3DUrl?: string;
  
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

  // Publish ad and link to customer
  const publishAdWithCustomerLink = useCallback(async (adData: PublishedAdData): Promise<{
    success: boolean;
    customerId: string | null;
    isNewCustomer: boolean;
    message: string;
  }> => {
    setIsProcessing(true);
    
    try {
      // Search for existing customer by phone
      const existingCustomer = findCustomerByPhone(adData.ownerPhone);
      
      let customerId: string;
      let isNewCustomer = false;
      
      if (existingCustomer) {
        // Add ad to existing customer
        customerId = existingCustomer.id;
        addPublishedAdToCustomer(customerId, adData);
      } else {
        // Create new customer
        const newCustomer = createCustomerFromAd(adData);
        customerId = newCustomer.id;
        isNewCustomer = true;
      }
      
      // Update ad with linked customer ID
      adData.linkedCustomerId = customerId;
      
      // Save to published ads
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      publishedAds.push(adData);
      localStorage.setItem('published_ads_list', JSON.stringify(publishedAds));
      
      // Mark items as new (for pulsing dot)
      markAsNew('published_ad', adData.id);
      markAsNew('customer', customerId);
      markAsNew('tab', 'published_ads_tab');
      
      // Send notifications
      triggerNotification({
        title: '✅ تم نشر الإعلان',
        message: 'تم نشر الإعلان على منصتي',
        type: 'success',
        category: 'system',
      });
      
      triggerNotification({
        title: '📋 تم إضافة العرض',
        message: 'الإعلان موجود الآن في العروض',
        type: 'info',
        category: 'system',
      });
      
      triggerNotification({
        title: isNewCustomer ? '👤 بطاقة مالك جديدة' : '🔗 تم الربط',
        message: isNewCustomer 
          ? `تم إنشاء بطاقة اسم جديدة للمالك: ${adData.ownerName}`
          : `تم ربط الإعلان ببطاقة المالك: ${existingCustomer?.name}`,
        type: 'success',
        category: 'customer',
      });
      
      // Dispatch events
      window.dispatchEvent(new CustomEvent('adPublished', { 
        detail: { adId: adData.id, customerId, isNewCustomer } 
      }));
      
      window.dispatchEvent(new CustomEvent('newItemsAdded', { 
        detail: { type: 'ad', id: adData.id } 
      }));

      // مزامنة تلقائية إلى قاعدة البيانات
      syncSingleListingToDatabase(adData).then((synced) => {
        if (synced) {
          console.log('تمت مزامنة العرض إلى قاعدة البيانات تلقائياً');
        }
      });
      
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
  }, []);

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

export function markAsViewed(type: 'published_ad' | 'customer' | 'tab' | 'offer', id: string) {
  const items = getNewItems();
  const key = `${type}_${id}`;
  delete items[key];
  localStorage.setItem(NEW_ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('itemViewed', { detail: { type, id } }));
}

export function isNew(type: 'published_ad' | 'customer' | 'tab' | 'offer', id: string): boolean {
  const items = getNewItems();
  const key = `${type}_${id}`;
  return !!items[key];
}

// Hook for pulsing dot
export function usePulsingDot(type: 'published_ad' | 'customer' | 'tab' | 'offer', id: string) {
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
