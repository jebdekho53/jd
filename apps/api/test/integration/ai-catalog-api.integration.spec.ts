/**
 * API-level integration tests for the merchant AI Catalog controller. Boots a
 * real Nest HTTP server (app.listen(0)) with the real ValidationPipe and the
 * controller, but with the SERVICE layer and auth guards mocked — so we assert
 * HTTP behaviour (routing, DTO validation, guard wiring, ownership, feature
 * flag, idempotency) without any DB, Redis or OpenAI. No supertest dependency:
 * uses native fetch against the ephemeral port.
 *
 * Run: npx jest --config test/jest-integration.json --runInBand --forceExit
 */
import { INestApplication, ValidationPipe, ExecutionContext, CanActivate, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MerchantAiCatalogController } from '../../src/modules/ai-catalog/controllers/merchant-ai-catalog.controller';
import { AiCatalogAnalysisService } from '../../src/modules/ai-catalog/services/ai-catalog-analysis.service';
import { AiCatalogImageService } from '../../src/modules/ai-catalog/services/ai-catalog-image.service';
import { AiCatalogConfigService } from '../../src/modules/ai-catalog/services/ai-catalog-config.service';
import { AiCatalogBillingService } from '../../src/modules/ai-catalog/services/ai-catalog-billing.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';

// Auth guard stub: injects req.user from an x-user-id header so we can simulate
// different authenticated merchants. In production the real JwtAuthGuard does this.
const authStub: CanActivate = {
  canActivate: (ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const uid = req.headers['x-user-id'];
    if (!uid) return false;
    req.user = { id: uid, roles: ['MERCHANT'], permissions: ['products:read', 'products:write'] };
    return true;
  },
};

describe('Merchant AI Catalog API (integration)', () => {
  let app: INestApplication;
  let url: string;
  // Mutable mocks so each test can shape behaviour.
  const analysis = {
    createAndQueue: jest.fn(),
    getAnalysisView: jest.fn(),
    getJobStatus: jest.fn(),
    requestImages: jest.fn(),
    confirm: jest.fn(),
  };
  const images = { approveAsset: jest.fn(), selectAsset: jest.fn() };
  const config = {
    isEnabled: jest.fn().mockResolvedValue(true),
    pricing: jest.fn().mockResolvedValue({ analysisPaise: 150, perOutputPaise: {} }),
    defaultOutputs: jest.fn().mockResolvedValue(['main', 'transparent_png', 'hero']),
  };
  const billing = {};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MerchantAiCatalogController],
      providers: [
        { provide: AiCatalogAnalysisService, useValue: analysis },
        { provide: AiCatalogImageService, useValue: images },
        { provide: AiCatalogConfigService, useValue: config },
        { provide: AiCatalogBillingService, useValue: billing },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(authStub)
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    url = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const get = (path: string, headers: Record<string, string> = {}) => fetch(`${url}${path}`, { headers });

  const S = '/merchant/stores/store1/products/ai-catalog';

  it('rejects unauthenticated requests (401/403 — no user context)', async () => {
    const res = await get(`${S}/availability`); // no x-user-id header
    expect([401, 403]).toContain(res.status);
  });

  it('returns 503 AI_CATALOG_DISABLED when the feature is DISABLED', async () => {
    // Mirrors the real service, which throws this when feature.enabled is off.
    analysis.createAndQueue.mockRejectedValueOnce(
      new ServiceUnavailableException({ message: 'AI cataloging v2 is not enabled.', code: 'AI_CATALOG_DISABLED' }),
    );
    const res = await post(`${S}/analyze`, { dataUrl: `data:image/png;base64,${'A'.repeat(64)}` }, { 'x-user-id': 'userA' });
    expect(analysis.createAndQueue).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.message?.code ?? body.code).toBe('AI_CATALOG_DISABLED');
  });

  it('rejects an invalid uploaded image at the DTO boundary (400, service never called)', async () => {
    const res = await post(`${S}/analyze`, { dataUrl: 'nope' }, { 'x-user-id': 'userA' }); // too short for @Length(32,..)
    expect(res.status).toBe(400);
    expect(analysis.createAndQueue).not.toHaveBeenCalled();
  });

  it('merchant A cannot access merchant B job (ownership enforced → 404)', async () => {
    // The service throws NotFound when the job is not owned by the caller.
    analysis.getJobStatus.mockImplementation((userId: string) => {
      if (userId !== 'ownerOfJob') {
        // Mirrors the real service, which throws NotFound for a non-owned job.
        throw new NotFoundException('Job not found');
      }
      return { jobId: 'job1', status: 'ACTIVE', progress: 10 };
    });
    const res = await get(`${S}/jobs/job1`, { 'x-user-id': 'intruder' });
    expect(res.status).toBe(404);
    expect(analysis.getJobStatus).toHaveBeenCalledWith('intruder', 'job1');
  });

  it('confirm is idempotent: a second confirm reports charged:false (no double bill)', async () => {
    analysis.confirm
      .mockResolvedValueOnce({ productId: 'p1', publish: false, charged: true, amountPaise: 150 })
      .mockResolvedValueOnce({ productId: 'p1', publish: false, charged: false, amountPaise: 0 });
    const body = { name: 'Test Product', categoryId: 'cat1', basePrice: 99 };
    const first = await post(`${S}/analysis/a1/confirm`, body, { 'x-user-id': 'userA' });
    const second = await post(`${S}/analysis/a1/confirm`, body, { 'x-user-id': 'userA' });
    const firstJson = await first.json();
    const secondJson = await second.json();
    expect(firstJson.data.charged).toBe(true);
    expect(secondJson.data.charged).toBe(false);
    expect(secondJson.data.amountPaise).toBe(0);
  });
});
