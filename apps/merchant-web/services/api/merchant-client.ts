import { useAuthStore } from '@/store/auth-store';

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function friendlyApiMessage(status: number, message: string, path: string) {
  const lower = message.toLowerCase();

  if (status === 0) return 'Network issue. Your draft is safe. Try again.';
  if (status === 400 || status === 422) return message && message !== 'Something went wrong' ? message : 'Please check the highlighted fields.';
  if (status === 401) return 'Your session expired. Please login again.';
  if (status === 403) return 'You do not have permission to edit this onboarding.';
  if (status === 500) return 'We could not save this step. Please try again.';

  if (status === 409) {
    if (lower.includes('email')) {
      return 'This email is already registered. Login to continue onboarding.';
    }
    if (lower.includes('phone') || lower.includes('mobile')) {
      return 'This phone number is already linked to another account.';
    }
    if (lower.includes('store') || lower.includes('slug') || lower.includes('name')) {
      return 'A store with this name already exists. Try adding locality or owner name.';
    }
    if (lower.includes('gst')) return 'This GST number is already linked to another merchant.';
    if (lower.includes('pan')) return 'This PAN is already linked to another merchant.';
    if (lower.includes('bank') || lower.includes('account')) {
      return 'This bank account is already linked to another merchant.';
    }
    if (lower.includes('category')) return 'This category request already exists.';
    if (lower.includes('pincode')) {
      return 'This pincode is already in your delivery coverage.';
    }
    return message;
  }

  if (resolvesAuthRoute(path) && status === 404) {
    return 'Auth service unavailable. Please redeploy merchant-web or contact support.';
  }

  return message || 'We could not complete that action. Please try again.';
}

function resolvesAuthRoute(path: string) {
  return path.startsWith('/api/auth/');
}

export async function merchantFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = async () => {
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
      throw new ApiError(friendlyApiMessage(0, '', path), 0);
    }
    const body = await res.json().catch(() => ({}));
    return { res, body };
  };

  let { res, body } = await doFetch();

  // Stale JWT after MERCHANT role assignment — refresh once and retry.
  if (res.status === 403 && path !== '/api/auth/refresh') {
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      ({ res, body } = await doFetch());
    }
  }

  if (res.status === 401 && path !== '/api/auth/me') {
    useAuthStore.getState().clearSession();
    throw new ApiError(friendlyApiMessage(401, '', path), 401);
  }

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Something went wrong';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    throw new ApiError(friendlyApiMessage(res.status, message, path), res.status);
  }

  return body as T;
}
