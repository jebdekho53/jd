const SENSITIVE_KEYS = new Set([
  'token',
  'authorization',
  'client_secret',
  'client_id',
  'password',
  'secret',
  'api_key',
  'webhook_secret',
]);

export function maskSensitivePayload<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitivePayload(item)) as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = maskSensitivePayload(val);
      }
    }
    return out as T;
  }
  return value;
}
