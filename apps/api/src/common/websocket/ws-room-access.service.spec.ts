import { ForbiddenException } from '@nestjs/common';
import { WsRoomAccessService } from './ws-room-access.service';
import type { RequestUser } from '../types';

describe('WsRoomAccessService', () => {
  const mockPrisma = {
    order: { findUnique: jest.fn() },
    store: { findFirst: jest.fn() },
    riderProfile: { findFirst: jest.fn() },
    buyerProfile: { findFirst: jest.fn() },
  };

  const service = new WsRoomAccessService(mockPrisma as never);

  const user = (roles: string[], id = 'user-1'): RequestUser => ({
    id,
    phone: '',
    email: null,
    roles,
    permissions: [],
  });

  beforeEach(() => jest.clearAllMocks());

  describe('order scope', () => {
    it('allows the buyer who owns the order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        buyerProfile: { userId: 'user-1' },
        store: { merchantProfile: { userId: 'other' } },
        delivery: null,
      });

      await expect(
        service.assertCanJoin(user(['BUYER']), { type: 'order', id: 'ord-1' }),
      ).resolves.toBeUndefined();
    });

    it('allows the merchant fulfilling the order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        buyerProfile: { userId: 'other' },
        store: { merchantProfile: { userId: 'user-1' } },
        delivery: null,
      });

      await expect(
        service.assertCanJoin(user(['MERCHANT']), { type: 'order', id: 'ord-1' }),
      ).resolves.toBeUndefined();
    });

    it('allows the rider assigned to the order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        buyerProfile: { userId: 'other' },
        store: { merchantProfile: { userId: 'other' } },
        delivery: { riderProfile: { userId: 'user-1' } },
      });

      await expect(
        service.assertCanJoin(user(['RIDER']), { type: 'order', id: 'ord-1' }),
      ).resolves.toBeUndefined();
    });

    it('denies an unrelated user', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        buyerProfile: { userId: 'other' },
        store: { merchantProfile: { userId: 'other' } },
        delivery: { riderProfile: { userId: 'other' } },
      });

      await expect(
        service.assertCanJoin(user(['BUYER']), { type: 'order', id: 'ord-1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('denies a nonexistent order without leaking existence', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.assertCanJoin(user(['BUYER']), { type: 'order', id: 'nope' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('store scope', () => {
    // The room merchants actually need: tracking events publish to store:<id>.
    it('allows a merchant who owns the store', async () => {
      mockPrisma.store.findFirst.mockResolvedValue({ id: 'store-1' });

      await expect(
        service.assertCanJoin(user(['MERCHANT']), { type: 'store', id: 'store-1' }),
      ).resolves.toBeUndefined();
    });

    it('denies a merchant who does not own the store', async () => {
      mockPrisma.store.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanJoin(user(['MERCHANT']), { type: 'store', id: 'store-2' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an admin without an ownership lookup', async () => {
      await expect(
        service.assertCanJoin(user(['ADMIN']), { type: 'store', id: 'store-9' }),
      ).resolves.toBeUndefined();
      expect(mockPrisma.store.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('rider scope', () => {
    it('denies a rider watching another rider', async () => {
      mockPrisma.riderProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanJoin(user(['RIDER']), { type: 'rider', id: 'rider-2' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('admin-only scopes', () => {
    it.each(['admin-fleet', 'fleet-ops', 'control-room', 'whatsapp-inbox'] as const)(
      'denies non-admins on %s',
      async (type) => {
        await expect(
          service.assertCanJoin(user(['BUYER']), { type }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      },
    );

    it.each(['admin-fleet', 'fleet-ops', 'control-room', 'whatsapp-inbox'] as const)(
      'allows admins on %s',
      async (type) => {
        await expect(service.assertCanJoin(user(['ADMIN']), { type })).resolves.toBeUndefined();
      },
    );

    it('accepts SUPER_ADMIN as admin', async () => {
      await expect(
        service.assertCanJoin(user(['SUPER_ADMIN']), { type: 'control-room' }),
      ).resolves.toBeUndefined();
    });
  });
});
