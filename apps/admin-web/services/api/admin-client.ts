export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isAuthAttemptRoute(path: string) {
  return path === '/api/auth/login';
}

function friendlyAdminMessage(status: number, message: string, path = '') {
  const lower = message.toLowerCase();
  if (status === 0) return 'Network issue. Please try again.';
  if (status === 400 || status === 422) return message || 'Please check the highlighted fields.';
  if (status === 401) {
    // A rejected login attempt (wrong password, etc.) is not an expired
    // session — there was no session yet. Show the API's own reason.
    if (isAuthAttemptRoute(path)) return message || 'Invalid email or password.';
    return 'Your session expired. Please login again.';
  }
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested record was not found.';
  if (status === 500) return 'We could not complete this action. Please try again.';
  if (status === 409) {
    if (lower.includes('pincode')) return 'This pincode is already added.';
    if (lower.includes('gst')) return 'This GST number is already linked.';
    if (lower.includes('store')) return 'Store name already exists.';
    if (lower.includes('category')) return 'This category request already exists.';
    if (lower.includes('bank') || lower.includes('account')) {
      return 'This bank account is already linked.';
    }
    return message;
  }
  return message || 'Request failed. Please try again.';
}

/**
 * Client-side fetch wrapper — all admin data flows through /app/api/admin/* BFF routes.
 * Never calls the NestJS backend directly.
 */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(friendlyAdminMessage(0, '', path), 0);
  }

  const body = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const raw401 = (body as { message?: string | string[] })?.message ?? '';
    const message401 = Array.isArray(raw401) ? raw401.join(', ') : String(raw401);
    throw new ApiError(friendlyAdminMessage(401, message401, path), 401);
  }

  if (res.status === 403) {
    if (body?.error === 'Step-Up Required' || body?.message?.includes('Step-Up Required') || body?.message?.includes('Re-authentication required')) {
      const { useUiModalsStore } = await import('@/store/ui-modals-store');
      const success = await useUiModalsStore.getState().triggerStepUp();
      if (success) {
        return adminFetch(path, init);
      }
    }
    throw new ApiError(friendlyAdminMessage(403, body?.message ?? '', path), 403);
  }

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Request failed';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    throw new ApiError(friendlyAdminMessage(res.status, message, path), res.status);
  }

  return body as T;
}

export function buildQuery(params: object): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') q.set(key, String(val));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}
