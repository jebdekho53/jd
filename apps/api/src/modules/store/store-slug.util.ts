import { randomUUID } from 'crypto';

/** Slugify a free-text value into a URL-safe token (lowercase, hyphenated). */
export function slugifyToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
}

function defaultShortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 6);
}

/**
 * Build a GLOBALLY-unique, SEO-friendly store slug of the form
 * `store-name-city`, falling back to `store-name-city-<shortid>` on collision.
 *
 * Uniqueness is decided by the injected `isTaken` predicate (a global DB lookup
 * in production), so this pure function is fully unit-testable. `citySlug` is
 * optional — when absent the bare name is used.
 */
export async function generateUniqueStoreSlug(
  name: string,
  citySlug: string | null,
  isTaken: (slug: string) => Promise<boolean>,
  shortId: () => string = defaultShortId,
): Promise<string> {
  const base = slugifyToken(name);
  const city = citySlug ? slugifyToken(citySlug) : '';
  const preferred = city ? `${base}-${city}`.slice(0, 60).replace(/-+$/g, '') : base;

  if (!(await isTaken(preferred))) return preferred;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${preferred}-${shortId()}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  // Effectively-unreachable final fallback — a timestamp token is unique.
  return `${preferred}-${Date.now().toString(36)}`;
}
