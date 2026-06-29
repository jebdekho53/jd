import { BadRequestException } from '@nestjs/common';

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;

/**
 * Ensures a URL points to the platform upload CDN (HTTPS only).
 * Used for verification documents, category evidence, menu OCR, claim evidence.
 */
export function assertTrustedUploadUrl(url: string, uploadPublicBase: string): void {
  const trimmed = url?.trim();
  if (!trimmed) {
    throw new BadRequestException('File URL is required');
  }
  if (BLOCKED_SCHEMES.test(trimmed)) {
    throw new BadRequestException('Invalid file URL scheme');
  }
  if (!trimmed.startsWith('https://')) {
    throw new BadRequestException('File URLs must use HTTPS');
  }

  const base = uploadPublicBase.replace(/\/$/, '');
  if (!base.startsWith('https://')) {
    throw new BadRequestException('Upload public URL is not configured for HTTPS');
  }
  if (!trimmed.startsWith(`${base}/`)) {
    throw new BadRequestException('Files must be uploaded via JebDekho');
  }
}
