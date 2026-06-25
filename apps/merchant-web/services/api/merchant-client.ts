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
      throw new ApiError('No internet connection', 0);
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
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Something went wrong';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    if (res.status === 404 && path.startsWith('/api/auth/')) {
      throw new ApiError(
        'Auth service unavailable. Please redeploy merchant-web or contact support.',
        404,
      );
    }
    throw new ApiError(message, res.status);
  }

  return body as T;
}
