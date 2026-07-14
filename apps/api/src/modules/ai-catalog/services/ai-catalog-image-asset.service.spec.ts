import { AiCatalogImageAssetService } from './ai-catalog-image-asset.service';
import { PrismaService } from '../../../database/prisma.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';

function makeService(): AiCatalogImageAssetService {
  return new AiCatalogImageAssetService({} as PrismaService, {} as AiCatalogConfigService);
}

describe('AiCatalogImageAssetService cache keys', () => {
  const svc = makeService();
  const base = { sourceHash: 'abc123', outputType: 'main', model: 'gpt-image-1', promptVersion: 1, transparent: false };

  it('is deterministic for identical inputs', () => {
    expect(svc.computeCacheKey(base)).toBe(svc.computeCacheKey({ ...base }));
  });

  it('changes when the source image changes', () => {
    expect(svc.computeCacheKey(base)).not.toBe(svc.computeCacheKey({ ...base, sourceHash: 'different' }));
  });

  it('changes per output type, model, prompt version and transparency', () => {
    expect(svc.computeCacheKey(base)).not.toBe(svc.computeCacheKey({ ...base, outputType: 'hero' }));
    expect(svc.computeCacheKey(base)).not.toBe(svc.computeCacheKey({ ...base, model: 'other' }));
    expect(svc.computeCacheKey(base)).not.toBe(svc.computeCacheKey({ ...base, promptVersion: 2 }));
    expect(svc.computeCacheKey(base)).not.toBe(svc.computeCacheKey({ ...base, transparent: true }));
  });

  it('a forced-regeneration nonce yields a distinct key (new version, no clobber)', () => {
    expect(svc.computeCacheKey(base)).not.toBe(svc.computeCacheKey({ ...base, nonce: 'v2' }));
  });
});
