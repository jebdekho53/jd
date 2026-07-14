/**
 * Centralised public-asset URL generation for locally-stored uploads.
 *
 * Two distinct bases exist:
 *   - uploadPublicUrl (UPLOAD_PUBLIC_URL) — canonical origin where files are
 *     physically served from and stored as. Reverse file lookups and legacy DB
 *     records depend on this value; it never changes silently.
 *   - cdnPublicUrl (CDN_PUBLIC_URL, optional) — a delivery base used *only* when
 *     configured. Empty ⇒ generation falls back to uploadPublicUrl, giving byte
 *     -for-byte identical behaviour to the pre-CDN codebase.
 *
 * For the first Cloudflare rollout CDN_PUBLIC_URL stays empty: uploads keep
 * resolving through the (now proxied) api.jebdekho.com/uploads origin, so no DB
 * value changes and every existing URL keeps working transparently.
 */

export interface AssetUrlConfig {
  /** UPLOAD_PUBLIC_URL — canonical upload origin (may include a trailing slash). */
  uploadPublicUrl: string;
  /** CDN_PUBLIC_URL — optional delivery base. Empty string when unset. */
  cdnPublicUrl?: string;
}

const ABSOLUTE_URL_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

/** Strip a single trailing slash (never mutate the scheme's `//`). */
function stripTrailingSlash(base: string): string {
  return base.replace(/\/+$/, '');
}

/**
 * The base every *newly generated* upload URL is built from: CDN when
 * configured, otherwise the canonical upload origin. Trailing slash removed.
 */
export function assetPublicBase(config: AssetUrlConfig): string {
  const cdn = (config.cdnPublicUrl ?? '').trim();
  return stripTrailingSlash(cdn || config.uploadPublicUrl);
}

/**
 * Every base that legitimately identifies one of our uploads. Used by trust
 * checks and reverse (URL → local file) lookups so that enabling CDN_PUBLIC_URL
 * later does not invalidate URLs minted under either base. De-duplicated,
 * trailing slashes removed, empties dropped.
 */
export function uploadPublicBases(config: AssetUrlConfig): string[] {
  const bases = [config.uploadPublicUrl, config.cdnPublicUrl]
    .map((b) => stripTrailingSlash((b ?? '').trim()))
    .filter((b) => b.length > 0);
  return Array.from(new Set(bases));
}

/**
 * Join the public asset base with one or more path segments, collapsing any
 * duplicate slashes at the joins. Segments are used verbatim otherwise, so a
 * caller-supplied `folder/name.jpg` is preserved exactly.
 */
export function buildUploadUrl(config: AssetUrlConfig, ...segments: string[]): string {
  const base = assetPublicBase(config);
  const tail = segments
    .map((s) => s.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter((s) => s.length > 0)
    .join('/');
  return tail ? `${base}/${tail}` : base;
}

/**
 * Normalise an arbitrary stored image/upload value into a public URL.
 *
 * Handles: null / undefined / empty (→ null), external absolute URLs
 * (preserved verbatim, incl. query/signature), our own absolute upload URLs
 * (preserved, or rebased onto the CDN when one is configured), and relative
 * paths such as `/uploads/x.jpg`, `uploads/x.jpg` or `product/x.jpg`.
 *
 * Query strings and fragments on absolute URLs are never touched, so signed
 * URLs survive intact. Duplicate slashes and a duplicated `/uploads/uploads`
 * prefix are collapsed.
 */
export function resolvePublicAssetUrl(
  config: AssetUrlConfig,
  input: string | null | undefined,
): string | null {
  const raw = input?.trim();
  if (!raw) return null;

  const bases = uploadPublicBases(config);

  if (ABSOLUTE_URL_RE.test(raw)) {
    // One of our own upload URLs → optionally rebase onto the preferred base
    // (CDN) while preserving the path + any query/fragment untouched.
    const preferred = assetPublicBase(config);
    for (const base of bases) {
      if (raw === base || raw.startsWith(`${base}/`)) {
        const rest = raw.slice(base.length); // keeps leading '/', query, fragment
        return `${preferred}${rest}`;
      }
    }
    // Foreign absolute URL (e.g. an external product image) — never rewrite it.
    return raw;
  }

  // Relative path. Drop a leading `/uploads` (or the base's own upload path)
  // segment so we never emit `/uploads/uploads/...`.
  let rel = raw.replace(/^\/+/, '');
  const uploadPathSegment = uploadBasePathname(config);
  if (uploadPathSegment && rel.toLowerCase().startsWith(`${uploadPathSegment}/`)) {
    rel = rel.slice(uploadPathSegment.length + 1);
  }
  return buildUploadUrl(config, rel);
}

/** The trailing path component of the canonical base, e.g. `uploads`. */
function uploadBasePathname(config: AssetUrlConfig): string {
  try {
    const { pathname } = new URL(assetPublicBase(config));
    return pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  } catch {
    return '';
  }
}
