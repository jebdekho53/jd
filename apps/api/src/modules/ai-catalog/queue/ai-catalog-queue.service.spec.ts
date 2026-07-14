import { AIProductJobStatus } from '@prisma/client';
import { AiCatalogQueueService } from './ai-catalog-queue.service';
import { PrismaService } from '../../../database/prisma.service';
import type { Queue } from 'bullmq';

function makeQueue(): jest.Mocked<Pick<Queue, 'add' | 'getJobCounts'>> & { name: string } {
  return {
    name: 'q',
    add: jest.fn().mockResolvedValue({ id: 'bull1' }),
    getJobCounts: jest.fn().mockResolvedValue({}),
  } as never;
}

function makeService(existingJob: { id: string; status: AIProductJobStatus } | null) {
  const created: unknown[] = [];
  const prisma = {
    aIProductJob: {
      findUnique: jest.fn().mockResolvedValue(existingJob),
      create: jest.fn((args: { data: unknown }) => {
        created.push(args.data);
        return Promise.resolve({ id: 'ledger1' });
      }),
      update: jest.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaService;
  const q = makeQueue() as unknown as Queue;
  const svc = new AiCatalogQueueService(prisma, q, q, q, q);
  return { svc, prisma, q, created };
}

const params = {
  analysisId: 'a1', merchantProfileId: 'm1', storeId: 's1', userId: 'u1', autoGenerateImages: true,
};

describe('AiCatalogQueueService dedupe', () => {
  it('creates a ledger row and enqueues a fresh analysis', async () => {
    const { svc, q, created } = makeService(null);
    const res = await svc.enqueueAnalysis(params);
    expect(res.deduped).toBe(false);
    expect(created).toHaveLength(1);
    expect(q.add).toHaveBeenCalledTimes(1);
  });

  it('collapses a duplicate enqueue for an in-flight ledger row (no double job)', async () => {
    const { svc, q } = makeService({ id: 'ledger1', status: AIProductJobStatus.ACTIVE });
    const res = await svc.enqueueAnalysis(params);
    expect(res.deduped).toBe(true);
    expect(q.add).not.toHaveBeenCalled();
  });

  it('re-drives a terminal (FAILED) ledger row instead of deduping', async () => {
    const { svc, q } = makeService({ id: 'ledger1', status: AIProductJobStatus.FAILED });
    const res = await svc.enqueueAnalysis(params);
    expect(res.deduped).toBe(false);
    expect(q.add).toHaveBeenCalledTimes(1);
  });
});
