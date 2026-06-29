import { Test, TestingModule } from '@nestjs/testing';
import { DistributedLockService } from './distributed-lock.service';
import { RedisService } from './redis.service';

const mockClient = {
  set: jest.fn(),
  eval: jest.fn(),
};

const mockRedis = {
  getClient: () => mockClient,
};

describe('DistributedLockService', () => {
  let service: DistributedLockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributedLockService,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();
    service = module.get(DistributedLockService);
    jest.clearAllMocks();
  });

  it('acquires lock when SET NX succeeds', async () => {
    mockClient.set.mockResolvedValue('OK');
    const token = await service.tryAcquire('test-job', 30);
    expect(token).toBeTruthy();
    expect(mockClient.set).toHaveBeenCalledWith(
      'lock:test-job',
      expect.any(String),
      'EX',
      30,
      'NX',
    );
  });

  it('returns null when lock is held', async () => {
    mockClient.set.mockResolvedValue(null);
    const token = await service.tryAcquire('test-job', 30);
    expect(token).toBeNull();
  });

  it('skips fn when lock not acquired', async () => {
    mockClient.set.mockResolvedValue(null);
    const fn = jest.fn();
    const ran = await service.runExclusive('job', 10, fn);
    expect(ran).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });
});
