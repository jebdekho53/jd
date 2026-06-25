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

  if (res.status === 401) {
    useAuthStore.getState().clearSession();
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Something went wrong';
    throw new ApiError(Array.isArray(raw) ? raw.join(', ') : String(raw), res.status);
  }

  return body as T;
}
