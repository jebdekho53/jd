import { Test, TestingModule } from '@nestjs/testing';
import { AdminPasswordService } from './admin-password.service';

describe('AdminPasswordService', () => {
  let service: AdminPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminPasswordService],
    }).compile();
    service = module.get(AdminPasswordService);
  });

  it('hashes and verifies passwords with bcrypt', async () => {
    const hash = await service.hash('SecurePass123');
    expect(hash).not.toBe('SecurePass123');
    await expect(service.verify(hash, 'SecurePass123')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong')).resolves.toBe(false);
  });
});
