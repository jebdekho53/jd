/**
 * Integration tests for the AI Catalog BullMQ mechanics against a REAL but
 * ISOLATED Redis (DB index 15, unique per-run prefix, obliterated after). These
 * exercise the exact primitives the production workers rely on: enqueue/consume,
 * jobId-based idempotency, attempt-based retry with our jittered backoff,
 * dead-lettering, cross-process progress pub/sub, and durability across a
 * worker restart. No OpenAI, no Postgres, no production Redis.
 *
 * Run: npx jest --config test/jest-integration.json --runInBand
 */
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { AI_JOB_DEFAULTS } from '../../src/modules/ai-catalog/ai-catalog.constants';
import { backoffStrategy } from '../../src/modules/ai-catalog/workers/backoff.util';

const TEST_REDIS_URL = process.env.REDIS_TEST_URL ?? 'redis://127.0.0.1:6379/15';
const connOpts = () => {
  const u = new URL(TEST_REDIS_URL);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    db: u.pathname && u.pathname !== '/' ? Number(u.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null,
  };
};

const prefix = `test-ai-catalog:${Date.now()}:${Math.random().toString(36).slice(2)}`;
let redisUp = false;

beforeAll(async () => {
  const probe = new IORedis(connOpts());
  try {
    await probe.ping();
    redisUp = true;
  } catch {
    redisUp = false;
  } finally {
    await probe.quit();
  }
  if (!redisUp) {
    // eslint-disable-next-line no-console
    console.warn('Redis not reachable — skipping AI catalog integration tests');
  }
});

function makeQueue(name: string): Queue {
  return new Queue(name, { connection: connOpts(), prefix });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('AI Catalog queue integration (real Redis)', () => {
  const created: (Queue | Worker)[] = [];
  const track = <T extends Queue | Worker>(x: T): T => {
    created.push(x);
    return x;
  };

  afterEach(async () => {
    for (const c of created.splice(0)) {
      try {
        if (c instanceof Worker) await c.close();
        else await c.obliterate({ force: true });
      } catch {
        /* best effort cleanup */
      }
    }
  });

  it('enqueues and consumes a job', async () => {
    if (!redisUp) return;
    const q = track(makeQueue('enqueue-consume'));
    const processed: string[] = [];
    const worker = track(
      new Worker('enqueue-consume', async (job: Job) => { processed.push(job.data.id); }, { connection: connOpts(), prefix }),
    );
    await q.add('job', { id: 'A1' }, { jobId: 'A1' });
    await new Promise<void>((resolve) => worker.on('completed', () => resolve()));
    expect(processed).toEqual(['A1']);
  });

  it('collapses a duplicate enqueue by stable jobId (idempotent — consumed once)', async () => {
    if (!redisUp) return;
    const q = track(makeQueue('dedupe'));
    // Two adds with the same jobId → BullMQ keeps ONE job (this is exactly how
    // AiCatalogQueueService.push guarantees a re-enqueue is a no-op).
    await q.add('job', { id: 'D1', n: 1 }, { jobId: 'dup' });
    await q.add('job', { id: 'D1', n: 2 }, { jobId: 'dup' });
    const counts = await q.getJobCounts('waiting', 'active', 'completed');
    expect(counts.waiting).toBe(1);

    let processedCount = 0;
    const worker = track(new Worker('dedupe', async () => { processedCount += 1; }, { connection: connOpts(), prefix }));
    await sleep(800);
    await worker.close();
    expect(processedCount).toBe(1);
  });

  it('retries with jittered backoff then succeeds', async () => {
    if (!redisUp) return;
    const q = track(makeQueue('retry'));
    let attempts = 0;
    const worker = track(
      new Worker('retry', async () => {
          attempts += 1;
          if (attempts < 2) throw new Error('transient');
        },
        { connection: connOpts(), prefix, settings: { backoffStrategy } },
      ),
    );
    await q.add('job', { id: 'R1' }, { attempts: 3, backoff: { type: 'custom' } });
    await new Promise<void>((resolve) => worker.on('completed', () => resolve()));
    expect(attempts).toBe(2);
  });

  it('dead-letters a job after attempts are exhausted (no infinite retry)', async () => {
    if (!redisUp) return;
    const q = track(makeQueue('deadletter'));
    let lastAttempts = 0;
    const worker = track(
      new Worker('deadletter', async () => { throw new Error('always fails'); },
        { connection: connOpts(), prefix, settings: { backoffStrategy } }),
    );
    await q.add('job', { id: 'DL1' }, { attempts: 2, backoff: { type: 'custom' } });
    await new Promise<void>((resolve) => {
      worker.on('failed', (job) => {
        if (job && job.attemptsMade >= 2) { lastAttempts = job.attemptsMade; resolve(); }
      });
    });
    const failed = await q.getJobCounts('failed');
    expect(lastAttempts).toBe(2);
    expect(failed.failed).toBe(1);
  });

  it('delivers progress across processes via Redis pub/sub', async () => {
    if (!redisUp) return;
    const channel = `${prefix}:progress`;
    const pub = new IORedis(connOpts());
    const sub = new IORedis(connOpts());
    const received: Record<string, unknown>[] = [];
    await sub.subscribe(channel);
    sub.on('message', (_c, raw) => received.push(JSON.parse(raw)));
    await sleep(100);
    // Mirrors AiCatalogProgressService.publish → gateway fan-out.
    await pub.publish(channel, JSON.stringify({ jobId: 'P1', merchantProfileId: 'm1', progress: 50 }));
    await sleep(200);
    await sub.quit();
    await pub.quit();
    expect(received).toEqual([{ jobId: 'P1', merchantProfileId: 'm1', progress: 50 }]);
  });

  it('recovers queued work across a worker restart (durability)', async () => {
    if (!redisUp) return;
    const q = track(makeQueue('restart'));
    // Enqueue while NO worker is running → proves the job is durable in Redis.
    await q.add('job', { id: 'X1' }, { jobId: 'X1' });
    await sleep(100);
    expect((await q.getJobCounts('waiting')).waiting).toBe(1);

    // "Restart": bring a worker up now; it must pick up the pre-existing job.
    const processed: string[] = [];
    const worker = track(new Worker('restart', async (job: Job) => { processed.push(job.data.id); }, { connection: connOpts(), prefix }));
    await new Promise<void>((resolve) => worker.on('completed', () => resolve()));
    expect(processed).toEqual(['X1']);
  });

  it('reclaims a stalled job when a worker dies mid-flight', async () => {
    if (!redisUp) return;
    const q = track(makeQueue('stalled'));
    // Worker A grabs the job and "crashes" (force close) without finishing.
    const workerA = new Worker('stalled', async () => sleep(10_000), {
      connection: connOpts(), prefix, lockDuration: 1500, stalledInterval: 1000, maxStalledCount: 2,
    });
    await q.add('job', { id: 'S1' }, { jobId: 'S1' });
    await sleep(500);
    await workerA.close(true); // force-kill mid-processing (no graceful drain)

    // Worker B comes up and must reclaim the stalled job.
    const processed: string[] = [];
    const workerB = track(new Worker('stalled', async (job: Job) => { processed.push(job.data.id); }, {
      connection: connOpts(), prefix, lockDuration: 1500, stalledInterval: 1000, maxStalledCount: 2,
    }));
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('stalled job not reclaimed in time')), 12_000);
      workerB.on('completed', () => { clearTimeout(t); resolve(); });
    });
    expect(processed).toContain('S1');
  }, 20000);
});
