import { LegalDocumentCode } from '@prisma/client';
import { LegalService } from './legal.service';
import { currentVersion } from './legal-documents.registry';

/**
 * Focused coverage for the version-aware acceptance check the guard relies on.
 * This is the piece that turns a version bump into a re-acceptance: only the
 * CURRENT version on record counts.
 */
describe('LegalService.hasAccepted', () => {
  const makeService = (findFirst: jest.Mock) =>
    new LegalService({ legalAcceptance: { findFirst } } as never);

  it('queries the CURRENT version — an older-version-only acceptance does not count', async () => {
    const findFirst = jest.fn().mockResolvedValue(null); // no row for the current version
    const service = makeService(findFirst);

    const result = await service.hasAccepted('u1', LegalDocumentCode.BUYER_TERMS);

    expect(result).toBe(false);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        code: LegalDocumentCode.BUYER_TERMS,
        version: currentVersion(LegalDocumentCode.BUYER_TERMS),
      },
      select: { id: true },
    });
  });

  it('passes when the current version is on record', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'acc-1' });
    const service = makeService(findFirst);

    await expect(service.hasAccepted('u1', LegalDocumentCode.MERCHANT_AGREEMENT)).resolves.toBe(
      true,
    );
  });
});
