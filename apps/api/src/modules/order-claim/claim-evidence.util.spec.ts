import { BadRequestException } from '@nestjs/common';
import { assertClaimEvidenceUrls } from './claim-evidence.util';

describe('assertClaimEvidenceUrls', () => {
  const base = 'https://api.jebdekho.com/uploads';

  it('accepts platform upload URLs', () => {
    expect(() =>
      assertClaimEvidenceUrls(
        [{ kind: 'PHOTO', url: `${base}/review/abc.jpg` }],
        base,
      ),
    ).not.toThrow();
  });

  it('rejects external domains', () => {
    expect(() =>
      assertClaimEvidenceUrls(
        [{ kind: 'PHOTO', url: 'https://evil.com/proof.jpg' }],
        base,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects non-https URLs', () => {
    expect(() =>
      assertClaimEvidenceUrls(
        [{ kind: 'PHOTO', url: `${base.replace('https', 'http')}/review/x.jpg` }],
        base,
      ),
    ).toThrow(BadRequestException);
  });
});
