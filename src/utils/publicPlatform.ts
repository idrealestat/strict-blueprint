// Utility helpers for building the public platform sharing URL.
// Centralizes slug sanitation so we never accidentally share numeric IDs like "/1".

export function sanitizePublicPlatformSlug(raw: unknown): string {
  const slug = String(raw ?? '').trim();
  if (!slug) return '';

  // Reject pure numeric slugs (these were legacy fallbacks like user.id = "1")
  if (/^\d+$/.test(slug)) return '';

  // Keep URLs consistent with routing + DB lookups
  return slug.toLowerCase();
}

export function getPublicPlatformSlug(fallbacks?: Array<unknown>): string {
  // 1) stored published slug
  const stored = sanitizePublicPlatformSlug(localStorage.getItem('public_platform_slug'));
  if (stored) return stored;

  // 2) explicit fallbacks (e.g., saved business card data userTitle)
  for (const f of fallbacks ?? []) {
    const s = sanitizePublicPlatformSlug(f);
    if (s) return s;
  }

  return 'default';
}

export function getPublicPlatformUrl(origin = 'https://wasataai.com', slug?: unknown): string {
  const safeSlug = slug ? sanitizePublicPlatformSlug(slug) : '';
  return `${origin}/${safeSlug || 'default'}`;
}
