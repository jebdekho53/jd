const DEFAULT_RETURN_PATH = '/stores';

/**
 * Validates post-login redirect targets — same-origin relative paths only.
 * Rejects external URLs, protocol-relative paths, and javascript/data schemes.
 */
export function safeReturnUrl(raw: string | null | undefined, fallback = DEFAULT_RETURN_PATH): string {
  if (!raw || typeof raw !== 'string') return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('/\\') || lower.includes('://')) return fallback;
  if (lower.startsWith('/javascript:') || lower.startsWith('/data:')) return fallback;

  return trimmed;
}

export { DEFAULT_RETURN_PATH };
