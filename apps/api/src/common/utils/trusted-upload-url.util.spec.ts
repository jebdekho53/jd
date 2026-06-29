import { BadRequestException } from '@nestjs/common';
import { assertTrustedUploadUrl } from './trusted-upload-url.util';

const BASE = 'https://api.jebdekho.com/uploads';

describe('assertTrustedUploadUrl', () => {
  it('accepts URLs under upload base', () => {
    expect(() =>
      assertTrustedUploadUrl(`${BASE}/product/abc.webp`, BASE),
    ).not.toThrow();
  });

  it('rejects external URLs', () => {
    expect(() =>
      assertTrustedUploadUrl('https://evil.example/doc.pdf', BASE),
    ).toThrow(BadRequestException);
  });

  it('rejects javascript scheme', () => {
    expect(() =>
      assertTrustedUploadUrl('javascript:alert(1)', BASE),
    ).toThrow(BadRequestException);
  });
});
