export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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
    throw new ApiError('No internet connection', 0);
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (res.status === 403) {
    throw new ApiError('Access denied. Admin role required.', 403);
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Request failed';
    throw new ApiError(Array.isArray(raw) ? raw.join(', ') : String(raw), res.status);
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
