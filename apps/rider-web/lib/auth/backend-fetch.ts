const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class BackendError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'BackendError';
  }
}

export async function backendFetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<{ data: T; status: number }> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.accessToken) headers.set('Authorization', `Bearer ${init.accessToken}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as { message?: string | string[] })?.message ??
      `Request failed (${res.status})`;
    throw new BackendError(Array.isArray(message) ? message.join(', ') : String(message), res.status);
  }

  return { data: body as T, status: res.status };
}
