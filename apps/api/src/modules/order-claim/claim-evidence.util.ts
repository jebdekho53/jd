import { BadRequestException } from '@nestjs/common';
import { MAX_CLAIM_EVIDENCE_ITEMS } from './order-claim.constants';

export function assertClaimEvidenceUrls(
  evidence: Array<{ kind: string; url: string }>,
  uploadPublicBase: string,
): void {
  if (evidence.length > MAX_CLAIM_EVIDENCE_ITEMS) {
    throw new BadRequestException(
      `At most ${MAX_CLAIM_EVIDENCE_ITEMS} evidence items are allowed`,
    );
  }

  const base = uploadPublicBase.replace(/\/$/, '');
  if (!base.startsWith('https://')) {
    throw new BadRequestException('Upload public URL is not configured for HTTPS');
  }

  for (const item of evidence) {
    if (!item.url.startsWith('https://')) {
      throw new BadRequestException('Evidence URLs must use HTTPS');
    }
    if (!item.url.startsWith(`${base}/`)) {
      throw new BadRequestException('Evidence must be uploaded via JebDekho');
    }
  }
}
