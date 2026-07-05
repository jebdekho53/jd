const PRODUCTION_CONNECT_SRC = ["'self'", 'https:', 'wss:'] as const;

const PRODUCTION_SCRIPT_SRC = [
  "'self'",
  "'unsafe-inline'",
  'blob:',
  'https://checkout.razorpay.com',
  'https://cdn.razorpay.com',
  'https://maps.googleapis.com',
  'https://maps.gstatic.com',
] as const;

const LOCAL_API_CONNECT_SRC = ['http://localhost:3001', 'http://127.0.0.1:3001'] as const;

const LOCAL_WS_ENV_KEYS = ['NEXT_PUBLIC_WS_URL'] as const;

const LOCAL_API_ENV_KEYS = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_API_ORIGIN',
  'API_BASE_URL',
  'BUYER_API_BASE_URL',
] as const;

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function localOriginFromEnv(envKey: string, allowedProtocols: readonly string[]): string | null {
  const rawValue = process.env[envKey];
  if (!rawValue) return null;

  try {
    const url = new URL(rawValue);
    if (!allowedProtocols.includes(url.protocol) || !isLoopbackHost(url.hostname)) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function connectSrcDirective(): string {
  const sources = new Set<string>(PRODUCTION_CONNECT_SRC);

  if (process.env.NODE_ENV !== 'production') {
    LOCAL_API_CONNECT_SRC.forEach((source) => sources.add(source));
    LOCAL_API_ENV_KEYS.forEach((envKey) => {
      const origin = localOriginFromEnv(envKey, ['http:']);
      if (origin) sources.add(origin);
    });
    LOCAL_WS_ENV_KEYS.forEach((envKey) => {
      const origin = localOriginFromEnv(envKey, ['ws:']);
      if (origin) sources.add(origin);
    });
  }

  return `connect-src ${Array.from(sources).join(' ')}`;
}

function scriptSrcDirective(): string {
  const sources = new Set<string>(PRODUCTION_SCRIPT_SRC);

  if (process.env.NODE_ENV !== 'production') {
    sources.add("'unsafe-eval'");
  }

  return `script-src ${Array.from(sources).join(' ')}`;
}

function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    // blob: + maps.gstatic.com are required by the Google Maps vector
    // (WebGL) renderer, which loads code and spins up a Web Worker.
    scriptSrcDirective(),
    // Google Maps creates its WebGL worker from a blob: URL; without an
    // explicit worker-src the (blob-less) script-src is used and blocks it.
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    connectSrcDirective(),
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/** Shared security headers for Next.js apps (OWASP ASVS V14). */
export const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  },
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy(),
  },
] as const;

export function nextSecurityHeaders() {
  return [
    {
      source: '/:path*',
      headers: [...SECURITY_HEADERS],
    },
  ];
}
