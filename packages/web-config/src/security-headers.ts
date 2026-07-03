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
    value: [
      "default-src 'self'",
      // blob: + maps.gstatic.com are required by the Google Maps vector
      // (WebGL) renderer, which loads code and spins up a Web Worker.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://checkout.razorpay.com https://cdn.razorpay.com https://maps.googleapis.com https://maps.gstatic.com",
      // Google Maps creates its WebGL worker from a blob: URL; without an
      // explicit worker-src the (blob-less) script-src is used and blocks it.
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
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
