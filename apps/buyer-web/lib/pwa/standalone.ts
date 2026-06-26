export const RAZORPAY_CHECKOUT_SESSION_KEY = 'jebdekho_rzp_checkout';

/** Installed PWA (home screen) — not the same as mobile browser tab. */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Break out of installed PWA into the system browser so UPI / wallet apps can open.
 * Android: Chrome intent; iOS: same URL (user may need Safari manually).
 */
export function openInSystemBrowser(url = window.location.href): void {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    const withoutScheme = url.replace(/^https?:\/\//, '');
    window.location.assign(
      `intent://${withoutScheme}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`,
    );
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function razorpayCallbackUrl(): string {
  if (typeof window === 'undefined') return '/checkout/razorpay-callback';
  return `${window.location.origin}/checkout/razorpay-callback`;
}
