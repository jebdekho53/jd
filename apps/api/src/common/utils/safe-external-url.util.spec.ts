import { BadRequestException } from '@nestjs/common';
import {
  assertSafeExternalHttpsUrl,
  assertSafeExternalHttpsUrls,
} from './safe-external-url.util';

describe('assertSafeExternalHttpsUrl (SSRF guard)', () => {
  it('accepts a normal public HTTPS url', () => {
    expect(() => assertSafeExternalHttpsUrl('https://cdn.example.com/a.jpg')).not.toThrow();
  });

  it('rejects empty / missing input', () => {
    expect(() => assertSafeExternalHttpsUrl('')).toThrow(BadRequestException);
    // @ts-expect-error deliberately passing undefined
    expect(() => assertSafeExternalHttpsUrl(undefined)).toThrow(BadRequestException);
  });

  it('rejects dangerous schemes', () => {
    for (const u of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
    ]) {
      expect(() => assertSafeExternalHttpsUrl(u)).toThrow(BadRequestException);
    }
  });

  it('rejects non-HTTPS urls', () => {
    expect(() => assertSafeExternalHttpsUrl('http://example.com/a.jpg')).toThrow(BadRequestException);
  });

  it('blocks SSRF targets: loopback, private ranges, link-local and cloud metadata', () => {
    for (const host of [
      'https://localhost/x',
      'https://127.0.0.1/x',
      'https://10.0.0.5/x',
      'https://192.168.1.1/x',
      'https://172.16.0.1/x',
      'https://169.254.169.254/latest/meta-data/', // AWS metadata
      'https://metadata.google.internal/x',
    ]) {
      expect(() => assertSafeExternalHttpsUrl(host)).toThrow(BadRequestException);
    }
  });

  it('allows a public IP that is not in a blocked range', () => {
    expect(() => assertSafeExternalHttpsUrl('https://8.8.8.8/logo.png')).not.toThrow();
  });

  it('validates a whole list and throws on the first bad entry', () => {
    expect(() =>
      assertSafeExternalHttpsUrls(['https://ok.example.com/a.jpg', 'http://bad/x']),
    ).toThrow(BadRequestException);
    expect(() => assertSafeExternalHttpsUrls(undefined)).not.toThrow();
  });
});
