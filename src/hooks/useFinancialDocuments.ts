/**
 * useFinancialDocuments.ts
 * Hook لجلب وإدارة المستندات المالية (عروض الأسعار وسندات القبض)
 */

import { useState, useEffect, useCallback } from 'react';

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
}

export interface CustomerWithDocuments {
  id: string;
  name: string;
  phone: string;
  quotations: FinancialDocument[];
  receipts: FinancialDocument[];
}

export function useFinancialDocuments() {
  const [customersWithQuotations, setCustomersWithQuotations] = useState<CustomerWithDocuments[]>([]);
  const [customersWithReceipts, setCustomersWithReceipts] = useState<CustomerWithDocuments[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب المستندات من localStorage
  const fetchDocuments = useCallback(() => {
    setIsLoading(true);
    try {
      const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      
      const withQuotations: CustomerWithDocuments[] = [];
      const withReceipts: CustomerWithDocuments[] = [];

      customers.forEach((customer: any) => {
        const documents = customer.documents || [];
        
        const quotations = documents.filter((doc: any) => doc.type === 'quotation');
        const receipts = documents.filter((doc: any) => doc.type === 'receipt');

        if (quotations.length > 0) {
          withQuotations.push({
            id: customer.id,
            name: customer.name,
            phone: customer.phone || customer.whatsapp || '',
            quotations: quotations.map((q: any) => ({
              ...q,
              customerId: customer.id,
              customerName: customer.name,
              customerPhone: customer.phone || customer.whatsapp || '',
            })),
            receipts: [],
          });
        }

        if (receipts.length > 0) {
          withReceipts.push({
            id: customer.id,
            name: customer.name,
            phone: customer.phone || customer.whatsapp || '',
            quotations: [],
            receipts: receipts.map((r: any) => ({
              ...r,
              customerId: customer.id,
              customerName: customer.name,
              customerPhone: customer.phone || customer.whatsapp || '',
            })),
          });
        }
      });

      setCustomersWithQuotations(withQuotations);
      setCustomersWithReceipts(withReceipts);
    } catch (error) {
      console.error('Error fetching financial documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // التحديث عند إضافة مستند جديد
  useEffect(() => {
    fetchDocuments();

    const handleDocumentAdded = () => {
      fetchDocuments();
    };

    window.addEventListener('customerDocumentAdded', handleDocumentAdded);
    window.addEventListener('storage', handleDocumentAdded);

    return () => {
      window.removeEventListener('customerDocumentAdded', handleDocumentAdded);
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
