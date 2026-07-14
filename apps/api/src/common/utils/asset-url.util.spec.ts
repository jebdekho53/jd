import {
  assetPublicBase,
  buildUploadUrl,
  resolvePublicAssetUrl,
  uploadPublicBases,
  type AssetUrlConfig,
} from './asset-url.util';

const UPLOAD = 'https://api.jebdekho.com/uploads';

const noCdn: AssetUrlConfig = { uploadPublicUrl: UPLOAD, cdnPublicUrl: '' };
const withCdn: AssetUrlConfig = {
  uploadPublicUrl: UPLOAD,
  cdnPublicUrl: 'https://cdn.jebdekho.com/uploads',
};
const trailingSlash: AssetUrlConfig = {
  uploadPublicUrl: 'https://api.jebdekho.com/uploads/',
  cdnPublicUrl: '',
};

describe('asset-url util', () => {
  describe('assetPublicBase', () => {
    it('uses the upload origin when no CDN configured', () => {
      expect(assetPublicBase(noCdn)).toBe(UPLOAD);
    });
    it('prefers the CDN base when configured', () => {
      expect(assetPublicBase(withCdn)).toBe('https://cdn.jebdekho.com/uploads');
    });
    it('strips a trailing slash', () => {
      expect(assetPublicBase(trailingSlash)).toBe(UPLOAD);
    });
    it('treats whitespace-only CDN as unset', () => {
      expect(assetPublicBase({ uploadPublicUrl: UPLOAD, cdnPublicUrl: '   ' })).toBe(UPLOAD);
    });
  });

  describe('uploadPublicBases', () => {
    it('returns just the upload base when no CDN', () => {
      expect(uploadPublicBases(noCdn)).toEqual([UPLOAD]);
    });
    it('returns both bases (upload first) when CDN configured', () => {
      expect(uploadPublicBases(withCdn)).toEqual([UPLOAD, 'https://cdn.jebdekho.com/uploads']);
    });
    it('de-duplicates when both bases are equal', () => {
      expect(uploadPublicBases({ uploadPublicUrl: UPLOAD, cdnPublicUrl: UPLOAD })).toEqual([UPLOAD]);
    });
  });

  describe('buildUploadUrl', () => {
    it('joins folder + name without duplicate slashes', () => {
      expect(buildUploadUrl(noCdn, 'product', 'a.jpg')).toBe(`${UPLOAD}/product/a.jpg`);
    });
    it('collapses slashes contributed by segments', () => {
      expect(buildUploadUrl(noCdn, '/product/', '/a.jpg')).toBe(`${UPLOAD}/product/a.jpg`);
    });
    it('routes generation through the CDN base when set', () => {
      expect(buildUploadUrl(withCdn, 'product', 'a.jpg')).toBe(
        'https://cdn.jebdekho.com/uploads/product/a.jpg',
      );
    });
  });

  describe('resolvePublicAssetUrl', () => {
    it.each([null, undefined, '', '   '])('returns null for %p', (v) => {
      expect(resolvePublicAssetUrl(noCdn, v as string | null | undefined)).toBeNull();
    });

    it('prefixes a bare relative path', () => {
      expect(resolvePublicAssetUrl(noCdn, 'product/a.jpg')).toBe(`${UPLOAD}/product/a.jpg`);
    });

    it('handles a leading-slash relative path', () => {
      expect(resolvePublicAssetUrl(noCdn, '/product/a.jpg')).toBe(`${UPLOAD}/product/a.jpg`);
    });

    it('does not double the /uploads segment (/uploads/x.jpg)', () => {
      expect(resolvePublicAssetUrl(noCdn, '/uploads/product/a.jpg')).toBe(
        `${UPLOAD}/product/a.jpg`,
      );
    });

    it('does not double the /uploads segment (uploads/x.jpg)', () => {
      expect(resolvePublicAssetUrl(noCdn, 'uploads/product/a.jpg')).toBe(
        `${UPLOAD}/product/a.jpg`,
      );
    });

    it('preserves an already-correct absolute upload URL', () => {
      const url = `${UPLOAD}/product/a.jpg`;
      expect(resolvePublicAssetUrl(noCdn, url)).toBe(url);
    });

    it('preserves an external absolute URL verbatim', () => {
      const ext = 'https://some-external-domain.com/image.jpg';
      expect(resolvePublicAssetUrl(noCdn, ext)).toBe(ext);
    });

    it('preserves query/signature params on absolute URLs', () => {
      const signed = `${UPLOAD}/product/a.jpg?sig=abc123&exp=999`;
      expect(resolvePublicAssetUrl(noCdn, signed)).toBe(signed);
    });

    it('rebases our own upload URL onto the CDN when configured, keeping the query', () => {
      const src = `${UPLOAD}/product/a.jpg?v=2`;
      expect(resolvePublicAssetUrl(withCdn, src)).toBe(
        'https://cdn.jebdekho.com/uploads/product/a.jpg?v=2',
      );
    });

    it('accepts a URL already minted under the CDN base', () => {
      const cdnUrl = 'https://cdn.jebdekho.com/uploads/product/a.jpg';
      expect(resolvePublicAssetUrl(withCdn, cdnUrl)).toBe(cdnUrl);
    });

    it('never rewrites a foreign URL even when CDN is configured', () => {
      const ext = 'https://some-external-domain.com/image.jpg';
      expect(resolvePublicAssetUrl(withCdn, ext)).toBe(ext);
    });
  });
});
