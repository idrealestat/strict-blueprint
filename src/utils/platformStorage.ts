// src/utils/platformStorage.ts

export type AnyRecord = Record<string, any>;

export const STORAGE_KEYS = {
  platformComplete: 'wasata_platform_complete',
  publishedAdsList: 'published_ads_list',
  platformVisibilityState: 'platform_visibility_state',
} as const;

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function readPublishedAdsList(): AnyRecord[] {
  const list = safeJsonParse<any[]>(localStorage.getItem(STORAGE_KEYS.publishedAdsList), []);
  return Array.isArray(list) ? list : [];
}

export function readPlatformComplete(): AnyRecord[] {
  const list = safeJsonParse<any[]>(localStorage.getItem(STORAGE_KEYS.platformComplete), []);
  return Array.isArray(list) ? list : [];
}

export function readVisibilityState(): Record<string, boolean> {
  return safeJsonParse<Record<string, boolean>>(localStorage.getItem(STORAGE_KEYS.platformVisibilityState), {});
}

// يوحّد مصدر البيانات: يجعل wasata_platform_complete يعكس published_ads_list
// مع الحفاظ على أي حقول إضافية موجودة سابقاً في wasata_platform_complete.
export function syncPlatformCompleteFromPublishedAds(): { merged: AnyRecord[]; changed: boolean } {
  const published = readPublishedAdsList();
  const existing = readPlatformComplete();

  const byId = new Map<string, AnyRecord>();
  existing.forEach((it) => {
    if (it?.id) byId.set(String(it.id), it);
  });

  // ندمج كل published ad داخل wasata_platform_complete
  published.forEach((ad) => {
    const id = String(ad.id ?? '');
    if (!id) return;

    const prev = byId.get(id) || {};
    // status: public platform يفلتر published فقط
    const status = (ad.status as string) || 'published';

    byId.set(id, {
      ...prev,
      ...ad,
      status,
    });
  });

  const merged = Array.from(byId.values());
  const changed = JSON.stringify(merged) !== JSON.stringify(existing);
  if (changed) {
    localStorage.setItem(STORAGE_KEYS.platformComplete, JSON.stringify(merged));
  }

  return { merged, changed };
}
