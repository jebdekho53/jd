import { Test, TestingModule } from '@nestjs/testing';
import { TerritoryService } from './territory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';

describe('TerritoryService', () => {
  let service: TerritoryService;
  const mockPrisma = {
    franchiseTerritory: { create: jest.fn(), findMany: jest.fn() },
    territoryConflict: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    franchiseAudit: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerritoryService,
        { provide: PrismaService, useValue: mockPrisma },
        // Notifications ride the event bus; the spec only needs it to resolve.
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = module.get(TerritoryService);
    jest.clearAllMocks();
  });

  it('creates conflict when exclusive territories overlap', async () => {
    mockPrisma.franchiseTerritory.create.mockResolvedValue({ id: 't1' });
    mockPrisma.franchiseTerritory.findMany.mockResolvedValue([
      { id: 't2', pincodes: ['110016'], franchise: { businessName: 'Other' } },
    ]);
    mockPrisma.territoryConflict.findFirst.mockResolvedValue(null);
    mockPrisma.territoryConflict.create.mockResolvedValue({ id: 'c1', pincode: '110016' });
    mockPrisma.franchiseAudit.create.mockResolvedValue({});

    const result = await service.assignTerritory('f1', {
      city: 'Delhi',
      state: 'Delhi',
      pincodes: ['110016'],
      exclusivityEnabled: true,
    });

    expect(result.conflicts).toHaveLength(1);
    expect(mockPrisma.territoryConflict.create).toHaveBeenCalled();
  });
});
