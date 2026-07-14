import { BadRequestException } from '@nestjs/common';

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;

/**
 * Ensures a URL points to a platform upload origin (HTTPS only).
 * Used for verification documents, category evidence, menu OCR, claim evidence.
 *
 * Accepts one base or several (e.g. the canonical UPLOAD_PUBLIC_URL plus an
 * optional CDN_PUBLIC_URL) so enabling a CDN later does not reject URLs minted
 * under either base. Pass `uploadPublicBases(cfg.storage)` for the full set.
 */
export function assertTrustedUploadUrl(
  url: string,
  uploadPublicBase: string | string[],
): void {
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

  const bases = (Array.isArray(uploadPublicBase) ? uploadPublicBase : [uploadPublicBase])
    .map((b) => b.replace(/\/$/, ''))
    .filter(Boolean);
  if (bases.length === 0 || !bases.every((b) => b.startsWith('https://'))) {
    throw new BadRequestException('Upload public URL is not configured for HTTPS');
  }
  if (!bases.some((b) => trimmed.startsWith(`${b}/`))) {
    throw new BadRequestException('Files must be uploaded via JebDekho');
  }
}
