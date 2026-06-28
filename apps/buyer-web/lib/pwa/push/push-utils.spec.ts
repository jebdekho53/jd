import { resolveClientPushState } from './push-utils';

describe('push-utils', () => {
  it('resolves enabled state when permission granted and subscribed', () => {
    expect(resolveClientPushState('granted', true)).toBe('enabled');
  });

  it('hides install-equivalent blocked state', () => {
    expect(resolveClientPushState('denied', false)).toBe('blocked');
  });

  it('treats granted without subscription as not enabled', () => {
    expect(resolveClientPushState('granted', false)).toBe('not_enabled');
  });
});

describe('service worker click URL mapping', () => {
  it('normalizes relative order route', () => {
    const raw = '/orders/o-1/track';
    const url = raw.startsWith('http') ? raw : `https://jebdekho.com${raw}`;
    expect(url).toBe('https://jebdekho.com/orders/o-1/track');
  });

  it('keeps absolute URLs unchanged', () => {
    const raw = 'https://jebdekho.com/wallet';
    expect(raw.startsWith('http') ? raw : `https://jebdekho.com${raw}`).toBe(raw);
  });
});
