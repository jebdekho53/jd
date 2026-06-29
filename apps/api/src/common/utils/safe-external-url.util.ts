import { BadRequestException } from '@nestjs/common';
import { isIP } from 'net';

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;

/** RFC1918, link-local, loopback, metadata — block SSRF targets in user-supplied HTTPS URLs. */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === 'metadata.google.internal' || host === 'metadata') return true;
  if (isIP(host)) {
    if (host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true;
    if (host.startsWith('10.')) return true;
    if (host.startsWith('192.168.')) return true;
    if (host.startsWith('169.254.')) return true;
    const parts = host.split('.').map(Number);
    if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  }
  return false;
}

/** Validates HTTPS image/product URLs — blocks private/metadata hosts (SSRF). */
export function assertSafeExternalHttpsUrl(url: string): void {
  const trimmed = url?.trim();
  if (!trimmed) {
    throw new BadRequestException('URL is required');
  }
  if (BLOCKED_SCHEMES.test(trimmed)) {
    throw new BadRequestException('Invalid URL scheme');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new BadRequestException('Invalid URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new BadRequestException('URLs must use HTTPS');
  }
  if (isBlockedHost(parsed.hostname)) {
    throw new BadRequestException('URL host is not allowed');
  }
}

export function assertSafeExternalHttpsUrls(urls: string[] | undefined): void {
  for (const url of urls ?? []) {
    assertSafeExternalHttpsUrl(url);
  }
}
