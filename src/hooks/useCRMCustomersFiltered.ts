/**
 * useCRMCustomersFiltered.ts
 * Hook مساعد للفلترة في الواجهة مع تحذير أداء عند تجاوز 500 عميل.
 * لا يعدّل useCRMCustomers الأصلي.
 */
import { useMemo, useEffect, useRef } from 'react';

const PERF_THRESHOLD = 500;

export interface FilterOptions {
  search?: string;
  status?: string | null;
  category?: string | null;
  assignedToUserId?: string | null;
  assignedCustomerIds?: string[] | null;
}

export function useCRMCustomersFiltered<T extends Record<string, any>>(
  customers: T[],
  options: FilterOptions = {}
) {
  const warnedRef = useRef(false);

  useEffect(() => {
    if (customers.length > PERF_THRESHOLD && !warnedRef.current) {
      warnedRef.current = true;
      // eslint-disable-next-line no-console
      console.warn(
        `[useCRMCustomersFiltered] عدد العملاء (${customers.length}) كبير، يُنصح بالتبديل إلى فلترة الخلفية (server-side) لتحسين الأداء.`
      );
    }
  }, [customers.length]);

  const filtered = useMemo(() => {
    const q = (options.search || '').trim().toLowerCase();
    return customers.filter((c) => {
      if (options.assignedCustomerIds && !options.assignedCustomerIds.includes(c.id)) return false;
      if (options.status && c.status !== options.status) return false;
      if (options.category && c.category !== options.category) return false;
      if (q) {
        const hay = `${c.customer_name || ''} ${c.phone || ''} ${c.email || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customers, options.search, options.status, options.category, options.assignedCustomerIds]);

  return {
    filtered,
    total: customers.length,
    isLarge: customers.length > PERF_THRESHOLD,
  };
}
