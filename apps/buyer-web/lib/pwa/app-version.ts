/** Client-safe app version (inlined at build time via NEXT_PUBLIC_APP_VERSION). */
export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';
}
