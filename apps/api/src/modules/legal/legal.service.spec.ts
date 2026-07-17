import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { LegalDocumentCode } from '@prisma/client';
import { LegalService } from './legal.service';
import { PrismaService } from '../../database/prisma.service';
import { LEGAL_DOCUMENTS, REQUIRED_DOCUMENTS } from './legal-documents.registry';
import { LEGAL_ENTITY, PENDING, pendingLegalFields } from './legal-entity';

const mockPrisma = {
  legalAcceptance: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// The registry refuses to serve while the company's statutory details are
// placeholders. Stub them so the behavioural tests below exercise the logic
// rather than the guard — the guard has its own tests further down.
function withCompleteEntity<T>(run: () => T): T {
  const entity = LEGAL_ENTITY as unknown as Record<string, unknown>;
  const snapshot = JSON.parse(JSON.stringify(entity));
  const fill = (obj: Record<string, unknown>): void => {
    for (const [k, v] of Object.entries(obj)) {
      if (v === PENDING) obj[k] = 'FILLED';
      else if (v && typeof v === 'object') fill(v as Record<string, unknown>);
    }
  };
  fill(entity);
  try {
    return run();
  } finally {
    for (const k of Object.keys(entity)) delete entity[k];
    Object.assign(entity, snapshot);
  }
}

describe('LegalService', () => {
  let service: LegalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegalService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(LegalService);
    jest.clearAllMocks();
  });

  describe('document registry', () => {
    it('serves a document for every code a portal requires', () => {
      withCompleteEntity(() => {
        for (const codes of Object.values(REQUIRED_DOCUMENTS)) {
          for (const code of codes) {
            expect(() => service.getDocument(code)).not.toThrow();
          }
        }
      });
    });

    it('names the company, not just the trade name, in every document', () => {
      for (const doc of Object.values(LEGAL_DOCUMENTS)) {
        const text = JSON.stringify(doc);
        expect(text).toContain('UrbanMove Services Private Limited');
      }
    });

    it('gives every document a version and an effective date', () => {
      for (const doc of Object.values(LEGAL_DOCUMENTS)) {
        expect(doc!.version).toMatch(/^v\d+$/);
        expect(doc!.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(doc!.sections.length).toBeGreaterThan(0);
      }
    });
  });

  describe('statutory-detail guard', () => {
    it('reports every unfilled field', () => {
      // Fails loudly until the company supplies its real details.
      expect(pendingLegalFields()).toEqual(
        expect.arrayContaining(['cin', 'gstin', 'grievanceOfficer.name', 'jurisdictionCity']),
      );
    });

    it('refuses to serve a document while details are placeholders', () => {
      expect(() => service.getDocument(LegalDocumentCode.BUYER_TERMS)).toThrow(
        /Legal entity details are incomplete/,
      );
    });
  });

  describe('accept', () => {
    it('records the version, ip and user agent', async () => {
      await withCompleteEntity(async () => {
        const version = LEGAL_DOCUMENTS[LegalDocumentCode.MERCHANT_AGREEMENT]!.version;
        mockPrisma.legalAcceptance.findFirst.mockResolvedValue(null);
        mockPrisma.legalAcceptance.create.mockResolvedValue({ acceptedAt: new Date('2026-07-17') });

        await service.accept('u-1', LegalDocumentCode.MERCHANT_AGREEMENT, version, {
          ip: '1.2.3.4',
          userAgent: 'Chrome',
        });

        expect(mockPrisma.legalAcceptance.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: 'u-1',
              code: LegalDocumentCode.MERCHANT_AGREEMENT,
              version,
              ipAddress: '1.2.3.4',
              userAgent: 'Chrome',
            }),
          }),
        );
      });
    });

    it('rejects a version the registry never served', async () => {
      await withCompleteEntity(async () => {
        await expect(
          service.accept('u-1', LegalDocumentCode.MERCHANT_AGREEMENT, 'v0', {}),
        ).rejects.toThrow(BadRequestException);
        expect(mockPrisma.legalAcceptance.create).not.toHaveBeenCalled();
      });
    });

    it('does not re-stamp an acceptance already on record', async () => {
      await withCompleteEntity(async () => {
        const version = LEGAL_DOCUMENTS[LegalDocumentCode.RIDER_AGREEMENT]!.version;
        const original = new Date('2026-01-01');
        mockPrisma.legalAcceptance.findFirst.mockResolvedValue({ id: 'a-1', acceptedAt: original });

        const res = await service.accept('u-1', LegalDocumentCode.RIDER_AGREEMENT, version, {});

        expect(res.acceptedAt).toEqual(original);
        expect(mockPrisma.legalAcceptance.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('pendingFor', () => {
    it('is empty when the current version is accepted', async () => {
      const version = LEGAL_DOCUMENTS[LegalDocumentCode.MERCHANT_AGREEMENT]!.version;
      mockPrisma.legalAcceptance.findMany.mockResolvedValue([
        { code: LegalDocumentCode.MERCHANT_AGREEMENT, version },
      ]);

      await expect(service.pendingFor('u-1', 'merchant')).resolves.toEqual([]);
    });

    it('asks again when only an older version was accepted', async () => {
      mockPrisma.legalAcceptance.findMany.mockResolvedValue([
        { code: LegalDocumentCode.MERCHANT_AGREEMENT, version: 'v0' },
      ]);

      const pending = await service.pendingFor('u-1', 'merchant');

      expect(pending).toHaveLength(1);
      expect(pending[0].isReacceptance).toBe(true);
    });

    it('flags a never-accepted document as a first acceptance', async () => {
      mockPrisma.legalAcceptance.findMany.mockResolvedValue([]);

      const pending = await service.pendingFor('u-1', 'rider');

      expect(pending).toHaveLength(1);
      expect(pending[0].code).toBe(LegalDocumentCode.RIDER_AGREEMENT);
      expect(pending[0].isReacceptance).toBe(false);
    });
  });
});
