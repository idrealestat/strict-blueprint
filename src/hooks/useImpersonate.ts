/**
 * useImpersonate.ts
 * انتحال هوية عضو فريق للعرض فقط (وضع المراقبة)
 * يخزّن الحالة في sessionStorage ليبقى البنر ظاهراً
 */
import { useEffect, useState, useCallback } from 'react';

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
