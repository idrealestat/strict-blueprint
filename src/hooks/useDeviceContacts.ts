/**
 * useDeviceContacts.ts
 * Hook للوصول إلى جهات اتصال الجهاز عبر Capacitor
 * ⚠️ تحذير: هذا الملف محمي - لا تعدله بدون إذن صريح من صاحب المشروع
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Contacts, ContactPayload, PhonePayload, EmailPayload, PhoneType, EmailType } from '@capacitor-community/contacts';
import { toast } from 'sonner';

export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  phones?: string[];
  emails?: string[];
  avatar?: string;
}

interface UseDeviceContactsReturn {
  contacts: DeviceContact[];
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isNativePlatform: boolean;
  requestPermission: () => Promise<boolean>;
  fetchContacts: () => Promise<void>;
  searchContacts: (query: string) => DeviceContact[];
  saveContactToDevice: (contact: { name: string; phone: string; email?: string }) => Promise<boolean>;
  isSaving: boolean;
}

export function useDeviceContacts(): UseDeviceContactsReturn {
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // التحقق من المنصة
  const isNativePlatform = Capacitor.isNativePlatform();

  // تحويل جهة اتصال من Capacitor للصيغة الموحدة
  const transformContact = (contact: ContactPayload): DeviceContact | null => {
    const name = contact.name?.display || contact.name?.given || contact.name?.family || '';
    if (!name) return null;

    const phones = contact.phones?.map((p: PhonePayload) => p.number).filter(Boolean) || [];
    const emails = contact.emails?.map((e: EmailPayload) => e.address).filter(Boolean) || [];

    if (phones.length === 0) return null; // تجاهل جهات الاتصال بدون رقم

    return {
      id: contact.contactId || `device-${Date.now()}-${Math.random()}`,
      name,
      phone: phones[0] || '',
      email: emails[0],
      phones,
      emails,
    };
  };

  // طلب صلاحية الوصول
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNativePlatform) {
      console.log('Not on native platform, skipping permission request');
      return false;
    }

    try {
      const permissionStatus = await Contacts.requestPermissions();
      const granted = permissionStatus.contacts === 'granted';
      setHasPermission(granted);

      if (!granted) {
        toast.error('تم رفض الوصول لجهات الاتصال');
      }

      return granted;
    } catch (err: any) {
      console.error('Error requesting contacts permission:', err);
      setError(err.message);
      return false;
    }
  }, [isNativePlatform]);

  // التحقق من الصلاحيات الحالية
  const checkPermission = useCallback(async () => {
    if (!isNativePlatform) return;

    try {
      const permissionStatus = await Contacts.checkPermissions();
      setHasPermission(permissionStatus.contacts === 'granted');
    } catch (err: any) {
      console.error('Error checking contacts permission:', err);
    }
  }, [isNativePlatform]);

  // جلب جهات الاتصال
  const fetchContacts = useCallback(async () => {
    if (!isNativePlatform) {
      setError('جهات اتصال الجهاز متاحة فقط على التطبيق الأصلي (Android/iOS)');
      return;
    }

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true,
        },
      });

      const transformedContacts: DeviceContact[] = [];
      
      for (const contact of result.contacts) {
        const transformed = transformContact(contact);
        if (transformed) {
          transformedContacts.push(transformed);
        }
      }

      // ترتيب حسب الاسم
      transformedContacts.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

      setContacts(transformedContacts);
      toast.success(`تم جلب ${transformedContacts.length} جهة اتصال`);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.message || 'فشل في جلب جهات الاتصال');
      toast.error('فشل في جلب جهات الاتصال');
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform, hasPermission, requestPermission]);

  // البحث في جهات الاتصال
  const searchContacts = useCallback((query: string): DeviceContact[] => {
    if (!query.trim()) return contacts;

    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.phone.includes(query) ||
      contact.phones?.some(p => p.includes(query)) ||
      contact.email?.toLowerCase().includes(lowerQuery) ||
      contact.emails?.some(e => e.toLowerCase().includes(lowerQuery))
    );
  }, [contacts]);

  // حفظ جهة اتصال في دفتر الهاتف
  const saveContactToDevice = useCallback(async (contact: { name: string; phone: string; email?: string }): Promise<boolean> => {
    if (!isNativePlatform) {
      toast.error('هذه الميزة متاحة فقط على التطبيق الأصلي');
      return false;
    }

    try {
      setIsSaving(true);

      // طلب صلاحية الكتابة إذا لم تكن متوفرة
      const permissionStatus = await Contacts.requestPermissions();
      if (permissionStatus.contacts !== 'granted') {
        toast.error('يجب السماح بالوصول لجهات الاتصال');
        return false;
      }

      // إنشاء جهة الاتصال
      await Contacts.createContact({
        contact: {
          name: {
            given: contact.name.split(' ')[0],
            family: contact.name.split(' ').slice(1).join(' ') || '',
          },
          phones: [
            {
              type: PhoneType.Mobile,
              number: contact.phone,
            }
          ],
          emails: contact.email ? [
            {
              type: EmailType.Work,
              address: contact.email,
            }
          ] : undefined,
        }
      });

      toast.success(`تم حفظ ${contact.name} في دفتر الهاتف`);
      
      // تحديث قائمة جهات الاتصال
      await fetchContacts();
      
      return true;
    } catch (err: any) {
      console.error('Error saving contact:', err);
      toast.error('فشل في حفظ جهة الاتصال');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isNativePlatform, fetchContacts]);

  // التحقق من الصلاحيات عند التحميل
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    contacts,
    isLoading,
    isSaving,
    error,
    hasPermission,
    isNativePlatform,
    requestPermission,
    fetchContacts,
    searchContacts,
    saveContactToDevice,
  };
}
