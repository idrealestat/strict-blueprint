/**
 * useImpersonate.ts
 * انتحال هوية عضو فريق للعرض فقط (وضع المراقبة)
 * يخزّن الحالة في sessionStorage ليبقى البنر ظاهراً
 */
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'wasata_impersonate_v1';

export interface ImpersonationState {
  memberId: string;
  memberName: string;
  memberUserId: string | null;
  startedAt: string;
}

const EVENT = 'wasata:impersonation-change';

function read(): ImpersonationState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useImpersonate() {
  const [state, setState] = useState<ImpersonationState | null>(() => read());

  useEffect(() => {
    const handler = () => setState(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const start = useCallback((data: Omit<ImpersonationState, 'startedAt'>) => {
    const next: ImpersonationState = { ...data, startedAt: new Date().toISOString() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
    setState(next);
  }, []);

  const stop = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT));
    setState(null);
  }, []);

  return {
    impersonation: state,
    isImpersonating: !!state,
    start,
    stop,
  };
}

/**
 * useImpersonationGuard
 * يستخدم لحماية أي إجراء كتابة (إضافة/حذف/تعديل) أثناء وضع المراقبة.
 * يرجع:
 *  - isImpersonating: boolean (لإعطاء disabled للأزرار)
 *  - guard(fn): wrapper يمنع التنفيذ ويعرض تنبيهاً إذا كنا في وضع المراقبة
 *  - disabledTitle: نص ينصح بتمريره كـ title عند disabled
 */
export function useImpersonationGuard() {
  const { isImpersonating, impersonation } = useImpersonate();

  const guard = useCallback(<T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: any[]) => {
      if (isImpersonating) {
        toast.warning('وضع المراقبة نشط — جميع إجراءات التعديل معطّلة', {
          description: impersonation
            ? `تشاهد بيانات "${impersonation.memberName}" للقراءة فقط`
            : undefined,
        });
        return;
      }
      return fn(...args);
    }) as T;
  }, [isImpersonating, impersonation]);

  return {
    isImpersonating,
    guard,
    disabledTitle: 'معطل أثناء وضع مشاهدة العضو',
  };
}

