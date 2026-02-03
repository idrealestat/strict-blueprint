/**
 * useFinancialDocuments.ts
 * Hook لجلب وإدارة المستندات المالية (عروض الأسعار وسندات القبض)
 * يجمع البيانات من:
 * 1. localStorage (بطاقات العملاء المحلية)
 * 2. received_documents (المستلمة من النماذج العامة)
 * 3. crm_customers metadata (المحفوظة في قاعدة البيانات)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FinancialDocument {
  id: string;
  type: 'quotation' | 'receipt';
  typeName: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  total: number;
  createdAt: string;
  items?: any[];
  brokerName?: string;
  brokerPhone?: string;
  source?: 'local' | 'database' | 'received'; // مصدر المستند
  status?: string;
  propertyTitle?: string;
  message?: string;
}

export interface CustomerWithDocuments {
  id: string;
  name: string;
  phone: string;
  quotations: FinancialDocument[];
  receipts: FinancialDocument[];
}

export function useFinancialDocuments() {
  const { user } = useAuth();
  const [customersWithQuotations, setCustomersWithQuotations] = useState<CustomerWithDocuments[]>([]);
  const [customersWithReceipts, setCustomersWithReceipts] = useState<CustomerWithDocuments[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب المستندات من جميع المصادر
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const quotationsMap = new Map<string, CustomerWithDocuments>();
      const receiptsMap = new Map<string, CustomerWithDocuments>();

      // 1. جلب من localStorage (البيانات المحلية)
      const localCustomers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      
      localCustomers.forEach((customer: any) => {
        const documents = customer.documents || [];
        
        const quotations = documents.filter((doc: any) => doc.type === 'quotation');
        const receipts = documents.filter((doc: any) => doc.type === 'receipt');

        if (quotations.length > 0) {
          const existing = quotationsMap.get(customer.id) || {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || customer.whatsapp || '',
            quotations: [],
            receipts: [],
          };
          existing.quotations.push(...quotations.map((q: any) => ({
            ...q,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone || customer.whatsapp || '',
            source: 'local' as const,
          })));
          quotationsMap.set(customer.id, existing);
        }

        if (receipts.length > 0) {
          const existing = receiptsMap.get(customer.id) || {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || customer.whatsapp || '',
            quotations: [],
            receipts: [],
          };
          existing.receipts.push(...receipts.map((r: any) => ({
            ...r,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone || customer.whatsapp || '',
            source: 'local' as const,
          })));
          receiptsMap.set(customer.id, existing);
        }
      });

      // 2. جلب من قاعدة البيانات (إذا كان المستخدم مسجل دخول)
      if (user?.id) {
        // جلب received_documents (عروض الأسعار المستلمة من النماذج العامة)
        const { data: receivedDocs } = await supabase
          .from('received_documents')
          .select('*')
          .eq('user_id', user.id)
          .in('document_type', ['quotation_request', 'quotation', 'receipt']);

        if (receivedDocs) {
          receivedDocs.forEach((doc) => {
            const isQuotation = doc.document_type === 'quotation_request' || doc.document_type === 'quotation';
            const docData = doc.data as any;
            
            const financialDoc: FinancialDocument = {
              id: doc.id,
              type: isQuotation ? 'quotation' : 'receipt',
              typeName: isQuotation ? 'عرض سعر مستلم' : 'سند قبض مستلم',
              customerName: doc.customer_name || 'غير معروف',
              customerPhone: doc.customer_phone || '',
              customerId: doc.id,
              total: docData?.offered_price || docData?.total || docData?.amount || 0,
              createdAt: doc.created_at,
              source: 'received',
              status: doc.status || 'pending',
              propertyTitle: docData?.property_title || docData?.propertyTitle || '',
              message: docData?.message || docData?.notes || '',
            };

            const customerKey = doc.customer_phone || doc.id;
            
            if (isQuotation) {
              const existing = quotationsMap.get(customerKey) || {
                id: customerKey,
                name: doc.customer_name || 'غير معروف',
                phone: doc.customer_phone || '',
                quotations: [],
                receipts: [],
              };
              existing.quotations.push(financialDoc);
              quotationsMap.set(customerKey, existing);
            } else {
              const existing = receiptsMap.get(customerKey) || {
                id: customerKey,
                name: doc.customer_name || 'غير معروف',
                phone: doc.customer_phone || '',
                quotations: [],
                receipts: [],
              };
              existing.receipts.push(financialDoc);
              receiptsMap.set(customerKey, existing);
            }
          });
        }

        // جلب crm_customers مع المستندات المحفوظة في metadata
        const { data: dbCustomers } = await supabase
          .from('crm_customers')
          .select('*')
          .eq('user_id', user.id);

        if (dbCustomers) {
          dbCustomers.forEach((customer) => {
            const metadata = customer.metadata as any;
            const documents = metadata?.documents || [];
            const priceQuotes = metadata?.priceQuotes || [];
            
            // المستندات العامة
            const quotations = documents.filter((doc: any) => doc.type === 'quotation');
            const receipts = documents.filter((doc: any) => doc.type === 'receipt');

            // عروض الأسعار من priceQuotes
            const allQuotations = [
              ...quotations,
              ...priceQuotes.map((q: any) => ({
                ...q,
                type: 'quotation',
                typeName: 'عرض سعر',
              }))
            ];

            if (allQuotations.length > 0) {
              const customerKey = customer.phone || customer.id;
              const existing = quotationsMap.get(customerKey) || {
                id: customer.id,
                name: customer.name,
                phone: customer.phone || customer.whatsapp || '',
                quotations: [],
                receipts: [],
              };
              
              allQuotations.forEach((q: any) => {
                // تجنب التكرار
                const isDuplicate = existing.quotations.some(
                  (eq) => eq.id === q.id || (eq.createdAt === q.createdAt && eq.total === q.total)
                );
                if (!isDuplicate) {
                  existing.quotations.push({
                    ...q,
                    customerId: customer.id,
                    customerName: customer.name,
                    customerPhone: customer.phone || customer.whatsapp || '',
                    source: 'database' as const,
                  });
                }
              });
              
              quotationsMap.set(customerKey, existing);
            }

            if (receipts.length > 0) {
              const customerKey = customer.phone || customer.id;
              const existing = receiptsMap.get(customerKey) || {
                id: customer.id,
                name: customer.name,
                phone: customer.phone || customer.whatsapp || '',
                quotations: [],
                receipts: [],
              };
              
              receipts.forEach((r: any) => {
                const isDuplicate = existing.receipts.some(
                  (er) => er.id === r.id || (er.createdAt === r.createdAt && er.total === r.total)
                );
                if (!isDuplicate) {
                  existing.receipts.push({
                    ...r,
                    customerId: customer.id,
                    customerName: customer.name,
                    customerPhone: customer.phone || customer.whatsapp || '',
                    source: 'database' as const,
                  });
                }
              });
              
              receiptsMap.set(customerKey, existing);
            }
          });
        }
      }

      // تحويل الـ Maps إلى مصفوفات وترتيبها
      const sortedQuotations = Array.from(quotationsMap.values())
        .filter(c => c.quotations.length > 0)
        .sort((a, b) => {
          const latestA = Math.max(...a.quotations.map(q => new Date(q.createdAt).getTime()));
          const latestB = Math.max(...b.quotations.map(q => new Date(q.createdAt).getTime()));
          return latestB - latestA;
        });

      const sortedReceipts = Array.from(receiptsMap.values())
        .filter(c => c.receipts.length > 0)
        .sort((a, b) => {
          const latestA = Math.max(...a.receipts.map(r => new Date(r.createdAt).getTime()));
          const latestB = Math.max(...b.receipts.map(r => new Date(r.createdAt).getTime()));
          return latestB - latestA;
        });

      setCustomersWithQuotations(sortedQuotations);
      setCustomersWithReceipts(sortedReceipts);
    } catch (error) {
      console.error('Error fetching financial documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // التحديث عند إضافة مستند جديد
  useEffect(() => {
    fetchDocuments();

    const handleDocumentAdded = () => {
      fetchDocuments();
    };

    window.addEventListener('customerDocumentAdded', handleDocumentAdded);
    window.addEventListener('priceQuoteReceived', handleDocumentAdded);
    window.addEventListener('storage', handleDocumentAdded);

    return () => {
      window.removeEventListener('customerDocumentAdded', handleDocumentAdded);
      window.removeEventListener('priceQuoteReceived', handleDocumentAdded);
      window.removeEventListener('storage', handleDocumentAdded);
    };
  }, [fetchDocuments]);

  // إجمالي عدد المستندات
  const totalQuotations = customersWithQuotations.reduce(
    (sum, c) => sum + c.quotations.length,
    0
  );
  const totalReceipts = customersWithReceipts.reduce(
    (sum, c) => sum + c.receipts.length,
    0
  );

  return {
    customersWithQuotations,
    customersWithReceipts,
    totalQuotations,
    totalReceipts,
    isLoading,
    refresh: fetchDocuments,
  };
}
